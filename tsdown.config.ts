import { writeFile } from 'fs/promises';
import type { UserConfig } from 'tsdown';
import { defineConfig } from 'tsdown';
import { defaultIgnore, generateDTS } from '@jakeboone02/generate-dts';

const config: ReturnType<typeof defineConfig> = defineConfig(options => {
  const commonOptions = {
    entry: {
      'parse-ingredient': 'src/index.ts',
    },
    dts: false,
    outputOptions: {
      globals: {
        'numeric-quantity': 'NumericQuantity',
      },
    },
    platform: 'neutral',
    sourcemap: true,
    ...options,
  } satisfies UserConfig;

  const productionOptions = {
    minify: true,
    define: { NODE_ENV: 'production' },
  } satisfies UserConfig;

  const opts: UserConfig[] = [
    // ESM, standard bundler dev, embedded `process` references
    {
      ...commonOptions,
      clean: true,
      format: 'esm',
      onSuccess: () =>
        generateDTS({
          ignore: filePath =>
            defaultIgnore(filePath) || filePath.endsWith('Tests.ts') || filePath.endsWith('dev.ts'),
        }),
    },
    // ESM, Webpack 4 support. Target ES2017 syntax to compile away optional chaining and spreads
    {
      ...commonOptions,
      entry: {
        'parse-ingredient.legacy-esm': 'src/index.ts',
      },
      // ESBuild outputs `'.mjs'` by default for the 'esm' format. Force '.js'
      outExtensions: () => ({ js: '.js' }),
      format: 'esm',
      target: 'es2017',
    },
    // ESM for use in browsers. Minified, with `process` compiled away
    {
      ...commonOptions,
      ...productionOptions,
      entry: {
        'parse-ingredient.production': 'src/index.ts',
      },
      format: 'esm',
      outExtensions: () => ({ js: '.mjs' }),
    },
    // CJS development
    {
      ...commonOptions,
      entry: {
        'parse-ingredient.cjs.development': 'src/index.ts',
      },
      format: 'cjs',
      outDir: './dist/cjs/',
    },
    // CJS production
    {
      ...commonOptions,
      ...productionOptions,
      entry: {
        'parse-ingredient.cjs.production': 'src/index.ts',
      },
      format: 'cjs',
      outDir: './dist/cjs/',
      onSuccess: async () => {
        // Write the CJS index file
        await writeFile(
          'dist/cjs/index.js',
          `'use strict';
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./parse-ingredient.cjs.production.js');
} else {
  module.exports = require('./parse-ingredient.cjs.development.js');
}
`
        );
      },
    },
    // UMD (ish)
    {
      ...commonOptions,
      ...productionOptions,
      dts: false,
      format: 'iife',
      globalName: 'ParseIngredient',
      outExtensions: () => ({ js: '.umd.min.js' }),
    },
  ];

  return opts;
});

export default config;

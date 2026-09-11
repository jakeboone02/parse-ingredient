import type { UserConfig } from 'tsdown';
import { defineConfig } from 'tsdown';

const config: ReturnType<typeof defineConfig> = defineConfig(options => {
  const commonOptions = {
    entry: {
      'parse-ingredient': 'src/index.ts',
    },
    dts: { oxc: {} },
    platform: 'neutral',
    sourcemap: true,
    ...options,
  } satisfies UserConfig;

  const opts: UserConfig[] = [
    // ESM
    {
      ...commonOptions,
      clean: true,
      format: 'esm',
    },
    // CJS. The library reads no environment, so there is no dev/prod distinction to make
    {
      ...commonOptions,
      entry: { index: 'src/index.ts' },
      format: 'cjs',
      outDir: './dist/cjs/',
    },
    // UMD (browser global `ParseIngredient`, plus CJS/AMD interop)
    {
      ...commonOptions,
      dts: false,
      minify: true,
      format: 'umd',
      globalName: 'ParseIngredient',
      deps: { alwaysBundle: ['numeric-quantity'] },
      outExtensions: () => ({ js: '.min.js' }),
      // `numeric-quantity`'s overflow path uses bigint literals, which are left as-is
      suppressWarnings: [
        'Big integer literals are not available in the configured target environment.',
      ],
      // Bundlers that treat classic <script> tags as CJS modules (e.g. Bun's HTML entrypoint
      // support) hit the UMD `exports` branch, so the browser global never gets defined.
      // Re-expose it explicitly when running in a browser.
      footer: {
        js: `typeof window<"u"&&typeof exports=="object"&&(window.ParseIngredient=exports);`,
      },
    },
  ];

  return opts;
});

export default config;

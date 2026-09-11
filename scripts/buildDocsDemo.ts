/**
 * Stages the demo page into `docs/demo/` for the GitHub Pages artifact.
 */

import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = join(dirname(Bun.fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'demo');

await mkdir(outDir, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(root, 'src', 'index.ts')],
  outdir: outDir,
  naming: 'parse-ingredient.mjs',
  format: 'esm',
  target: 'browser',
  minify: false,
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  throw new Error('Failed to bundle parse-ingredient for the demo');
}

for (const file of ['index.html', 'styles.css']) {
  await Bun.write(join(outDir, file), Bun.file(join(root, 'demo', file)));
}

console.log(`Demo staged in ${outDir}`);

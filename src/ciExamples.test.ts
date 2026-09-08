import { describe, expect, it } from 'bun:test';
import { generateCIExamples } from '../scripts/generateCIExamples';

describe('ci examples', () => {
  it('is up to date with the fixtures', async () => {
    const onDisk = await Bun.file(new URL('../ci/src/examples.ts', import.meta.url)).text();

    expect(onDisk).toBe(generateCIExamples());
  });
});

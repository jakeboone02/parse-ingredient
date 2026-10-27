import { describe, expect, it } from 'bun:test';
import { examples } from '../ci/src/examples';
import { generateCIExamples } from '../scripts/generateCIExamples';
import { parseIngredientTests } from './parseIngredientTests';

describe('ci examples', () => {
  it('is up to date with the fixtures', async () => {
    const onDisk = await Bun.file(new URL('../ci/src/examples.ts', import.meta.url)).text();

    expect(onDisk).toBe(generateCIExamples());
  });

  it('round-trips every fixture input', () => {
    expect(examples.map(e => e.input)).toEqual(
      Object.values(parseIngredientTests).map(([input]) => input)
    );
  });
});

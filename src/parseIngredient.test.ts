import { describe, expect, test } from 'bun:test';
import { parseIngredient } from './parseIngredient';
import { parseIngredientTests } from './parseIngredientTests';

for (const [testName, [input, expected, options]] of Object.entries(parseIngredientTests)) {
  test(testName, () => {
    expect(parseIngredient(input, options)).toEqual(expected);
  });
}

/** Guards against exponential backtracking in the word after a leading unit. */
describe('next word regex backtracking', () => {
  test('fails fast on a long word followed by punctuation', () => {
    const word = 'a'.repeat(40);
    const start = performance.now();
    expect(parseIngredient(`1 cup ${word}/b`)).toEqual([
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: `${word}/b`,
        isGroupHeader: false,
      },
    ]);
    expect(performance.now() - start).toBeLessThan(250);
  });
});

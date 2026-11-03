import { describe, expect, test } from 'bun:test';
import { parseIngredient } from './parseIngredient';
import { parseIngredientTests } from './parseIngredientTests';

for (const [testName, [input, expected, options]] of Object.entries(parseIngredientTests)) {
  test(testName, () => {
    expect(parseIngredient(input, options)).toEqual(expected);
  });
}

/**
 * The word after a leading unit is matched to try a two-word unit. A long word followed by
 * punctuation used to backtrack exponentially there: 30 letters took ~36s in Node, and Hermes
 * throws. Bun's regex engine caps the backtracking at ~400ms, so the budget stays below that; the
 * fixed regex takes ~1ms.
 */
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
    expect(performance.now() - start).toBeLessThan(100);
  });
});

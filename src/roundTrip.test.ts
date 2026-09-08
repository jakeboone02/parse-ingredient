import { expect, test } from 'bun:test';
import { formatQuantity } from 'format-quantity';
import { parseIngredient } from './parseIngredient';

/*
 * `format-quantity` and `parse-ingredient` sit on opposite sides of the same
 * `numeric-quantity` contract, so anything the former emits the latter must be able to
 * read back. Sixteenths are the motivating case: they are standard in US baking, they are
 * what `format-quantity` produces for eighth-and-finer values, and they are what the old
 * fixed-width quantity window silently corrupted.
 *
 * `round: false` is required for exact comparison; the default of 3 would truncate
 * sixteenths.
 */

const denominators = [2, 3, 4, 8, 16];
const numerators = Array.from({ length: 48 }, (_, i) => i + 1);

/**
 * Values like 2/3 are not exactly representable, so a formatted fraction can re-parse to
 * a neighboring float. The parse must be faithful to the printed fraction, not
 * bit-identical to the input double.
 */
const closeEnough = (actual: number | null, expected: number) =>
  actual !== null && Math.abs(actual - expected) < 1e-10;

/** Every case is reported as one test per denominator/style to keep failures legible. */
const cases = denominators.flatMap(denominator =>
  [false, true].map(vulgarFractions => [denominator, vulgarFractions] as const)
);

test.each(cases)('round trip 1/%d (vulgar fractions: %p)', (denominator, vulgarFractions) => {
  const failures: unknown[] = [];

  for (const numerator of numerators) {
    const value = numerator / denominator;
    const formatted = formatQuantity(value, vulgarFractions);

    if (typeof formatted !== 'string') {
      failures.push({ value, formatted });
      continue;
    }

    const [ingredient] = parseIngredient(`${formatted} cups sugar`, { round: false });

    if (
      !closeEnough(ingredient.quantity, value) ||
      ingredient.quantity2 !== null ||
      ingredient.unitOfMeasureID !== 'cup' ||
      ingredient.description !== 'sugar'
    ) {
      failures.push({ value, formatted, ingredient });
    }
  }

  expect(failures).toEqual([]);
});

test.each(cases)(
  'round trip 1/%d as the upper end of a range (vulgar fractions: %p)',
  (denominator, vulgarFractions) => {
    const failures: unknown[] = [];

    for (const numerator of numerators) {
      const value = numerator / denominator;
      const formatted = formatQuantity(value, vulgarFractions) as string;
      const [ingredient] = parseIngredient(`1 to ${formatted} cups sugar`, { round: false });

      if (
        ingredient.quantity !== 1 ||
        !closeEnough(ingredient.quantity2, value) ||
        ingredient.unitOfMeasureID !== 'cup' ||
        ingredient.description !== 'sugar'
      ) {
        failures.push({ value, formatted, ingredient });
      }
    }

    expect(failures).toEqual([]);
  }
);

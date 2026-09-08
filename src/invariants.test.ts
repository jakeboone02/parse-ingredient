import { describe, expect, test } from 'bun:test';
import { parseIngredient } from './parseIngredient';
import { parseIngredientTests } from './parseIngredientTests';
import { isAcceptableQuantity } from './quantityScan';
import type { Ingredient } from './types';

/**
 * Post-conditions that must hold for *every* `Ingredient` this library ever returns,
 * regardless of input. They exist to catch incoherent results that per-fixture `toEqual`
 * assertions cannot: a fixture can only pin what it was written to expect, while these
 * apply to inputs nobody thought to write a fixture for.
 *
 * Returns a list of violated invariant names so callers can report the offending input.
 */
const invariantViolations = (ingredient: Ingredient): string[] => {
  const violations: string[] = [];

  // A range with no lower bound is not a range. `quantity2` without `quantity` means the
  // parser found a second value while rejecting the first, which no consumer can act on.
  if (ingredient.quantity === null && ingredient.quantity2 !== null) {
    violations.push('quantity === null implies quantity2 === null');
  }

  // The two UOM fields are one fact expressed two ways.
  if ((ingredient.unitOfMeasureID === null) !== (ingredient.unitOfMeasure === null)) {
    violations.push('unitOfMeasureID and unitOfMeasure are both null or both set');
  }

  // A group header is a label, not a measurement.
  if (
    ingredient.isGroupHeader &&
    (ingredient.quantity !== null ||
      ingredient.quantity2 !== null ||
      ingredient.unitOfMeasureID !== null)
  ) {
    violations.push('group headers carry no quantity or unit');
  }

  if (typeof ingredient.description !== 'string') {
    violations.push('description is always a string');
  }

  // `.trim()`-ing is the parser's job, not the consumer's.
  if (ingredient.description !== ingredient.description.trim()) {
    violations.push('description is trimmed');
  }

  if (ingredient.quantity !== null && typeof ingredient.quantity !== 'number') {
    violations.push('quantity is a number or null');
  }

  if (ingredient.quantity2 !== null && typeof ingredient.quantity2 !== 'number') {
    violations.push('quantity2 is a number or null');
  }

  // Neither `NaN` nor `Infinity` is ever a meaningful quantity.
  if (
    (ingredient.quantity !== null && !Number.isFinite(ingredient.quantity)) ||
    (ingredient.quantity2 !== null && !Number.isFinite(ingredient.quantity2))
  ) {
    violations.push('quantities are always finite');
  }

  // Documented in `Ingredient`: a parsed quantity is never negative.
  if (
    (ingredient.quantity !== null && ingredient.quantity < 0) ||
    (ingredient.quantity2 !== null && ingredient.quantity2 < 0)
  ) {
    violations.push('quantities are never negative');
  }

  violations.push(...measurementViolations(ingredient));

  return violations;
};

/**
 * Post-conditions for `descriptionMeasurements`. The index assertions are the load-bearing
 * ones: `text === description.slice(startIndex, endIndex)` catches every description-index
 * bug at once, and its source-relative counterpart does the same for the alignment.
 */
const measurementViolations = (ingredient: Ingredient): string[] => {
  const violations: string[] = [];
  const measurements = ingredient.descriptionMeasurements;

  if (!measurements) return violations;

  // A group header is a label, not a measurement — same rule as its quantity and unit.
  if (ingredient.isGroupHeader && measurements.length > 0) {
    violations.push('group headers carry no measurements');
  }

  let previousEnd = 0;

  for (const measurement of measurements) {
    if (!(measurement.startIndex < measurement.endIndex)) {
      violations.push('startIndex < endIndex');
    }

    if (measurement.startIndex < previousEnd) {
      violations.push('measurement spans ascend and do not overlap');
    }
    previousEnd = measurement.endIndex;

    if (
      ingredient.description.slice(measurement.startIndex, measurement.endIndex) !==
      measurement.text
    ) {
      violations.push('text === description.slice(startIndex, endIndex)');
    }

    if ((measurement.sourceStartIndex === null) !== (measurement.sourceEndIndex === null)) {
      violations.push('sourceStartIndex and sourceEndIndex are both null or both set');
    }

    if (
      measurement.sourceStartIndex !== null &&
      measurement.sourceEndIndex !== null &&
      ingredient.meta!.sourceText.slice(
        measurement.sourceStartIndex,
        measurement.sourceEndIndex
      ) !== measurement.text
    ) {
      violations.push('text === sourceText.slice(sourceStartIndex, sourceEndIndex)');
    }

    // A measurement without a recognized unit is not a measurement.
    if (!measurement.unitOfMeasureID || !measurement.unitOfMeasure) {
      violations.push('measurements always carry a unit');
    }

    // Same acceptance test the parser's own quantities are held to.
    if (
      !isAcceptableQuantity(measurement.quantity) ||
      (measurement.quantity2 !== null && !isAcceptableQuantity(measurement.quantity2))
    ) {
      violations.push('measurement quantities are finite and non-negative');
    }
  }

  return violations;
};

const expectInvariants = (
  input: string | string[],
  options?: Parameters<typeof parseIngredient>[1]
) => {
  // `includeMeta` and `descriptionMeasurements` are forced on so that every input is held
  // to the measurement and alignment invariants too, not just the ones whose fixture
  // happens to enable them.
  const failures = parseIngredient(input, {
    ...options,
    includeMeta: true,
    descriptionMeasurements: true,
  })
    .map(ingredient => ({ ingredient, violations: invariantViolations(ingredient) }))
    .filter(({ violations }) => violations.length > 0);

  expect({ input, failures }).toEqual({ input, failures: [] });
};

describe('every fixture result satisfies the Ingredient invariants', () => {
  for (const [name, [input, , options]] of Object.entries(parseIngredientTests)) {
    test(name, () => {
      expectInvariants(input, options);
    });
  }
});

/**
 * Inputs chosen to attack the invariants rather than to document behavior.
 */
const adversarialInputs = [
  '',
  '   ',
  '\n\n',
  'sugar',
  '2 cups',
  '2 cups sugar',
  'x2',
  'Ripe tomato x2',
  '-',
  '–',
  '—',
  '2 - cups',
  '1--2 cups sugar',
  '1 to cups sugar',
  '1/0 cups sugar',
  '1/0 to 2 cups sugar',
  '0/0 cups sugar',
  '1e1000 cups sugar',
  '1 1/2 - cups sugar',
  ': ',
  'For the icing:',
  'For:',
  '1 cup of',
  'of',
  '½',
  '½ - ½ cups sugar',
  '1,5 cups sugar',
  '000 cups sugar',
  '9007199254740993 cups sugar',
  // Description measurements: duplicated text, back-to-back units, interior splices, and
  // units with nothing parseable in front of them.
  '1 inch inch',
  'cup 1 cup cup',
  'of of 1 of of',
  '1 inch cm mm',
  'inch 1',
  'Juice of 1 lemon cut into 1 inch wedges',
  'Zest of 2 oranges and juice of 1 lime',
  'cut into 1--2 inch cubes',
  'cut into 1/0 inch cubes',
  'cut into -1 inch cubes',
  'cut into 1e1000 inch cubes',
  'İnch 1 inch',
];

test.each(adversarialInputs)('adversarial input %p satisfies the invariants', input => {
  expectInvariants(input);
});

/**
 * A leading `-` used to be rejected as a quantity but then consumed as a range
 * separator, so the value landed in `quantity2` and the result claimed an upper bound with
 * no lower one. `parseRangeQuantity2` now requires a `quantity`.
 */
test.each(['-2 cups sugar', '- 2 cups sugar', '-1 1/2 cups sugar'])(
  'negative leading quantity %p does not produce a lone quantity2',
  input => {
    expectInvariants(input);
  }
);

/**
 * The same failure via a leading range-separator *word*: no first quantity was found, but
 * the separator still opened a range. Covered by the same fix.
 */
test.each(['to 2 cups sugar', 'or 2 cups sugar'])(
  'a leading range separator in %p does not produce a lone quantity2',
  input => {
    expectInvariants(input);
  }
);

/**
 * Division by zero is the one input that reaches this library as `Infinity` —
 * `numeric-quantity` returns it intentionally. It is not a usable measurement, so the
 * token is rejected and the whole line stays in the description.
 */
test('a division by zero is not a quantity', () => {
  expect(parseIngredient('1/0 cups sugar')).toEqual([
    {
      quantity: null,
      quantity2: null,
      unitOfMeasureID: null,
      unitOfMeasure: null,
      description: '1/0 cups sugar',
      isGroupHeader: false,
    },
  ]);
});

test('a division by zero in the upper bound of a range is not a range', () => {
  expect(parseIngredient('1 to 1/0 cups sugar')).toMatchObject([{ quantity: 1, quantity2: null }]);
});

/**
 * Off-type input from JS consumers. The library is typed `string | string[]`, so these
 * are contract violations; the assertions exist to pin *how* they fail (a plain
 * `TypeError` at the boundary) rather than to endorse them.
 */
test.each([null, undefined, 42, {}, /re/])('parseIngredient(%p) throws a TypeError', value => {
  expect(() => parseIngredient(value as unknown as string)).toThrow(TypeError);
});

test.each([[[null]], [[undefined]], [[42]], [['1 cup sugar', null]]])(
  'parseIngredient(%p) throws a TypeError',
  value => {
    expect(() => parseIngredient(value as unknown as string[])).toThrow(TypeError);
  }
);

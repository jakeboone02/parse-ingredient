import { describe, expect, test } from 'bun:test';
import {
  numericQuantity,
  superSubDigitToAsciiMap,
  vulgarFractionToAsciiMap,
} from 'numeric-quantity';
import { buildLeadingQuantityPrefixRegex } from './constants';
import { parseIngredient } from './parseIngredient';
import { isAcceptableQuantity, stripLeadingQuantityPrefixes } from './parsePhases';

/**
 * The leading-quantity search bounds itself with a character class that must cover every
 * character `numericQuantity` can consume, including the non-ASCII forms it normalizes
 * internally. If a character is missing from that class it is treated as the start of the
 * description instead, so these assertions exist to catch drift from upstream rather than
 * to re-test `numericQuantity` itself.
 */
const standaloneNumericChars = [
  ...Object.keys(vulgarFractionToAsciiMap),
  ...Object.keys(superSubDigitToAsciiMap),
  // A representative Unicode decimal digit from a few different blocks.
  '٢', // Arabic-Indic
  '२', // Devanagari
  '๒', // Thai
  '２', // Fullwidth
].filter(char => !isNaN(numericQuantity(char)));

test.each(standaloneNumericChars)('leading quantity handles %s', char => {
  expect(parseIngredient(`${char} cups sugar`)).toEqual([
    {
      quantity: numericQuantity(char),
      quantity2: null,
      unitOfMeasureID: 'cup',
      unitOfMeasure: 'cups',
      description: 'sugar',
      isGroupHeader: false,
    },
  ]);
});

test('leading quantity handles the fraction slash', () => {
  expect(parseIngredient('1\u20442 cups sugar')[0].quantity).toBe(0.5);
});

/**
 * The quantity is located by trying progressively shorter prefixes, so quantities of any
 * length must be extracted whole rather than truncated into the description.
 */
test.each([
  ['1 cup sugar', 1, 'sugar'],
  ['12 cups sugar', 12, 'sugar'],
  ['123 cups sugar', 123, 'sugar'],
  ['1234 cups sugar', 1234, 'sugar'],
  ['12345 cups sugar', 12345, 'sugar'],
  ['123456 cups sugar', 123456, 'sugar'],
  ['1234567 cups sugar', 1234567, 'sugar'],
  ['12345678 cups sugar', 12345678, 'sugar'],
  ['1 1/2 cups sugar', 1.5, 'sugar'],
  ['1 1/16 cups sugar', 1.063, 'sugar'],
  ['1 11/16 cups sugar', 1.688, 'sugar'],
  ['1 111/160 cups sugar', 1.694, 'sugar'],
  ['1.5 cups sugar', 1.5, 'sugar'],
  ['1.5678 cups sugar', 1.568, 'sugar'],
])('extracts the entire quantity from %s', (input, quantity, description) => {
  const [ingredient] = parseIngredient(input);
  expect(ingredient.quantity).toBe(quantity);
  expect(ingredient.description).toBe(description);
});

test.each([
  ['1 - 12345678 cups sugar', 12345678],
  ['1 to 1 11/16 cups sugar', 1.688],
  ['1 - 1.5678 cups sugar', 1.568],
])('extracts the entire second quantity from %s', (input, quantity2) => {
  const [ingredient] = parseIngredient(input);
  expect(ingredient.quantity2).toBe(quantity2);
  expect(ingredient.description).toBe('sugar');
});

test('quantities are rounded to three decimal places by default', () => {
  expect(parseIngredient('1 11/16 cups sugar')[0].quantity).toBe(1.688);
});

test('round: false preserves the exact value', () => {
  expect(parseIngredient('1 11/16 cups sugar', { round: false })[0].quantity).toBe(1.6875);
});

test('round applies to both quantities in a range', () => {
  expect(parseIngredient('1 1/3 to 1 2/3 cups sugar', { round: 1 })).toMatchObject([
    { quantity: 1.3, quantity2: 1.7 },
  ]);
});

/**
 * `quantity` and `quantity2` share one acceptance test, so they can never disagree
 * about whether a value counts as a quantity. Negatives, `NaN`, and `Infinity` are
 * rejected on both paths.
 */
test.each([
  [0, true],
  [0.5, true],
  [1, true],
  [Infinity, false],
  [-0.5, false],
  [-1, false],
  [-2, false],
  [-Infinity, false],
  [NaN, false],
])('isAcceptableQuantity(%p) is %p', (value, expected) => {
  expect(isAcceptableQuantity(value)).toBe(expected);
});

describe('stripLeadingQuantityPrefixes', () => {
  const regex = buildLeadingQuantityPrefixRegex(['about', 'ca.']);

  test('returns the text unchanged when there is no prefix regex', () => {
    expect(stripLeadingQuantityPrefixes('  about 2 cups', null)).toBe('  about 2 cups');
  });

  test('returns empty text unchanged', () => {
    expect(stripLeadingQuantityPrefixes('', regex)).toBe('');
  });

  test('strips a prefix and the whitespace around it', () => {
    expect(stripLeadingQuantityPrefixes('  about   2 cups', regex)).toBe('2 cups');
  });

  test('strips a prefix that is adjacent to the quantity', () => {
    expect(stripLeadingQuantityPrefixes('ca.200 g', regex)).toBe('200 g');
  });

  test('strips repeatedly', () => {
    expect(stripLeadingQuantityPrefixes('about ca. 200 g', regex)).toBe('200 g');
  });

  test('leaves text that does not start with a prefix', () => {
    expect(stripLeadingQuantityPrefixes('2 cups about', regex)).toBe('2 cups about');
  });

  test('stops on a zero-length match rather than looping forever', () => {
    expect(stripLeadingQuantityPrefixes('2 cups', buildLeadingQuantityPrefixRegex([/x?/u]))).toBe(
      '2 cups'
    );
  });

  /** Alternation is left-to-right, so a shorter pattern listed first wins (README note). */
  test('matches patterns in the order given', () => {
    expect(stripLeadingQuantityPrefixes('ca. 200 g', buildLeadingQuantityPrefixRegex(['ca']))).toBe(
      '. 200 g'
    );
    expect(
      stripLeadingQuantityPrefixes('ca. 200 g', buildLeadingQuantityPrefixRegex(['ca.', 'ca']))
    ).toBe('200 g');
  });
});

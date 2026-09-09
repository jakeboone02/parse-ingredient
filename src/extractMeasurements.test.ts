import { describe, expect, test } from 'bun:test';
import { convertUnit } from './convertUnit';
import { extractMeasurements } from './extractMeasurements';
import type { Measurement } from './types';

/** The fields most assertions care about, so expectations stay readable. */
const summarize = (measurements: Measurement[]) =>
  measurements.map(({ quantity, quantity2, text, unitOfMeasureID }) => ({
    quantity,
    quantity2,
    unitOfMeasureID,
    text,
  }));

describe('finds a quantity paired with a unit', () => {
  test.each([
    ['cut into 1 1/2-inch cubes', 1.5, 'inch', '1 1/2-inch'],
    ['cut into 1 1/2 inch cubes', 1.5, 'inch', '1 1/2 inch'],
    ['beef (about 1 pound)', 1, 'pound', '1 pound'],
    ['½ inch thick', 0.5, 'inch', '½ inch'],
    ['reduce by 250 ml', 250, 'milliliter', '250 ml'],
    ['cut into 4 pieces', 4, 'piece', '4 pieces'],
  ])('%p', (text, quantity, unitOfMeasureID, matched) => {
    expect(summarize(extractMeasurements(text))).toEqual([
      { quantity, quantity2: null, unitOfMeasureID, text: matched },
    ]);
  });
});

describe('finds ranges', () => {
  test.each([
    ['cut into 1 to 2 inch cubes', '1 to 2 inch'],
    ['cut into 1-2 inch cubes', '1-2 inch'],
    ['cut into 1 – 2 inch cubes', '1 – 2 inch'],
    ['cut into 1 or 2 inch cubes', '1 or 2 inch'],
  ])('%p', (text, matched) => {
    expect(summarize(extractMeasurements(text))).toEqual([
      { quantity: 1, quantity2: 2, unitOfMeasureID: 'inch', text: matched },
    ]);
  });
});

describe('rejects text that is not a measurement', () => {
  /**
   * The whole heuristic is "a known unit preceded by something that parses, in its
   * entirety, as a quantity". These are the cases that requirement exists to reject.
   */
  test.each([
    'cut into cubes',
    // "in" inside a word is not an inch.
    'stir into the pan',
    // A unit with nothing quantity-like before it.
    'a pinch of salt',
    // Digits that are part of a word.
    'recipe A4 pan',
    // Only part of "9x13" parses, so the whole thing is rejected rather than reported as
    // a 13-inch measurement.
    'a 9x13 inch pan',
    // A quantity separated from the unit by a word.
    'chill 2 hours then cut in cubes',
    // No numeric character at all — the scan is skipped entirely.
    'salt and pepper to taste',
  ])('%p', text => {
    expect(extractMeasurements(text)).toEqual([]);
  });
});

test('finds multiple, non-overlapping measurements', () => {
  expect(summarize(extractMeasurements('a 1 inch by 2 inch by 3 cm block'))).toEqual([
    { quantity: 1, quantity2: null, unitOfMeasureID: 'inch', text: '1 inch' },
    { quantity: 2, quantity2: null, unitOfMeasureID: 'inch', text: '2 inch' },
    { quantity: 3, quantity2: null, unitOfMeasureID: 'centimeter', text: '3 cm' },
  ]);
});

test('a quantity is never claimed by two measurements', () => {
  // The backwards scan for "cm" cannot reach past the end of the "1 inch" match.
  expect(summarize(extractMeasurements('1 inch cm'))).toEqual([
    { quantity: 1, quantity2: null, unitOfMeasureID: 'inch', text: '1 inch' },
  ]);
});

test('prefers the longest unit at a given position', () => {
  expect(summarize(extractMeasurements('add 2 fluid ounces'))).toEqual([
    { quantity: 2, quantity2: null, unitOfMeasureID: 'fluid ounce', text: '2 fluid ounces' },
  ]);
});

test('unit identification is case-sensitive first', () => {
  expect(extractMeasurements('add 1 T and 1 t')).toMatchObject([
    { unitOfMeasureID: 'tablespoon' },
    { unitOfMeasureID: 'teaspoon' },
  ]);
});

test('reports the unit type', () => {
  expect(extractMeasurements('1 inch, 1 gram, 1 cup, 1 piece, 1 large')).toMatchObject([
    { unitType: 'length' },
    { unitType: 'mass' },
    { unitType: 'volume' },
    { unitType: 'count' },
    { unitType: 'other' },
  ]);
});

test('a unit with no declared type reports a null unitType', () => {
  expect(
    extractMeasurements('2 bkt water', {
      additionalUOMs: { bucket: { short: 'bkt', plural: 'buckets' } },
    })
  ).toMatchObject([{ unitOfMeasureID: 'bucket', unitType: null }]);
});

describe('options', () => {
  test('normalizeUOM reports the canonical ID', () => {
    expect(extractMeasurements('2 inches', { normalizeUOM: true })).toMatchObject([
      { unitOfMeasure: 'inch' },
    ]);
  });

  test('ignoreUOMs excludes a unit', () => {
    expect(extractMeasurements('4 pieces', { ignoreUOMs: ['pieces'] })).toEqual([]);
  });

  test('additionalUOMs adds a unit', () => {
    expect(
      summarize(
        extractMeasurements('2 buckets water', {
          additionalUOMs: { bucket: { short: 'bkt', plural: 'buckets', type: 'volume' } },
        })
      )
    ).toEqual([{ quantity: 2, quantity2: null, unitOfMeasureID: 'bucket', text: '2 buckets' }]);
  });

  test('decimalSeparator applies to the quantity', () => {
    expect(summarize(extractMeasurements('2,5 cm dick', { decimalSeparator: ',' }))).toEqual([
      { quantity: 2.5, quantity2: null, unitOfMeasureID: 'centimeter', text: '2,5 cm' },
    ]);
  });

  test('rangeSeparators applies to ranges', () => {
    expect(summarize(extractMeasurements('1 bis 2 cm dick', { rangeSeparators: ['bis'] }))).toEqual(
      [{ quantity: 1, quantity2: 2, unitOfMeasureID: 'centimeter', text: '1 bis 2 cm' }]
    );
  });

  /**
   * `round` is forwarded, so a description measurement cannot be rounded differently from
   * the quantity the parser reports for the same line.
   */
  test('round: false keeps the exact value', () => {
    expect(extractMeasurements('1 1/16 inch')).toMatchObject([{ quantity: 1.063 }]);
    expect(extractMeasurements('1 1/16 inch', { round: false })).toMatchObject([
      { quantity: 1.0625 },
    ]);
  });

  test("measurementUnits: 'convertible' keeps only units convertUnit can act on", () => {
    const text = 'cut into 4 pieces, 1 inch thick, with 2 pinches of salt';

    expect(summarize(extractMeasurements(text)).map(m => m.unitOfMeasureID)).toEqual([
      'piece',
      'inch',
      'pinch',
    ]);
    expect(
      summarize(extractMeasurements(text, { measurementUnits: 'convertible' })).map(
        m => m.unitOfMeasureID
      )
    ).toEqual(['inch']);
  });
});

/**
 * Every reported span must be exactly the text it claims. This is the one assertion that
 * catches an index bug regardless of which path produced it.
 */
describe('indices always describe the reported text', () => {
  test.each([
    'cut into 1 1/2-inch cubes',
    'beef (about 1 pound)',
    'a 1 inch by 2 inch by 3 cm block',
    // `İ` lowercases to two code points, so any case-folding of the haystack would shift
    // every index after it. Matching is done on the original text, so it cannot.
    'Beef İnch, cut into 1 inch cubes',
    'İİİ 1 inch',
    'ölçü 2 cm ölçü 3 cm',
  ])('%p', text => {
    for (const measurement of extractMeasurements(text)) {
      expect(text.slice(measurement.startIndex, measurement.endIndex)).toBe(measurement.text);
    }
  });
});

/** The composition the feature exists for: extract, then convert. */
test('composes with convertUnit', () => {
  const [measurement] = extractMeasurements('cut into 1 1/2-inch cubes');

  expect(convertUnit(measurement.quantity, measurement.unitOfMeasureID, 'centimeter')).toBe(3.81);
});

test('an empty string yields no measurements', () => {
  expect(extractMeasurements('')).toEqual([]);
});

/**
 * The scan regex is global and cached across calls, so its `lastIndex` is shared state.
 * Repeating a call must give the same answer.
 */
test('repeat calls do not leak regex state', () => {
  const first = extractMeasurements('a 1 inch by 2 inch block');
  const second = extractMeasurements('a 1 inch by 2 inch block');

  expect(second).toEqual(first);
  expect(second).toBeArrayOfSize(2);
});

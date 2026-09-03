import { expect, test } from 'bun:test';
import {
  defaultDescriptionStripPrefixes,
  defaultGroupHeaderPatterns,
  defaultLeadingQuantityPrefixes,
  defaultOptions,
  defaultRangeSeparators,
  defaultTrailingQuantityContext,
  unitsOfMeasure,
} from './constants';
import { parseIngredient } from './parseIngredient';

/**
 * Every one of these is reachable from the public surface, and every one of them would
 * reconfigure the library process-wide if it could be mutated. `defaultOptions` is spread
 * on each call, so a write would take effect immediately; `unitsOfMeasure` is worse,
 * because the lookup maps built from it are memoized lazily — whether a mutation is
 * observed would depend on whether anything has parsed yet.
 *
 * The tests below only *observe* frozenness — they deliberately do not mutate anything,
 * so they cannot leak state into the rest of the suite.
 */

test('defaultOptions is frozen', () => {
  expect(Object.isFrozen(defaultOptions)).toBe(true);
});

test.each([
  ['groupHeaderPatterns', defaultOptions.groupHeaderPatterns],
  ['rangeSeparators', defaultOptions.rangeSeparators],
  ['descriptionStripPrefixes', defaultOptions.descriptionStripPrefixes],
  ['trailingQuantityContext', defaultOptions.trailingQuantityContext],
  ['leadingQuantityPrefixes', defaultOptions.leadingQuantityPrefixes],
  ['additionalUOMs', defaultOptions.additionalUOMs],
  ['ignoreUOMs', defaultOptions.ignoreUOMs],
])('defaultOptions.%s is frozen', (_name, value) => {
  expect(Object.isFrozen(value)).toBe(true);
});

test.each([
  ['defaultGroupHeaderPatterns', defaultGroupHeaderPatterns],
  ['defaultRangeSeparators', defaultRangeSeparators],
  ['defaultDescriptionStripPrefixes', defaultDescriptionStripPrefixes],
  ['defaultTrailingQuantityContext', defaultTrailingQuantityContext],
  ['defaultLeadingQuantityPrefixes', defaultLeadingQuantityPrefixes],
])('%s is frozen', (_name, value) => {
  expect(Object.isFrozen(value)).toBe(true);
});

test('unitsOfMeasure is frozen', () => {
  expect(Object.isFrozen(unitsOfMeasure)).toBe(true);
});

test('every unit definition is frozen', () => {
  const unfrozen = Object.entries(unitsOfMeasure)
    .filter(([, def]) => !Object.isFrozen(def))
    .map(([id]) => id);
  expect(unfrozen).toEqual([]);
});

test('every alternates array is frozen', () => {
  const unfrozen = Object.entries(unitsOfMeasure)
    .filter(([, def]) => def.alternates && !Object.isFrozen(def.alternates))
    .map(([id]) => id);
  expect(unfrozen).toEqual([]);
});

test('every multi-system conversion factor is frozen', () => {
  const unfrozen = Object.entries(unitsOfMeasure)
    .filter(
      ([, def]) =>
        typeof def.conversionFactor === 'object' && !Object.isFrozen(def.conversionFactor)
    )
    .map(([id]) => id);
  expect(unfrozen).toEqual([]);
});

/**
 * The point of freezing, stated as behavior rather than as a property check: a write to a
 * shared constant must not change what a later, unrelated `parseIngredient` call returns.
 *
 * Once frozen, the assignment itself throws (modules are strict mode), so the attempt is
 * swallowed — either outcome, silent no-op or throw, satisfies the contract. Each case
 * restores in a `finally` so a failure here cannot cascade into unrelated tests.
 */
const tryMutate = (mutate: () => void) => {
  try {
    mutate();
  } catch {
    // Frozen: the assignment threw, which is the desired end state.
  }
};

test('mutating defaultOptions does not reconfigure the library', () => {
  const original = defaultOptions.normalizeUOM;
  try {
    tryMutate(() => {
      (defaultOptions as { normalizeUOM: boolean }).normalizeUOM = true;
    });
    expect(parseIngredient('1 c sugar')[0].unitOfMeasure).toBe('c');
  } finally {
    tryMutate(() => {
      (defaultOptions as { normalizeUOM: boolean }).normalizeUOM = original;
    });
  }
});

test('mutating unitsOfMeasure does not reconfigure the library', () => {
  // Cast: the property is `readonly` now, so the write only exists as a runtime check of
  // what a plain-JS consumer would attempt.
  const cup = unitsOfMeasure.cup as { plural: string };
  const original = cup.plural;
  try {
    // A value nothing else could match, so the assertions can't pass by coincidence.
    tryMutate(() => {
      cup.plural = 'zzz';
    });
    expect(cup.plural).toBe('cups');
    expect(parseIngredient('2 zzz sugar')[0].unitOfMeasureID).toBeNull();
  } finally {
    tryMutate(() => {
      cup.plural = original;
    });
  }
});

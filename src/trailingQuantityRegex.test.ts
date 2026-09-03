import { expect, test } from 'bun:test';
import { numericRegex } from 'numeric-quantity';
import { buildRangeSeparatorSource, buildTrailingQuantityRegex, firstWordRegEx } from './constants';
import { parseIngredient } from './parseIngredient';

/**
 * The existing `buildTrailingQuantityRegex` tests only assert that *something* matched,
 * which passes trivially even when the wrong slots are read. These assert the captured
 * values instead.
 */

/**
 * `buildTrailingQuantityRegex` inlines `numericRegex`'s source twice, so the same
 * group names would appear twice in one pattern — a construction-time `SyntaxError` —
 * if `numeric-quantity` ever adopted named groups. It is a caret dependency, so assert
 * the assumption rather than discovering it in a consumer's build.
 *
 * The old capture-*count* assumption is gone: extraction now goes through the library's
 * own named groups, so upstream adding or removing an anonymous group is harmless.
 */
test('numericRegex contains no named capture groups', () => {
  expect(numericRegex.source).not.toMatch(/\(\?<(?![=!])/u);
});

/**
 * Behavioral contract, asserted end-to-end so it stays meaningful across the named-group
 * refactor: the trailing-quantity path must recover the first quantity, the second
 * quantity, and the unit — not merely match.
 */
test.each([
  ['Ripe tomato x2', 2, null, null, 'Ripe tomato'],
  ['Stuff 300mg', 300, null, 'milligram', 'Stuff'],
  ['Stuff 1-2 cups', 1, 2, 'cup', 'Stuff'],
  ['Stuff 1–2 cups', 1, 2, 'cup', 'Stuff'],
  ['Stuff 1 to 2 cups', 1, 2, 'cup', 'Stuff'],
  ['Stuff 1 or 2 cups', 1, 2, 'cup', 'Stuff'],
  ['Stuff 1 1/2 to 2 1/4 cups', 1.5, 2.25, 'cup', 'Stuff'],
])(
  'trailing quantity in %p yields %p / %p / %p',
  (input, quantity, quantity2, unitOfMeasureID, description) => {
    expect(parseIngredient(input)).toMatchObject([
      { quantity, quantity2, unitOfMeasureID, description },
    ]);
  }
);

test.each([
  ['Sachen 1 bis 2 Tassen', 1, 2],
  ['Sachen 1 oder 2', 1, 2],
])('custom string range separator in %p yields %p / %p', (input, quantity, quantity2) => {
  expect(parseIngredient(input, { rangeSeparators: ['bis', 'oder'] })).toMatchObject([
    { quantity, quantity2 },
  ]);
});

/**
 * `buildRangeSeparatorSource` wraps each user pattern in `(?:…)`, which does not
 * neutralize capture groups *inside* the pattern's own source. One extra group shifts
 * every index after it, so the fixed `[3]` / `[12]` reads land on the wrong slots and
 * `quantity2` is silently lost. The README advertises user `RegExp` patterns as a
 * supported feature, so this was reachable from documented usage. Fixed by reading the
 * named groups instead.
 */
test.each([[/(bis)/iu], [/(?:(bis)|(oder))/iu], [/((b)is)/iu]])(
  'a capture group inside a user range separator (%p) does not lose quantity2',
  separator => {
    expect(parseIngredient('Stuff 1 bis 2 cups', { rangeSeparators: [separator] })).toMatchObject([
      { quantity: 1, quantity2: 2, unitOfMeasureID: 'cup', description: 'Stuff' },
    ]);
  }
);

/** The same pattern without a capture group already works, isolating the cause. */
test('a non-capturing user range separator preserves quantity2', () => {
  expect(parseIngredient('Stuff 1 bis 2 cups', { rangeSeparators: [/(?:bis)/iu] })).toMatchObject([
    { quantity: 1, quantity2: 2, unitOfMeasureID: 'cup', description: 'Stuff' },
  ]);
});

/**
 * Named groups make the extraction immune to both failure modes above, since neither an
 * upstream group-count change nor a user capture group can shift a name. Only the outer
 * captures are named — `numericRegex`'s internal groups stay anonymous, and the two
 * insertions must not collide on a name.
 */
test('the trailing quantity regex exposes named groups', () => {
  const regex = buildTrailingQuantityRegex(['to', 'or']);
  const groups = regex.exec('Stuff 1 to 2 cups')?.groups;

  expect(groups).toBeDefined();
  expect(groups!.qty1).toBe('1');
  expect(groups!.qty2).toBe('2');
  expect(groups!.uom).toBe('cups');
});

test('the named groups tolerate a missing first quantity and unit', () => {
  const regex = buildTrailingQuantityRegex(['to', 'or']);
  const groups = regex.exec('Ripe tomato x2')?.groups;

  expect(groups).toBeDefined();
  expect(groups!.qty1).toBeUndefined();
  expect(groups!.qty2).toBe('2');
  expect(groups!.uom).toBeUndefined();
});

/**
 * The library now uses named groups of its own, so a user pattern whose name collides
 * would throw at `RegExp` construction time. Policy: named groups in user patterns are
 * rewritten as non-capturing, which neutralizes collisions without changing what matches.
 */
test('a named group in a user range separator does not break composition', () => {
  expect(() => buildTrailingQuantityRegex([/(?<sep>bis)/iu])).not.toThrow();
  expect(
    parseIngredient('Stuff 1 bis 2 cups', { rangeSeparators: [/(?<sep>bis)/iu] })
  ).toMatchObject([{ quantity: 1, quantity2: 2, unitOfMeasureID: 'cup', description: 'Stuff' }]);
});

/** Lookbehinds share the `(?<` prefix and must survive the rewrite intact. */
test('a lookbehind in a user range separator is preserved', () => {
  expect(
    parseIngredient('Stuff 1 bis 2 cups', { rangeSeparators: [/(?<=\s)bis/iu] })
  ).toMatchObject([{ quantity: 1, quantity2: 2, unitOfMeasureID: 'cup', description: 'Stuff' }]);
  // Negative lookbehind: "bis" is preceded by a space, so it is not a separator here and
  // only the final "2 cups" is picked up as a trailing quantity.
  expect(
    parseIngredient('Stuff 1 bis 2 cups', { rangeSeparators: [/(?<!\s)bis/iu] })
  ).toMatchObject([{ quantity: 2, quantity2: null, description: 'Stuff 1 bis' }]);
});

/**
 * The UOM word pattern is `uomWordSource`, inlined by both `firstWordRegEx` and
 * `buildTrailingQuantityRegex`. Sharing one source makes textual drift impossible, so
 * there is nothing left to assert about the sources themselves — but the *shapes* that
 * pattern is meant to admit were never covered. These pin them, on both consumers at
 * once, so a future narrowing of the pattern fails loudly rather than silently changing
 * which words count as units.
 */
test.each([
  'cups',
  'fl oz',
  'fl-oz',
  'fluid ounces',
  'fluid-ounce',
  'oz.',
  'T.',
  'c/s',
  'kilo-gram',
  'tasses',
  '大さじ',
  'cup(s)',
  'gram.s',
])('%p is captured as a unit word by both consumers', uom => {
  expect(firstWordRegEx.exec(`${uom} sugar`)?.[1]).toBe(uom);
  expect(buildTrailingQuantityRegex(['to', 'or']).exec(`Stuff 1 ${uom}`)?.groups?.uom).toBe(uom);
});

/** An escaped `\(?<name>` is literal text, not a group, and must not be rewritten. */
test('an escaped group-like sequence in a user range separator is left alone', () => {
  expect(buildRangeSeparatorSource([/\(\?<x>bis/u])).toContain(String.raw`\(\?<x>bis`);
});

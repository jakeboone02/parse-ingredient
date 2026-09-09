import {
  numericQuantity,
  NumericQuantityOptions,
  superSubDigitToAsciiMap,
  vulgarFractionToAsciiMap,
} from 'numeric-quantity';

/**
 * The options `numericQuantity` is called with. The `bigIntOnOverflow`/`verbose` literals
 * are load-bearing: they are what narrows `numericQuantity`'s conditional return type to
 * `number`.
 *
 * @internal
 */
export type NQOptions = NumericQuantityOptions & { bigIntOnOverflow: false; verbose: false };

/**
 * Matches the first character that `numericQuantity` could *not* consume, and therefore
 * marks the end of any leading quantity. The class it negates covers the non-ASCII forms
 * `numericQuantity` normalizes as well: Unicode decimal digits, vulgar fractions,
 * super/subscript digits, and the fraction slash.
 *
 * This is not a grammar — it is only an upper bound on how far
 * {@link matchLeadingQuantity} has to search. Being too narrow merely shortens the
 * search; being too wide merely costs iterations. Correctness is delegated entirely to
 * `numericQuantity`.
 *
 * @internal
 */
export const nonQuantityCharRegExp: RegExp = new RegExp(
  `[^\\p{Nd}\\s.,_/+\u2044${Object.keys(vulgarFractionToAsciiMap).join('')}${Object.keys(
    superSubDigitToAsciiMap
  ).join('')}eE-]`,
  'u'
);

/**
 * Finds the longest prefix of `text` that parses as a single numeric value.
 *
 * `numericQuantity` is all-or-nothing on the string it is given, so the end of the
 * quantity can only be located by trying prefixes longest-first and taking the first one
 * that both parses and satisfies `accept`.
 *
 * A prefix that parses to a *rejected* value (negative, `Infinity`) ends the search
 * instead of shortening it: the shorter prefixes are fragments of that same number, so
 * accepting one would silently reinterpret part of the value as description. `'1/0 cups'`
 * must not become `quantity: 1` with a description of `'/0 cups'`.
 *
 * Returns the parsed value along with the remainder of the *original* text (never the
 * normalized form `numericQuantity` works with internally), or `null` if no prefix
 * qualifies.
 *
 * @internal
 */
export const matchLeadingQuantity = (
  text: string,
  nqOpts: NQOptions,
  accept: (value: number) => boolean
): { value: number; rest: string } | null => {
  const stop = nonQuantityCharRegExp.exec(text);

  for (let len = stop ? stop.index : text.length; len > 0; len--) {
    const value = numericQuantity(text.substring(0, len).trim(), nqOpts);

    if (accept(value)) {
      return { value, rest: text.substring(len).trim() };
    }

    if (!Number.isNaN(value)) break;
  }

  return null;
};

/**
 * The single acceptance test for a parsed quantity, shared by `quantity` and `quantity2`
 * so the two paths can never disagree about whether a value counts as a quantity.
 *
 * Rejects `NaN` (nothing parsed), negatives (a negative amount of an ingredient is
 * meaningless), and non-finite values (`numeric-quantity` returns `Infinity` for `'1/0'`,
 * which is not a usable recipe quantity and would serialize to `null` anyway).
 *
 * @internal
 */
export const isAcceptableQuantity = (value: number): boolean =>
  Number.isFinite(value) && value >= 0;

const whitespaceRegExp = /\s/u;

/**
 * Characters a quantity is allowed to start immediately after. Anything else means the
 * digits are part of a larger word ("x12", "A4") rather than a measurement.
 */
const quantityStartBoundaryRegExp = /[\s([{"'\u2018\u201c\u201d\u2019,;:~\-\u2010-\u2015]/u;

/**
 * Finds the longest *suffix* of `text` that parses as a single acceptable quantity, and
 * whose start sits at a word boundary.
 *
 * The backwards counterpart of {@link matchLeadingQuantity}, used when a unit has already
 * been located and the quantity preceding it has to be delimited from the left. The
 * search is bounded by {@link nonQuantityCharRegExp} scanning backwards from the end —
 * never by a fixed-width window — so a quantity of any length is found whole. `minStart`
 * bounds it further, for callers that must not look back past a known point.
 *
 * @returns The parsed value and its start index in `text`, or `null`.
 *
 * @internal
 */
export const matchTrailingQuantity = (
  text: string,
  nqOpts: NQOptions,
  minStart = 0
): { value: number; startIndex: number } | null => {
  // Lower bound on the start index: one past the last character `numericQuantity` could
  // not have consumed. Derived from the text, never a fixed window.
  let min = minStart;
  for (let i = text.length - 1; i >= min; i--) {
    if (nonQuantityCharRegExp.test(text[i])) {
      min = i + 1;
      break;
    }
  }

  for (let start = min; start < text.length; start++) {
    // A quantity never starts on whitespace, and never mid-word ("x12" is not 12).
    if (whitespaceRegExp.test(text[start])) continue;
    if (start > 0 && !quantityStartBoundaryRegExp.test(text[start - 1])) continue;

    const value = numericQuantity(text.substring(start), nqOpts);
    // Leftmost acceptable start wins, so the longest quantity is returned.
    if (isAcceptableQuantity(value)) return { value, startIndex: start };
  }

  return null;
};

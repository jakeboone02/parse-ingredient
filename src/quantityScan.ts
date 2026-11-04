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

const whitespaceRegExp = /\s/u;

const signLeftRegExp = /[\seE]/u;

const vulgarFractionChars = new Set(Object.keys(vulgarFractionToAsciiMap));

const quantityDigitRegExp = new RegExp(
  `[\\p{Nd}${Object.keys(superSubDigitToAsciiMap).join('')}]`,
  'u'
);

/**
 * A char a quantity can end on: a digit (any script), super/subscript digit, or vulgar
 * fraction. `'1.'` and `'1/'` are not quantities.
 *
 * @internal
 */
export const quantityEndCharRegExp: RegExp = new RegExp(
  `[\\p{Nd}${Object.keys(superSubDigitToAsciiMap).join('')}${Object.keys(
    vulgarFractionToAsciiMap
  ).join('')}]`,
  'u'
);

const isSlashLike = (ch: string): boolean =>
  ch === '/' || ch === '\u2044' || vulgarFractionChars.has(ch);

/** Code point starting at `i`. */
const codePointAt = (text: string, i: number): string => String.fromCodePoint(text.codePointAt(i)!);

/** Code point ending at `i` (a surrogate pair if `text[i]` is its low half). */
const codePointEndingAt = (text: string, i: number): string =>
  i > 0 && /[\uDC00-\uDFFF]/.test(text[i]) && /[\uD800-\uDBFF]/.test(text[i - 1])
    ? text.slice(i - 1, i + 1)
    : text[i];

const decimalSeparatorChars = new Set(['.', ',', '_']);

/** Whether the code point at `i` is a digit preceded by whitespace preceded by a digit. */
const digitAfterGap = (text: string, i: number): boolean => {
  if (
    !quantityDigitRegExp.test(codePointAt(text, i)) ||
    !whitespaceRegExp.test(text[i - 1] ?? '')
  ) {
    return false;
  }
  let j = i - 1;
  while (j >= 0 && whitespaceRegExp.test(text[j])) j--;
  return j >= 0 && quantityDigitRegExp.test(codePointEndingAt(text, j));
};

/** Whether the code point at `i` is a digit followed by whitespace followed by a digit. */
const digitBeforeGap = (text: string, i: number): boolean => {
  const ch = codePointAt(text, i);
  if (!quantityDigitRegExp.test(ch) || !whitespaceRegExp.test(text[i + ch.length] ?? '')) {
    return false;
  }
  let j = i + ch.length;
  while (j < text.length && whitespaceRegExp.test(text[j])) j++;
  return j < text.length && quantityDigitRegExp.test(codePointAt(text, j));
};

/**
 * Returns a per-char tally that only grows; once it returns `false`, no span containing every
 * char fed so far can parse. Upper bounds from `numericRegex`, kept loose on purpose: too
 * loose only costs iterations, too tight would drop quantities. Bounds what would otherwise
 * be one `numericQuantity` call per char of a long all-quantity-char run (quadratic).
 * Fed one char at a time, in `backwards` order for suffix scans.
 */
const createQuantityTally = (
  decimalSeparator: NQOptions['decimalSeparator'],
  backwards = false
) => {
  let slashes = 0;
  let exponents = 0;
  let signs = 0;
  let dots = 0;
  let commas = 0;
  let wsRuns = 0;
  let prev = '';

  return (ch: string): boolean => {
    const before = prev;
    prev = ch;
    const [left, right] = backwards ? [ch, before] : [before, ch];
    // A sign only leads the number or follows an exponent marker
    if ((right === '-' || right === '+') && left && !signLeftRegExp.test(left)) return false;
    // Separators need a digit next (`'1. 5'` is NaN), so a following gap ends every span
    if (decimalSeparatorChars.has(left) && whitespaceRegExp.test(right)) return false;
    if (vulgarFractionChars.has(ch)) {
      // Expands to ` n/d`: a whitespace run plus a slash
      wsRuns++;
      return ++slashes <= 1;
    }
    if (whitespaceRegExp.test(ch)) {
      // Sign, mixed number, both sides of the slash, vulgar expansion, plus trim slack
      if (!whitespaceRegExp.test(before)) wsRuns++;
      return wsRuns <= 8;
    }
    if (ch === '/' || ch === '\u2044') return ++slashes <= 1;
    if (ch === 'e' || ch === 'E') return ++exponents <= 1;
    // Leading sign plus exponent sign
    if (ch === '-' || ch === '+') return ++signs <= 2;
    if (ch === '.' || ch === ',' || ch === '_') {
      // Every separator must be followed by a digit
      if (before === '.' || before === ',' || before === '_') return false;
      if (ch === '.' && decimalSeparator !== ',') return ++dots <= 1;
      if (ch === ',' && decimalSeparator === ',') return ++commas <= 1;
    }
    return true;
  };
};

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
  const tally = createQuantityTally(nqOpts.decimalSeparator);
  // Without a slash, digits never straddle whitespace (`'1 2'` is NaN), so prefixes ending
  // past the first such gap but before the first slash are skipped
  let slash = -1;
  let gap = -1;
  let end = 0;
  // By code point, so astral digits like `'𝟚'` aren't split into lone surrogates
  for (let ch = ''; end < text.length; end += ch.length) {
    ch = String.fromCodePoint(text.codePointAt(end)!);
    if (nonQuantityCharRegExp.test(ch) || !tally(ch)) break;
    if (slash < 0 && isSlashLike(ch)) slash = end;
    else if (slash < 0 && gap < 0 && digitAfterGap(text, end)) gap = end;
  }

  for (let len = end; len > 0; len--) {
    if (len > gap && gap >= 0 && (slash < 0 || len <= slash)) continue;
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

/**
 * Characters a quantity is allowed to start immediately after. Anything else means the
 * digits are part of a larger word ("x12", "A4") rather than a measurement.
 */
const quantityStartBoundaryRegExp = /[\s([{"'\u2018\u201c\u201d\u2019,;:~\-\u2010-\u2015]/u;

/**
 * A slash also starts a quantity, as in the alternate amount of `'cups/10 ounces'`, unless
 * a numeric char (per `numericQuantity`: digits, vulgar fractions, etc.) precedes it: then
 * it is a fraction bar, and `'1/0'` / `'½/1'` must not yield a quantity. The char is read
 * by code point, so astral digits like `'𝟚'` count too.
 */
const isQuantityStartBoundary = (text: string, start: number, nqOpts: NQOptions): boolean => {
  if (quantityStartBoundaryRegExp.test(text[start - 1])) return true;
  if (text[start - 1] !== '/') return false;
  const before = Array.from(text.slice(Math.max(0, start - 3), start - 1)).at(-1);
  return !before || isNaN(numericQuantity(before, nqOpts));
};

const trailingPrefixChars = new Set([':', '-', '–', '—', '⨯']);

const casedLetterRegExp = /\p{LC}/u;

const letterRegExp = /\p{L}/u;

/**
 * Whether a quantity, or the range/prefix leading it, may start at `start` when parsing a
 * line's trailing quantity. Allowed after whitespace, a prefix char (`,` `:` dashes `x`
 * `⨯`), or any other char except a cased letter (`'A4'` is not a quantity; CJK `'大さじ2'`
 * is) or part of a number. An `x` must not end a word (`'box 2'` is not `'bo'` × 2).
 *
 * @internal
 */
export const isTrailingQuantityStart = (text: string, start: number): boolean => {
  if (start === 0) return true;
  const prev = codePointEndingAt(text, start - 1);
  if (whitespaceRegExp.test(prev) || trailingPrefixChars.has(prev)) return true;
  const beforePrev = start > prev.length ? codePointEndingAt(text, start - prev.length - 1) : '';
  if (prev === 'x' || prev === 'X') return !letterRegExp.test(beforePrev);
  if (prev === ',') {
    return !(
      quantityEndCharRegExp.test(beforePrev) && quantityDigitRegExp.test(codePointAt(text, start))
    );
  }
  if (prev === '/' || prev === '\u2044') return !quantityEndCharRegExp.test(beforePrev);
  return (
    !casedLetterRegExp.test(prev) &&
    !quantityEndCharRegExp.test(prev) &&
    !decimalSeparatorChars.has(prev)
  );
};

/**
 * Options for {@link matchTrailingQuantity}.
 *
 * @internal
 */
export interface TrailingQuantityScanOptions {
  /** Lower bound on the start index. */
  minStart?: number;
  /** Replaces the default start-boundary test. */
  isStart?: (text: string, start: number) => boolean;
  /**
   * Return the first boundary-valid start that parses to a *rejected* value (negative,
   * `Infinity`) instead of skipping it, so callers can reject the whole match.
   */
  stopAtRejected?: boolean;
}

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
 * @returns The parsed value and its start index in `text`, or `null`. With `stopAtRejected`,
 * the value may be unacceptable.
 *
 * @internal
 */
export const matchTrailingQuantity = (
  text: string,
  nqOpts: NQOptions,
  { minStart = 0, isStart, stopAtRejected = false }: TrailingQuantityScanOptions = {}
): { value: number; startIndex: number } | null => {
  // Lower bound on the start index: one past the last character `numericQuantity` could
  // not have consumed. Derived from the text, never a fixed window.
  let min = minStart;
  const tally = createQuantityTally(nqOpts.decimalSeparator, true);
  // Mirror of the gap/slash pruning in `matchLeadingQuantity`
  let slash = -1;
  let gap = -1;
  // By code point, so trailing astral digits like `'𝟚'` aren't split into lone surrogates
  for (let i = text.length - 1, ch = ''; i >= min; i -= ch.length) {
    ch = codePointEndingAt(text, i);
    const s = i - ch.length + 1;
    if (s < min || nonQuantityCharRegExp.test(ch) || !tally(ch)) {
      min = i + 1;
      break;
    }
    if (slash < 0 && isSlashLike(ch)) slash = s;
    else if (slash < 0 && gap < 0 && digitBeforeGap(text, s)) gap = s;
  }

  for (let start = min; start < text.length; start++) {
    if (start <= gap && start > slash) continue;
    // A quantity never starts on whitespace, and never mid-word ("x12" is not 12).
    if (whitespaceRegExp.test(text[start])) continue;
    if (
      start > 0 &&
      !(isStart ? isStart(text, start) : isQuantityStartBoundary(text, start, nqOpts))
    ) {
      continue;
    }

    const value = numericQuantity(text.substring(start), nqOpts);
    // Leftmost acceptable start wins, so the longest quantity is returned.
    if (isAcceptableQuantity(value) || (stopAtRejected && !Number.isNaN(value))) {
      return { value, startIndex: start };
    }
  }

  return null;
};

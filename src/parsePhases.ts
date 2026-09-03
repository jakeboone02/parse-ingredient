import {
  numericQuantity,
  NumericQuantityOptions,
  superSubDigitToAsciiMap,
  vulgarFractionToAsciiMap,
} from 'numeric-quantity';
import {
  buildLeadingQuantityPrefixRegex,
  buildPrefixPatternRegex,
  buildRangeSeparatorRegex,
  buildStripPrefixRegex,
  buildTrailingContextRegex,
  buildTrailingQuantityRegex,
  defaultOptions,
  firstWordRegEx,
} from './constants';
import { identifyUnit } from './convertUnit';
import type { Ingredient, ParseIngredientOptions } from './types';
import { buildUnitLookupMaps, collectUOMStrings, getDefaultUnitLookupMaps } from './unitLookup';

/**
 * The options `numericQuantity` is called with. The `bigIntOnOverflow`/`verbose` literals
 * are load-bearing: they are what narrows `numericQuantity`'s conditional return type to
 * `number`.
 */
type NQOptions = NumericQuantityOptions & { bigIntOnOverflow: false; verbose: false };

/**
 * Everything derived from a single {@link parseIngredient} call's options, computed once
 * and threaded through the parsing phases. Building this is the only place option
 * defaults are applied, so the phases never see raw user options.
 *
 * @internal
 */
export interface ParseContext {
  /** User options merged over {@link defaultOptions}. */
  opts: Required<ParseIngredientOptions>;
  /** Options forwarded to every `numericQuantity` call. */
  nqOpts: NQOptions;
  /** `opts.ignoreUOMs`, lowercased once for the trailing-quantity bail-out check. */
  ignoredUOMsLC: string[];
  groupHeaderRegex: RegExp | null;
  rangeSeparatorRegex: RegExp;
  stripPrefixRegex: RegExp | null;
  trailingContextRegex: RegExp;
  trailingQuantityRegex: RegExp;
  leadingQuantityPrefixRegex: RegExp | null;
  /** Known UOM strings, longest-first. Empty unless `partialUnitMatching` is on. */
  uomStrings: string[];
}

/**
 * Merges the given options over the defaults and pre-builds every regex and lookup the
 * parsing phases need.
 *
 * @internal
 */
export const createParseContext = (
  options: ParseIngredientOptions = defaultOptions
): ParseContext => {
  const opts = { ...defaultOptions, ...options };

  return {
    opts,
    nqOpts: {
      decimalSeparator: opts.decimalSeparator,
      round: opts.round,
      bigIntOnOverflow: false,
      verbose: false,
    },
    ignoredUOMsLC: opts.ignoreUOMs.map(u => u.toLowerCase()),
    groupHeaderRegex: buildPrefixPatternRegex(opts.groupHeaderPatterns),
    rangeSeparatorRegex: buildRangeSeparatorRegex(opts.rangeSeparators),
    stripPrefixRegex: buildStripPrefixRegex(opts.descriptionStripPrefixes),
    trailingContextRegex: buildTrailingContextRegex(opts.trailingQuantityContext),
    trailingQuantityRegex: buildTrailingQuantityRegex(opts.rangeSeparators),
    leadingQuantityPrefixRegex: buildLeadingQuantityPrefixRegex(opts.leadingQuantityPrefixes),
    uomStrings: opts.partialUnitMatching
      ? collectUOMStrings(
          Object.keys(opts.additionalUOMs).length > 0
            ? buildUnitLookupMaps(opts.additionalUOMs)
            : getDefaultUnitLookupMaps()
        )
      : [],
  };
};

const nextWordRegExp = /^([\p{L}\p{N}_]+(?:[.-]?[\p{L}\p{N}_]+)*[-.]?)(?:\s+|$)/iu;

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
 */
const nonQuantityCharRegExp = new RegExp(
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

/**
 * Repeatedly strips configured quantity prefixes from the start of a string.
 *
 * @internal
 */
export const stripLeadingQuantityPrefixes = (text: string, prefixRegex: RegExp | null): string => {
  if (!text || !prefixRegex) return text;
  let out = text.trimStart();
  while (out) {
    const match = prefixRegex.exec(out);
    // Break if no match or if the match is zero-length to prevent infinite loops
    // (empty string is falsy, so `!match[0]` catches both null/undefined and "")
    if (!match || !match[0]) break;
    out = out.slice(match[0].length).trimStart();
  }
  return out;
};

/**
 * Identifies a unit of measure, preferring a two-word match over the single-word one so
 * that e.g. "fluid ounces" wins over "ounces". Callers pass `twoWord` as `null` when no
 * multi-word candidate is available or eligible.
 *
 * @internal
 */
export const identifyGreedyUnit = (
  singleWord: string,
  twoWord: string | null,
  ctx: ParseContext
): { id: string; matchedText: string; isTwoWord: boolean } | null => {
  if (twoWord) {
    const twoWordID = identifyUnit(twoWord, ctx.opts);
    if (twoWordID) return { id: twoWordID, matchedText: twoWord, isTwoWord: true };
  }

  const id = identifyUnit(singleWord, ctx.opts);
  return id ? { id, matchedText: singleWord, isTwoWord: false } : null;
};

/**
 * Whether `text` begins with either (1) at least one numeric character, or (2) a decimal
 * separator followed by at least one numeric character.
 *
 * @internal
 */
export const startsWithQuantity = (text: string, ctx: ParseContext): boolean =>
  Boolean(text) &&
  (!isNaN(numericQuantity(text[0], ctx.nqOpts)) ||
    (text[0] === ctx.opts.decimalSeparator &&
      !isNaN(numericQuantity(text.slice(0, 2), ctx.nqOpts))));

/**
 * Takes the longest leading run of characters that parses as a single value as
 * `quantity`; whatever follows it is the description.
 *
 * @returns `true` if a quantity was found, `false` if the line should fall through to the
 * remaining strategies (e.g. `'1/0 cups sugar'`, which starts numerically but whose only
 * parseable value is rejected).
 *
 * @internal
 */
export const parseLeadingQuantity = (
  ingredient: Ingredient,
  text: string,
  ctx: ParseContext
): boolean => {
  const leadingQuantity = matchLeadingQuantity(text, ctx.nqOpts, isAcceptableQuantity);

  if (!leadingQuantity) return false;

  ingredient.quantity = leadingQuantity.value;
  ingredient.description = leadingQuantity.rest;
  return true;
};

/**
 * Handles lines that end with a quantity/range and an optional unit of measure, e.g.
 * "Ripe tomato x2".
 *
 * @returns `true` if the line was handled (including the case where a trailing quantity
 * was found but its unit is ignored), `false` if it should fall through to
 * {@link parsePlainDescription}.
 *
 * @internal
 */
export const parseTrailingQuantity = (
  ingredient: Ingredient,
  text: string,
  ctx: ParseContext
): boolean => {
  const trailingQtyResult = ctx.trailingQuantityRegex.exec(text);

  if (!trailingQtyResult) return false;

  // Named groups, never indices: the regex inlines `numericRegex` twice and splices in
  // user-supplied range separators, so its group numbering is not stable.
  const { qty1, qty2, uom: uomRaw } = trailingQtyResult.groups!;

  // Same acceptance test as the leading path. A negative trailing quantity ("Tomato x-2 -
  // 3") is not a quantity, so the whole line falls through to the description.
  const quantity = numericQuantity(qty1 || qty2, ctx.nqOpts);
  const quantity2 = qty1 ? numericQuantity(qty2, ctx.nqOpts) : null;

  if (!isAcceptableQuantity(quantity) || (quantity2 !== null && !isAcceptableQuantity(quantity2))) {
    return false;
  }

  if (uomRaw && ctx.ignoredUOMsLC.includes(uomRaw.toLowerCase())) {
    // Trailing quantity detected, but bailing out since the UOM should be ignored.
    ingredient.description = text;
    return true;
  }

  // Trailing quantity detected with missing or non-ignored UOM.
  // Remove the quantity and unit of measure from the description.
  ingredient.description = text.replace(ctx.trailingQuantityRegex, '').trim();

  // Trailing quantity/range.
  ingredient.quantity = quantity;
  ingredient.quantity2 = quantity2;

  // Trailing unit of measure. The multi-word candidate extends backwards into the
  // description, e.g. "Broth x2 fluid|oz" — the unit's first word is the description's
  // last word.
  if (uomRaw) {
    const descWords = ingredient.description ? ingredient.description.trim().split(/\s+/) : null;
    const unit = identifyGreedyUnit(
      uomRaw,
      descWords ? `${descWords[descWords.length - 1]} ${uomRaw}` : null,
      ctx
    );

    if (unit) {
      if (unit.isTwoWord) {
        // The unit consumed the description's last word.
        ingredient.description = descWords!.slice(0, -1).join(' ');
      }
      ingredient.unitOfMeasureID = unit.id;
      ingredient.unitOfMeasure = ctx.opts.normalizeUOM ? unit.id : unit.matchedText;
    } else if (ingredient.description.match(ctx.trailingContextRegex)) {
      ingredient.description += ` ${uomRaw}`;
    }
  }

  return true;
};

/**
 * The line has no leading and no trailing quantity, so all of it is the description.
 * A line ending in ":" or matching a group header pattern is a group header.
 *
 * @internal
 */
export const parsePlainDescription = (
  ingredient: Ingredient,
  text: string,
  ctx: ParseContext
): void => {
  ingredient.description = text;

  if (ingredient.description.endsWith(':') || ctx.groupHeaderRegex?.test(ingredient.description)) {
    ingredient.isGroupHeader = true;
  }
};

/**
 * Checks the description for a `quantity2` at the beginning: a dash, emdash, endash, or
 * word separator indicating a range, followed by a leading value just like `quantity`.
 *
 * Only runs when a `quantity` was found. A range with no lower bound is not a range, so a
 * separator that opens the line (`'-2 cups sugar'`, `'to 2 cups sugar'`) is left in the
 * description rather than producing a lone `quantity2`.
 *
 * @internal
 */
export const parseRangeQuantity2 = (ingredient: Ingredient, ctx: ParseContext): void => {
  if (ingredient.quantity === null) return;

  const rangeMatch = ctx.rangeSeparatorRegex.exec(ingredient.description);
  if (!rangeMatch) return;

  const quantity2Text = stripLeadingQuantityPrefixes(
    ingredient.description.substring(rangeMatch[1].length).trim(),
    ctx.leadingQuantityPrefixRegex
  );

  // Same entry condition as the leading path. Guards against an empty string after prefix
  // stripping (aggressive prefixes could strip content down to nothing).
  if (!startsWithQuantity(quantity2Text, ctx)) return;

  const secondQuantity = matchLeadingQuantity(quantity2Text, ctx.nqOpts, isAcceptableQuantity);

  if (secondQuantity) {
    ingredient.quantity2 = secondQuantity.value;
    ingredient.description = secondQuantity.rest;
  }
};

/**
 * Checks the beginning of the description for a known unit of measure.
 *
 * @internal
 */
export const identifyLeadingUnit = (ingredient: Ingredient, ctx: ParseContext): void => {
  const firstWordMatches = firstWordRegEx.exec(ingredient.description);
  if (!firstWordMatches) return;

  const firstWord = firstWordMatches[1].replace(/\s+/g, ' ');
  const remainingDesc = (firstWordMatches[2] ?? '').trim();
  if (!remainingDesc) return;

  // The multi-word candidate extends forwards into the description.
  const nextWords = nextWordRegExp.exec(remainingDesc);
  const multiWordFinalDesc = nextWords
    ? remainingDesc.substring(nextWords[0].length).trim()
    : remainingDesc;
  // When no quantity is present, require remaining description
  // (consistent with single-word behavior: "1 cup" → description, not UOM).
  const twoWordEligible = nextWords && (ingredient.quantity !== null || multiWordFinalDesc);

  const unit = identifyGreedyUnit(
    firstWord,
    twoWordEligible ? `${firstWord} ${nextWords[1]}` : null,
    ctx
  );
  if (!unit) return;

  ingredient.unitOfMeasureID = unit.id;
  ingredient.unitOfMeasure = ctx.opts.normalizeUOM ? unit.id : unit.matchedText;
  ingredient.description = unit.isTwoWord ? multiWordFinalDesc : remainingDesc;
};

/**
 * Fallback: scans the description for known UOM substrings (for CJK/spaceless text).
 *
 * @internal
 */
export const identifyPartialUnit = (ingredient: Ingredient, ctx: ParseContext): void => {
  if (ingredient.unitOfMeasureID || !ctx.opts.partialUnitMatching || !ingredient.description) {
    return;
  }

  const descLower = ingredient.description.toLowerCase();
  for (const uomStr of ctx.uomStrings) {
    const idx = descLower.indexOf(uomStr.toLowerCase());
    if (idx === -1) continue;

    const matchedText = ingredient.description.substring(idx, idx + uomStr.length);
    const uomID = identifyUnit(matchedText, ctx.opts);
    if (!uomID) continue;

    const before = ingredient.description.substring(0, idx).trim();
    const after = ingredient.description.substring(idx + uomStr.length).trim();
    const newDesc = [before, after].filter(Boolean).join(' ');

    // Don't extract UOM if it would leave description empty
    // (consistent with "2 cup" keeping "cup" as description, not UOM)
    if (!newDesc) continue;

    ingredient.unitOfMeasureID = uomID;
    ingredient.unitOfMeasure = ctx.opts.normalizeUOM ? uomID : matchedText;
    ingredient.description = newDesc;
    break;
  }
};

/**
 * Strips configured prefixes ("of" equivalents) from the start of the description. Runs
 * last, on whatever survives UOM extraction.
 *
 * @internal
 */
export const stripDescriptionPrefix = (ingredient: Ingredient, ctx: ParseContext): void => {
  if (
    !ctx.opts.allowLeadingOf &&
    ctx.stripPrefixRegex &&
    ingredient.description.match(ctx.stripPrefixRegex)
  ) {
    ingredient.description = ingredient.description.replace(ctx.stripPrefixRegex, '');
  }
};

/**
 * Parses a single, already-trimmed, non-empty line into an {@link Ingredient} by running
 * each parsing phase in order.
 *
 * @internal
 */
export const parseIngredientLine = (
  line: string,
  sourceIndex: number,
  ctx: ParseContext
): Ingredient => {
  const ingredient: Ingredient = {
    quantity: null,
    quantity2: null,
    unitOfMeasureID: null,
    unitOfMeasure: null,
    description: '',
    isGroupHeader: false,
  };

  if (ctx.opts.includeMeta) {
    ingredient.meta = { sourceText: line, sourceIndex };
  }

  const text = stripLeadingQuantityPrefixes(line, ctx.leadingQuantityPrefixRegex);

  if (
    !(startsWithQuantity(text, ctx) && parseLeadingQuantity(ingredient, text, ctx)) &&
    !parseTrailingQuantity(ingredient, text, ctx)
  ) {
    parsePlainDescription(ingredient, text, ctx);
  }

  parseRangeQuantity2(ingredient, ctx);
  identifyLeadingUnit(ingredient, ctx);
  identifyPartialUnit(ingredient, ctx);
  stripDescriptionPrefix(ingredient, ctx);

  return ingredient;
};

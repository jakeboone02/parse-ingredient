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

const newLineRegExp = /\r?\n/;
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
 * Returns the parsed value along with the remainder of the *original* text (never the
 * normalized form `numericQuantity` works with internally), or `null` if no prefix
 * qualifies.
 */
const matchLeadingQuantity = (
  text: string,
  nqOpts: NumericQuantityOptions & { bigIntOnOverflow: false; verbose: false },
  accept: (value: number) => boolean
): { value: number; rest: string } | null => {
  const stop = nonQuantityCharRegExp.exec(text);
  let result: { value: number; rest: string } | null = null;

  for (let len = stop ? stop.index : text.length; len > 0 && !result; len--) {
    const value = numericQuantity(text.substring(0, len).trim(), nqOpts);

    if (accept(value)) {
      result = { value, rest: text.substring(len).trim() };
    }
  }

  return result;
};

/**
 * Repeatedly strips configured quantity prefixes from the start of a string.
 */
const stripLeadingQuantityPrefixes = (text: string, prefixRegex: RegExp | null): string => {
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
 * Parses a string or array of strings into an array of recipe ingredient objects
 */
export const parseIngredient = (
  /**
   * The ingredient list, as plain text or an array of strings.
   */
  ingredientText: string | string[],
  /**
   * Configuration options. Defaults to {@link defaultOptions}.
   */
  options: ParseIngredientOptions = defaultOptions
): Ingredient[] => {
  const opts = { ...defaultOptions, ...options };
  // The `bigIntOnOverflow`/`verbose` literals are load-bearing: they are what narrows
  // `numericQuantity`'s conditional return type to `number`.
  const nqOpts: NumericQuantityOptions & { bigIntOnOverflow: false; verbose: false } = {
    decimalSeparator: opts.decimalSeparator,
    round: opts.round,
    bigIntOnOverflow: false,
    verbose: false,
  };

  // Pre-compute lowercase ignored UOMs for the trailing quantity bail-out check
  const ignoredUOMsLC = opts.ignoreUOMs.map(u => u.toLowerCase());

  // Build dynamic regexes from i18n options
  const groupHeaderRegex = buildPrefixPatternRegex(opts.groupHeaderPatterns);
  const rangeSeparatorRegex = buildRangeSeparatorRegex(opts.rangeSeparators);
  const stripPrefixRegex = buildStripPrefixRegex(opts.descriptionStripPrefixes);
  const trailingContextRegex = buildTrailingContextRegex(opts.trailingQuantityContext);
  const trailingQuantityRegex = buildTrailingQuantityRegex(opts.rangeSeparators);
  const leadingQuantityPrefixRegex = buildLeadingQuantityPrefixRegex(opts.leadingQuantityPrefixes);

  const uomStrings = opts.partialUnitMatching
    ? collectUOMStrings(
        Object.keys(opts.additionalUOMs).length > 0
          ? buildUnitLookupMaps(opts.additionalUOMs)
          : getDefaultUnitLookupMaps()
      )
    : [];

  const ingredientArray = (
    Array.isArray(ingredientText) ? ingredientText : ingredientText.split(newLineRegExp)
  )
    .map((line, index) => ({ line: line.trim(), sourceIndex: index }))
    .filter(({ line }) => Boolean(line));

  return ingredientArray.map(({ line, sourceIndex }) => {
    const lineToParse = stripLeadingQuantityPrefixes(line, leadingQuantityPrefixRegex);
    const oIng: Ingredient = {
      quantity: null,
      quantity2: null,
      unitOfMeasureID: null,
      unitOfMeasure: null,
      description: '',
      isGroupHeader: false,
    };

    if (opts.includeMeta) {
      oIng.meta = {
        sourceText: line,
        sourceIndex,
      };
    }

    // Check if the line begins with either (1) at least one numeric character, or
    // (2) a decimal separator followed by at least one numeric character.
    if (
      lineToParse &&
      (!isNaN(numericQuantity(lineToParse[0], nqOpts)) ||
        (lineToParse[0] === opts.decimalSeparator &&
          !isNaN(numericQuantity(lineToParse.slice(0, 2), nqOpts))))
    ) {
      // Take the longest leading run of characters that parses as a single value.
      // This will be `quantity`; whatever follows it is the description.
      const leadingQuantity = matchLeadingQuantity(lineToParse, nqOpts, value => value > -1);

      if (leadingQuantity) {
        oIng.quantity = leadingQuantity.value;
        oIng.description = leadingQuantity.rest;
      }
    } else {
      // The first character is not numeric. First check for trailing quantity/uom.
      const trailingQtyResult = trailingQuantityRegex.exec(lineToParse);
      const trailingQtyMaybeUom = trailingQtyResult?.at(-1)?.toLowerCase();

      if (trailingQtyMaybeUom && ignoredUOMsLC.includes(trailingQtyMaybeUom)) {
        // Trailing quantity detected, but bailing out since the UOM should be ignored.
        oIng.description = lineToParse;
      } else if (trailingQtyResult) {
        // Trailing quantity detected with missing or non-ignored UOM.
        // Remove the quantity and unit of measure from the description.
        oIng.description = lineToParse.replace(trailingQuantityRegex, '').trim();

        // Trailing quantity/range.
        const firstQty = trailingQtyResult[3];
        const secondQty = trailingQtyResult[12];
        if (!firstQty) {
          oIng.quantity = numericQuantity(secondQty, nqOpts);
        } else {
          oIng.quantity = numericQuantity(firstQty, nqOpts);
          oIng.quantity2 = numericQuantity(secondQty, nqOpts);
        }

        // Trailing unit of measure.
        const uomRaw = trailingQtyResult.at(-1);
        if (uomRaw) {
          let uomID: string | null = null;
          let finalUomRaw = uomRaw;

          // Greedy: try multi-word unit first (prefer longer match over shorter one)
          if (oIng.description) {
            const descWords = oIng.description.trim().split(/\s+/);
            if (descWords.length >= 1) {
              const lastDescWord = descWords[descWords.length - 1];
              const twoWordUnit = lastDescWord + ' ' + uomRaw;
              const twoWordID = identifyUnit(twoWordUnit, options);

              if (twoWordID) {
                uomID = twoWordID;
                finalUomRaw = twoWordUnit;
                // Remove the last word from description
                oIng.description = descWords.slice(0, -1).join(' ');
              }
            }
          }

          // Fall back to single-word match
          if (!uomID) {
            uomID = identifyUnit(uomRaw, options);
            finalUomRaw = uomRaw;
          }

          if (uomID) {
            oIng.unitOfMeasureID = uomID;
            oIng.unitOfMeasure = opts.normalizeUOM ? uomID : finalUomRaw;
          } else if (oIng.description.match(trailingContextRegex)) {
            oIng.description += ` ${uomRaw}`;
          }
        }
      } else {
        // The first character is not numeric, and no trailing quantity was detected,
        // so the entire line is the description.
        oIng.description = lineToParse;

        // If the line ends with ":" or matches a group header pattern, it is assumed to be a group header.
        if (oIng.description.endsWith(':') || groupHeaderRegex?.test(oIng.description)) {
          oIng.isGroupHeader = true;
        }
      }
    }

    // Now check the description for a `quantity2` at the beginning.
    // First we look for a dash, emdash, endash, or word separator to
    // indicate a range, then extract a leading value just like we did
    // for `quantity`.
    const q2reMatch = rangeSeparatorRegex.exec(oIng.description);
    if (q2reMatch) {
      const q2reMatchLen = q2reMatch[1].length;
      const q2Portion = stripLeadingQuantityPrefixes(
        oIng.description.substring(q2reMatchLen).trim(),
        leadingQuantityPrefixRegex
      );

      // Guard against empty string after prefix stripping (e.g., aggressive
      // prefixes could strip content down to nothing)
      if (q2Portion) {
        const nqResultFirstChar = numericQuantity(q2Portion[0], nqOpts);

        if (!isNaN(nqResultFirstChar)) {
          const secondQuantity = matchLeadingQuantity(q2Portion, nqOpts, value => !isNaN(value));

          if (secondQuantity) {
            oIng.quantity2 = secondQuantity.value;
            oIng.description = secondQuantity.rest;
          }
        }
      }
    }

    // Check for a known unit of measure
    const firstWordREMatches = firstWordRegEx.exec(oIng.description);

    if (firstWordREMatches) {
      const firstWord = firstWordREMatches[1].replace(/\s+/g, ' ');
      const remainingDesc = (firstWordREMatches[2] ?? '').trim();
      if (remainingDesc) {
        let uomID = identifyUnit(firstWord, options);
        let matchedUnit = firstWord;
        let finalDesc = remainingDesc;

        // Try multi-word unit combinations (greedy matching: prefer longer matches over shorter ones)
        const nextWords = remainingDesc.match(nextWordRegExp);
        if (nextWords) {
          const twoWordCombo = firstWord + ' ' + nextWords[1];
          const twoWordID = identifyUnit(twoWordCombo, options);

          // If multi-word unit exists, prefer it over single-word match.
          // When no quantity is present, require remaining description
          // (consistent with single-word behavior: "1 cup" → description, not UOM).
          const multiWordFinalDesc = remainingDesc.substring(nextWords[0].length).trim();
          if (twoWordID && (oIng.quantity !== null || multiWordFinalDesc)) {
            uomID = twoWordID;
            matchedUnit = twoWordCombo;
            finalDesc = multiWordFinalDesc;
          }
        }

        if (uomID) {
          oIng.unitOfMeasureID = uomID;
          oIng.unitOfMeasure = opts.normalizeUOM ? uomID : matchedUnit;
          oIng.description = finalDesc;
        }
      }
    }

    // Fallback: scan description for known UOM substrings (for CJK/spaceless text)
    if (!oIng.unitOfMeasureID && opts.partialUnitMatching && oIng.description) {
      const descLower = oIng.description.toLowerCase();
      for (const uomStr of uomStrings) {
        const idx = descLower.indexOf(uomStr.toLowerCase());
        if (idx === -1) continue;

        const matchedText = oIng.description.substring(idx, idx + uomStr.length);
        const uomID = identifyUnit(matchedText, options);
        if (!uomID) continue;

        const before = oIng.description.substring(0, idx).trim();
        const after = oIng.description.substring(idx + uomStr.length).trim();
        const newDesc = [before, after].filter(Boolean).join(' ');

        // Don't extract UOM if it would leave description empty
        // (consistent with "2 cup" keeping "cup" as description, not UOM)
        if (!newDesc) continue;

        oIng.unitOfMeasureID = uomID;
        oIng.unitOfMeasure = opts.normalizeUOM ? uomID : matchedText;
        oIng.description = newDesc;
        break;
      }
    }

    if (!opts.allowLeadingOf && stripPrefixRegex && oIng.description.match(stripPrefixRegex)) {
      oIng.description = oIng.description.replace(stripPrefixRegex, '');
    }

    return oIng;
  });
};

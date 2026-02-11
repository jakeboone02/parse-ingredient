import { numericQuantity, NumericQuantityOptions } from 'numeric-quantity';
import {
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

const newLineRegExp = /\r?\n/;

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
  const nqOpts: NumericQuantityOptions | undefined =
    opts.decimalSeparator === ',' ? { decimalSeparator: ',' } : undefined;

  // Pre-compute lowercase ignored UOMs for the trailing quantity bail-out check
  const ignoredUOMsLC = opts.ignoreUOMs.map(u => u.toLowerCase());

  // Build dynamic regexes from i18n options
  const groupHeaderRegex = buildPrefixPatternRegex(opts.groupHeaderPatterns);
  const rangeSeparatorRegex = buildRangeSeparatorRegex(opts.rangeSeparators);
  const stripPrefixRegex = buildStripPrefixRegex(opts.descriptionStripPrefixes);
  const trailingContextRegex = buildTrailingContextRegex(opts.trailingQuantityContext);
  const trailingQuantityRegex = buildTrailingQuantityRegex(opts.rangeSeparators);

  const ingredientArray = (
    Array.isArray(ingredientText) ? ingredientText : ingredientText.split(newLineRegExp)
  )
    .map((line, index) => ({ line: line.trim(), sourceIndex: index }))
    .filter(({ line }) => Boolean(line));

  return ingredientArray.map(({ line, sourceIndex }) => {
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
      !isNaN(numericQuantity(line[0], nqOpts)) ||
      (line[0] === opts.decimalSeparator && !isNaN(numericQuantity(line.slice(0, 2), nqOpts)))
    ) {
      // See how many of the first seven characters constitute a single value. This will be `quantity`.
      let lenNum = 6;
      let nqResult = NaN;

      while (lenNum > 0 && isNaN(nqResult)) {
        nqResult = numericQuantity(line.substring(0, lenNum).trim(), nqOpts);

        if (nqResult > -1) {
          oIng.quantity = nqResult;
          oIng.description = line.substring(lenNum).trim();
        }

        lenNum--;
      }
    } else {
      // The first character is not numeric. First check for trailing quantity/uom.
      const trailingQtyResult = trailingQuantityRegex.exec(line);
      const trailingQtyMaybeUom = trailingQtyResult?.at(-1)?.toLowerCase();

      if (trailingQtyMaybeUom && ignoredUOMsLC.includes(trailingQtyMaybeUom)) {
        // Trailing quantity detected, but bailing out since the UOM should be ignored.
        oIng.description = line;
      } else if (trailingQtyResult) {
        // Trailing quantity detected with missing or non-ignored UOM.
        // Remove the quantity and unit of measure from the description.
        oIng.description = line.replace(trailingQuantityRegex, '').trim();

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
          const uomID = identifyUnit(uomRaw, options);

          if (uomID) {
            oIng.unitOfMeasureID = uomID;
            oIng.unitOfMeasure = opts.normalizeUOM ? uomID : uomRaw;
          } else if (oIng.description.match(trailingContextRegex)) {
            oIng.description += ` ${uomRaw}`;
          }
        }
      } else {
        // The first character is not numeric, and no trailing quantity was detected,
        // so the entire line is the description.
        oIng.description = line;

        // If the line ends with ":" or matches a group header pattern, it is assumed to be a group header.
        if (oIng.description.endsWith(':') || groupHeaderRegex.test(oIng.description)) {
          oIng.isGroupHeader = true;
        }
      }
    }

    // Now check the description for a `quantity2` at the beginning.
    // First we look for a dash, emdash, endash, or word separator to
    // indicate a range, then process the next seven characters just
    // like we did for `quantity`.
    const q2reMatch = rangeSeparatorRegex.exec(oIng.description);
    if (q2reMatch) {
      const q2reMatchLen = q2reMatch[1].length;
      const nqResultFirstChar = numericQuantity(
        oIng.description.substring(q2reMatchLen).trim()[0],
        nqOpts
      );

      if (!isNaN(nqResultFirstChar)) {
        let lenNum = 7;
        let nqResult = NaN;

        while (--lenNum > 0 && isNaN(nqResult)) {
          nqResult = numericQuantity(oIng.description.substring(q2reMatchLen, lenNum), nqOpts);

          if (!isNaN(nqResult)) {
            oIng.quantity2 = nqResult;
            oIng.description = oIng.description.substring(lenNum).trim();
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
        const uomID = identifyUnit(firstWord, options);

        if (uomID) {
          oIng.unitOfMeasureID = uomID;
          oIng.unitOfMeasure = opts.normalizeUOM ? uomID : firstWord;
          oIng.description = remainingDesc;
        }
      }
    }

    if (!opts.allowLeadingOf && oIng.description.match(stripPrefixRegex)) {
      oIng.description = oIng.description.replace(stripPrefixRegex, '');
    }

    return oIng;
  });
};

import { numericQuantity, NumericQuantityOptions } from 'numeric-quantity';
import {
  defaultOptions,
  firstWordRegEx,
  forsRegEx,
  fromRegEx,
  ofRegEx,
  rangeSeparatorRegEx,
  trailingQuantityRegEx,
} from './constants';
import { identifyUnit } from './convertUnit';
import type { Ingredient, ParseIngredientOptions } from './types';

const newLineRegExp = /\r?\n/;

/**
 * Parses a string into an array of recipe ingredient objects
 */
export const parseIngredient = (
  /**
   * The ingredient list, as plain text.
   */
  ingredientText: string,
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

  const ingredientArray = ingredientText
    .split(newLineRegExp)
    .map(line => line.trim())
    .filter(Boolean);

  return ingredientArray.map(line => {
    const oIng: Ingredient = {
      quantity: null,
      quantity2: null,
      unitOfMeasureID: null,
      unitOfMeasure: null,
      description: '',
      isGroupHeader: false,
    };

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
      const trailingQtyResult = trailingQuantityRegEx.exec(line);
      const trailingQtyMaybeUom = trailingQtyResult?.at(-1)?.toLowerCase();

      if (trailingQtyMaybeUom && ignoredUOMsLC.includes(trailingQtyMaybeUom)) {
        // Trailing quantity detected, but bailing out since the UOM should be ignored.
        oIng.description = line;
      } else if (trailingQtyResult) {
        // Trailing quantity detected with missing or non-ignored UOM.
        // Remove the quantity and unit of measure from the description.
        oIng.description = line.replace(trailingQuantityRegEx, '').trim();

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
          let uomID = identifyUnit(uomRaw, options);
          let finalUomRaw = uomRaw;

          // Try multi-word unit: check if description ends with the first word of a two-word unit
          if (!uomID && oIng.description) {
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

          if (uomID) {
            oIng.unitOfMeasureID = uomID;
            oIng.unitOfMeasure = opts.normalizeUOM ? uomID : finalUomRaw;
          } else if (oIng.description.match(fromRegEx)) {
            oIng.description += ` ${uomRaw}`;
          }
        }
      } else {
        // The first character is not numeric, and no trailing quantity was detected,
        // so the entire line is the description.
        oIng.description = line;

        // If the line ends with ":" or starts with "For ", then it is assumed to be a group header.
        if (oIng.description.endsWith(':') || forsRegEx.test(oIng.description)) {
          oIng.isGroupHeader = true;
        }
      }
    }

    // Now check the description for a `quantity2` at the beginning.
    // First we look for a dash, emdash, endash, "to ", or "or " to
    // indicate a range, then process the next seven characters just
    // like we did for `quantity`.
    const q2reMatch = rangeSeparatorRegEx.exec(oIng.description);
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
        let uomID = identifyUnit(firstWord, options);
        let matchedUnit = firstWord;
        let finalDesc = remainingDesc;

        // Try multi-word unit combinations (greedy matching: prefer longer matches over shorter ones)
        const nextWords = remainingDesc.match(/^([\p{L}\p{N}_]+(?:[.-]?[\p{L}\p{N}_]+)*[-.]?)\s+/iu);
        if (nextWords) {
          const twoWordCombo = firstWord + ' ' + nextWords[1];
          const twoWordID = identifyUnit(twoWordCombo, options);

          // If multi-word unit exists, prefer it over single-word match
          if (twoWordID) {
            uomID = twoWordID;
            matchedUnit = twoWordCombo;
            finalDesc = remainingDesc.substring(nextWords[0].length).trim();
          }
        }

        if (uomID) {
          oIng.unitOfMeasureID = uomID;
          oIng.unitOfMeasure = opts.normalizeUOM ? uomID : matchedUnit;
          oIng.description = finalDesc;
        }
      }
    }

    if (!opts.allowLeadingOf && oIng.description.match(ofRegEx)) {
      oIng.description = oIng.description.replace(ofRegEx, '');
    }

    return oIng;
  });
};

import { numericQuantity } from 'numeric-quantity';
import {
  defaultOptions,
  firstWordRegEx,
  forsRegEx,
  fromRegEx,
  ofRegEx,
  rangeSeparatorRegEx,
  trailingQuantityRegEx,
  unitsOfMeasure,
} from './constants';
import type { Ingredient, ParseIngredientOptions, UnitOfMeasure } from './types';

const newLineRegExp = /\r?\n/;

const addIdToUomDefinition = ([uom, def]: [string, UnitOfMeasure]) => ({ id: uom, ...def });

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
  const mergedUOMs = { ...unitsOfMeasure, ...opts.additionalUOMs };
  const uomArray = Object.entries(mergedUOMs).map(addIdToUomDefinition);
  const uomArrayLength = uomArray.length;

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
    // (2) a decimal point followed by at least one numeric character.
    if (
      !isNaN(numericQuantity(line[0])) ||
      (line[0] === '.' && !isNaN(numericQuantity(line.slice(0, 2))))
    ) {
      // See how many of the first seven characters constitute a single value. This will be `quantity`.
      let lenNum = 6;
      let nqResult = NaN;

      while (lenNum > 0 && isNaN(nqResult)) {
        nqResult = numericQuantity(line.substring(0, lenNum).trim());

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

      if (
        trailingQtyMaybeUom &&
        opts.ignoreUOMs.some(ignored => ignored.toLowerCase() === trailingQtyMaybeUom)
      ) {
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
          oIng.quantity = numericQuantity(secondQty);
        } else {
          oIng.quantity = numericQuantity(firstQty);
          oIng.quantity2 = numericQuantity(secondQty);
        }

        // Trailing unit of measure.
        const uomRaw = trailingQtyResult.at(-1);
        if (uomRaw) {
          const uomLC = uomRaw.toLowerCase();
          let uom = '';
          let uomID = '';
          let i = -1;

          while (++i < uomArrayLength && !uom) {
            const { alternates, id, short, plural } = uomArray[i];
            const versions = [...alternates, id, short, plural];
            if (versions.some(v => v.toLowerCase() === uomLC)) {
              uom = uomRaw;
              uomID = id;
            }
          }

          if (uom) {
            oIng.unitOfMeasureID = uomID;
            oIng.unitOfMeasure = opts.normalizeUOM ? uomID : uom;
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
      const nqResultFirstChar = numericQuantity(oIng.description.substring(q2reMatchLen).trim()[0]);

      if (!isNaN(nqResultFirstChar)) {
        let lenNum = 7;
        let nqResult = NaN;

        while (--lenNum > 0 && isNaN(nqResult)) {
          nqResult = numericQuantity(oIng.description.substring(q2reMatchLen, lenNum));

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
      const firstWordLC = firstWord.toLowerCase();
      const remainingDesc = (firstWordREMatches[2] ?? '').trim();
      if (remainingDesc) {
        let uom = '';
        let uomID = '';
        let i = -1;

        while (++i < uomArrayLength && !uom) {
          const { alternates, id, short, plural } = uomArray[i];
          const versions = [...alternates, id, short, plural].filter(unit => {
            const unitLC = unit.toLowerCase();
            return !opts.ignoreUOMs.some(ignored => ignored.toLowerCase() === unitLC);
          });
          if (versions.some(v => v.toLowerCase() === firstWordLC)) {
            uom = firstWord;
            uomID = id;
          }
        }

        if (uom) {
          oIng.unitOfMeasureID = uomID;
          oIng.unitOfMeasure = opts.normalizeUOM ? uomID : uom;
          oIng.description = remainingDesc;
        }
      }
    }

    if (!opts.allowLeadingOf && oIng.description.match(ofRegEx)) {
      oIng.description = oIng.description.replace(ofRegEx, '');
    }

    return oIng;
  });
};

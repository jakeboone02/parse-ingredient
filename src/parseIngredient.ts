import { numericQuantity } from 'numeric-quantity';
import {
  defaultOptions,
  firstWordRegEx,
  forsRegEx,
  ofRegEx,
  rangeSeparatorRegEx,
  unitsOfMeasure,
} from './constants';
import type { Ingredient, ParseIngredientOptions, UnitOfMeasure } from './types';
import { compactStringArray } from './utils';

const newLineRegExp = /\r?\n/;

const addIdToUomDefinition = ([uom, def]: [string, UnitOfMeasure]) => ({ id: uom, ...def });

/**
 * Parses a string into an array of recipe ingredient objects
 * @param ingText The ingredient text
 * @param options Configuration options
 */
export const parseIngredient = (
  ingText: string,
  options: ParseIngredientOptions = defaultOptions
): Ingredient[] => {
  const opts = { ...defaultOptions, ...options };
  const mergedUOMs = { ...unitsOfMeasure, ...opts.additionalUOMs };
  const uomArray = Object.entries(mergedUOMs).map(addIdToUomDefinition);
  const uomArrayLength = uomArray.length;

  return compactStringArray(ingText.split(newLineRegExp)).map(line => {
    const oIng: Ingredient = {
      quantity: null,
      quantity2: null,
      unitOfMeasureID: null,
      unitOfMeasure: null,
      description: '',
      isGroupHeader: false,
    };

    // Check if the first character is numeric.
    const nqResultFirstChar = numericQuantity(line.substring(0, 1));

    if (isNaN(nqResultFirstChar)) {
      // The first character is not numeric, so the entire line is the description.
      oIng.description = line;

      // If the line ends with ":" or starts with "For ", then it is assumed to be a group header.
      if (oIng.description.endsWith(':') || forsRegEx.test(oIng.description)) {
        oIng.isGroupHeader = true;
      }
    } else {
      // The first character is numeric. See how many of the first seven
      // constitute a single value. This will be `quantity`.
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
      const remainingDesc = (firstWordREMatches[2] ?? '').trim();
      if (remainingDesc) {
        let uom = '';
        let uomID = '';
        let i = -1;

        while (++i < uomArrayLength && !uom) {
          const { alternates, id, short, plural } = uomArray[i];
          const versions = [...alternates, id, short, plural];
          if (versions.includes(firstWord)) {
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

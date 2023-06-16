import { numericQuantity } from 'numeric-quantity';
import {
  firstWordRegEx,
  forsRegEx,
  ofRegEx,
  rangeSeparatorRegEx,
  unitsOfMeasure,
} from './constants';
import type { Ingredient, ParseIngredientOptions } from './types';
import { compactArray } from './utils';

/**
 * Parses a string into an array of recipe ingredient objects
 * @param ingText The ingredient text
 * @param options Configuration options
 */
export const parseIngredient = (
  ingText: string,
  options?: ParseIngredientOptions
): Ingredient[] => {
  const mergedUOMs = { ...unitsOfMeasure, ...options?.additionalUOMs };
  const uomArray = Object.keys(mergedUOMs).map(uom => ({ id: uom, ...mergedUOMs[uom] }));

  const arrRaw = compactArray(
    ingText
      .replace(/\n{2,}/g, '\n')
      .split('\n')
      .map(ing => ing.trim())
  );

  const arrIngs = arrRaw.map(line => {
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
      const nqResultFirstChar = numericQuantity(
        oIng.description.substring(q2reMatchLen).trim().substring(0, 1)
      );

      if (!isNaN(nqResultFirstChar)) {
        let lenNum = 6;
        let nqResult = NaN;

        while (lenNum > 0 && isNaN(nqResult)) {
          nqResult = numericQuantity(oIng.description.substring(q2reMatchLen, lenNum));

          if (!isNaN(nqResult)) {
            oIng.quantity2 = nqResult;
            oIng.description = oIng.description.substring(lenNum).trim();
          }

          lenNum--;
        }
      }
    }

    // Check for a known unit of measure
    const firstWordREMatches = firstWordRegEx.exec(oIng.description);

    if (firstWordREMatches) {
      const firstWord = firstWordREMatches[1].replace(/\s+/g, ' ');
      const remainingDesc = firstWordREMatches[2];
      let uom = '';
      let uomID = '';
      let i = 0;

      while (i < uomArray.length && !uom) {
        const versions = [
          ...uomArray[i].alternates,
          uomArray[i].id,
          uomArray[i].short,
          uomArray[i].plural,
        ];
        if (versions.includes(firstWord)) {
          uom = firstWord;
          uomID = uomArray[i].id;
        }
        i++;
      }

      if (uom) {
        oIng.unitOfMeasureID = uomID;
        if (options?.normalizeUOM) {
          oIng.unitOfMeasure = uomID;
        } else {
          oIng.unitOfMeasure = uom;
        }
        oIng.description = remainingDesc.trim();
      }
    }

    if (!options?.allowLeadingOf && oIng.description.match(ofRegEx)) {
      oIng.description = oIng.description.replace(ofRegEx, '');
    }

    return oIng;
  });

  return arrIngs;
};

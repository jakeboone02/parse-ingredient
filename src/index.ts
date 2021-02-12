import numericQuantity from 'numeric-quantity';

export interface Ingredient {
  /**
   * The primary quantity (the lower quantity in a range, if applicable)
   */
  quantity: number | null;
  /**
   * The secondary quantity (the upper quantity in a range, or `null` if not applicable)
   */
  quantity2: number | null;
  /**
   * The unit of measure
   */
  unitOfMeasure: string | null;
  /**
   * The description
   */
  description: string;
  /**
   * Whether the "ingredient" is actually a group header, e.g. "For icing:"
   */
  isGroupHeader: boolean;
}

// prettier-ignore
const UOM_LIST = [
  'cup','cups','c','c.','C',
  'teaspoon','teaspoons','tsp','tsp.','t',
  'tablespoon','tablespoons','tbsp','tbsp.','T',
  'ounce','ounces','oz','oz.',
  'pint','pints','pt','pt.',
  'pound','pounds','lb','lb.','lbs','lbs.',
  'gram','grams','g','g.',
  'kilogram','kilograms','kg','kg.',
  'stick','sticks',
  'inch','inches','in','in.',
  'foot','feet','ft','ft.',
  'quart','quarts','qt','qt.',
  'liter','liters','l'
];

/**
 * Removes falsy values from an array
 *
 * Originally from lodash: https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L6874
 */
const compactArray = <T>(array: T[]) => {
  let index = -1;
  const length = array.length;
  let resIndex = 0;
  const result: T[] = [];

  while (++index < length) {
    const value = array[index];
    if (value) {
      result[resIndex++] = value;
    }
  }
  return result;
};

/**
 * Parses a string into an array of recipe ingredient objects
 * @param ingText The ingredient text
 */
const parseIngredient = (ingText: string): Ingredient[] => {
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
      unitOfMeasure: null,
      description: '',
      isGroupHeader: false,
    };

    // Check if the first character is numeric.
    const nqResultFirstChar = numericQuantity(line.substring(0, 1));

    // If the first character is not numeric, the entire line is the description.
    if (isNaN(nqResultFirstChar)) {
      oIng.description = line;

      // If the line ends with ":" or starts with "For ", then it is assumed to be a group header.
      if (/:$/.test(oIng.description) || /^For /i.test(oIng.description)) {
        oIng.isGroupHeader = true;
      }

      // If the first character is numeric, then see how many of the first seven
      // constitute a single value.  This will be `quantity`.
    } else {
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
    // First we look for a dash to indicate a range, then process the next seven
    // characters just like we did for `quantity`.
    const firstChar = oIng.description.substring(0, 1);
    if (firstChar === '-' || firstChar === '\u2013' || firstChar === '\u2014') {
      const nqResultFirstChar = numericQuantity(
        oIng.description
          .substring(1)
          .trim()
          .substring(0, 1)
      );

      if (!isNaN(nqResultFirstChar)) {
        let lenNum = 6;
        let nqResult = NaN;

        while (lenNum > 0 && isNaN(nqResult)) {
          nqResult = numericQuantity(oIng.description.substring(1, lenNum));

          if (!isNaN(nqResult)) {
            oIng.quantity2 = nqResult;
            oIng.description = oIng.description.substring(lenNum).trim();
          }

          lenNum--;
        }
      }
    }

    // Check for a known unit of measure
    const firstSpace = oIng.description.indexOf(' ');
    const firstWord = oIng.description.substring(0, firstSpace);
    if (UOM_LIST.indexOf(firstWord) >= 0) {
      oIng.unitOfMeasure = firstWord;
      oIng.description = oIng.description.substring(firstSpace + 1);
    }

    return oIng;
  });

  return arrIngs;
};

export default parseIngredient;

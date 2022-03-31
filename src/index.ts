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
   * The unit of measure identifier
   */
  unitOfMeasureID: string | null;
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

export interface UnitOfMeasure {
  short: string;
  plural: string;
  versions: string[];
}

export type UnitOfMeasureDefinitions = Record<string, UnitOfMeasure>;

export interface ParseIngredientOptions {
  /**
   * Converts the unit of measure (`unitOfMeasure` property) of each
   * ingredient to its long, singular form. For example, "ml" becomes
   * "milliliter" and "cups" becomes "cup".
   */
  normalizeUOM?: boolean;
  /**
   * An object that matches the format of `unitsOfMeasure`. Keys that
   * match any in `unitsOfMeasure` will be used instead of the default,
   * and any others will be added to the list of known units of measure
   * when parsing ingredients.
   */
  additionalUOMs?: UnitOfMeasureDefinitions;
  /**
   * If `true`, ingredient descriptions that start with "of " will not be
   * modified. (By default, a leading "of " will be removed all descriptions.)
   */
  allowLeadingOf?: boolean;
}

// prettier-ignore
export const unitsOfMeasure: UnitOfMeasureDefinitions = {
  bag: { short: 'bag', plural: 'bags', versions: ['bag', 'bags'] },
  box: { short: 'box', plural: 'boxes', versions: ['box', 'boxes'] },
  bunch: { short: 'bunch', plural: 'bunches', versions: ['bunch', 'bunches'] },
  can: { short: 'can', plural: 'cans', versions: ['can', 'cans'] },
  carton: { short: 'carton', plural: 'cartons', versions: ['carton', 'cartons'] },
  centimeter: { short: 'cm', plural: 'centimeters', versions: ['centimeter', 'centimeters', 'cm', 'cm.'] },
  clove: { short: 'clove', plural: 'cloves', versions: ['clove', 'cloves'] },
  container: { short: 'containter', plural: 'containers', versions: ['container', 'containers'] },
  cup: { short: 'c', plural: 'cups', versions: ['cup', 'cups', 'c', 'c.', 'C'] },
  dash: { short: 'dash', plural: 'dashes', versions: ['dash', 'dashes'] },
  drop: { short: 'drop', plural: 'drops', versions: ['drop', 'drops'] },
  ear: { short: 'ear', plural: 'ears', versions: ['ear', 'ears'] },
  'fluid ounce': { short: 'fl oz', plural: 'fluid ounces', versions: ['fluid ounce', 'fluidounce', 'fl oz', 'floz', 'fl-oz', 'fluid-ounce', 'fluid ounces', 'fluid-ounces', 'fluidounces', 'fl ounce', 'fl ounces', 'fl-ounce', 'fl-ounces', 'fluid oz', 'fluid-oz'] },
  foot: { short: 'ft', plural: 'feet', versions: ['foot', 'feet', 'ft', 'ft.'] },
  gallon: { short: 'gal', plural: 'gallons', versions: ['gallon', 'gallons', 'gal', 'gal.'] },
  gram: { short: 'g', plural: 'grams', versions: ['gram', 'grams', 'g', 'g.'] },
  head: { short: 'head', plural: 'heads', versions: ['head', 'heads'] },
  inch: { short: 'in', plural: 'inches', versions: ['inch', 'inches', 'in', 'in.'] },
  kilogram: { short: 'kg', plural: 'kilograms', versions: ['kilogram', 'kilograms', 'kg', 'kg.'] },
  liter: { short: 'l', plural: 'liters', versions: ['liter', 'liters', 'l'] },
  meter: { short: 'm', plural: 'meters', versions: ['meter', 'meters', 'm', 'm.'] },
  milligram: { short: 'mg', plural: 'milligrams', versions: ['milligram', 'milligrams', 'mg', 'mg.'] },
  milliliter: { short: 'ml', plural: 'milliliters', versions: ['milliliter', 'milliliters', 'ml', 'mL', 'ml.', 'mL.'] },
  millimeter: { short: 'mm', plural: 'millimeters', versions: ['millimeter', 'millimeters', 'mm', 'mm.'] },
  ounce: { short: 'oz', plural: 'ounces', versions: ['ounce', 'ounces', 'oz', 'oz.'] },
  pack: { short: 'pack', plural: 'packs', versions: ['pack', 'packs'] },
  package: { short: 'pkg', plural: 'packages', versions: ['package', 'packages', 'pkg', 'pkgs'] },
  piece: { short: 'piece', plural: 'pieces', versions: ['piece', 'pieces', 'pcs', 'pcs.'] },
  pinch: { short: 'pinch', plural: 'pinches', versions: ['pinch', 'pinches'] },
  pint: { short: 'pt', plural: 'pints', versions: ['pint', 'pints', 'pt', 'pt.'] },
  pound: { short: 'lb', plural: 'pounds', versions: ['pound', 'pounds', 'lb', 'lb.', 'lbs', 'lbs.'] },
  quart: { short: 'qt', plural: 'quarts', versions: ['quart', 'quarts', 'qt', 'qt.', 'qts', 'qts.'] },
  sprig: { short: 'sprig', plural: 'sprigs', versions: ['sprig', 'sprigs'] },
  stick: { short: 'stick', plural: 'sticks', versions: ['stick', 'sticks'] },
  tablespoon: { short: 'tbsp', plural: 'tablespoons', versions: ['tablespoon', 'tablespoons', 'tbsp', 'tbsp.', 'T'] },
  teaspoon: { short: 'tsp', plural: 'teaspoons', versions: ['teaspoon', 'teaspoons', 'tsp', 'tsp.', 't'] },
  yard: { short: 'yd', plural: 'yards', versions: ['yard', 'yards', 'yd', 'yd.'] },
};

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
    // istanbul ignore else
    if (value) {
      result[resIndex++] = value;
    }
  }
  return result;
};

/**
 * Parses a string into an array of recipe ingredient objects
 * @param ingText The ingredient text
 * @param options Configuration options
 */
export const parseIngredient = (
  ingText: string,
  options?: ParseIngredientOptions
): Ingredient[] => {
  const mergedUOMs = {
    ...unitsOfMeasure,
    ...options?.additionalUOMs,
  };
  const uomArray = Object.keys(mergedUOMs).map(uom => ({
    id: uom,
    ...mergedUOMs[uom],
  }));

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
    // First we look for a dash, emdash, endash, or the word "to" to indicate
    // a range, then process the next seven characters just like we did for
    // `quantity`.
    const q2re = /^(-|–|—|to )/i;
    const q2reMatch = q2re.exec(oIng.description);
    if (q2reMatch) {
      const q2reMatchLen = q2reMatch[1].length;
      const nqResultFirstChar = numericQuantity(
        oIng.description.substring(q2reMatchLen).trim().substring(0, 1)
      );

      if (!isNaN(nqResultFirstChar)) {
        let lenNum = 6;
        let nqResult = NaN;

        while (lenNum > 0 && isNaN(nqResult)) {
          nqResult = numericQuantity(
            oIng.description.substring(q2reMatchLen, lenNum)
          );

          if (!isNaN(nqResult)) {
            oIng.quantity2 = nqResult;
            oIng.description = oIng.description.substring(lenNum).trim();
          }

          lenNum--;
        }
      }
    }

    // Check for a known unit of measure
    const firstWordRE = /^(fl(?:uid)?(?:\s+|-)(?:oz|ounces?)|[a-zA-Z.]+)\b(.+)/;
    const firstWordREMatches = firstWordRE.exec(oIng.description);
    if (firstWordREMatches) {
      const firstWord = firstWordREMatches[1].replace(/\s+/g, ' ');
      const remainingDesc = firstWordREMatches[2];
      let uom = '';
      let uomID = '';
      let i = 0;

      while (i < uomArray.length && !uom) {
        if (uomArray[i].versions.includes(firstWord)) {
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

    if (!options?.allowLeadingOf && oIng.description.match(/^of\s+/i)) {
      oIng.description = oIng.description.replace(/^of\s+/i, '');
    }

    return oIng;
  });

  return arrIngs;
};

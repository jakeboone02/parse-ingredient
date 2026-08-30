import { numericQuantity, type NumericQuantityOptions } from 'numeric-quantity';
import { buildRangeSeparatorRegex } from './constants';
import { identifyUnit } from './convertUnit';
import type { IngredientMeasurement, ParseIngredientOptions } from './types';
import { buildUnitLookupMaps, collectUOMStrings, getDefaultUnitLookupMaps } from './unitLookup';

const maxQuantityExpressionLength = 32;
const quantityStartRegex = /[\d.,\u00bc-\u00be\u2150-\u215e]/u;
const wordCharacterRegex = /[\p{L}\p{N}_]/u;
const asciiWordCharacterRegex = /[A-Za-z0-9_]/;
const unitConnectorRegex = /[-\u2010-\u2015]/u;

interface ParsedQuantityExpression {
  quantity: number;
  quantity2: number | null;
}

type QuantityNumericOptions =
  | (NumericQuantityOptions & { decimalSeparator: ','; bigIntOnOverflow: false; verbose: false })
  | undefined;

const numericOptions = (
  decimalSeparator: ParseIngredientOptions['decimalSeparator']
): QuantityNumericOptions =>
  decimalSeparator === ','
    ? { decimalSeparator: ',', bigIntOnOverflow: false, verbose: false }
    : undefined;

const parseSingleQuantity = (text: string, options: QuantityNumericOptions): number | null => {
  const quantity = numericQuantity(text.trim(), options);
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : null;
};

const parseQuantityExpression = (
  text: string,
  options: ParseIngredientOptions
): ParsedQuantityExpression | null => {
  const nqOptions = numericOptions(options.decimalSeparator);
  const singleQuantity = parseSingleQuantity(text, nqOptions);

  if (singleQuantity !== null) {
    return { quantity: singleQuantity, quantity2: null };
  }

  const rangeRegex = buildRangeSeparatorRegex(options.rangeSeparators ?? []);

  for (let separatorIndex = 1; separatorIndex < text.length; separatorIndex += 1) {
    const suffix = text.slice(separatorIndex).trimStart();
    const separatorMatch = rangeRegex.exec(suffix);

    if (!separatorMatch) continue;

    const firstQuantity = parseSingleQuantity(text.slice(0, separatorIndex), nqOptions);

    const secondQuantity = parseSingleQuantity(suffix.slice(separatorMatch[0].length), nqOptions);

    if (firstQuantity !== null && secondQuantity !== null) {
      return { quantity: firstQuantity, quantity2: secondQuantity };
    }
  }

  return null;
};

const hasUnitEndBoundary = (description: string, unit: string, endIndex: number): boolean => {
  const lastUnitCharacter = unit.at(-1);
  const nextCharacter = description[endIndex];

  return !(
    lastUnitCharacter &&
    nextCharacter &&
    asciiWordCharacterRegex.test(lastUnitCharacter) &&
    wordCharacterRegex.test(nextCharacter)
  );
};

const findQuantityBeforeUnit = (
  description: string,
  unitStartIndex: number,
  options: ParseIngredientOptions
): ({ startIndex: number } & ParsedQuantityExpression) | null => {
  let quantityEndIndex = unitStartIndex;

  while (quantityEndIndex > 0 && /\s/u.test(description[quantityEndIndex - 1])) {
    quantityEndIndex -= 1;
  }

  if (quantityEndIndex > 0 && unitConnectorRegex.test(description[quantityEndIndex - 1])) {
    quantityEndIndex -= 1;
  }

  const earliestStartIndex = Math.max(0, quantityEndIndex - maxQuantityExpressionLength);

  for (let startIndex = earliestStartIndex; startIndex < quantityEndIndex; startIndex += 1) {
    const firstCharacter = description[startIndex];

    if (!quantityStartRegex.test(firstCharacter)) continue;

    const previousCharacter = description[startIndex - 1];

    if (previousCharacter && wordCharacterRegex.test(previousCharacter)) continue;

    const parsed = parseQuantityExpression(
      description.slice(startIndex, quantityEndIndex),
      options
    );

    if (parsed) return { startIndex, ...parsed };
  }

  return null;
};

/**
 * Finds numeric quantities paired with known units inside an ingredient
 * description. Matches are returned in source order and never modify the
 * description.
 */
export const extractDescriptionMeasurements = (
  description: string,
  options: ParseIngredientOptions
): IngredientMeasurement[] => {
  if (!description) return [];

  const lookupMaps = Object.keys(options.additionalUOMs ?? {}).length
    ? buildUnitLookupMaps(options.additionalUOMs)
    : getDefaultUnitLookupMaps();

  const units = collectUOMStrings(lookupMaps).map(unit => ({
    unit,
    lowercase: unit.toLowerCase(),
  }));

  const lowercaseDescription = description.toLowerCase();
  const measurements: IngredientMeasurement[] = [];

  for (let unitStartIndex = 0; unitStartIndex < description.length; unitStartIndex += 1) {
    const unitMatch = units.find(candidate => {
      return (
        lowercaseDescription.startsWith(candidate.lowercase, unitStartIndex) &&
        hasUnitEndBoundary(description, candidate.unit, unitStartIndex + candidate.unit.length)
      );
    });

    if (!unitMatch) continue;

    const unitEndIndex = unitStartIndex + unitMatch.unit.length;
    const matchedUnit = description.slice(unitStartIndex, unitEndIndex);
    const unitOfMeasureID = identifyUnit(matchedUnit, options);
    const parsedQuantity = findQuantityBeforeUnit(description, unitStartIndex, options);

    if (unitOfMeasureID && parsedQuantity) {
      const { startIndex, quantity, quantity2 } = parsedQuantity;

      measurements.push({
        quantity,
        quantity2,
        unitOfMeasureID,
        unitOfMeasure: options.normalizeUOM ? unitOfMeasureID : matchedUnit,
        sourceText: description.slice(startIndex, unitEndIndex),
        startIndex,
        endIndex: unitEndIndex,
      });

      unitStartIndex = unitEndIndex - 1;
    }
  }

  return measurements;
};

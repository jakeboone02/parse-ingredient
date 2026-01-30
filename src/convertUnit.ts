import { unitsOfMeasure } from './constants';
import {
  MultiSystemConversionFactor,
  ParseIngredientOptions,
  UnitOfMeasureDefinitions,
  UnitSystem,
} from './types';
import { buildUnitLookupMaps, getDefaultUnitLookupMaps, lookupUnit } from './unitLookup';

export type IdentifyUnitOptions = Pick<ParseIngredientOptions, 'additionalUOMs' | 'ignoreUOMs'>;

/**
 * Identifies a unit of measure from a string, returning the canonical unit ID.
 * Matches against the unit ID, short form, plural form, and all alternates.
 * Case-sensitive matches are tried first (e.g., 'T' = tablespoon, 't' = teaspoon),
 * then falls back to case-insensitive matching.
 *
 * @returns The canonical unit ID (e.g., 'cup'), or `null` if the unit is not recognized
 *          or is in the `ignoreUOMs` list.
 *
 * @example
 * ```ts
 * identifyUnit('cups') // 'cup'
 * identifyUnit('c') // 'cup'
 * identifyUnit('T') // 'tablespoon'
 * identifyUnit('t') // 'teaspoon'
 * identifyUnit('tbsp') // 'tablespoon'
 * identifyUnit('unknown') // null
 * identifyUnit('large', { ignoreUOMs: ['large'] }) // null
 * ```
 */
export const identifyUnit = (
  /** The unit string to identify (e.g., 'cups', 'c', 'C', 'cup'). */
  unit: string,
  /** Options for unit identification. */
  options: IdentifyUnitOptions = {}
): string | null => {
  const { additionalUOMs = {}, ignoreUOMs = [] } = options;

  // Check if the unit should be ignored (case-insensitive)
  if (ignoreUOMs.length > 0) {
    const unitLC = unit.toLowerCase();
    if (ignoreUOMs.some(ignored => ignored.toLowerCase() === unitLC)) {
      return null;
    }
  }

  const hasAdditionalUOMs = Object.keys(additionalUOMs).length > 0;
  const maps = hasAdditionalUOMs ? buildUnitLookupMaps(additionalUOMs) : getDefaultUnitLookupMaps();

  return lookupUnit(unit, maps);
};

/**
 * Options for {@link convertUnit}.
 */
export interface ConvertUnitOptions {
  /**
   * The measurement system to use when units have different US/Imperial conversion factors.
   *
   * @default 'us'
   */
  fromSystem?: UnitSystem;
  /**
   * The measurement system to use when units have different US/Imperial conversion factors.
   *
   * @default 'us'
   */
  toSystem?: UnitSystem;
  /**
   * Additional unit definitions to use for conversion.
   * These are merged with the default {@link unitsOfMeasure}.
   */
  additionalUOMs?: UnitOfMeasureDefinitions;
}

/**
 * Gets the conversion factor for a unit, handling both single and multi-system factors.
 */
const getConversionFactor = (
  factor: number | MultiSystemConversionFactor | undefined,
  system: UnitSystem
): number | null =>
  factor === undefined ? null : typeof factor === 'number' ? factor : (factor[system] ?? null);

/**
 * Converts a value from one unit to another.
 *
 * @returns The converted value, or `null` if conversion is not possible
 *          (incompatible types, missing conversion factors, or unknown units).
 *
 * @example
 * ```ts
 * convertUnit(1, 'cup', 'milliliter') // ~236.588 (US)
 * convertUnit(1, 'cup', 'milliliter', { fromSystem: 'imperial' }) // ~284.131
 * convertUnit(1, 'pound', 'gram') // ~453.592
 * convertUnit(1, 'cup', 'gram') // null (incompatible types)
 * ```
 */
export const convertUnit = (
  /** The numeric value to convert. */
  value: number,
  /** The unit to convert from (unit ID, short, plural, or alternate spelling). */
  fromUnit: string,
  /** The unit to convert to (unit ID, short, plural, or alternate spelling). */
  toUnit: string,
  /** Conversion options. */
  options: ConvertUnitOptions = {}
): number | null => {
  const { fromSystem = 'us', toSystem = 'us', additionalUOMs = {} } = options;
  // Normalize system names to lowercase for case-insensitive matching
  const normalizedFromSystem = fromSystem.toLowerCase() as UnitSystem;
  const normalizedToSystem = toSystem.toLowerCase() as UnitSystem;
  const mergedUOMs = { ...unitsOfMeasure, ...additionalUOMs };

  const fromUnitID = identifyUnit(fromUnit, { additionalUOMs });
  const toUnitID = identifyUnit(toUnit, { additionalUOMs });

  // Unknown units
  if (!fromUnitID || !toUnitID) {
    return null;
  }

  const fromDef = mergedUOMs[fromUnitID];
  const toDef = mergedUOMs[toUnitID];

  // Incompatible or missing types
  if (!fromDef.type || !toDef.type || fromDef.type !== toDef.type) {
    return null;
  }

  const fromFactor = getConversionFactor(fromDef.conversionFactor, normalizedFromSystem);
  const toFactor = getConversionFactor(toDef.conversionFactor, normalizedToSystem);

  // Missing conversion factors
  if (fromFactor === null || toFactor === null) {
    return null;
  }

  // Convert via base unit: value * fromFactor / toFactor
  return (value * fromFactor) / toFactor;
};

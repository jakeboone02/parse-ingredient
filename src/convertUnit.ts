import { unitsOfMeasure } from './constants';
import { MultiSystemConversionFactor, UnitOfMeasureDefinitions, UnitSystem } from './types';

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
 * @param value - The numeric value to convert.
 * @param fromUnit - The unit to convert from (unit ID, e.g., 'cup', 'milliliter').
 * @param toUnit - The unit to convert to (unit ID, e.g., 'cup', 'milliliter').
 * @param options - Conversion options.
 * @returns The converted value, or `null` if conversion is not possible
 *          (incompatible types, missing conversion factors, or unknown units).
 *
 * @example
 * ```ts
 * convertUnit(1, 'cup', 'milliliter') // ~236.588 (US)
 * convertUnit(1, 'cup', 'milliliter', { system: 'imperial' }) // ~284.131
 * convertUnit(1, 'pound', 'gram') // ~453.592
 * convertUnit(1, 'cup', 'gram') // null (incompatible types)
 * ```
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  options: ConvertUnitOptions = {}
): number | null {
  const { fromSystem = 'us', toSystem = 'us', additionalUOMs = {} } = options;
  const mergedUOMs = { ...unitsOfMeasure, ...additionalUOMs };

  const fromDef = mergedUOMs[fromUnit];
  const toDef = mergedUOMs[toUnit];

  // Unknown units
  if (!fromDef || !toDef) {
    return null;
  }

  // Incompatible or missing types
  if (!fromDef.type || !toDef.type || fromDef.type !== toDef.type) {
    return null;
  }

  const fromFactor = getConversionFactor(fromDef.conversionFactor, fromSystem);
  const toFactor = getConversionFactor(toDef.conversionFactor, toSystem);

  // Missing conversion factors
  if (fromFactor === null || toFactor === null) {
    return null;
  }

  // Convert via base unit: value * fromFactor / toFactor
  return (value * fromFactor) / toFactor;
}

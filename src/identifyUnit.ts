import { ParseIngredientOptions } from './types';
import { getUnitLookupMaps, identifyUnitFromMaps } from './unitLookup';

/**
 * Options for {@link identifyUnit}.
 */
type IdentifyUnitOptions = Pick<ParseIngredientOptions, 'additionalUOMs' | 'ignoreUOMs'>;

/**
 * Identifies a unit of measure from a string, returning the canonical unit ID.
 * Matches against the unit ID, short form, plural form, and all alternates.
 * Case-sensitive matches are tried first (e.g., 'T' = tablespoon, 't' = teaspoon),
 * then falls back to case-insensitive matching.
 *
 * @internal
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

  return identifyUnitFromMaps(
    unit,
    getUnitLookupMaps(additionalUOMs),
    ignoreUOMs.map(u => u.toLowerCase())
  );
};

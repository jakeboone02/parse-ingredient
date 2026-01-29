import { unitsOfMeasure } from './constants';
import { UnitOfMeasureDefinitions } from './types';

/**
 * Result of building unit lookup maps.
 */
export interface UnitLookupMaps {
  /** Case-sensitive map (exact matches only) */
  caseSensitive: Map<string, string>;
  /** Case-insensitive map (lowercase keys) */
  caseInsensitive: Map<string, string>;
}

/**
 * Builds Maps for unit lookup. Returns both case-sensitive and case-insensitive maps.
 * The case-sensitive map should be checked first to handle cases like 'T' (tablespoon)
 * vs 't' (teaspoon).
 */
export const buildUnitLookupMaps = (
  additionalUOMs: UnitOfMeasureDefinitions = {}
): UnitLookupMaps => {
  const caseSensitive = new Map<string, string>();
  const caseInsensitive = new Map<string, string>();

  // Helper to add versions to maps (first one wins for case-insensitive)
  const addToMaps = (id: string, def: UnitOfMeasureDefinitions[string]) => {
    const versions = [id, def.short, def.plural, ...def.alternates];
    for (const version of versions) {
      // For case-sensitive, later entries override (so additionalUOMs wins)
      caseSensitive.set(version, id);
      // For case-insensitive, later entries also override
      caseInsensitive.set(version.toLowerCase(), id);
    }
  };

  // Process default UOMs first
  for (const [id, def] of Object.entries(unitsOfMeasure)) {
    addToMaps(id, def);
  }

  // Process additionalUOMs second so they override defaults
  for (const [id, def] of Object.entries(additionalUOMs)) {
    addToMaps(id, def);
  }

  return { caseSensitive, caseInsensitive };
};

/**
 * Looks up a unit ID from the maps, trying case-sensitive first.
 */
export const lookupUnit = (unit: string, maps: UnitLookupMaps): string | null =>
  maps.caseSensitive.get(unit) ?? maps.caseInsensitive.get(unit.toLowerCase()) ?? null;

/**
 * Cached lookup maps for the default unitsOfMeasure (no additionalUOMs).
 * Lazily initialized on first use.
 */
let defaultLookupMaps: UnitLookupMaps | null = null;

/**
 * Gets the default lookup maps, creating them if needed.
 */
export const getDefaultUnitLookupMaps = (): UnitLookupMaps =>
  defaultLookupMaps ?? (defaultLookupMaps = buildUnitLookupMaps());

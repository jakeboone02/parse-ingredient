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
    // `short`/`plural`/`alternates` may be missing when called from plain JS
    const versions = [id, def.short, def.plural, ...(def.alternates ?? [])].filter(Boolean);
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

/**
 * Maps keyed by the `additionalUOMs` object they were built from, so repeat calls with
 * the same definitions object reuse the maps instead of rebuilding ~50 definitions.
 *
 * The key is object identity, so mutating an `additionalUOMs` object after it has been
 * used does not invalidate its maps. Pass a new object to pick up changed definitions.
 */
const additionalLookupMapsCache = new WeakMap<UnitOfMeasureDefinitions, UnitLookupMaps>();

/**
 * Gets the lookup maps for the given `additionalUOMs`, reusing the cached default maps
 * when there are none.
 */
export const getUnitLookupMaps = (
  additionalUOMs: UnitOfMeasureDefinitions = {}
): UnitLookupMaps => {
  if (Object.keys(additionalUOMs).length === 0) return getDefaultUnitLookupMaps();

  const cached = additionalLookupMapsCache.get(additionalUOMs);
  if (cached) return cached;

  const maps = buildUnitLookupMaps(additionalUOMs);
  additionalLookupMapsCache.set(additionalUOMs, maps);
  return maps;
};

/**
 * Identifies a unit of measure against prebuilt maps. The maps-based counterpart of
 * `identifyUnit`, for callers that already hold a {@link UnitLookupMaps} and the
 * lowercased ignore list.
 *
 * @internal
 */
export const identifyUnitFromMaps = (
  unit: string,
  maps: UnitLookupMaps,
  ignoredUOMsLC: readonly string[]
): string | null =>
  ignoredUOMsLC.length > 0 && ignoredUOMsLC.includes(unit.toLowerCase())
    ? null
    : lookupUnit(unit, maps);

/**
 * Collects all known UOM strings from the lookup maps, sorted longest-first.
 */
export const collectUOMStrings = (maps: UnitLookupMaps): string[] => {
  const keys = [...maps.caseSensitive.keys()];
  keys.sort((a, b) => b.length - a.length);
  return keys;
};

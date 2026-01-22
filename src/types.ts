/**
 * Ingredient properties.
 */
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

/**
 * Kinds of units of measure.
 * - volume: Units measuring volume (liters, cups, etc.)
 * - mass: Units measuring mass/weight (grams, pounds, etc.)
 * - length: Units measuring length (meters, inches, etc.)
 * - count: Units measuring countable items (pieces, items, etc.)
 * - package: Units measuring packaged goods (cans, bottles, etc.)
 * - size: Units measuring size (slices, wedges, etc.)
 * - other: Units that do not fit into the above categories
 */
export type UnitKind = 'volume' | 'mass' | 'length' | 'count' | 'package' | 'size' | 'other';

/**
 * Systems of units of measure.
 * - metric: Metric system (liters, grams, etc.)
 * - imperial: Imperial system (cups, pounds, etc.)
 * - none: Units that do not belong to a specific system (e.g., "pinch", "can")
 */
export type UnitSystem = 'metric' | 'imperial' | 'none';

/**
 * Variants of imperial units. 
 * - us: United States customary units
 * - uk: United Kingdom imperial units
 */
export type ImperialVariant = 'us' | 'uk';

/**
 * Unit of measure properties.
 */
export interface UnitOfMeasure {
  /**
   * Abbreviation or short name for the unit.
   */
  short: string;
  /**
   * Full name of the unit used when quantity is greater than one.
   */
  plural: string;
  /**
   * List of all known alternate spellings, abbreviations, etc.
   */
  alternates: string[];
  /**
   * Kind of unit.
   */
  kind: UnitKind;
  /**
   * System of the unit.
   */
  system: UnitSystem;
  /**
   * Variant of the imperial unit, if applicable.
   */
  variant?: ImperialVariant;
}

export type UnitOfMeasureDefinitions = Record<string, UnitOfMeasure>;

/**
 * Options available to {@link parseIngredient}.
 */
export interface ParseIngredientOptions {
  /**
   * Converts the unit of measure (`unitOfMeasure` property) of each
   * ingredient to its long, singular form. For example, "ml" becomes
   * "milliliter" and "cups" becomes "cup".
   *
   * @default false
   */
  normalizeUOM?: boolean;
  /**
   * An object that matches the format of {@link unitsOfMeasure}. Keys that
   * match any in {@link unitsOfMeasure} will be used instead of the default,
   * and any others will be added to the list of known units of measure
   * when parsing ingredients.
   *
   * @default {}
   */
  additionalUOMs?: UnitOfMeasureDefinitions;
  /**
   * An array of strings to ignore as units of measure when parsing ingredients.
   *
   * @example
   *
   * ```ts
   * parseIngredient('2 small eggs', {
   *   ignoreUOMs: ['small', 'medium', 'large']
   * })
   * // [
   * //   {
   * //     quantity: 2,
   * //     quantity2: null,
   * //     unitOfMeasure: null,
   * //     unitOfMeasureID: null,
   * //     description: 'small eggs',
   * //     isGroupHeader: false,
   * //   }
   * // ]
   * ```
   *
   * @default []
   */
  ignoreUOMs?: string[];
  /**
   * If `true`, ingredient descriptions that start with "of " will not be
   * modified. (By default, a leading "of " will be removed from all descriptions.)
   *
   * @default false
   */
  allowLeadingOf?: boolean;
  /**
   * The character used as a decimal separator in numeric quantities.
   * Use `","` for European-style decimal commas (e.g., "1,5" for 1.5).
   *
   * @default "."
   */
  decimalSeparator?: '.' | ',';
}

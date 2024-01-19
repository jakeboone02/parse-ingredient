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
}

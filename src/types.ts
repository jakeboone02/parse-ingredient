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
  alternates: string[];
}

export type UnitOfMeasureDefinitions = Record<string, UnitOfMeasure>;

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
   * An object that matches the format of `unitsOfMeasure`. Keys that
   * match any in `unitsOfMeasure` will be used instead of the default,
   * and any others will be added to the list of known units of measure
   * when parsing ingredients.
   *
   * @default {}
   */
  additionalUOMs?: UnitOfMeasureDefinitions;
  /**
   * If `true`, ingredient descriptions that start with "of " will not be
   * modified. (By default, a leading "of " will be removed all descriptions.)
   *
   * @default false
   */
  allowLeadingOf?: boolean;
}

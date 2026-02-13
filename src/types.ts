/**
 * Metadata about the parsed ingredient line.
 */
export interface IngredientMeta {
  /**
   * The source text of the ingredient line before parsing.
   */
  sourceText: string;
  /**
   * The source index (line number) of the ingredient in the input.
   * Zero-based index relative to the order of non-empty lines.
   */
  sourceIndex: number;
}

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
  /**
   * Metadata about the parsed ingredient line.
   * Only included when the `includeMeta` option is `true`.
   */
  meta?: IngredientMeta;
}

/**
 * The type of measurement.
 */
export type UnitType = 'volume' | 'mass' | 'length' | 'count' | 'other';

/**
 * The measurement system.
 */
export type UnitSystem = 'us' | 'imperial' | 'metric';

/**
 * Conversion factor that differs between measurement systems.
 */
export interface MultiSystemConversionFactor {
  us?: number;
  imperial?: number;
  metric?: number;
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
  /**
   * The type of measurement (volume, mass, length, count, or other).
   */
  type?: UnitType;
  /**
   * Conversion factor to base unit (ml for volume, g for mass, mm for length).
   * A number means the same factor applies to all systems.
   * An object with `us`, `imperial`, and/or `metric` keys means the factor differs by system.
   */
  conversionFactor?: number | MultiSystemConversionFactor;
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

  // --- Internationalization options ---

  /**
   * Patterns to identify group headers (e.g., "For the icing:").
   * Strings are treated as prefix patterns (matched at the start of the line followed by whitespace).
   * RegExp patterns are used as-is for more complex matching.
   *
   * @default ['For']
   * @example ['For', 'Für', /^Pour\s/iu]
   */
  groupHeaderPatterns?: (string | RegExp)[];
  /**
   * Words or patterns to identify ranges between quantities (e.g., "1 to 2", "1 or 2").
   * Strings are matched as whole words followed by whitespace.
   * RegExp patterns are used as-is for more complex matching.
   *
   * @default ['to', 'or']
   * @example ['to', 'or', 'bis', 'oder', 'à']
   */
  rangeSeparators?: (string | RegExp)[];
  /**
   * Words or patterns to strip from the beginning of ingredient descriptions.
   * Commonly used to remove "of" from phrases like "1 cup of sugar".
   * Strings are matched as whole words followed by whitespace.
   * RegExp patterns are used as-is for more complex matching (e.g., French elisions).
   *
   * @default ['of']
   * @example ['of', 'de', /d[eu]?\s/iu, new RegExp("de\\s+l[ae']?\\s*", "iu")]
   */
  descriptionStripPrefixes?: (string | RegExp)[];
  /**
   * Words that indicate a trailing quantity extraction context.
   * Used to identify patterns like "Juice of 3 lemons" or "Peels from 5 oranges".
   *
   * @default ['from', 'of']
   * @example ['from', 'of', 'von', 'de']
   */
  trailingQuantityContext?: string[];
  /**
   * If `true`, include a `meta` property on each ingredient containing
   * the original text, original index, and other metadata.
   *
   * @default false
   */
  includeMeta?: boolean;
  /**
   * When `true`, if normal whitespace-based parsing fails to identify a unit
   * of measure, the parser scans the description for known UOM strings
   * registered via `additionalUOMs`. Useful for CJK languages where words
   * are not separated by spaces.
   *
   * @default false
   */
  partialUnitMatching?: boolean;
}

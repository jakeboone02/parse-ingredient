import { numericRegex } from 'numeric-quantity';
import { ParseIngredientOptions, UnitOfMeasureDefinitions } from './types';

// --- i18n Utilities ---

/**
 * Escapes special regex characters in a string.
 */
export const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a regex that matches any of the given patterns at the start of a string,
 * followed by whitespace. Strings are escaped and treated as literal prefixes.
 * RegExp patterns have their source extracted and combined.
 */
export const buildPrefixPatternRegex = (patterns: readonly (string | RegExp)[]): RegExp | null => {
  if (patterns.length === 0) return null;
  const parts = patterns.map(p =>
    p instanceof RegExp ? `(?:${p.source})` : `(?:${escapeRegex(p)})\\s`
  );
  return new RegExp(`^(?:${parts.join('|')})`, 'iu');
};

/**
 * Rewrites named capture groups in a user-supplied pattern source as non-capturing
 * groups, leaving lookbehinds (`(?<=`, `(?<!`) and escaped sequences alone.
 *
 * User patterns are composed into larger regexes that use named groups of their own, so
 * a user group named e.g. `sep` would otherwise throw at construction time. The names
 * would be unreadable to callers anyway, since only the composed regex is exposed.
 */
const stripNamedGroups = (source: string): string =>
  source.replace(/\\.|\(\?<(?![=!])[^>]*>/gu, m => (m.startsWith('\\') ? m : '(?:'));

/**
 * Builds a regex source string for range separators (dashes and word separators).
 * Always includes dash characters (-, –, —), plus any custom word separators.
 */
export const buildRangeSeparatorSource = (words: readonly (string | RegExp)[]): string => {
  const wordParts = words.map(w =>
    w instanceof RegExp ? `(?:${stripNamedGroups(w.source)})` : `(?:${escapeRegex(w)})`
  );
  // Always include dashes, then word separators followed by whitespace
  return `(-|–|—|(?:${wordParts.join('|')})\\s)`;
};

/**
 * Builds a regex that matches range separators at the start of a string.
 */
export const buildRangeSeparatorRegex = (words: readonly (string | RegExp)[]): RegExp =>
  new RegExp(`^${buildRangeSeparatorSource(words)}`, 'iu');

/**
 * Builds a regex that matches any of the given words or patterns at the start of a string.
 * Strings are matched as whole words followed by whitespace.
 * RegExp patterns are used as-is for more complex matching (e.g., French elisions).
 */
export const buildStripPrefixRegex = (patterns: readonly (string | RegExp)[]): RegExp | null => {
  if (patterns.length === 0) return null;
  const parts = patterns.map(p =>
    p instanceof RegExp ? `(?:${p.source})` : `(?:${escapeRegex(p)})\\s+`
  );
  return new RegExp(`^(?:${parts.join('|')})`, 'iu');
};

/**
 * Builds a regex that matches approximation/modifier prefixes at the start of
 * quantity expressions (e.g., "about", "ca.", "bis zu"), followed by optional whitespace.
 */
export const buildLeadingQuantityPrefixRegex = (
  patterns: readonly (string | RegExp)[]
): RegExp | null => {
  if (patterns.length === 0) return null;
  // Uses `\s*` (optional whitespace) instead of `\s+` (required whitespace, as in
  // buildStripPrefixRegex) because quantity prefixes like "ca." may appear directly
  // adjacent to the number (e.g., "ca.200g").
  const parts = patterns.map(p =>
    p instanceof RegExp ? `(?:${p.source})\\s*` : `(?:${escapeRegex(p)})\\s*`
  );
  return new RegExp(`^(?:${parts.join('|')})`, 'iu');
};

/**
 * Builds a regex that matches any of the given words at the end of a string,
 * preceded by whitespace. Used for trailing quantity context like "from" or "of".
 */
export const buildTrailingContextRegex = (words: readonly string[]): RegExp =>
  new RegExp(`\\s+(?:${words.map(escapeRegex).join('|')})$`, 'iu');

// --- Default i18n Values ---

/**
 * Recursively freezes an object and everything reachable from it.
 *
 * `RegExp` instances are left alone: freezing one makes `lastIndex` non-writable, which
 * breaks matching for global/sticky patterns.
 */
const deepFreeze = <T>(value: T): T => {
  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof RegExp) &&
    !Object.isFrozen(value)
  ) {
    // Freeze before recursing so a self-referential value can't loop forever.
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
};

/**
 * Default group header prefixes (e.g., "For the icing:").
 */
export const defaultGroupHeaderPatterns: readonly ['For'] = Object.freeze(['For'] as const);

/**
 * Default range separator words (e.g., "1 to 2", "1 or 2").
 */
export const defaultRangeSeparators: readonly ['or', 'to'] = Object.freeze(['or', 'to'] as const);

/**
 * Default words to strip from the beginning of descriptions.
 */
export const defaultDescriptionStripPrefixes: readonly ['of'] = Object.freeze(['of'] as const);

/**
 * Default words that indicate trailing quantity context.
 */
export const defaultTrailingQuantityContext: readonly ['from', 'of'] = Object.freeze([
  'from',
  'of',
] as const);
/**
 * Default words/patterns that are stripped from the beginning of quantity expressions.
 */
export const defaultLeadingQuantityPrefixes: readonly [] = Object.freeze([] as const);

/**
 * Default options for {@link parseIngredient}.
 *
 * Deep-frozen: it is spread into every {@link parseIngredient} call, so a write here
 * would otherwise reconfigure the library for the whole process.
 */
export const defaultOptions: Readonly<Required<ParseIngredientOptions>> = deepFreeze({
  additionalUOMs: {},
  allowLeadingOf: false,
  normalizeUOM: false,
  ignoreUOMs: [],
  decimalSeparator: '.',
  round: 3,
  groupHeaderPatterns: defaultGroupHeaderPatterns,
  rangeSeparators: defaultRangeSeparators,
  descriptionStripPrefixes: defaultDescriptionStripPrefixes,
  trailingQuantityContext: defaultTrailingQuantityContext,
  leadingQuantityPrefixes: defaultLeadingQuantityPrefixes,
  includeMeta: false,
  partialUnitMatching: false,
});

/**
 * Regex to capture the first word of a description to check if it's a unit of measure.
 */
export const firstWordRegEx: RegExp =
  /^(fl(?:uid)?(?:\s+|-)(?:oz|ounces?)|[\p{L}\p{N}_]+(?:[./-][\p{L}\p{N}_]+|\([\p{L}\p{N}_]+\))*[-.]?)(.+)?/iu;

const numericRegexAnywhere = numericRegex.source.replace(/^\^/, '').replace(/\$$/, '');

/**
 * Builds a regex to capture trailing quantity and unit of measure,
 * using the provided range separator words.
 *
 * Matches are read through the named groups `qty1`, `sep`, `qty2`, and `uom` — never by
 * index. `numericRegexAnywhere` is inlined twice and user range separators may contain
 * capture groups of their own, so every index here is unstable by construction.
 */
export const buildTrailingQuantityRegex = (
  rangeSeparators: readonly (string | RegExp)[]
): RegExp => {
  const rangeSeparatorSource = buildRangeSeparatorSource(rangeSeparators);
  return new RegExp(
    `(?:,|:|-|–|—|x|⨯)?\\s*(?:(?<qty1>${numericRegexAnywhere})\\s*(?<sep>${rangeSeparatorSource}))?\\s*(?<qty2>${numericRegexAnywhere})\\s*(?<uom>fl(?:uid)?(?:\\s+|-)(?:oz|ounces?)|[\\p{L}\\p{N}_]+(?:[./-][\\p{L}\\p{N}_]+|\\([\\p{L}\\p{N}_]+\\))*[-.]?)?$`,
    'iu'
  );
};

/**
 * Default unit of measure specifications.
 *
 * Deep-frozen, including each definition and its `alternates`/`conversionFactor`. The
 * lookup maps built from it are memoized, so a mutation would otherwise take effect or
 * not depending on whether anything had parsed yet.
 */
export const unitsOfMeasure: Readonly<UnitOfMeasureDefinitions> = deepFreeze({
  // Count units (no conversion factor)
  bag: {
    short: 'bag',
    plural: 'bags',
    alternates: [] satisfies string[],
    type: 'count',
  },
  box: {
    short: 'box',
    plural: 'boxes',
    alternates: [] satisfies string[],
    type: 'count',
  },
  bunch: {
    short: 'bunch',
    plural: 'bunches',
    alternates: [] satisfies string[],
    type: 'count',
  },
  can: {
    short: 'can',
    plural: 'cans',
    alternates: [] satisfies string[],
    type: 'count',
  },
  carton: {
    short: 'carton',
    plural: 'cartons',
    alternates: [] satisfies string[],
    type: 'count',
  },
  clove: {
    short: 'clove',
    plural: 'cloves',
    alternates: [] satisfies string[],
    type: 'count',
  },
  container: {
    short: 'container',
    plural: 'containers',
    alternates: [] satisfies string[],
    type: 'count',
  },
  dozen: {
    short: 'dz',
    plural: 'dozen',
    alternates: ['dz.'] satisfies string[],
    type: 'count',
  },
  ear: {
    short: 'ear',
    plural: 'ears',
    alternates: [] satisfies string[],
    type: 'count',
  },
  head: {
    short: 'head',
    plural: 'heads',
    alternates: [] satisfies string[],
    type: 'count',
  },
  pack: {
    short: 'pack',
    plural: 'packs',
    alternates: [] satisfies string[],
    type: 'count',
  },
  package: {
    short: 'pkg',
    plural: 'packages',
    alternates: ['pkg.', 'pkgs', 'pkgs.'] satisfies string[],
    type: 'count',
  },
  piece: {
    short: 'piece',
    plural: 'pieces',
    alternates: ['pc', 'pc.', 'pcs', 'pcs.'] satisfies string[],
    type: 'count',
  },
  sprig: {
    short: 'sprig',
    plural: 'sprigs',
    alternates: [] satisfies string[],
    type: 'count',
  },
  stick: {
    short: 'stick',
    plural: 'sticks',
    alternates: [] satisfies string[],
    type: 'count',
  },

  // Other units (no conversion factor)
  large: {
    short: 'lg',
    plural: 'large',
    alternates: ['lg', 'lg.'] satisfies string[],
    type: 'other',
  },
  medium: {
    short: 'md',
    plural: 'medium',
    alternates: ['med', 'med.', 'md.'] satisfies string[],
    type: 'other',
  },
  small: {
    short: 'sm',
    plural: 'small',
    alternates: ['sm.'] satisfies string[],
    type: 'other',
  },

  // Length units (conversion factor in mm)
  centimeter: {
    short: 'cm',
    plural: 'centimeters',
    alternates: ['cm.'] satisfies string[],
    type: 'length',
    conversionFactor: 10,
  },
  foot: {
    short: 'ft',
    plural: 'feet',
    alternates: ['ft.'] satisfies string[],
    type: 'length',
    conversionFactor: 304.8,
  },
  inch: {
    short: 'in',
    plural: 'inches',
    alternates: ['in.'] satisfies string[],
    type: 'length',
    conversionFactor: 25.4,
  },
  meter: {
    short: 'm',
    plural: 'meters',
    alternates: ['m.'] satisfies string[],
    type: 'length',
    conversionFactor: 1000,
  },
  millimeter: {
    short: 'mm',
    plural: 'millimeters',
    alternates: ['mm.'] satisfies string[],
    type: 'length',
    conversionFactor: 1,
  },
  yard: {
    short: 'yd',
    plural: 'yards',
    alternates: ['yd.', 'yds.'] satisfies string[],
    type: 'length',
    conversionFactor: 914.4,
  },

  // Mass units (conversion factor in g)
  gram: {
    short: 'g',
    plural: 'grams',
    alternates: ['g.'] satisfies string[],
    type: 'mass',
    conversionFactor: 1,
  },
  kilogram: {
    short: 'kg',
    plural: 'kilograms',
    alternates: ['kg.'] satisfies string[],
    type: 'mass',
    conversionFactor: 1000,
  },
  milligram: {
    short: 'mg',
    plural: 'milligrams',
    alternates: ['mg.'] satisfies string[],
    type: 'mass',
    conversionFactor: 0.001,
  },
  ounce: {
    short: 'oz',
    plural: 'ounces',
    alternates: ['oz.'] satisfies string[],
    type: 'mass',
    conversionFactor: 28.349523,
  },
  pound: {
    short: 'lb',
    plural: 'pounds',
    alternates: ['lb.', 'lbs', 'lbs.'] satisfies string[],
    type: 'mass',
    conversionFactor: 453.59237,
  },

  // Volume units (conversion factor in ml)
  cup: {
    short: 'c',
    plural: 'cups',
    alternates: ['c.', 'C'] satisfies string[],
    type: 'volume',
    conversionFactor: { us: 236.58824, imperial: 284.13063, metric: 250 },
  },
  deciliter: {
    short: 'dl',
    plural: 'deciliters',
    alternates: ['dl.'] satisfies string[],
    type: 'volume',
    conversionFactor: 100,
  },
  'fluid ounce': {
    short: 'fl oz',
    plural: 'fluid ounces',
    alternates: [
      'fluidounce',
      'floz',
      'fl-oz',
      'fluid-ounce',
      'fluid-ounces',
      'fluidounces',
      'fl ounce',
      'fl ounces',
      'fl-ounce',
      'fl-ounces',
      'fluid oz',
      'fluid-oz',
    ] satisfies string[],
    type: 'volume',
    conversionFactor: { us: 29.57353, imperial: 28.413063 },
  },
  gallon: {
    short: 'gal',
    plural: 'gallons',
    alternates: ['gal.'] satisfies string[],
    type: 'volume',
    conversionFactor: { us: 3785.4118, imperial: 4546.09 },
  },
  liter: {
    short: 'l',
    plural: 'liters',
    alternates: ['l.'] satisfies string[],
    type: 'volume',
    conversionFactor: 1000,
  },
  milliliter: {
    short: 'ml',
    plural: 'milliliters',
    alternates: ['mL', 'ml.', 'mL.'] satisfies string[],
    type: 'volume',
    conversionFactor: 1,
  },
  pint: {
    short: 'pt',
    plural: 'pints',
    alternates: ['pt.'] satisfies string[],
    type: 'volume',
    conversionFactor: { us: 473.17647, imperial: 568.26125 },
  },
  quart: {
    short: 'qt',
    plural: 'quarts',
    alternates: ['qt.', 'qts', 'qts.'] satisfies string[],
    type: 'volume',
    conversionFactor: { us: 946.35295, imperial: 1136.5225 },
  },
  tablespoon: {
    short: 'tbsp',
    plural: 'tablespoons',
    alternates: ['tbsp.', 'T', 'Tbsp.', 'Tbsp', 'tablespoonful'] satisfies string[],
    type: 'volume',
    conversionFactor: { us: 14.786765, imperial: 15, metric: 15 },
  },
  teaspoon: {
    short: 'tsp',
    plural: 'teaspoons',
    alternates: ['tsp.', 't', 'teaspoonful'] satisfies string[],
    type: 'volume',
    conversionFactor: { us: 4.9289216, imperial: 5, metric: 5 },
  },

  // Volume units without conversion factor (imprecise)
  dash: {
    short: 'dash',
    plural: 'dashes',
    alternates: [] satisfies string[],
    type: 'volume',
  },
  drop: {
    short: 'drop',
    plural: 'drops',
    alternates: [] satisfies string[],
    type: 'volume',
  },
  pinch: {
    short: 'pinch',
    plural: 'pinches',
    alternates: [] satisfies string[],
    type: 'volume',
  },
});

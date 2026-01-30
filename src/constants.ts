import { numericRegex } from 'numeric-quantity';
import { ParseIngredientOptions, UnitOfMeasureDefinitions } from './types';

/**
 * Default options for {@link parseIngredient}.
 */
export const defaultOptions: Required<ParseIngredientOptions> = {
  additionalUOMs: {},
  allowLeadingOf: false,
  normalizeUOM: false,
  ignoreUOMs: [],
  decimalSeparator: '.',
} as const;

/**
 * List of "for" equivalents (for upcoming i18n support).
 */
export const fors = ['For'] as const;
/**
 * Regex to capture "for" equivalents (for upcoming i18n support).
 */
export const forsRegEx: RegExp = new RegExp(`^(?:${fors.join('|')})\\s`, 'iu');

/**
 * List of range separators (for upcoming i18n support).
 */
export const rangeSeparatorWords = ['or', 'to'] as const;
const rangeSeparatorRegExSource = `(-|–|—|(?:${rangeSeparatorWords.join('|')})\\s)`;
/**
 * Regex to capture range separators (for upcoming i18n support).
 */
export const rangeSeparatorRegEx: RegExp = new RegExp(`^${rangeSeparatorRegExSource}`, 'iu');

/**
 * Regex to capture the first word of a description, to see if it's a unit of measure.
 */
export const firstWordRegEx: RegExp =
  /^(fl(?:uid)?(?:\s+|-)(?:oz|ounces?)|[\p{L}\p{N}_]+[-.]?)(.+)?/iu;

const numericRegexAnywhere = numericRegex.source.replace('^', '').replace(/\$$/, '');

/**
 * Regex to capture trailing quantity and unit of measure.
 */
export const trailingQuantityRegEx: RegExp = new RegExp(
  `(,|:|-|–|—|x|⨯)?\\s*((${numericRegexAnywhere})\\s*(${rangeSeparatorRegExSource}))?\\s*(${numericRegexAnywhere})\\s*(fl(?:uid)?(?:\\s+|-)(?:oz|ounces?)|[\\p{L}\\p{N}_]+)?$`,
  'iu'
);

/**
 * List of "of" equivalents (for upcoming i18n support).
 */
export const ofs = ['of'] as const;
/**
 * Regex to capture "of" equivalents at the beginning of a string (for upcoming i18n support).
 */
export const ofRegEx: RegExp = new RegExp(`^(?:${ofs.join('|')})\\s+`, 'iu');

/**
 * List of "from" equivalents (for upcoming i18n support).
 */
export const froms = ['from', 'of'] as const;
/**
 * Regex to capture "from" equivalents at the end of a string (for upcoming i18n support).
 */
export const fromRegEx: RegExp = new RegExp(`\\s+(?:${froms.join('|')})$`, 'iu');

/**
 * Default unit of measure specifications.
 */
export const unitsOfMeasure: UnitOfMeasureDefinitions = {
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
} as const;

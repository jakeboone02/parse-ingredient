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
  bag: {
    short: 'bag',
    plural: 'bags',
    alternates: [] satisfies string[],
  },
  box: {
    short: 'box',
    plural: 'boxes',
    alternates: [] satisfies string[],
  },
  bunch: {
    short: 'bunch',
    plural: 'bunches',
    alternates: [] satisfies string[],
  },
  can: {
    short: 'can',
    plural: 'cans',
    alternates: [] satisfies string[],
  },
  carton: {
    short: 'carton',
    plural: 'cartons',
    alternates: [] satisfies string[],
  },
  centimeter: {
    short: 'cm',
    plural: 'centimeters',
    alternates: ['cm.'] satisfies string[],
  },
  clove: {
    short: 'clove',
    plural: 'cloves',
    alternates: [] satisfies string[],
  },
  container: {
    short: 'container',
    plural: 'containers',
    alternates: [] satisfies string[],
  },
  cup: {
    short: 'c',
    plural: 'cups',
    alternates: ['c.', 'C'] satisfies string[],
  },
  dash: {
    short: 'dash',
    plural: 'dashes',
    alternates: [] satisfies string[],
  },
  drop: {
    short: 'drop',
    plural: 'drops',
    alternates: [] satisfies string[],
  },
  ear: {
    short: 'ear',
    plural: 'ears',
    alternates: [] satisfies string[],
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
  },
  foot: {
    short: 'ft',
    plural: 'feet',
    alternates: ['ft.'] satisfies string[],
  },
  gallon: {
    short: 'gal',
    plural: 'gallons',
    alternates: ['gal.'] satisfies string[],
  },
  gram: {
    short: 'g',
    plural: 'grams',
    alternates: ['g.'] satisfies string[],
  },
  head: {
    short: 'head',
    plural: 'heads',
    alternates: [] satisfies string[],
  },
  inch: {
    short: 'in',
    plural: 'inches',
    alternates: ['in.'] satisfies string[],
  },
  kilogram: {
    short: 'kg',
    plural: 'kilograms',
    alternates: ['kg.'] satisfies string[],
  },
  large: {
    short: 'lg',
    plural: 'large',
    alternates: ['lg', 'lg.'] satisfies string[],
  },
  liter: {
    short: 'l',
    plural: 'liters',
    alternates: ['l.'] satisfies string[],
  },
  medium: {
    short: 'md',
    plural: 'medium',
    alternates: ['med', 'med.', 'md.'] satisfies string[],
  },
  meter: {
    short: 'm',
    plural: 'meters',
    alternates: ['m.'] satisfies string[],
  },
  milligram: {
    short: 'mg',
    plural: 'milligrams',
    alternates: ['mg.'] satisfies string[],
  },
  milliliter: {
    short: 'ml',
    plural: 'milliliters',
    alternates: ['mL', 'ml.', 'mL.'] satisfies string[],
  },
  millimeter: {
    short: 'mm',
    plural: 'millimeters',
    alternates: ['mm.'] satisfies string[],
  },
  ounce: {
    short: 'oz',
    plural: 'ounces',
    alternates: ['oz.'] satisfies string[],
  },
  pack: {
    short: 'pack',
    plural: 'packs',
    alternates: [] satisfies string[],
  },
  package: {
    short: 'pkg',
    plural: 'packages',
    alternates: ['pkg.', 'pkgs', 'pkgs.'] satisfies string[],
  },
  piece: {
    short: 'piece',
    plural: 'pieces',
    alternates: ['pc', 'pc.', 'pcs', 'pcs.'] satisfies string[],
  },
  pinch: {
    short: 'pinch',
    plural: 'pinches',
    alternates: [] satisfies string[],
  },
  pint: {
    short: 'pt',
    plural: 'pints',
    alternates: ['pt.'] satisfies string[],
  },
  pound: {
    short: 'lb',
    plural: 'pounds',
    alternates: ['lb.', 'lbs', 'lbs.'] satisfies string[],
  },
  quart: {
    short: 'qt',
    plural: 'quarts',
    alternates: ['qt.', 'qts', 'qts.'] satisfies string[],
  },
  small: {
    short: 'sm',
    plural: 'small',
    alternates: ['sm.'] satisfies string[],
  },
  sprig: {
    short: 'sprig',
    plural: 'sprigs',
    alternates: [] satisfies string[],
  },
  stick: {
    short: 'stick',
    plural: 'sticks',
    alternates: [] satisfies string[],
  },
  tablespoon: {
    short: 'tbsp',
    plural: 'tablespoons',
    alternates: ['tbsp.', 'T', 'Tbsp.', 'Tbsp'] satisfies string[],
  },
  teaspoon: {
    short: 'tsp',
    plural: 'teaspoons',
    alternates: ['tsp.', 't'] satisfies string[],
  },
  yard: {
    short: 'yd',
    plural: 'yards',
    alternates: ['yd.', 'yds.'] satisfies string[],
  },
} as const;

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
  bag: {
    short: 'bag',
    plural: 'bags',
    alternates: [] satisfies string[],
    kind: 'package',
    system: 'none',
  },
  box: {
    short: 'box',
    plural: 'boxes',
    alternates: [] satisfies string[],
    kind: 'package',
    system: 'none',
  },
  bunch: {
    short: 'bunch',
    plural: 'bunches',
    alternates: [] satisfies string[],
    kind: 'count',
    system: 'none',
  },
  can: {
    short: 'can',
    plural: 'cans',
    alternates: [] satisfies string[],
    kind: 'package',
    system: 'none',
  },
  carton: {
    short: 'carton',
    plural: 'cartons',
    alternates: [] satisfies string[],
    kind: 'package',
    system: 'none',
  },
  centimeter: {
    short: 'cm',
    plural: 'centimeters',
    alternates: ['cm.'] satisfies string[],
    kind: 'length',
    system: 'metric',
  },
  clove: {
    short: 'clove',
    plural: 'cloves',
    alternates: [] satisfies string[],
    kind: 'count',
    system: 'none',
  },
  container: {
    short: 'container',
    plural: 'containers',
    alternates: [] satisfies string[],
    kind: 'package',
    system: 'none',
  },
  cup: {
    short: 'c',
    plural: 'cups',
    alternates: ['c.', 'C'] satisfies string[],
    kind: 'volume',
    system: 'imperial',
    variant: 'us',
  },
  dash: {
    short: 'dash',
    plural: 'dashes',
    alternates: [] satisfies string[],
    kind: 'volume',
    system: 'none',
  },
  drop: {
    short: 'drop',
    plural: 'drops',
    alternates: [] satisfies string[],
    kind: 'volume',
    system: 'none',
  },
  ear: {
    short: 'ear',
    plural: 'ears',
    alternates: [] satisfies string[],
    kind: 'count',
    system: 'none',
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
    kind: 'volume',
    system: 'imperial',
    variant: 'us',
  },
  foot: {
    short: 'ft',
    plural: 'feet',
    alternates: ['ft.'] satisfies string[],
    kind: 'length',
    system: 'none',
  },
  gallon: {
    short: 'gal',
    plural: 'gallons',
    alternates: ['gal.'] satisfies string[],
    kind: 'volume',
    system: 'imperial',
    variant: 'us',
  },
  gram: {
    short: 'g',
    plural: 'grams',
    alternates: ['g.'] satisfies string[],
    kind: 'mass',
    system: 'metric',
  },
  head: {
    short: 'head',
    plural: 'heads',
    alternates: [] satisfies string[],
    kind: 'count',
    system: 'none',
  },
  inch: {
    short: 'in',
    plural: 'inches',
    alternates: ['in.'] satisfies string[],
    kind: 'length',
    system: 'none',
  },
  kilogram: {
    short: 'kg',
    plural: 'kilograms',
    alternates: ['kg.'] satisfies string[],
    kind: 'mass',
    system: 'metric',
  },
  large: {
    short: 'lg',
    plural: 'large',
    alternates: ['lg', 'lg.'] satisfies string[],
    kind: 'size',
    system: 'none',
  },
  liter: {
    short: 'l',
    plural: 'liters',
    alternates: ['l.'] satisfies string[],
    kind: 'volume',
    system: 'metric',
  },
  medium: {
    short: 'md',
    plural: 'medium',
    alternates: ['med', 'med.', 'md.'] satisfies string[],
    kind: 'size',
    system: 'none',
  },
  meter: {
    short: 'm',
    plural: 'meters',
    alternates: ['m.'] satisfies string[],
    kind: 'length',
    system: 'metric',
  },
  milligram: {
    short: 'mg',
    plural: 'milligrams',
    alternates: ['mg.'] satisfies string[],
    kind: 'mass',
    system: 'metric',
  },
  milliliter: {
    short: 'ml',
    plural: 'milliliters',
    alternates: ['mL', 'ml.', 'mL.'] satisfies string[],
    kind: 'volume',
    system: 'metric',
  },
  millimeter: {
    short: 'mm',
    plural: 'millimeters',
    alternates: ['mm.'] satisfies string[],
    kind: 'length',
    system: 'metric',
  },
  ounce: {
    short: 'oz',
    plural: 'ounces',
    alternates: ['oz.'] satisfies string[],
    kind: 'mass',
    system: 'imperial',
    variant: 'us',
  },
  pack: {
    short: 'pack',
    plural: 'packs',
    alternates: [] satisfies string[],
    kind: 'package',
    system: 'none',
  },
  package: {
    short: 'pkg',
    plural: 'packages',
    alternates: ['pkg.', 'pkgs', 'pkgs.'] satisfies string[],
    kind: 'package',
    system: 'none',
  },
  piece: {
    short: 'piece',
    plural: 'pieces',
    alternates: ['pc', 'pc.', 'pcs', 'pcs.'] satisfies string[],
    kind: 'count',
    system: 'none',
  },
  pinch: {
    short: 'pinch',
    plural: 'pinches',
    alternates: [] satisfies string[],
    kind: 'volume',
    system: 'none',
  },
  pint: {
    short: 'pt',
    plural: 'pints',
    alternates: ['pt.'] satisfies string[],
    kind: 'volume',
    system: 'imperial',
    variant: 'us',
  },
  pound: {
    short: 'lb',
    plural: 'pounds',
    alternates: ['lb.', 'lbs', 'lbs.'] satisfies string[],
    kind: 'mass',
    system: 'none',
  },
  quart: {
    short: 'qt',
    plural: 'quarts',
    alternates: ['qt.', 'qts', 'qts.'] satisfies string[],
    kind: 'volume',
    system: 'imperial',
    variant: 'us',
  },
  small: {
    short: 'sm',
    plural: 'small',
    alternates: ['sm.'] satisfies string[],
    kind: 'size',
    system: 'none',
  },
  sprig: {
    short: 'sprig',
    plural: 'sprigs',
    alternates: [] satisfies string[],
    kind: 'count',
    system: 'none',
  },
  stick: {
    short: 'stick',
    plural: 'sticks',
    alternates: [] satisfies string[],
    kind: 'count',
    system: 'none',
  },
  tablespoon: {
    short: 'tbsp',
    plural: 'tablespoons',
    alternates: ['tbsp.', 'T', 'Tbsp.', 'Tbsp'] satisfies string[],
    kind: 'volume',
    system: 'imperial',
    variant: 'us',
  },
  teaspoon: {
    short: 'tsp',
    plural: 'teaspoons',
    alternates: ['tsp.', 't'] satisfies string[],
    kind: 'volume',
    system: 'imperial',
    variant: 'us',
  },
  yard: {
    short: 'yd',
    plural: 'yards',
    alternates: ['yd.', 'yds.'] satisfies string[],
    kind: 'length',
    system: 'none',
  },
} as const;

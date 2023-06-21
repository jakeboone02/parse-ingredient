import { ParseIngredientOptions, UnitOfMeasureDefinitions } from './types';

export const defaultOptions = {
  additionalUOMs: {},
  allowLeadingOf: false,
  normalizeUOM: false,
} satisfies Required<ParseIngredientOptions>;

export const fors = ['For'] as const;
export const forsRegEx = new RegExp(`^(?:${fors.join('|')})\\s`, 'i');

export const rangeSeparatorWords = ['or', 'to'] as const;
export const rangeSeparatorRegEx = new RegExp(
  `^(-|–|—|(?:${rangeSeparatorWords.join('|')})\\s)`,
  'i'
);

export const firstWordRegEx = /^(fl(?:uid)?(?:\s+|-)(?:oz|ounces?)|\w+[-.]?)(.+)?/;

export const ofs = ['of'] as const;
export const ofRegEx = new RegExp(`^(?:${ofs.join('|')})\\s+`, 'i');

export const unitsOfMeasure = {
  bag: { short: 'bag', plural: 'bags', alternates: [] },
  box: { short: 'box', plural: 'boxes', alternates: [] },
  bunch: { short: 'bunch', plural: 'bunches', alternates: [] },
  can: { short: 'can', plural: 'cans', alternates: [] },
  carton: { short: 'carton', plural: 'cartons', alternates: [] },
  centimeter: { short: 'cm', plural: 'centimeters', alternates: ['cm.'] },
  clove: { short: 'clove', plural: 'cloves', alternates: [] },
  container: { short: 'container', plural: 'containers', alternates: [] },
  cup: { short: 'c', plural: 'cups', alternates: ['c.', 'C'] },
  dash: { short: 'dash', plural: 'dashes', alternates: [] },
  drop: { short: 'drop', plural: 'drops', alternates: [] },
  ear: { short: 'ear', plural: 'ears', alternates: [] },
  'fluid ounce': { short: 'fl oz', plural: 'fluid ounces', alternates: ['fluidounce', 'floz', 'fl-oz', 'fluid-ounce', 'fluid-ounces', 'fluidounces', 'fl ounce', 'fl ounces', 'fl-ounce', 'fl-ounces', 'fluid oz', 'fluid-oz'] }, // prettier-ignore
  foot: { short: 'ft', plural: 'feet', alternates: ['ft.'] },
  gallon: { short: 'gal', plural: 'gallons', alternates: ['gal.'] },
  gram: { short: 'g', plural: 'grams', alternates: ['g.'] },
  head: { short: 'head', plural: 'heads', alternates: [] },
  inch: { short: 'in', plural: 'inches', alternates: ['in.'] },
  kilogram: { short: 'kg', plural: 'kilograms', alternates: ['kg.'] },
  large: { short: 'lg', plural: 'large', alternates: ['lg', 'lg.'] },
  liter: { short: 'l', plural: 'liters', alternates: [] },
  medium: { short: 'md', plural: 'medium', alternates: ['med', 'med.', 'md.'] },
  meter: { short: 'm', plural: 'meters', alternates: ['m.'] },
  milligram: { short: 'mg', plural: 'milligrams', alternates: ['mg.'] },
  milliliter: { short: 'ml', plural: 'milliliters', alternates: ['mL', 'ml.', 'mL.'] },
  millimeter: { short: 'mm', plural: 'millimeters', alternates: ['mm.'] },
  ounce: { short: 'oz', plural: 'ounces', alternates: ['oz.'] },
  pack: { short: 'pack', plural: 'packs', alternates: [] },
  package: { short: 'pkg', plural: 'packages', alternates: ['pkg.', 'pkgs'] },
  piece: { short: 'piece', plural: 'pieces', alternates: ['pcs', 'pcs.'] },
  pinch: { short: 'pinch', plural: 'pinches', alternates: [] },
  pint: { short: 'pt', plural: 'pints', alternates: ['pt.'] },
  pound: { short: 'lb', plural: 'pounds', alternates: ['lb.', 'lbs', 'lbs.'] },
  quart: { short: 'qt', plural: 'quarts', alternates: ['qt.', 'qts', 'qts.'] },
  small: { short: 'sm', plural: 'small', alternates: ['sm.'] },
  sprig: { short: 'sprig', plural: 'sprigs', alternates: [] },
  stick: { short: 'stick', plural: 'sticks', alternates: [] },
  tablespoon: { short: 'tbsp', plural: 'tablespoons', alternates: ['tbsp.', 'T', 'Tbsp.'] },
  teaspoon: { short: 'tsp', plural: 'teaspoons', alternates: ['tsp.', 't'] },
  yard: { short: 'yd', plural: 'yards', alternates: ['yd.', 'yds.'] },
} satisfies UnitOfMeasureDefinitions;

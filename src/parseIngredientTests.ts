import type { Ingredient, ParseIngredientOptions } from './types';

export const parseIngredientTests: Record<
  string,
  [string, Ingredient[]] | [string, Ingredient[], ParseIngredientOptions]
> = {
  'basic case': [
    '1 cup stuff',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'trim leading "of " off description': [
    '1 cup of stuff',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  fraction: [
    '1/2 cup stuff',
    [
      {
        quantity: 0.5,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'range (hyphen)': [
    '1-2 cups stuff',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'range (emdash)': [
    '1\u20132 cups stuff',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'range (endash)': [
    '1\u20142 cups stuff',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'range (spaced emdash)': [
    '1 \u2013 2 cups stuff',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'range (spaced endash)': [
    '1 \u2014 2 cups stuff',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'range (or)': [
    '1 or 2 bananas',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'bananas',
        isGroupHeader: false,
      },
    ],
  ],
  'range (OR)': [
    '1 OR 2 bananas',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'bananas',
        isGroupHeader: false,
      },
    ],
  ],
  'range (to)': [
    '1 to 2 cups stuff',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'range (TO)': [
    '1 TO 2 cups stuff',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'range (invalid quantity2)': [
    '1-NaN cups stuff',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: '-NaN cups stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'space(s) in UOM': [
    '1 fl  oz stuff',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'fluid ounce',
        unitOfMeasure: 'fl oz',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'normalize UOM': [
    '1 c stuff',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
    { normalizeUOM: true },
  ],
  'additional UOMs': [
    '2 buckets of widgets\n4 oz confusion',
    [
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'bucket',
        unitOfMeasure: 'buckets',
        description: 'widgets',
        isGroupHeader: false,
      },
      {
        quantity: 4,
        quantity2: null,
        unitOfMeasureID: 'foot',
        unitOfMeasure: 'oz',
        description: 'confusion',
        isGroupHeader: false,
      },
    ],
    {
      additionalUOMs: {
        bucket: {
          short: 'bkt',
          plural: 'buckets',
          alternates: [],
        },
        foot: {
          short: 'oz',
          plural: 'ounces',
          alternates: ['ounce'],
        },
      },
    },
  ],
  'allow leading "of "': [
    '1 cup of stuff',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'of stuff',
        isGroupHeader: false,
      },
    ],
    { allowLeadingOf: true },
  ],
  'parse UOM as description even if it matches': [
    '1 cup',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'cup',
        isGroupHeader: false,
      },
    ],
  ],
  'group header ("For x")': [
    'For cake',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'For cake',
        isGroupHeader: true,
      },
    ],
  ],
  'group header ("x:")': [
    'Icing:',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Icing:',
        isGroupHeader: true,
      },
    ],
  ],
  'no numeric part': [
    'a bunch of bananas',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'a bunch of bananas',
        isGroupHeader: false,
      },
    ],
  ],
  'multi-line': [
    '2/3 cup sugar\n1 tsp baking powder',
    [
      {
        quantity: 0.667,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'sugar',
        isGroupHeader: false,
      },
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'teaspoon',
        unitOfMeasure: 'tsp',
        description: 'baking powder',
        isGroupHeader: false,
      },
    ],
  ],
  'empty lines': [
    '2/3 cup sugar\n\n    1 tsp baking powder',
    [
      {
        quantity: 0.667,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'sugar',
        isGroupHeader: false,
      },
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'teaspoon',
        unitOfMeasure: 'tsp',
        description: 'baking powder',
        isGroupHeader: false,
      },
    ],
  ],
  'alternates (Tbsp.)': [
    '3 Tbsp. unsalted butter, divided',
    [
      {
        quantity: 3,
        quantity2: null,
        unitOfMeasureID: 'tablespoon',
        unitOfMeasure: 'Tbsp.',
        description: 'unsalted butter, divided',
        isGroupHeader: false,
      },
    ],
  ],
};

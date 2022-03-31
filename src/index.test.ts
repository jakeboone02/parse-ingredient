import { parseIngredient, Ingredient, ParseIngredientOptions } from '.';

const testPI = (
  desc: string,
  input: string,
  compare: Ingredient[],
  options?: ParseIngredientOptions
) => {
  it(desc, () => {
    expect(parseIngredient(input, options ?? undefined)).toEqual(compare);
  });
};

testPI('basic case', '1 cup stuff', [
  {
    quantity: 1,
    quantity2: null,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cup',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('trim leading "of " off description', '1 cup of stuff', [
  {
    quantity: 1,
    quantity2: null,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cup',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('fraction', '1/2 cup stuff', [
  {
    quantity: 0.5,
    quantity2: null,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cup',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('range (hyphen)', '1-2 cups stuff', [
  {
    quantity: 1,
    quantity2: 2,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cups',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('range (emdash)', '1\u20132 cups stuff', [
  {
    quantity: 1,
    quantity2: 2,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cups',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('range (endash)', '1\u20142 cups stuff', [
  {
    quantity: 1,
    quantity2: 2,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cups',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('range (spaced emdash)', '1 \u2013 2 cups stuff', [
  {
    quantity: 1,
    quantity2: 2,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cups',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('range (spaced endash)', '1 \u2014 2 cups stuff', [
  {
    quantity: 1,
    quantity2: 2,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cups',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('range (to)', '1 to 2 cups stuff', [
  {
    quantity: 1,
    quantity2: 2,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cups',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('range (TO)', '1 TO 2 cups stuff', [
  {
    quantity: 1,
    quantity2: 2,
    unitOfMeasureID: 'cup',
    unitOfMeasure: 'cups',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI('range (invalid quantity2)', '1-NaN cups stuff', [
  {
    quantity: 1,
    quantity2: null,
    unitOfMeasureID: null,
    unitOfMeasure: null,
    description: '-NaN cups stuff',
    isGroupHeader: false,
  },
]);

testPI('space(s) in UOM', '1 fl  oz stuff', [
  {
    quantity: 1,
    quantity2: null,
    unitOfMeasureID: 'fluidounce',
    unitOfMeasure: 'fl oz',
    description: 'stuff',
    isGroupHeader: false,
  },
]);

testPI(
  'normalize UOM',
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
  { normalizeUOM: true }
);

testPI(
  'additional UOMs',
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
        versions: ['bucket', 'buckets', 'bkt'],
      },
      foot: {
        short: 'ft',
        plural: 'feet',
        versions: ['ounce', 'oz', 'ounces'],
      },
    },
  }
);

testPI(
  'allow leading "of "',
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
  { allowLeadingOf: true }
);

testPI('parse UOM as description even if it matches', '1 cup', [
  {
    quantity: 1,
    quantity2: null,
    unitOfMeasureID: null,
    unitOfMeasure: null,
    description: 'cup',
    isGroupHeader: false,
  },
]);

testPI('group header ("For x")', 'For cake', [
  {
    quantity: null,
    quantity2: null,
    unitOfMeasureID: null,
    unitOfMeasure: null,
    description: 'For cake',
    isGroupHeader: true,
  },
]);

testPI('group header ("x:")', 'Icing:', [
  {
    quantity: null,
    quantity2: null,
    unitOfMeasureID: null,
    unitOfMeasure: null,
    description: 'Icing:',
    isGroupHeader: true,
  },
]);

testPI('no numeric part', 'a bunch of bananas', [
  {
    quantity: null,
    quantity2: null,
    unitOfMeasureID: null,
    unitOfMeasure: null,
    description: 'a bunch of bananas',
    isGroupHeader: false,
  },
]);

testPI('multi-line', '2/3 cup sugar\n1 tsp baking powder', [
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
]);

testPI('empty lines', '2/3 cup sugar\n\n    1 tsp baking powder', [
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
]);

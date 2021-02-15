import parseIngredient from '.';

it('works', () => {
  // Basic case
  expect(parseIngredient('1 cup stuff')).toEqual([
    {
      quantity: 1,
      quantity2: null,
      unitOfMeasure: 'cup',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  // Fraction
  expect(parseIngredient('1/2 cup stuff')).toEqual([
    {
      quantity: 0.5,
      quantity2: null,
      unitOfMeasure: 'cup',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  // Ranges
  expect(parseIngredient('1-2 cups stuff')).toEqual([
    {
      quantity: 1,
      quantity2: 2,
      unitOfMeasure: 'cups',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  expect(parseIngredient('1\u20132 cups stuff')).toEqual([
    {
      quantity: 1,
      quantity2: 2,
      unitOfMeasure: 'cups',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  expect(parseIngredient('1\u20142 cups stuff')).toEqual([
    {
      quantity: 1,
      quantity2: 2,
      unitOfMeasure: 'cups',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  expect(parseIngredient('1 \u2013 2 cups stuff')).toEqual([
    {
      quantity: 1,
      quantity2: 2,
      unitOfMeasure: 'cups',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  expect(parseIngredient('1 \u2014 2 cups stuff')).toEqual([
    {
      quantity: 1,
      quantity2: 2,
      unitOfMeasure: 'cups',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  expect(parseIngredient('1 to 2 cups stuff')).toEqual([
    {
      quantity: 1,
      quantity2: 2,
      unitOfMeasure: 'cups',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  expect(parseIngredient('1 TO 2 cups stuff')).toEqual([
    {
      quantity: 1,
      quantity2: 2,
      unitOfMeasure: 'cups',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  // Invalid number for quantity 2
  expect(parseIngredient('1-NaN cups stuff')).toEqual([
    {
      quantity: 1,
      quantity2: null,
      unitOfMeasure: null,
      description: '-NaN cups stuff',
      isGroupHeader: false,
    },
  ]);
  // Normalize UOM
  expect(parseIngredient('1 c stuff', { normalizeUOM: true })).toEqual([
    {
      quantity: 1,
      quantity2: null,
      unitOfMeasure: 'cup',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  // Missing description - parse UOM as description even if it matches
  expect(parseIngredient('1 cup')).toEqual([
    {
      quantity: 1,
      quantity2: null,
      unitOfMeasure: null,
      description: 'cup',
      isGroupHeader: false,
    },
  ]);
  // Group header ('For ')
  expect(parseIngredient('For cake')).toEqual([
    {
      quantity: null,
      quantity2: null,
      unitOfMeasure: null,
      description: 'For cake',
      isGroupHeader: true,
    },
  ]);
  // Group header ('xxx:')
  expect(parseIngredient('Icing:')).toEqual([
    {
      quantity: null,
      quantity2: null,
      unitOfMeasure: null,
      description: 'Icing:',
      isGroupHeader: true,
    },
  ]);
  // No numeric part
  expect(parseIngredient('a bunch of bananas')).toEqual([
    {
      quantity: null,
      quantity2: null,
      unitOfMeasure: null,
      description: 'a bunch of bananas',
      isGroupHeader: false,
    },
  ]);
  // Multi-line
  expect(
    parseIngredient(`2/3 cup sugar
1 tsp baking powder`)
  ).toEqual([
    {
      quantity: 0.667,
      quantity2: null,
      unitOfMeasure: 'cup',
      description: 'sugar',
      isGroupHeader: false,
    },
    {
      quantity: 1,
      quantity2: null,
      unitOfMeasure: 'tsp',
      description: 'baking powder',
      isGroupHeader: false,
    },
  ]);
  // Empty lines
  expect(
    parseIngredient(`2/3 cup sugar

    
1 tsp baking powder`)
  ).toEqual([
    {
      quantity: 0.667,
      quantity2: null,
      unitOfMeasure: 'cup',
      description: 'sugar',
      isGroupHeader: false,
    },
    {
      quantity: 1,
      quantity2: null,
      unitOfMeasure: 'tsp',
      description: 'baking powder',
      isGroupHeader: false,
    },
  ]);
});

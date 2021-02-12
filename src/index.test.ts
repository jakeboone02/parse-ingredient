import parseIngredient from '.';

it('works', () => {
  expect(parseIngredient('1 cup stuff')).toEqual([
    {
      quantity: 1,
      quantity2: null,
      unitOfMeasure: 'cup',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  expect(parseIngredient('1/2 cup stuff')).toEqual([
    {
      quantity: 0.5,
      quantity2: null,
      unitOfMeasure: 'cup',
      description: 'stuff',
      isGroupHeader: false,
    },
  ]);
  expect(parseIngredient('For cake')).toEqual([
    {
      quantity: null,
      quantity2: null,
      unitOfMeasure: null,
      description: 'For cake',
      isGroupHeader: true,
    },
  ]);
  expect(parseIngredient('Icing:')).toEqual([
    {
      quantity: null,
      quantity2: null,
      unitOfMeasure: null,
      description: 'Icing:',
      isGroupHeader: true,
    },
  ]);
});

import { parseIngredient } from './parseIngredient';
import { parseIngredientTests } from './parseIngredientTests';

for (const [testName, [input, expected, options]] of Object.entries(parseIngredientTests)) {
  it(testName, () => {
    expect(parseIngredient(input, options)).toEqual(expected);
  });
}

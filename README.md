# parse-ingredient

[![npm version](https://badge.fury.io/js/parse-ingredient.svg)](//npmjs.com/package/parse-ingredient)
![workflow status](https://github.com/jakeboone02/parse-ingredient/workflows/Continuous%20Integration/badge.svg)
[![codecov.io](https://codecov.io/github/jakeboone02/parse-ingredient/coverage.svg?branch=master)](https://codecov.io/github/jakeboone02/parse-ingredient?branch=master)
[![downloads](https://img.shields.io/npm/dm/parse-ingredient.svg)](http://npm-stat.com/charts.html?package=parse-ingredient&from=2015-08-01)
[![MIT License](https://img.shields.io/npm/l/parse-ingredient.svg)](http://opensource.org/licenses/MIT)

Parses a string, which can include mixed numbers or vulgar fractions (thanks to [numeric-quantity](https://www.npmjs.com/package/numeric-quantity)), into an array of ingredient objects with the following signature:

```ts
interface Ingredient {
  /**
   * The primary quantity (the lower quantity in a range, if applicable)
   */
  quantity: number | null;
  /**
   * The secondary quantity (the upper quantity in a range, or `null` if not applicable)
   */
  quantity2: number | null;
  /**
   * The unit of measure
   */
  unitOfMeasure: string | null;
  /**
   * The description
   */
  description: string;
  /**
   * Whether the "ingredient" is actually a group header, e.g. "For icing:"
   */
  isGroupHeader: boolean;
}
```

For the `isGroupHeader` attribute to be `true`, the ingredient string must not start with a number, and must either start with `'For'` or end with `':'`.

This library pairs nicely with [format-quantity](https://www.npmjs.com/package/format-quantity) which can display numeric values as imperial measurements (e.g. `'1 1/2'` instead of `1.5`).

## Installation

### npm

```shell
# npm
npm i parse-ingredient

# yarn
yarn add parse-ingredient
```

### Browser

In the browser, available as a global function `parseIngredient`. Remember to first include `numeric-quantity`.

```html
<script src="https://unpkg.com/numeric-quantity"></script>
<script src="https://unpkg.com/parse-ingredient"></script>
<script>
  console.log(parseIngredient('1 1/2 cups sugar'));
  /**
   * [
   *   {
   *     quantity: 1.5,
   *     quantity2: null,
   *     unitOfMeasure: 'cups',
   *     description: 'sugar',
   *     isGroupHeader: false,
   *   }
   * ]
   */
</script>
```

## Usage

```js
import parseIngredient from 'parse-ingredient';

console.log(parseIngredient('1-2 pears'));
/**
 * [
 *   {
 *     quantity: 1,
 *     quantity2: 2,
 *     unitOfMeasure: null,
 *     description: 'pears',
 *     isGroupHeader: false,
 *   }
 * ]
 */
console.log(
  parseIngredient(
    `2/3 cup flour
1 tsp baking powder`
  )
);
/**
 * [
 *   {
 *     quantity: 0.667,
 *     quantity2: null,
 *     unitOfMeasure: 'cup',
 *     description: 'flour',
 *     isGroupHeader: false,
 *   },
 *   {
 *     quantity: 1,
 *     quantity2: null,
 *     unitOfMeasure: 'tsp',
 *     description: 'baking powder',
 *     isGroupHeader: false,
 *   },
 * ]
 */
console.log(parseIngredient('For cake:'));
/**
 * [
 *   {
 *     quantity: null,
 *     quantity2: null,
 *     unitOfMeasure: null,
 *     description: 'For cake:',
 *     isGroupHeader: true,
 *   }
 * ]
 */
```

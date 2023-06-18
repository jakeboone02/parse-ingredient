# parse-ingredient

[![npm][badge-npm]](https://www.npmjs.com/package/parse-ingredient)
![workflow status](https://github.com/jakeboone02/parse-ingredient/actions/workflows/main.yml/badge.svg)
[![codecov.io](https://codecov.io/github/jakeboone02/parse-ingredient/coverage.svg?branch=main)](https://codecov.io/github/jakeboone02/parse-ingredient?branch=main)
[![downloads](https://img.shields.io/npm/dm/parse-ingredient.svg)](http://npm-stat.com/charts.html?package=parse-ingredient&from=2015-08-01)
[![MIT License](https://img.shields.io/npm/l/parse-ingredient.svg)](http://opensource.org/licenses/MIT)
[![All Contributors][badge-all-contributors]](#contributors-)

Parses a string, which can include mixed numbers or vulgar fractions (thanks to [numeric-quantity](https://www.npmjs.com/package/numeric-quantity)), into an array of recipe ingredient objects with the following signature:

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
   * The unit of measure identifier (see `unitsOfMeasure`)
   */
  unitOfMeasureID: string | null;
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

For the `isGroupHeader` attribute to be `true`, the ingredient string must not start with a number, and must either start with `'For '` or end with `':'`.

For a complimentary library that handles the inverse operation, displaying numeric values as imperial measurements (e.g. `'1 1/2'` instead of `1.5`), see [format-quantity](https://www.npmjs.com/package/format-quantity).

If present (i.e. not `null`), the `unitOfMeasureID` property corresponds to a key from the exported `unitsOfMeasure` object which defines short, plural, and other alternate versions of known units of measure. To extend the list of units, use the [`additionalUOMs` option](#additionaluoms) and/or or submit a [pull request](https://github.com/jakeboone02/parse-ingredient/pulls) to add new units to this library's default list.

## Demo

[See demo here](https://jakeboone02.github.io/parse-ingredient/).

## Installation

### npm/yarn

```shell
# npm
npm i parse-ingredient

# yarn
yarn add parse-ingredient
```

### Browser

In the browser, all exports including the `parseIngredient` function are available on the global object `ParseIngredient`.

```html
<script src="https://unpkg.com/parse-ingredient"></script>
<script>
  console.log(ParseIngredient.parseIngredient('1 1/2 cups sugar'));
  // [
  //   {
  //     quantity: 1.5,
  //     quantity2: null,
  //     unitOfMeasure: 'cups',
  //     unitOfMeasureID: 'cup',
  //     description: 'sugar',
  //     isGroupHeader: false,
  //   }
  // ]
</script>
```

## Usage

```js
import { parseIngredient } from 'parse-ingredient';

console.log(parseIngredient('1-2 pears'));
// [
//   {
//     quantity: 1,
//     quantity2: 2,
//     unitOfMeasure: null,
//     unitOfMeasureID: null,
//     description: 'pears',
//     isGroupHeader: false,
//   }
// ]
console.log(
  parseIngredient(
    `2/3 cup flour
1 tsp baking powder`
  )
);
// [
//   {
//     quantity: 0.667,
//     quantity2: null,
//     unitOfMeasure: 'cup',
//     unitOfMeasureID: 'cup',
//     description: 'flour',
//     isGroupHeader: false,
//   },
//   {
//     quantity: 1,
//     quantity2: null,
//     unitOfMeasure: 'tsp',
//     unitOfMeasureID: 'teaspoon',
//     description: 'baking powder',
//     isGroupHeader: false,
//   },
// ]
console.log(parseIngredient('For cake:'));
// [
//   {
//     quantity: null,
//     quantity2: null,
//     unitOfMeasure: null,
//     unitOfMeasureID: null,
//     description: 'For cake:',
//     isGroupHeader: true,
//   }
// ]
```

## Options

### `normalizeUOM`

Pass `true` to convert units of measure to their long, singular form, e.g. "ml" becomes "milliliter" and "cups" becomes "cup". This can help normalize the units of measure for processing. In most cases, this option will make `unitOfMeasure` equivalent to `unitOfMeasureID`.

Example:

```js
console.log(parseIngredient('1 c sugar', { normalizeUOM: true }));
// [
//   {
//     quantity: 1,
//     quantity2: null,
//     unitOfMeasure: 'cup',
//     unitOfMeasureID: 'cup',
//     description: 'sugar',
//     isGroupHeader: false,
//   }
// ]
```

### `additionalUOMs`

Pass an object that matches the format of the exported `unitsOfMeasure` object. Keys that match any in the exported object will be used instead of the default, and any others will be added to the list of known units of measure when parsing ingredients.

Example:

```js
console.log(
  parseIngredient('2 buckets of widgets', {
    additionalUOMs: {
      bucket: {
        short: 'bkt',
        plural: 'buckets',
        versions: ['bk'],
      },
    },
  })
);
// [
//   {
//     quantity: 2,
//     quantity2: null,
//     unitOfMeasureID: 'bucket',
//     unitOfMeasure: 'buckets',
//     description: 'widgets',
//     isGroupHeader: false,
//   },
// ]
```

### `allowLeadingOf`

When `true`, ingredient descriptions that start with "of " will not be modified. (By default, a leading "of " will be removed from all descriptions.)

Example:

```js
console.log(parseIngredient('1 cup of sugar', { allowLeadingOf: true }));
// [
//   {
//     quantity: 1,
//     quantity2: null,
//     unitOfMeasure: 'cup',
//     unitOfMeasureID: 'cup',
//     description: 'of sugar',
//     isGroupHeader: false,
//   }
// ]
```

## Other exports

| Name                       | Type        | Description                                                                           |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `unitsOfMeasure`           | `object`    | Information about natively-supported units of measure (see `UnitOfMeasure` interface) |
| `ParseIngredientOptions`   | `interface` | Shape of the second parameter to the `parseIngredient` function                       |
| `Ingredient`               | `interface` | Interface describing the shape of each element in the returned ingredient array       |
| `UnitOfMeasure`            | `interface` | Interface including short, plural, and alternate forms of a unit of measure           |
| `UnitOfMeasureDefinitions` | `type`      | Object with keys representing a `unitOfMeasureID` and values of type `UnitOfMeasure`  |

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jakeboone02"><img src="https://avatars.githubusercontent.com/u/366438?v=4?s=100" width="100px;" alt="Jake Boone"/><br /><sub><b>Jake Boone</b></sub></a><br /><a href="https://github.com/jakeboone02/parse-ingredient/commits?author=jakeboone02" title="Code">💻</a> <a href="https://github.com/jakeboone02/parse-ingredient/commits?author=jakeboone02" title="Documentation">📖</a> <a href="#example-jakeboone02" title="Examples">💡</a> <a href="#maintenance-jakeboone02" title="Maintenance">🚧</a> <a href="https://github.com/jakeboone02/parse-ingredient/commits?author=jakeboone02" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://studioterabyte.nl/"><img src="https://avatars.githubusercontent.com/u/25407622?v=4?s=100" width="100px;" alt="Stefan van der Weide"/><br /><sub><b>Stefan van der Weide</b></sub></a><br /><a href="https://github.com/jakeboone02/parse-ingredient/commits?author=StefanVDWeide" title="Code">💻</a> <a href="https://github.com/jakeboone02/parse-ingredient/commits?author=StefanVDWeide" title="Tests">⚠️</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<!-- prettier-ignore-start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[badge-all-contributors]: https://img.shields.io/badge/all_contributors-2-orange.svg
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- prettier-ignore-end -->

[badge-npm]: https://img.shields.io/npm/v/parse-ingredient.svg?cacheSeconds=3600&logo=npm

[![npm][badge-npm]](https://www.npmjs.com/package/parse-ingredient)
![workflow status](https://github.com/jakeboone02/parse-ingredient/actions/workflows/main.yml/badge.svg)
[![codecov.io](https://codecov.io/github/jakeboone02/parse-ingredient/coverage.svg?branch=main)](https://codecov.io/github/jakeboone02/parse-ingredient?branch=main)
[![downloads](https://img.shields.io/npm/dm/parse-ingredient.svg)](https://npm-stat.com/charts.html?package=parse-ingredient&from=2015-08-01)
[![MIT License](https://img.shields.io/npm/l/parse-ingredient.svg)](https://opensource.org/licenses/MIT)
[![All Contributors][badge-all-contributors]](#contributors-)

Parses a string, which can include mixed numbers or vulgar fractions (thanks to [numeric-quantity](https://www.npmjs.com/package/numeric-quantity)), into an array of recipe ingredient objects.

**[Full documentation](https://jakeboone02.github.io/parse-ingredient/)**

**[Demo](https://jakeboone02.github.io/parse-ingredient-demo/)**

Ingredient objects have the following signature:

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

If present (i.e., not `null`), the `unitOfMeasureID` property corresponds to a key from the exported `unitsOfMeasure` object which defines short, plural, and other alternate versions of known units of measure. To extend the list of units, use the `additionalUOMs` option and/or or submit a [pull request](https://github.com/jakeboone02/parse-ingredient/pulls) to add new units to this library's default list.

> For a complimentary library that handles the inverse operation, displaying numeric values as imperial measurements (e.g. `'1 1/2'` instead of `1.5`), see [format-quantity](https://www.npmjs.com/package/format-quantity).

## Installation

### npm

```shell
npm i parse-ingredient
# OR yarn add / pnpm add / bun add
```

### Browser

In the browser, all exports including the `parseIngredient` function are available on the global object `ParseIngredient`.

```html
<script src="https://unpkg.com/parse-ingredient"></script>
<script>
  ParseIngredient.parseIngredient('1 1/2 cups sugar');
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

The `parseIngredient` function accepts a string (with newline-separated ingredients) or an array of strings (one ingredient per element).

```js
import { parseIngredient } from 'parse-ingredient';

parseIngredient('1-2 pears');
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

parseIngredient(
  `2/3 cup flour
1 tsp baking powder`
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
parseIngredient('For cake:');
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
parseIngredient('Ripe tomato x2');
// [
//   {
//     quantity: 2,
//     quantity2: null,
//     unitOfMeasure: null,
//     unitOfMeasureID: null,
//     description: 'Ripe tomato',
//     isGroupHeader: false,
//   }
// ]
```

## Options

### `normalizeUOM`

Pass `true` to convert units of measure to their long, singular form, e.g. "ml" becomes "milliliter" and "cups" becomes "cup". This can help normalize the units of measure for processing. In most cases, this option will make `unitOfMeasure` equivalent to `unitOfMeasureID`.

```js
parseIngredient('1 c sugar', { normalizeUOM: true });
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

```js
parseIngredient('2 buckets of widgets', {
  additionalUOMs: {
    bucket: {
      short: 'bkt',
      plural: 'buckets',
      versions: ['bk'],
    },
  },
});
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

```js
parseIngredient('1 cup of sugar', { allowLeadingOf: true });
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

### `ignoreUOMs`

An array of strings to ignore as units of measure when parsing ingredients.

```js
parseIngredient('2 large eggs', { ignoreUOMs: ['large'] });
// [
//   {
//     quantity: 2,
//     quantity2: null,
//     unitOfMeasure: null,
//     unitOfMeasureID: null,
//     description: 'large eggs',
//     isGroupHeader: false,
//   }
// ]
```

### `includeMeta`

When `true`, each ingredient object will include a `meta` property containing source metadata:

- `sourceText`: The original text of the ingredient line before parsing.
- `sourceIndex`: The zero-based line number in the original input (accounts for empty lines).

```js
parseIngredient('1 cup flour\n\n2 tbsp sugar', { includeMeta: true });
// [
//   {
//     quantity: 1,
//     quantity2: null,
//     unitOfMeasure: 'cup',
//     unitOfMeasureID: 'cup',
//     description: 'flour',
//     isGroupHeader: false,
//     meta: { sourceText: '1 cup flour', sourceIndex: 0 },
//   },
//   {
//     quantity: 2,
//     quantity2: null,
//     unitOfMeasure: 'tbsp',
//     unitOfMeasureID: 'tablespoon',
//     description: 'sugar',
//     isGroupHeader: false,
//     meta: { sourceText: '2 tbsp sugar', sourceIndex: 2 },
//   },
// ]
```

## Internationalization (i18n)

The library supports parsing ingredients in multiple languages through configurable keyword options. While unit names can be localized using `additionalUOMs`, the following options allow localization of parsing keywords and quantities.

### `decimalSeparator`

The character used as a decimal separator in numeric quantities. Use `','` for European-style decimal commas (e.g., `'1,5'` for 1.5). Defaults to `'.'`.

```js
parseIngredient('1,5 cups sugar', { decimalSeparator: ',' });
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
```

### `groupHeaderPatterns`

Patterns to identify group headers (e.g., "For the icing:"). Strings are treated as prefix patterns matched at the start of the line followed by whitespace. RegExp patterns are used as-is for more complex matching. Defaults to `['For']`.

```js
// German group headers
parseIngredient('Für den Teig:\n2 cups flour', {
  groupHeaderPatterns: ['For', 'Für'],
});
// [
//   { description: 'Für den Teig:', isGroupHeader: true, ... },
//   { quantity: 2, unitOfMeasure: 'cups', description: 'flour', ... }
// ]

// French with regex pattern (matches "Pour la", "Pour le", "Pour un", etc.)
parseIngredient('Pour la pâte:', {
  groupHeaderPatterns: ['For', /^Pour\s/iu],
});
```

### `rangeSeparators`

Words or patterns to identify ranges between quantities (e.g., "1 to 2", "1 or 2"). Dash characters (-, –, —) are always recognized. Defaults to `['to', 'or']`.

```js
// German range separators
parseIngredient('1 bis 2 cups flour', {
  rangeSeparators: ['to', 'or', 'bis', 'oder'],
});
// [{ quantity: 1, quantity2: 2, ... }]

// French range separator
parseIngredient('2 à 3 cups sugar', {
  rangeSeparators: ['to', 'or', 'à', 'ou'],
});
```

### `descriptionStripPrefixes`

Words or patterns to strip from the beginning of ingredient descriptions. Commonly used to remove "of" from phrases like "1 cup of sugar". Strings are matched as whole words followed by whitespace. RegExp patterns are used as-is, which is useful for languages with contractions or elisions. Defaults to `['of']`.

> **Note:** This option is only applied when `allowLeadingOf` is `false` (the default). If `allowLeadingOf` is `true`, prefix stripping is disabled entirely and this option is ignored.

```js
// Spanish "de" stripping
parseIngredient('2 tazas de azúcar', {
  descriptionStripPrefixes: ['of', 'de'],
});
// [{ description: 'azúcar', ... }]

// French with regex patterns for elisions/contractions
parseIngredient("2 tasses d'huile", {
  descriptionStripPrefixes: [/de\s+la\s+/iu, /de\s+l'/iu, /d'/iu, 'de'],
});
// [{ description: 'huile', ... }]
```

### `trailingQuantityContext`

Words that indicate a trailing quantity extraction context, used to identify patterns like "Juice of 3 lemons". Defaults to `['from', 'of']`.

```js
// German context word
parseIngredient('Saft von 3 Zitronen', {
  trailingQuantityContext: ['from', 'of', 'von'],
});
// [{ quantity: 3, description: 'Saft von Zitronen', ... }]
```

### Full i18n Example (German)

```js
parseIngredient(
  `Für den Kuchen:
2 bis 3 Tassen Mehl
1 Tasse Zucker`,
  {
    groupHeaderPatterns: ['For', 'Für'],
    rangeSeparators: ['to', 'or', 'bis', 'oder'],
    decimalSeparator: ',',
    additionalUOMs: {
      tasse: {
        short: 'T',
        plural: 'Tassen',
        alternates: ['Tasse'],
      },
    },
  }
);
// [
//   { description: 'Für den Kuchen:', isGroupHeader: true, ... },
//   { quantity: 2, quantity2: 3, unitOfMeasure: 'Tassen', description: 'Mehl', ... },
//   { quantity: 1, unitOfMeasure: 'Tasse', description: 'Zucker', ... }
// ]
```

## Unit Conversion

### `convertUnit`

Converts a numeric value from one unit of measure to another. Accepts unit IDs, short forms, plurals, or alternate spellings (e.g., `'cup'`, `'c'`, `'cups'`, `'C'`). Returns the converted value, or `null` if conversion is not possible (incompatible types, missing conversion factors, or unknown units).

```js
import { convertUnit } from 'parse-ingredient';

convertUnit(1, 'cup', 'milliliter'); // ~236.588 (US)
convertUnit(1, 'cups', 'ml'); // ~236.588 (same as above)
convertUnit(1, 'pound', 'gram'); // ~453.592
convertUnit(1, 'lbs', 'g'); // ~453.592 (same as above)
convertUnit(1, 'inch', 'centimeter'); // ~2.54
convertUnit(1, 'cup', 'gram'); // null (incompatible types: volume vs mass)
```

#### Options

- **`fromSystem`**: The measurement system to use for the source unit (`'us'`, `'imperial'`, or `'metric'`). Defaults to `'us'`.
- **`toSystem`**: The measurement system to use for the target unit. Defaults to `'us'`.
- **`additionalUOMs`**: Additional unit definitions to use for conversion (merged with the default `unitsOfMeasure`).

```js
// Convert using different measurement systems
convertUnit(1, 'cup', 'milliliter', { fromSystem: 'imperial' }); // ~284.131
convertUnit(1, 'cup', 'cup', { fromSystem: 'us', toSystem: 'imperial' }); // ~0.833

// Use custom unit definitions
convertUnit(1, 'bucket', 'liter', {
  additionalUOMs: {
    bucket: {
      short: 'bkt',
      plural: 'buckets',
      alternates: [],
      type: 'volume',
      conversionFactor: 10000, // 10000 ml = 10 liters
    },
  },
}); // 10
```

### `conversionFactor`

The `conversionFactor` property in unit definitions enables the `convertUnit` function. Units with the same `type` (e.g., `'volume'`, `'mass'`, `'length'`) can be converted between each other.

- **Number**: A single conversion factor applies to all measurement systems.
- **Object**: Different factors for `us`, `imperial`, and/or `metric` systems.

```ts
// Single factor (same for all systems)
gram: {
  short: 'g',
  plural: 'grams',
  type: 'mass',
  conversionFactor: 1, // base unit for mass
}

// Multi-system factors
cup: {
  short: 'c',
  plural: 'cups',
  type: 'volume',
  conversionFactor: { us: 236.588, imperial: 284.131, metric: 250 },
}
```

Supported unit types: `volume`, `mass`, `length`. Units without a `conversionFactor` or `type` (such as `pinch`, `clove`, or count-based units like `bag`) cannot be converted.

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
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rogermparent"><img src="https://avatars.githubusercontent.com/u/9111807?v=4?s=100" width="100px;" alt="Roger"/><br /><sub><b>Roger</b></sub></a><br /><a href="https://github.com/jakeboone02/parse-ingredient/commits?author=rogermparent" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://site.tylermayoff.com"><img src="https://avatars.githubusercontent.com/u/10094264?v=4?s=100" width="100px;" alt="Tyler"/><br /><sub><b>Tyler</b></sub></a><br /><a href="https://github.com/jakeboone02/parse-ingredient/commits?author=tmayoff" title="Code">💻</a> <a href="https://github.com/jakeboone02/parse-ingredient/commits?author=tmayoff" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AfoxDesignz"><img src="https://avatars.githubusercontent.com/u/45944543?v=4?s=100" width="100px;" alt="AfoxDesignz"/><br /><sub><b>AfoxDesignz</b></sub></a><br /><a href="https://github.com/jakeboone02/parse-ingredient/commits?author=AfoxDesignz" title="Code">💻</a> <a href="https://github.com/jakeboone02/parse-ingredient/commits?author=AfoxDesignz" title="Tests">⚠️</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<!-- prettier-ignore-start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[badge-all-contributors]: https://img.shields.io/badge/all_contributors-5-orange.svg
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- prettier-ignore-end -->

[badge-npm]: https://img.shields.io/npm/v/parse-ingredient.svg?cacheSeconds=3600&logo=npm

import type { Ingredient, ParseIngredientOptions } from './types';

export const parseIngredientTests: Record<
  string,
  [string | string[], Ingredient[]] | [string | string[], Ingredient[], ParseIngredientOptions]
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
  'leading zero-less decimal': [
    '.5 cup stuff',
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
    '2/3 cup sugar\r\n  \n  1 tsp baking powder',
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
  Capitalized: [
    '2 Tbsp butter',
    [
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'tablespoon',
        unitOfMeasure: 'Tbsp',
        description: 'butter',
        isGroupHeader: false,
      },
    ],
  ],
  'extract of/from N things': [
    'Juice of 1 lemon\nPeels from 40-50 bananas',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Juice of lemon',
        isGroupHeader: false,
      },
      {
        quantity: 40,
        quantity2: 50,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Peels from bananas',
        isGroupHeader: false,
      },
    ],
  ],
  ...Object.fromEntries(
    [
      ['basic', ''],
      ['comma', ','],
      ['colon', ':'],
      ['dash', '-'],
      ['emdash', '\u2013'],
      ['endash', '\u2014'],
      ['x', 'x'],
      ['⨯', '⨯'],
    ].map(([desc, char]) => [
      `trailing quantity (${desc})`,
      [
        `Stuff ${char} 300mg`,
        [
          {
            quantity: 300,
            quantity2: null,
            unitOfMeasureID: 'milligram',
            unitOfMeasure: 'mg',
            description: 'Stuff',
            isGroupHeader: false,
          },
        ],
      ],
    ])
  ),
  'trailing zero-less decimal': [
    'stuff .5 cup',
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
  'trailing range (hyphen)': [
    'stuff 1-2 cups',
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
  'trailing range (emdash)': [
    'stuff 1\u20132 cups',
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
  'trailing range (endash)': [
    'stuff 1\u20142 cups',
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
  'trailing range (spaced emdash)': [
    'stuff 1 \u2013 2 cups',
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
  'trailing range (spaced endash)': [
    'stuff 1 \u2014 2 cups',
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
  'trailing range (or)': [
    'bananas 1 or 2',
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
  'trailing range (OR)': [
    'bananas 1 OR 2',
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
  'trailing range (to)': [
    'stuff 1 to 2 cups',
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
  'trailing range (TO)': [
    'stuff 1 TO 2 cups',
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
  'trailing range (invalid quantity2)': [
    'stuff 1-NaN cups',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'stuff 1-NaN cups',
        isGroupHeader: false,
      },
    ],
  ],
  'prefers leading quantity over trailing': [
    '4 lbs stuff 300 mg',
    [
      {
        quantity: 4,
        quantity2: null,
        unitOfMeasureID: 'pound',
        unitOfMeasure: 'lbs',
        description: 'stuff 300 mg',
        isGroupHeader: false,
      },
    ],
  ],
  'ignores units of measure': [
    '1 cup stuff\nstuff x 2 cups',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'cup stuff',
        isGroupHeader: false,
      },
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'stuff x 2 cups',
        isGroupHeader: false,
      },
    ],
    { ignoreUOMs: ['cup', 'cups'] },
  ],
  'additional UOMs with umlauts (German)': [
    '1 Päckchen Backpulver',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'paeckchen',
        unitOfMeasure: 'Päckchen',
        description: 'Backpulver',
        isGroupHeader: false,
      },
    ],
    {
      additionalUOMs: {
        paeckchen: {
          short: 'Pck',
          plural: 'Päckchen',
          alternates: ['Pck', 'Pck.'],
        },
      },
    },
  ],
  'trailing range with umlaut': [
    'Backpulver 1-2 Päckchen',
    [
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'paeckchen',
        unitOfMeasure: 'Päckchen',
        description: 'Backpulver',
        isGroupHeader: false,
      },
    ],
    {
      additionalUOMs: {
        paeckchen: {
          short: 'Pck',
          plural: 'Päckchen',
          alternates: ['Pck', 'Pck.'],
        },
      },
    },
  ],
  'case-insensitive UOM (leading, preserved capitalization)': [
    '2 Grams sugar',
    [
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'gram',
        unitOfMeasure: 'Grams',
        description: 'sugar',
        isGroupHeader: false,
      },
    ],
    {
      additionalUOMs: {
        gram: {
          short: 'g',
          plural: 'grams',
          alternates: [],
        },
      },
    },
  ],
  'case-insensitive UOM (builtin uppercase)': [
    '3 CUPS flour',
    [
      {
        quantity: 3,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'CUPS',
        description: 'flour',
        isGroupHeader: false,
      },
    ],
  ],
  'case-insensitive UOM (trailing)': [
    'sugar 2 Grams',
    [
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'gram',
        unitOfMeasure: 'Grams',
        description: 'sugar',
        isGroupHeader: false,
      },
    ],
    {
      additionalUOMs: {
        gram: {
          short: 'g',
          plural: 'grams',
          alternates: [],
        },
      },
    },
  ],
  'repeated separators (invalid)': [
    '1__5 cup stuff',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: '__5 cup stuff',
        isGroupHeader: false,
      },
    ],
  ],
  'decimal comma (basic)': [
    '1,5 cup stuff',
    [
      {
        quantity: 1.5,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
    { decimalSeparator: ',' },
  ],
  'decimal comma (leading zero-less)': [
    ',5 cup stuff',
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
    { decimalSeparator: ',' },
  ],
  'decimal comma (range)': [
    '1,5-2,5 cups stuff',
    [
      {
        quantity: 1.5,
        quantity2: 2.5,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
    { decimalSeparator: ',' },
  ],
  'decimal comma (trailing)': [
    'stuff 1,5 cup',
    [
      {
        quantity: 1.5,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
    { decimalSeparator: ',' },
  ],
  'decimal comma (trailing range)': [
    'stuff 1,5-2,5 cups',
    [
      {
        quantity: 1.5,
        quantity2: 2.5,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'stuff',
        isGroupHeader: false,
      },
    ],
    { decimalSeparator: ',' },
  ],
  'decimal comma (multi-line)': [
    '0,667 cup sugar\n1,5 tsp baking powder',
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
        quantity: 1.5,
        quantity2: null,
        unitOfMeasureID: 'teaspoon',
        unitOfMeasure: 'tsp',
        description: 'baking powder',
        isGroupHeader: false,
      },
    ],
    { decimalSeparator: ',' },
  ],
  'decimal comma (extract of/from N things)': [
    'Juice of 1,5 lemons',
    [
      {
        quantity: 1.5,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Juice of lemons',
        isGroupHeader: false,
      },
    ],
    { decimalSeparator: ',' },
  ],
  'invalid decimal separator': [
    'Juice of 1,5 lemons\nJuice of 1.5 lemons',
    [
      {
        quantity: 15,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Juice of lemons',
        isGroupHeader: false,
      },
      {
        quantity: 1.5,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Juice of lemons',
        isGroupHeader: false,
      },
    ],
    { decimalSeparator: 'x' as unknown as ',' },
  ],

  // --- i18n: groupHeaderPatterns ---
  'i18n: group header with custom prefix (Für)': [
    'Für den Teig',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Für den Teig',
        isGroupHeader: true,
      },
    ],
    { groupHeaderPatterns: ['For', 'Für'] },
  ],
  'i18n: group header with regex pattern': [
    'Pour la pâte',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Pour la pâte',
        isGroupHeader: true,
      },
    ],
    { groupHeaderPatterns: ['For', /^Pour\s+l[ea]/iu] },
  ],
  'i18n: group header - colon still works with custom patterns': [
    'Glasur:',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Glasur:',
        isGroupHeader: true,
      },
    ],
    { groupHeaderPatterns: ['Für'] },
  ],
  'i18n: group header - original For still detected with mixed patterns': [
    'For the icing',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'For the icing',
        isGroupHeader: true,
      },
    ],
    { groupHeaderPatterns: ['For', 'Für', 'Pour'] },
  ],

  // --- i18n: rangeSeparators ---
  'i18n: range with German "bis"': [
    '1 bis 2 cups stuff',
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
    { rangeSeparators: ['to', 'or', 'bis', 'oder'] },
  ],
  'i18n: range with German "oder"': [
    '3 oder 4 bananas',
    [
      {
        quantity: 3,
        quantity2: 4,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'bananas',
        isGroupHeader: false,
      },
    ],
    { rangeSeparators: ['to', 'or', 'bis', 'oder'] },
  ],
  'i18n: range with French "à"': [
    '2 à 3 cups flour',
    [
      {
        quantity: 2,
        quantity2: 3,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'flour',
        isGroupHeader: false,
      },
    ],
    { rangeSeparators: ['to', 'or', 'à', 'ou'] },
  ],
  'i18n: trailing range with custom separator': [
    'stuff 1 bis 2 cups',
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
    { rangeSeparators: ['to', 'or', 'bis'] },
  ],
  'i18n: range - dashes still work with custom separators': [
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
    { rangeSeparators: ['bis', 'oder'] },
  ],

  // --- i18n: descriptionStripPrefixes ---
  'i18n: strip German "von" prefix': [
    '1 cup von sugar',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'sugar',
        isGroupHeader: false,
      },
    ],
    { descriptionStripPrefixes: ['of', 'von'] },
  ],
  'i18n: strip French "de" prefix': [
    '2 cups de farine',
    [
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cups',
        description: 'farine',
        isGroupHeader: false,
      },
    ],
    { descriptionStripPrefixes: ['of', 'de'] },
  ],
  'i18n: custom strip prefix only - "of" not stripped': [
    '1 cup of sugar',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'of sugar',
        isGroupHeader: false,
      },
    ],
    { descriptionStripPrefixes: ['von', 'de'] },
  ],

  // --- i18n: trailingQuantityContext ---
  'i18n: trailing quantity with German "von"': [
    'Saft von 3 lemons',
    [
      {
        quantity: 3,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Saft von lemons',
        isGroupHeader: false,
      },
    ],
    { trailingQuantityContext: ['from', 'of', 'von'] },
  ],
  'i18n: trailing quantity with French "de"': [
    'Jus de 2 citrons',
    [
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Jus de citrons',
        isGroupHeader: false,
      },
    ],
    { trailingQuantityContext: ['from', 'of', 'de'] },
  ],

  // --- i18n: Combined German example ---
  'i18n: full German example': [
    'Für den Kuchen:\n2 bis 3 Tassen Mehl\n1 Tasse von Zucker',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Für den Kuchen:',
        isGroupHeader: true,
      },
      {
        quantity: 2,
        quantity2: 3,
        unitOfMeasureID: 'tasse',
        unitOfMeasure: 'Tassen',
        description: 'Mehl',
        isGroupHeader: false,
      },
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'tasse',
        unitOfMeasure: 'Tasse',
        description: 'Zucker',
        isGroupHeader: false,
      },
    ],
    {
      groupHeaderPatterns: ['For', 'Für'],
      rangeSeparators: ['to', 'or', 'bis', 'oder'],
      descriptionStripPrefixes: ['of', 'von'],
      additionalUOMs: {
        tasse: {
          short: 'T',
          plural: 'Tassen',
          alternates: ['Tasse'],
        },
      },
    },
  ],

  // --- i18n: Combined French example ---
  'i18n: full French example': [
    'Pour la pâte:\n1 à 2 tasses farine\nJus de 3 citrons',
    [
      {
        quantity: null,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Pour la pâte:',
        isGroupHeader: true,
      },
      {
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'tasse',
        unitOfMeasure: 'tasses',
        description: 'farine',
        isGroupHeader: false,
      },
      {
        quantity: 3,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'Jus de citrons',
        isGroupHeader: false,
      },
    ],
    {
      groupHeaderPatterns: ['For', /^Pour\s+l[ea]/iu],
      rangeSeparators: ['to', 'or', 'à', 'ou'],
      trailingQuantityContext: ['from', 'of', 'de'],
      additionalUOMs: {
        tasse: {
          short: 't',
          plural: 'tasses',
          alternates: ['tasse'],
        },
      },
    },
  ],
  'includeMeta option - single line': [
    '1 cup flour',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false,
        meta: {
          sourceText: '1 cup flour',
          sourceIndex: 0,
        },
      },
    ],
    { includeMeta: true },
  ],
  'includeMeta option - multiple lines': [
    '1 cup flour\n2 tbsp sugar\n3 eggs',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false,
        meta: {
          sourceText: '1 cup flour',
          sourceIndex: 0,
        },
      },
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'tablespoon',
        unitOfMeasure: 'tbsp',
        description: 'sugar',
        isGroupHeader: false,
        meta: {
          sourceText: '2 tbsp sugar',
          sourceIndex: 1,
        },
      },
      {
        quantity: 3,
        quantity2: null,
        unitOfMeasureID: null,
        unitOfMeasure: null,
        description: 'eggs',
        isGroupHeader: false,
        meta: {
          sourceText: '3 eggs',
          sourceIndex: 2,
        },
      },
    ],
    { includeMeta: true },
  ],
  'includeMeta option - skips empty lines in index': [
    '1 cup flour\n\n2 tbsp sugar',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false,
        meta: {
          sourceText: '1 cup flour',
          sourceIndex: 0,
        },
      },
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'tablespoon',
        unitOfMeasure: 'tbsp',
        description: 'sugar',
        isGroupHeader: false,
        meta: {
          sourceText: '2 tbsp sugar',
          sourceIndex: 2,
        },
      },
    ],
    { includeMeta: true },
  ],
  'includeMeta false - no meta property': [
    '1 cup flour',
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false,
      },
    ],
    { includeMeta: false },
  ],

  // --- Array input ---
  'array input - single element': [
    ['1 cup flour'],
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false,
      },
    ],
  ],
  'array input - multiple elements': [
    ['1 cup flour', '2 tbsp sugar'],
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false,
      },
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'tablespoon',
        unitOfMeasure: 'tbsp',
        description: 'sugar',
        isGroupHeader: false,
      },
    ],
  ],
  'array input - with options': [
    ['1 cup flour', '2 tbsp sugar'],
    [
      {
        quantity: 1,
        quantity2: null,
        unitOfMeasureID: 'cup',
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false,
        meta: { sourceText: '1 cup flour', sourceIndex: 0 },
      },
      {
        quantity: 2,
        quantity2: null,
        unitOfMeasureID: 'tablespoon',
        unitOfMeasure: 'tbsp',
        description: 'sugar',
        isGroupHeader: false,
        meta: { sourceText: '2 tbsp sugar', sourceIndex: 1 },
      },
    ],
    { includeMeta: true },
  ],
  'array input - empty array': [[], []],
};

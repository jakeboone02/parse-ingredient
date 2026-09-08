import {
  convertUnit,
  extractMeasurements,
  parseIngredient,
  type ParseIngredientOptions,
  type UnitOfMeasureDefinitions,
} from 'parse-ingredient';
import { examples } from './examples';

/** Unit definitions used by the `additionalUOMs`/`partialUnitMatching` columns. */
const additionalUOMs: UnitOfMeasureDefinitions = {
  bucket: { short: 'bkt', plural: 'buckets', alternates: [], type: 'volume' },
  大さじ: { short: '大さじ', plural: '大さじ', alternates: ['大'], type: 'volume' },
};

/** Option sets rendered as columns, left to right. */
const columns: { label: string; options?: ParseIngredientOptions }[] = [
  { label: 'default' },
  { label: 'allowLeadingOf', options: { allowLeadingOf: true } },
  { label: 'normalizeUOM', options: { normalizeUOM: true } },
  { label: 'additionalUOMs', options: { additionalUOMs } },
  { label: 'ignoreUOMs', options: { ignoreUOMs: ['cup', 'cups'] } },
  { label: 'includeMeta', options: { includeMeta: true } },
  { label: 'decimalSeparator ","', options: { decimalSeparator: ',' } },
  { label: 'partialUnitMatching', options: { additionalUOMs, partialUnitMatching: true } },
  { label: 'round: false', options: { round: false } },
  {
    label: 'descriptionMeasurements',
    options: { descriptionMeasurements: true, includeMeta: true },
  },
];

const grid = document.querySelector<HTMLElement>('#grid');

if (grid) {
  grid.style.setProperty('--column-count', `${columns.length + 1}`);

  const cells: string[] = [
    `<div class="heading">ingredient list</div>`,
    ...columns.map(c => `<div class="heading">${escapeHTML(c.label)}</div>`),
  ];

  for (const { name, input } of examples) {
    cells.push(
      `<div class="label" title="${escapeHTML(name)}">${escapeHTML(JSON.stringify(input, null, 2))}</div>`,
      ...columns.map(
        c => `<div>${escapeHTML(JSON.stringify(parseIngredient(input, c.options), null, 2))}</div>`
      )
    );
  }

  grid.innerHTML = cells.join('');
}

/** Conversions rendered in the `convertUnit` table. */
const conversions: [value: number, from: string, to: string][] = [
  [1, 'cup', 'milliliter'],
  [1, 'pound', 'gram'],
  [1, 'tablespoon', 'teaspoon'],
  [1, 'foot', 'centimeter'],
  [1, 'cup', 'gram'],
];

const conversionTable = document.querySelector('#conversions');

if (conversionTable) {
  conversionTable.innerHTML = [
    `<tr><th>call</th><th>result</th></tr>`,
    ...conversions.map(
      ([value, from, to]) =>
        `<tr><td>convertUnit(${value}, '${escapeHTML(from)}', '${escapeHTML(to)}')</td><td>${convertUnit(value, from, to)}</td></tr>`
    ),
  ].join('');
}

/** Strings scanned by the `extractMeasurements` table. */
const measurementTexts: string[] = [
  'cut into 1 1/2-inch cubes',
  'beef (about 1 pound)',
  'a 1 inch by 2 inch by 3 cm block',
  'chill 1 to 2 hours, then cut into 4 pieces',
  'stir into the pan and add a pinch of salt',
];

const measurementTable = document.querySelector('#measurements');

if (measurementTable) {
  measurementTable.innerHTML = [
    `<tr><th>text</th><th>measurements</th></tr>`,
    ...measurementTexts.map(
      text =>
        `<tr><td>${escapeHTML(text)}</td><td>${escapeHTML(
          JSON.stringify(extractMeasurements(text), null, 2)
        )}</td></tr>`
    ),
  ].join('');
}

/** Escapes text for interpolation into an HTML string. */
function escapeHTML(text: string): string {
  return text.replaceAll(/[&<>"]/gu, c => `&#${c.charCodeAt(0)};`);
}

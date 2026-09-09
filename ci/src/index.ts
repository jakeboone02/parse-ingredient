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

/** Option sets rendered as columns, left to right. `visible` is the initial checkbox state. */
const columns: { label: string; options?: ParseIngredientOptions; visible?: boolean }[] = [
  { label: 'default', visible: true },
  { label: 'allowLeadingOf', options: { allowLeadingOf: true }, visible: true },
  { label: 'normalizeUOM', options: { normalizeUOM: true }, visible: true },
  { label: 'additionalUOMs', options: { additionalUOMs } },
  { label: 'ignoreUOMs', options: { ignoreUOMs: ['cup', 'cups'] } },
  { label: 'includeMeta', options: { includeMeta: true }, visible: true },
  { label: 'decimalSeparator ","', options: { decimalSeparator: ',' } },
  { label: 'partialUnitMatching', options: { additionalUOMs, partialUnitMatching: true } },
  { label: 'round: false', options: { round: false } },
  {
    label: 'descriptionMeasurements',
    options: { descriptionMeasurements: true, includeMeta: true },
    visible: true,
  },
  // Composed columns: fixtures needing option overrides also get descriptionMeasurements so the
  // measurement scan is exercised against non-default parses, not just the default one.
  {
    label: 'descriptionMeasurements + convertible',
    options: { descriptionMeasurements: true, includeMeta: true, measurementUnits: 'convertible' },
  },
  {
    label: 'descriptionMeasurements + ignoreUOMs',
    options: {
      descriptionMeasurements: true,
      includeMeta: true,
      ignoreUOMs: ['cup', 'cups'],
    },
  },
  {
    label: 'descriptionMeasurements + additionalUOMs',
    options: { descriptionMeasurements: true, includeMeta: true, additionalUOMs },
  },
  {
    label: 'descriptionMeasurements + decimalSeparator ","',
    options: { descriptionMeasurements: true, includeMeta: true, decimalSeparator: ',' },
  },
  {
    label: 'descriptionMeasurements + normalizeUOM',
    options: { descriptionMeasurements: true, includeMeta: true, normalizeUOM: true },
  },
];

const grid = document.querySelector<HTMLElement>('#grid');
const toggles = document.querySelector<HTMLElement>('#column-toggles');

if (grid) {
  const cells: string[] = [
    `<div class="heading">ingredient list</div>`,
    ...columns.map((c, i) => `<div class="heading col-${i}">${escapeHTML(c.label)}</div>`),
  ];

  for (const { name, input } of examples) {
    cells.push(
      `<div class="label" title="${escapeHTML(name)}">${escapeHTML(JSON.stringify(input, null, 2))}</div>`,
      ...columns.map(
        (c, i) =>
          `<div class="col-${i}">${escapeHTML(JSON.stringify(parseIngredient(input, c.options), null, 2))}</div>`
      )
    );
  }

  grid.innerHTML = cells.join('');

  if (toggles) {
    toggles.innerHTML = [
      `<legend>option sets</legend>`,
      ...columns.map(
        (c, i) =>
          `<label><input type="checkbox" id="col-${i}"${c.visible ? ' checked' : ''} />${escapeHTML(c.label)}</label>`
      ),
    ].join('');
  }

  // Column visibility is CSS-only: `:has(:checked)` reveals a column's cells and adds 1 to the
  // track count. Generated because the rules are per-column and the column list lives above.
  document.head.insertAdjacentHTML(
    'beforeend',
    `<style>${columns
      .map(
        (_c, i) =>
          `body:has(#col-${i}:checked) #grid > .col-${i}{display:block}body:has(#col-${i}:checked){--col-${i}:1}`
      )
      .join(
        ''
      )}#grid{--column-count:calc(1${columns.map((_c, i) => ` + var(--col-${i}, 0)`).join('')})}</style>`
  );
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

import { parseIngredient } from 'parse-ingredient';
import { examples } from './examples';
import './styles.css';

const grid = document.querySelector('#grid')!;

const gridInnerHTML: string[] = [];

const allowLeadingOf = true;
const normalizeUOM = true;
const additionalUOMs = {
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
} as const;
const ignoreUOMs = ['cup', 'cups'] as const;

for (const ex of examples) {
  const run = [
    ex,
    parseIngredient(ex),
    parseIngredient(ex, { allowLeadingOf }),
    parseIngredient(ex, { normalizeUOM }),
    parseIngredient(ex, { additionalUOMs }),
    parseIngredient(ex, { ignoreUOMs }),
  ];

  gridInnerHTML.push(...run.map(e => `<div>${JSON.stringify(e, null, 2)}</div>`));
}

grid.innerHTML += gridInnerHTML.join('');

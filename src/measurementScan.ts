import { superSubDigitToAsciiMap, vulgarFractionToAsciiMap } from 'numeric-quantity';
import { buildTrailingRangeSeparatorRegex, defaultOptions } from './constants';
import type { NQOptions } from './quantityScan';
import { matchTrailingQuantity } from './quantityScan';
import type { ExtractMeasurementsOptions, Measurement } from './types';
import type { UnitLookupMaps, UOMScanner } from './unitLookup';
import { getUnitLookupMaps, getUOMScanner, identifyUnitFromMaps } from './unitLookup';

/**
 * Cheap pre-filter: text with no numeric character cannot contain a measurement, so the
 * whole scan — including the alignment that follows it — is skipped. Covers the same
 * non-ASCII forms `numericQuantity` normalizes.
 */
const quantityCharRegExp = new RegExp(
  `[\\p{Nd}${Object.keys(vulgarFractionToAsciiMap).join('')}${Object.keys(
    superSubDigitToAsciiMap
  ).join('')}]`,
  'u'
);

/** Word constituents, for the boundary check on both edges of a unit match. */
const wordCharRegExp = /[\p{L}\p{N}_]/u;

/**
 * A single hyphen or dash joining a quantity to its unit, as in `"1 1/2-inch"`. Stripped
 * before the backwards quantity scan so the dash is not mistaken for a range separator.
 */
const connectorRegExp = /[-\u2010-\u2015]$/u;

/**
 * Everything derived from a single {@link extractMeasurements} (or
 * {@link parseIngredient}) call's options. Built once, then reused for every scanned
 * string, so no regex or lookup map is constructed per line or per match.
 *
 * @internal
 */
export interface MeasurementContext {
  scanner: UOMScanner;
  lookupMaps: UnitLookupMaps;
  ignoredUOMsLC: string[];
  nqOpts: NQOptions;
  normalizeUOM: boolean;
  trailingRangeSeparatorRegex: RegExp;
}

/**
 * Builds a {@link MeasurementContext} from user options, applying defaults.
 *
 * @internal
 */
export const createMeasurementContext = (
  options: ExtractMeasurementsOptions = {}
): MeasurementContext => {
  const opts = { ...defaultOptions, ...options };

  return {
    scanner: getUOMScanner(opts.additionalUOMs, opts.measurementUnits),
    lookupMaps: getUnitLookupMaps(opts.additionalUOMs),
    ignoredUOMsLC: opts.ignoreUOMs.map(u => u.toLowerCase()),
    nqOpts: {
      decimalSeparator: opts.decimalSeparator,
      round: opts.round,
      bigIntOnOverflow: false,
      verbose: false,
    },
    normalizeUOM: opts.normalizeUOM,
    trailingRangeSeparatorRegex: buildTrailingRangeSeparatorRegex(opts.rangeSeparators),
  };
};

/**
 * Whether a unit match sits on word boundaries at both edges, so that e.g. the `"in"` of
 * `"into"` is not read as an inch.
 *
 * Only word-character *adjacency* disqualifies a match: a unit written `"in."` may still
 * be followed by punctuation, and `"1 1/2-inch"` is preceded by a dash.
 */
const hasWordBoundaries = (text: string, start: number, end: number): boolean => {
  const matched = text.slice(start, end);

  if (start > 0 && wordCharRegExp.test(text[start - 1]) && wordCharRegExp.test(matched[0])) {
    return false;
  }

  return !(
    end < text.length &&
    wordCharRegExp.test(text[end]) &&
    wordCharRegExp.test(matched[matched.length - 1])
  );
};

/**
 * Scans `text` for quantities paired with known units of measure, using a prebuilt
 * context.
 *
 * The strategy is unit-first: find a known unit, then walk backwards and require the run
 * preceding it to parse, in its entirety, as a quantity or a range. That single
 * requirement is what rejects the false positives — no grammar is involved.
 *
 * @internal
 */
export const scanMeasurements = (text: string, mctx: MeasurementContext): Measurement[] => {
  if (!quantityCharRegExp.test(text)) return [];

  const { regex } = mctx.scanner;
  const measurements: Measurement[] = [];
  let previousEnd = 0;

  // The regex is cached and global, so its `lastIndex` is shared across calls.
  regex.lastIndex = 0;

  for (let match = regex.exec(text); match !== null; match = regex.exec(text)) {
    const unitStart = match.index;
    const unitEnd = unitStart + match[0].length;
    /** Resumes the scan one character past a rejected unit, rather than past its end. */
    const reject = () => {
      regex.lastIndex = unitStart + 1;
    };

    if (!hasWordBoundaries(text, unitStart, unitEnd)) {
      reject();
      continue;
    }

    // Same identification path the parser uses, so `ignoreUOMs`/`additionalUOMs`/`T`-vs-`t`
    // behavior cannot drift between the two.
    const unitOfMeasureID = identifyUnitFromMaps(match[0], mctx.lookupMaps, mctx.ignoredUOMsLC);
    if (!unitOfMeasureID) {
      reject();
      continue;
    }

    // Everything before the unit, minus the whitespace and at most one dash joining the
    // two. Trimming only from the end keeps indices into `before` valid for `text`.
    let before = text.slice(0, unitStart).trimEnd();
    if (connectorRegExp.test(before)) before = before.slice(0, -1).trimEnd();

    // The backwards scan never reaches past the previous measurement, which is what makes
    // the emitted spans non-overlapping.
    const upper = matchTrailingQuantity(before, mctx.nqOpts, previousEnd);
    if (!upper) {
      reject();
      continue;
    }

    let { value: quantity, startIndex } = upper;
    let quantity2: number | null = null;

    // A range: the run before the value just found ends with a separator, and whatever
    // precedes *that* parses as a quantity too.
    const beforeQuantity = before.slice(0, startIndex);
    const separator = mctx.trailingRangeSeparatorRegex.exec(beforeQuantity);
    if (separator) {
      const lower = matchTrailingQuantity(
        beforeQuantity.slice(0, separator.index),
        mctx.nqOpts,
        previousEnd
      );
      if (lower) {
        quantity2 = quantity;
        quantity = lower.value;
        startIndex = lower.startIndex;
      }
    }

    measurements.push({
      quantity,
      quantity2,
      unitOfMeasureID,
      unitOfMeasure: mctx.normalizeUOM ? unitOfMeasureID : match[0],
      unitType: mctx.scanner.definitions[unitOfMeasureID]?.type ?? null,
      text: text.slice(startIndex, unitEnd),
      startIndex,
      endIndex: unitEnd,
    });

    previousEnd = unitEnd;
    regex.lastIndex = unitEnd;
  }

  return measurements;
};

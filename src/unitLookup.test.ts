import { describe, expect, test } from 'bun:test';
import type { UnitOfMeasureDefinitions } from './types';
import {
  buildUnitLookupMaps,
  collectUOMStrings,
  getDefaultUnitLookupMaps,
  getUnitLookupMaps,
  identifyUnitFromMaps,
} from './unitLookup';

const bucket: UnitOfMeasureDefinitions = {
  bucket: { short: 'bkt', plural: 'buckets', alternates: ['pail'], type: 'volume' },
};

describe('getUnitLookupMaps', () => {
  test('returns the shared default maps when there are no additionalUOMs', () => {
    expect(getUnitLookupMaps()).toBe(getDefaultUnitLookupMaps());
    expect(getUnitLookupMaps({})).toBe(getDefaultUnitLookupMaps());
  });

  test('reuses maps for the same additionalUOMs object', () => {
    const maps = getUnitLookupMaps(bucket);
    expect(getUnitLookupMaps(bucket)).toBe(maps);
    expect(maps).not.toBe(getDefaultUnitLookupMaps());
  });

  test('builds separate maps for distinct additionalUOMs objects', () => {
    expect(getUnitLookupMaps({ ...bucket })).not.toBe(getUnitLookupMaps({ ...bucket }));
  });

  test('additionalUOMs are present alongside defaults', () => {
    const maps = getUnitLookupMaps(bucket);
    expect(identifyUnitFromMaps('pail', maps, [])).toBe('bucket');
    expect(identifyUnitFromMaps('cups', maps, [])).toBe('cup');
  });
});

describe('identifyUnitFromMaps', () => {
  const maps = buildUnitLookupMaps();

  test('matches case-sensitively first', () => {
    expect(identifyUnitFromMaps('T', maps, [])).toBe('tablespoon');
    expect(identifyUnitFromMaps('t', maps, [])).toBe('teaspoon');
  });

  test('falls back to case-insensitive matching', () => {
    expect(identifyUnitFromMaps('CUPS', maps, [])).toBe('cup');
  });

  test('returns null for unknown units', () => {
    expect(identifyUnitFromMaps('flurble', maps, [])).toBeNull();
  });

  test('honors the lowercased ignore list', () => {
    expect(identifyUnitFromMaps('Large', maps, ['large'])).toBeNull();
    expect(identifyUnitFromMaps('lg', maps, ['large'])).toBe('large');
  });
});

describe('collectUOMStrings', () => {
  test('returns every key of the case-sensitive map', () => {
    const maps = buildUnitLookupMaps();
    expect(collectUOMStrings(maps)).toBeArrayOfSize(maps.caseSensitive.size);
    expect(collectUOMStrings(maps)).toContain('tablespoon');
    expect(collectUOMStrings(maps)).toContain('T');
  });

  test('includes additionalUOMs strings', () => {
    expect(collectUOMStrings(buildUnitLookupMaps(bucket))).toEqual(
      expect.arrayContaining(['bucket', 'bkt', 'buckets', 'pail'])
    );
  });

  /**
   * `partialUnitMatching` scans descriptions in this order, so the longest-first contract
   * is what makes the longer of two overlapping units win (e.g. 大さじ over 大).
   */
  test('sorts longest-first', () => {
    const strings = collectUOMStrings(
      buildUnitLookupMaps({
        大: { short: '大', plural: '大' },
        大さじ: { short: '大さじ', plural: '大さじ' },
      })
    );
    for (const [index, value] of strings.slice(1).entries()) {
      expect(value.length).toBeLessThanOrEqual(strings[index].length);
    }
    expect(strings.indexOf('大さじ')).toBeLessThan(strings.indexOf('大'));
  });
});

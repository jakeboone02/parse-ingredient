import { describe, expect, test } from 'bun:test';
import type { UnitOfMeasureDefinitions } from './types';
import {
  buildUnitLookupMaps,
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

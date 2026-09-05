import { describe, expect, test } from 'bun:test';
import { identifyUnit } from './identifyUnit';

describe('identifyUnit', () => {
  test('returns unit ID for exact match', () => {
    expect(identifyUnit('cup')).toBe('cup');
    expect(identifyUnit('tablespoon')).toBe('tablespoon');
  });

  test('returns unit ID for short form', () => {
    expect(identifyUnit('c')).toBe('cup');
    expect(identifyUnit('tbsp')).toBe('tablespoon');
    expect(identifyUnit('tsp')).toBe('teaspoon');
    expect(identifyUnit('oz')).toBe('ounce');
  });

  test('returns unit ID for plural form', () => {
    expect(identifyUnit('cups')).toBe('cup');
    expect(identifyUnit('tablespoons')).toBe('tablespoon');
    expect(identifyUnit('ounces')).toBe('ounce');
  });

  test('returns unit ID for alternates', () => {
    expect(identifyUnit('T')).toBe('tablespoon');
    expect(identifyUnit('Tbsp')).toBe('tablespoon');
    expect(identifyUnit('lbs')).toBe('pound');
  });

  test('distinguishes case-sensitive units (T vs t)', () => {
    expect(identifyUnit('T')).toBe('tablespoon');
    expect(identifyUnit('t')).toBe('teaspoon');
  });

  test('is case-insensitive for non-conflicting units', () => {
    expect(identifyUnit('CUP')).toBe('cup');
    expect(identifyUnit('Cup')).toBe('cup');
    expect(identifyUnit('TBSP')).toBe('tablespoon');
  });

  test('returns null for unknown units', () => {
    expect(identifyUnit('unknown')).toBeNull();
    expect(identifyUnit('foo')).toBeNull();
  });

  test('uses additionalUOMs', () => {
    expect(identifyUnit('bucket')).toBeNull();
    expect(
      identifyUnit('bucket', {
        additionalUOMs: { bucket: { short: 'bkt', plural: 'buckets', alternates: [] } },
      })
    ).toBe('bucket');
    expect(
      identifyUnit('bkt', {
        additionalUOMs: { bucket: { short: 'bkt', plural: 'buckets', alternates: [] } },
      })
    ).toBe('bucket');
  });

  test('respects ignoreUOMs', () => {
    expect(identifyUnit('large')).toBe('large');
    expect(identifyUnit('large', { ignoreUOMs: ['large'] })).toBeNull();
    expect(identifyUnit('Large', { ignoreUOMs: ['large'] })).toBeNull();
    expect(identifyUnit('lg', { ignoreUOMs: ['large'] })).toBe('large'); // only ignores exact input match
  });
});

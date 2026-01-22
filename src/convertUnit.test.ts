import { expect, test, describe } from 'bun:test';
import { convertUnit } from './convertUnit';

describe('volume conversions', () => {
  test('cup to milliliter (US)', () => {
    const result = convertUnit(1, 'cup', 'milliliter', { system: 'us' });
    expect(result).toBeCloseTo(236.588, 2);
  });

  test('cup to milliliter (Imperial)', () => {
    const result = convertUnit(1, 'cup', 'milliliter', { system: 'imperial' });
    expect(result).toBeCloseTo(284.131, 2);
  });

  test('defaults to US system', () => {
    const result = convertUnit(1, 'cup', 'milliliter');
    expect(result).toBeCloseTo(236.588, 2);
  });

  test('gallon to liter (US)', () => {
    const result = convertUnit(1, 'gallon', 'liter', { system: 'us' });
    expect(result).toBeCloseTo(3.78541, 2);
  });

  test('gallon to liter (Imperial)', () => {
    const result = convertUnit(1, 'gallon', 'liter', { system: 'imperial' });
    expect(result).toBeCloseTo(4.54609, 2);
  });

  test('tablespoon to teaspoon (US)', () => {
    const result = convertUnit(1, 'tablespoon', 'teaspoon', { system: 'us' });
    expect(result).toBeCloseTo(3, 0);
  });

  test('pint to cup (US)', () => {
    const result = convertUnit(1, 'pint', 'cup', { system: 'us' });
    expect(result).toBeCloseTo(2, 0);
  });

  test('quart to pint (US)', () => {
    const result = convertUnit(1, 'quart', 'pint', { system: 'us' });
    expect(result).toBeCloseTo(2, 0);
  });

  test('fluid ounce to milliliter (US)', () => {
    const result = convertUnit(1, 'fluid ounce', 'milliliter', { system: 'us' });
    expect(result).toBeCloseTo(29.5735, 2);
  });
});

describe('mass conversions', () => {
  test('pound to gram', () => {
    const result = convertUnit(1, 'pound', 'gram');
    expect(result).toBeCloseTo(453.592, 2);
  });

  test('ounce to gram', () => {
    const result = convertUnit(1, 'ounce', 'gram');
    expect(result).toBeCloseTo(28.3495, 2);
  });

  test('kilogram to pound', () => {
    const result = convertUnit(1, 'kilogram', 'pound');
    expect(result).toBeCloseTo(2.205, 2);
  });

  test('gram to milligram', () => {
    const result = convertUnit(1, 'gram', 'milligram');
    expect(result).toBeCloseTo(1000, 0);
  });
});

describe('length conversions', () => {
  test('inch to centimeter', () => {
    const result = convertUnit(1, 'inch', 'centimeter');
    expect(result).toBeCloseTo(2.54, 2);
  });

  test('foot to inch', () => {
    const result = convertUnit(1, 'foot', 'inch');
    expect(result).toBeCloseTo(12, 0);
  });

  test('yard to foot', () => {
    const result = convertUnit(1, 'yard', 'foot');
    expect(result).toBeCloseTo(3, 0);
  });

  test('meter to centimeter', () => {
    const result = convertUnit(1, 'meter', 'centimeter');
    expect(result).toBeCloseTo(100, 0);
  });
});

describe('null cases', () => {
  test('returns null for incompatible types (cup to gram)', () => {
    const result = convertUnit(1, 'cup', 'gram');
    expect(result).toBeNull();
  });

  test('returns null for unknown units', () => {
    const result = convertUnit(1, 'foo', 'bar');
    expect(result).toBeNull();
  });

  test('returns null for units without conversion factors (pinch)', () => {
    const result = convertUnit(1, 'pinch', 'milliliter');
    expect(result).toBeNull();
  });

  test('returns null for count units (bag)', () => {
    const result = convertUnit(1, 'bag', 'box');
    expect(result).toBeNull();
  });

  test('returns null for other units (large to small)', () => {
    const result = convertUnit(1, 'large', 'small');
    expect(result).toBeNull();
  });
});

describe('with additionalUOMs', () => {
  test('uses custom unit definitions', () => {
    const result = convertUnit(1, 'bucket', 'liter', {
      additionalUOMs: {
        bucket: {
          short: 'bkt',
          plural: 'buckets',
          alternates: [],
          type: 'volume',
          conversionFactor: 10000,
        },
      },
    });
    expect(result).toBeCloseTo(10, 0);
  });

  test('overrides existing unit definitions', () => {
    const result = convertUnit(1, 'cup', 'milliliter', {
      additionalUOMs: {
        cup: {
          short: 'c',
          plural: 'cups',
          alternates: [],
          type: 'volume',
          conversionFactor: 250,
        },
      },
    });
    expect(result).toBeCloseTo(250, 0);
  });
});

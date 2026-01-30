import { describe, expect, test } from 'bun:test';
import { convertUnit, identifyUnit } from './convertUnit';
import { UnitSystem } from './types';

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

describe('volume conversions', () => {
  test('cup to milliliter (US)', () => {
    const result = convertUnit(1, 'cup', 'milliliter', { fromSystem: 'us' });
    expect(result).toBeCloseTo(236.588, 2);
  });

  test('cup to milliliter (Imperial)', () => {
    const result = convertUnit(1, 'cup', 'milliliter', { fromSystem: 'imperial' });
    expect(result).toBeCloseTo(284.131, 2);
  });

  test('defaults to US system', () => {
    const result = convertUnit(1, 'cup', 'milliliter');
    expect(result).toBeCloseTo(236.588, 2);
  });

  test('gallon to liter (US)', () => {
    const result = convertUnit(1, 'gallon', 'liter', { fromSystem: 'us' });
    expect(result).toBeCloseTo(3.78541, 2);
  });

  test('gallon to liter (Imperial)', () => {
    const result = convertUnit(1, 'gallon', 'liter', { fromSystem: 'imperial' });
    expect(result).toBeCloseTo(4.54609, 2);
  });

  test('tablespoon to teaspoon (US)', () => {
    const result = convertUnit(1, 'tablespoon', 'teaspoon', { fromSystem: 'us' });
    expect(result).toBeCloseTo(3, 0);
  });

  test('pint to cup (US)', () => {
    const result = convertUnit(1, 'pint', 'cup', { fromSystem: 'us' });
    expect(result).toBeCloseTo(2, 0);
  });

  test('quart to pint (US)', () => {
    const result = convertUnit(1, 'quart', 'pint', { fromSystem: 'us' });
    expect(result).toBeCloseTo(2, 0);
  });

  test('fluid ounce to milliliter (US)', () => {
    const result = convertUnit(1, 'fluid ounce', 'milliliter', { fromSystem: 'us' });
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
    expect(result).toBe(1000);
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
    expect(result).toBe(100);
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

describe('fromSystem/toSystem relationships', () => {
  describe('same unit conversions', () => {
    test('cup US to cup US returns 1', () => {
      const result = convertUnit(1, 'cup', 'cup', { fromSystem: 'us', toSystem: 'us' });
      expect(result).toBeCloseTo(1, 5);
    });

    test('cup Imperial to cup Imperial returns 1', () => {
      const result = convertUnit(1, 'cup', 'cup', { fromSystem: 'imperial', toSystem: 'imperial' });
      expect(result).toBeCloseTo(1, 5);
    });

    test('cup US to cup Imperial', () => {
      // US cup (236.588 ml) to Imperial cup (284.131 ml)
      const result = convertUnit(1, 'cup', 'cup', { fromSystem: 'us', toSystem: 'imperial' });
      expect(result).toBeCloseTo(236.588 / 284.131, 4);
    });

    test('cup Imperial to cup US', () => {
      // Imperial cup (284.131 ml) to US cup (236.588 ml)
      const result = convertUnit(1, 'cup', 'cup', { fromSystem: 'imperial', toSystem: 'us' });
      expect(result).toBeCloseTo(284.131 / 236.588, 4);
    });

    test('tablespoon US to tablespoon Imperial', () => {
      // US tbsp (14.787 ml) to Imperial tbsp (17.758 ml)
      const result = convertUnit(1, 'tablespoon', 'tablespoon', {
        fromSystem: 'us',
        toSystem: 'imperial',
      });
      expect(result).toBeCloseTo(14.787 / 17.758, 4);
    });

    test('gallon Imperial to gallon US', () => {
      // Imperial gallon (4546.09 ml) to US gallon (3785.41 ml)
      const result = convertUnit(1, 'gallon', 'gallon', {
        fromSystem: 'imperial',
        toSystem: 'us',
      });
      expect(result).toBeCloseTo(4546.09 / 3785.41, 4);
    });

    test('teaspoon US to teaspoon metric', () => {
      // US tsp (4.929 ml) to metric tsp (5 ml)
      const result = convertUnit(1, 'teaspoon', 'teaspoon', {
        fromSystem: 'us',
        toSystem: 'metric',
      });
      expect(result).toBeCloseTo(4.929 / 5, 4);
    });

    test('teaspoon metric to teaspoon US', () => {
      // metric tsp (5 ml) to US tsp (4.929 ml)
      const result = convertUnit(1, 'teaspoon', 'teaspoon', {
        fromSystem: 'metric',
        toSystem: 'us',
      });
      expect(result).toBeCloseTo(5 / 4.929, 4);
    });

    test('tablespoon metric to tablespoon metric returns 1', () => {
      const result = convertUnit(1, 'tablespoon', 'tablespoon', {
        fromSystem: 'metric',
        toSystem: 'metric',
      });
      expect(result).toBeCloseTo(1, 5);
    });

    test('tablespoon Imperial to tablespoon metric', () => {
      // Imperial tbsp (17.758 ml) to metric tbsp (15 ml)
      const result = convertUnit(1, 'tablespoon', 'tablespoon', {
        fromSystem: 'imperial',
        toSystem: 'metric',
      });
      expect(result).toBeCloseTo(17.758 / 15, 4);
    });
  });

  describe('cross-system conversions', () => {
    test('US cup to milliliter (metric target)', () => {
      const result = convertUnit(1, 'cup', 'milliliter', { fromSystem: 'us', toSystem: 'us' });
      expect(result).toBeCloseTo(236.588, 2);
    });

    test('Imperial cup to milliliter (metric target)', () => {
      const result = convertUnit(1, 'cup', 'milliliter', {
        fromSystem: 'imperial',
        toSystem: 'imperial',
      });
      expect(result).toBeCloseTo(284.131, 2);
    });

    test('US tablespoon to Imperial teaspoon', () => {
      // US tbsp (14.787 ml) to Imperial tsp (5.919 ml)
      const result = convertUnit(1, 'tablespoon', 'teaspoon', {
        fromSystem: 'us',
        toSystem: 'imperial',
      });
      expect(result).toBeCloseTo(14.787 / 5.919, 3);
    });

    test('Imperial pint to US cup', () => {
      // Imperial pint (568.261 ml) to US cup (236.588 ml)
      const result = convertUnit(1, 'pint', 'cup', { fromSystem: 'imperial', toSystem: 'us' });
      expect(result).toBeCloseTo(568.261 / 236.588, 3);
    });

    test('US quart to Imperial pint', () => {
      // US quart (946.353 ml) to Imperial pint (568.261 ml)
      const result = convertUnit(1, 'quart', 'pint', { fromSystem: 'us', toSystem: 'imperial' });
      expect(result).toBeCloseTo(946.353 / 568.261, 3);
    });

    test('US fluid ounce to Imperial fluid ounce', () => {
      // US fl oz (29.5735 ml) to Imperial fl oz (28.4131 ml)
      const result = convertUnit(1, 'fluid ounce', 'fluid ounce', {
        fromSystem: 'us',
        toSystem: 'imperial',
      });
      expect(result).toBeCloseTo(29.5735 / 28.4131, 4);
    });
  });

  describe('units without multi-system factors', () => {
    test('gram to gram returns 1 regardless of system', () => {
      const result = convertUnit(1, 'gram', 'gram', { fromSystem: 'us', toSystem: 'imperial' });
      expect(result).toBeCloseTo(1, 5);
    });

    test('liter to liter returns 1 regardless of system', () => {
      const result = convertUnit(1, 'liter', 'liter', { fromSystem: 'imperial', toSystem: 'us' });
      expect(result).toBeCloseTo(1, 5);
    });

    test('pound to kilogram same regardless of system', () => {
      const usResult = convertUnit(1, 'pound', 'kilogram', { fromSystem: 'us' });
      const imperialResult = convertUnit(1, 'pound', 'kilogram', { fromSystem: 'imperial' });
      expect(usResult).toBeCloseTo(imperialResult!, 5);
    });
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
    expect(result).toBe(10);
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
    expect(result).toBe(250);
  });
});

describe('unit spelling variations', () => {
  test('accepts short form units', () => {
    expect(convertUnit(1, 'c', 'ml')).toBeCloseTo(236.588, 2);
    expect(convertUnit(1, 'tbsp', 'tsp')).toBeCloseTo(3, 0);
    expect(convertUnit(1, 'lb', 'g')).toBeCloseTo(453.592, 2);
  });

  test('accepts plural form units', () => {
    expect(convertUnit(1, 'cups', 'milliliters')).toBeCloseTo(236.588, 2);
    expect(convertUnit(1, 'pounds', 'grams')).toBeCloseTo(453.592, 2);
  });

  test('accepts alternate spellings', () => {
    expect(convertUnit(1, 'T', 'tsp')).toBeCloseTo(3, 0);
    expect(convertUnit(1, 'lbs', 'g')).toBeCloseTo(453.592, 2);
  });

  test('handles mixed spelling styles', () => {
    expect(convertUnit(1, 'cups', 'ml')).toBeCloseTo(236.588, 2);
    expect(convertUnit(1, 'c', 'milliliter')).toBeCloseTo(236.588, 2);
  });
});

describe('fromSystem and toSystem case-insensitivity', () => {
  test('fromSystem is case-insensitive (uppercase)', () => {
    const result = convertUnit(1, 'cup', 'milliliter', { fromSystem: 'US' as UnitSystem });
    expect(result).toBeCloseTo(236.588, 2);
  });

  test('fromSystem is case-insensitive (mixed case)', () => {
    const result = convertUnit(1, 'cup', 'milliliter', { fromSystem: 'Imperial' as UnitSystem });
    expect(result).toBeCloseTo(284.131, 2);
  });

  test('fromSystem is case-insensitive (all caps)', () => {
    const result = convertUnit(1, 'cup', 'milliliter', { fromSystem: 'IMPERIAL' as UnitSystem });
    expect(result).toBeCloseTo(284.131, 2);
  });

  test('toSystem is case-insensitive (uppercase)', () => {
    const result = convertUnit(1, 'cup', 'cup', {
      fromSystem: 'us',
      toSystem: 'IMPERIAL' as UnitSystem,
    });
    expect(result).toBeCloseTo(236.588 / 284.131, 4);
  });

  test('toSystem is case-insensitive (mixed case)', () => {
    const result = convertUnit(1, 'gallon', 'liter', {
      fromSystem: 'us',
      toSystem: 'Us' as UnitSystem,
    });
    expect(result).toBeCloseTo(3.78541, 2);
  });

  test('both fromSystem and toSystem are case-insensitive', () => {
    const result = convertUnit(1, 'teaspoon', 'teaspoon', {
      fromSystem: 'METRIC' as UnitSystem,
      toSystem: 'US' as UnitSystem,
    });
    expect(result).toBeCloseTo(5 / 4.929, 4);
  });

  test('works with all uppercase METRIC', () => {
    const result = convertUnit(1, 'tablespoon', 'tablespoon', {
      fromSystem: 'METRIC' as UnitSystem,
      toSystem: 'metric',
    });
    expect(result).toBeCloseTo(1, 5);
  });

  test('mixed case produces same result as lowercase', () => {
    const lowercaseResult = convertUnit(1, 'cup', 'milliliter', { fromSystem: 'imperial' });
    const mixedCaseResult = convertUnit(1, 'cup', 'milliliter', {
      fromSystem: 'ImPeRiAl' as UnitSystem,
    });
    expect(lowercaseResult).toBeCloseTo(mixedCaseResult!, 5);
  });
});

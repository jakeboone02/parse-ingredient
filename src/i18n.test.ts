import { describe, expect, test } from 'bun:test';
import {
  buildLeadingQuantityPrefixRegex,
  buildPrefixPatternRegex,
  buildRangeSeparatorRegex,
  buildRangeSeparatorSource,
  buildStripPrefixRegex,
  buildTrailingContextRegex,
  buildTrailingQuantityRegex,
  escapeRegex,
} from './constants';

describe('escapeRegex', () => {
  test('escapes special regex characters', () => {
    expect(escapeRegex('a.b')).toBe('a\\.b');
    expect(escapeRegex('a*b')).toBe('a\\*b');
    expect(escapeRegex('a+b')).toBe('a\\+b');
    expect(escapeRegex('a?b')).toBe('a\\?b');
    expect(escapeRegex('a^b')).toBe('a\\^b');
    expect(escapeRegex('a$b')).toBe('a\\$b');
    expect(escapeRegex('a{b}')).toBe('a\\{b\\}');
    expect(escapeRegex('a(b)')).toBe('a\\(b\\)');
    expect(escapeRegex('a[b]')).toBe('a\\[b\\]');
    expect(escapeRegex('a|b')).toBe('a\\|b');
    expect(escapeRegex('a\\b')).toBe('a\\\\b');
  });

  test('leaves normal characters unchanged', () => {
    expect(escapeRegex('abc')).toBe('abc');
    expect(escapeRegex('For')).toBe('For');
    expect(escapeRegex('Für')).toBe('Für');
  });
});

describe('buildPrefixPatternRegex', () => {
  test('matches string prefixes followed by whitespace', () => {
    const regex = buildPrefixPatternRegex(['For']);
    expect(regex.test('For the cake')).toBe(true);
    expect(regex.test('for the cake')).toBe(true); // case-insensitive
    expect(regex.test('For')).toBe(false); // no trailing whitespace
    expect(regex.test('Forget it')).toBe(false); // not followed by space
  });

  test('handles multiple string patterns', () => {
    const regex = buildPrefixPatternRegex(['For', 'Für', 'Pour']);
    expect(regex.test('For the icing')).toBe(true);
    expect(regex.test('Für den Teig')).toBe(true);
    expect(regex.test('Pour la pâte')).toBe(true);
    expect(regex.test('About the cake')).toBe(false);
  });

  test('handles RegExp patterns', () => {
    const regex = buildPrefixPatternRegex([/^Pour\s+l[ea]/iu]);
    expect(regex.test('Pour la pâte')).toBe(true);
    expect(regex.test('Pour le gâteau')).toBe(true);
    expect(regex.test('Pour une tarte')).toBe(false);
  });

  test('handles mixed string and RegExp patterns', () => {
    const regex = buildPrefixPatternRegex(['For', 'Für', /^Pour\s+l[ea]/iu]);
    expect(regex.test('For the cake')).toBe(true);
    expect(regex.test('Für den Kuchen')).toBe(true);
    expect(regex.test('Pour la pâte')).toBe(true);
  });

  test('escapes special characters in strings', () => {
    const regex = buildPrefixPatternRegex(['For.', 'Test*']);
    expect(regex.test('For. something')).toBe(true);
    expect(regex.test('Test* something')).toBe(true);
    expect(regex.test('Forx something')).toBe(false);
  });
});

describe('buildRangeSeparatorSource', () => {
  test('returns source string for regex', () => {
    const source = buildRangeSeparatorSource(['to', 'or']);
    expect(source).toContain('-|–|—'); // always includes dashes
    expect(source).toContain('to');
    expect(source).toContain('or');
  });

  test('handles custom words', () => {
    const source = buildRangeSeparatorSource(['bis', 'oder']);
    expect(source).toContain('bis');
    expect(source).toContain('oder');
  });
});

describe('buildRangeSeparatorRegex', () => {
  test('matches dashes at start of string', () => {
    const regex = buildRangeSeparatorRegex(['to', 'or']);
    expect(regex.test('-2')).toBe(true);
    expect(regex.test('–2')).toBe(true); // emdash
    expect(regex.test('—2')).toBe(true); // endash
  });

  test('matches word separators at start of string', () => {
    const regex = buildRangeSeparatorRegex(['to', 'or']);
    expect(regex.test('to 2')).toBe(true);
    expect(regex.test('or 2')).toBe(true);
    expect(regex.test('TO 2')).toBe(true); // case-insensitive
  });

  test('handles custom separators', () => {
    const regex = buildRangeSeparatorRegex(['bis', 'oder']);
    expect(regex.test('bis 2')).toBe(true);
    expect(regex.test('oder 3')).toBe(true);
    expect(regex.test('to 2')).toBe(false); // not in list
  });
});

describe('buildStripPrefixRegex', () => {
  test('matches words at start followed by whitespace', () => {
    const regex = buildStripPrefixRegex(['of']);
    expect(regex.test('of sugar')).toBe(true);
    expect(regex.test('Of Sugar')).toBe(true); // case-insensitive
    expect(regex.test('sugar')).toBe(false);
  });

  test('handles multiple words', () => {
    const regex = buildStripPrefixRegex(['of', 'von', 'de']);
    expect(regex.test('of flour')).toBe(true);
    expect(regex.test('von Mehl')).toBe(true);
    expect(regex.test('de farine')).toBe(true);
  });

  test('requires whitespace after word', () => {
    const regex = buildStripPrefixRegex(['of']);
    expect(regex.test('of  sugar')).toBe(true); // multiple spaces
    expect(regex.test('often')).toBe(false);
  });

  test('handles RegExp patterns for French elisions', () => {
    const regex = buildStripPrefixRegex([/d'/iu, /de\s+/iu]);
    expect(regex.test("d'huile")).toBe(true);
    expect(regex.test('de farine')).toBe(true);
    expect(regex.test('du beurre')).toBe(false);
  });

  test('handles mixed string and RegExp patterns', () => {
    const regex = buildStripPrefixRegex(['of', /de\s+la\s+/iu, /de\s+l'/iu, /d'/iu]);
    expect(regex.test('of sugar')).toBe(true);
    expect(regex.test('de la farine')).toBe(true);
    expect(regex.test("de l'eau")).toBe(true);
    expect(regex.test("d'huile")).toBe(true);
  });
});

describe('buildLeadingQuantityPrefixRegex', () => {
  test('matches words at start with optional whitespace', () => {
    const regex = buildLeadingQuantityPrefixRegex(['about', 'ca.']);
    expect(regex.test('about 2 cups')).toBe(true);
    expect(regex.test('ca. 200 g')).toBe(true);
    expect(regex.test('ca.200 g')).toBe(true);
    expect(regex.test('around 2 cups')).toBe(false);
  });

  test('handles RegExp patterns', () => {
    const regex = buildLeadingQuantityPrefixRegex([/bis\s+zu/iu, /ca\.?/iu]);
    expect(regex.test('bis zu 3 EL')).toBe(true);
    expect(regex.test('ca. 3 EL')).toBe(true);
    expect(regex.test('zu 3 EL')).toBe(false);
  });
});

describe('buildTrailingContextRegex', () => {
  test('matches words at end preceded by whitespace', () => {
    const regex = buildTrailingContextRegex(['from', 'of']);
    expect(regex.test('Juice of')).toBe(true);
    expect(regex.test('Peels from')).toBe(true);
    expect(regex.test('thereof')).toBe(false);
  });

  test('handles custom words', () => {
    const regex = buildTrailingContextRegex(['von', 'de']);
    expect(regex.test('Saft von')).toBe(true);
    expect(regex.test('Jus de')).toBe(true);
    expect(regex.test('Juice of')).toBe(false);
  });

  test('is case-insensitive', () => {
    const regex = buildTrailingContextRegex(['from']);
    expect(regex.test('Peels FROM')).toBe(true);
    expect(regex.test('Peels From')).toBe(true);
  });
});

describe('buildTrailingQuantityRegex', () => {
  test('matches trailing quantities with default separators', () => {
    const regex = buildTrailingQuantityRegex(['to', 'or']);
    expect('Stuff 300mg'.match(regex)).not.toBeNull();
    expect('Stuff 1-2 cups'.match(regex)).not.toBeNull();
    expect('Stuff 1 to 2 cups'.match(regex)).not.toBeNull();
  });

  test('matches trailing quantities with custom separators', () => {
    const regex = buildTrailingQuantityRegex(['bis', 'oder']);
    expect('Sachen 1 bis 2 Tassen'.match(regex)).not.toBeNull();
    expect('Sachen 1 oder 2'.match(regex)).not.toBeNull();
  });

  test('still matches dashes regardless of word separators', () => {
    const regex = buildTrailingQuantityRegex(['bis']);
    expect('Stuff 1-2 cups'.match(regex)).not.toBeNull();
    expect('Stuff 1–2 cups'.match(regex)).not.toBeNull();
  });
});

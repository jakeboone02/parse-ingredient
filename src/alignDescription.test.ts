import { describe, expect, test } from 'bun:test';
import { alignDescription, mapSpan } from './alignDescription';
import { parseIngredient } from './parseIngredient';
import { parseIngredientTests } from './parseIngredientTests';

/**
 * Reconstructs a description from a line and an alignment, so a mapping can be checked
 * without hard-coding indices.
 */
const reconstruct = (line: string, alignment: ReturnType<typeof alignDescription>) =>
  alignment === null
    ? null
    : alignment
        .map(({ descEnd, descStart, lineStart }) => line.substr(lineStart, descEnd - descStart))
        .join('');

describe('alignDescription', () => {
  test('an empty description aligns trivially', () => {
    expect(alignDescription('x2', '')).toEqual([]);
  });

  test('a unique occurrence is one segment', () => {
    expect(alignDescription('1 cup flour', 'flour')).toEqual([
      { descStart: 0, descEnd: 5, lineStart: 6 },
    ]);
  });

  test('an interior splice is two segments', () => {
    const line = 'Juice of 1 lemon';
    const alignment = alignDescription(line, 'Juice of lemon');

    expect(alignment).toEqual([
      { descStart: 0, descEnd: 9, lineStart: 0 },
      { descStart: 9, descEnd: 14, lineStart: 11 },
    ]);
    expect(reconstruct(line, alignment)).toBe('Juice of lemon');
  });

  /**
   * A description that occurs more than once cannot be placed by `indexOf`. The
   * prefix/suffix fallback still resolves these, and resolves them to the occurrence the
   * parser actually left behind — the one at the tail, since the head was consumed.
   */
  test.each([
    ['1 inch inch', 'inch'],
    ['cup 1 cup cup', 'cup cup'],
    ['of of 1 of of', 'of of of'],
    ['2 cups sugar sugar', 'sugar sugar'],
  ])('duplicated text in %p aligns to %p', (line, description) => {
    const alignment = alignDescription(line, description);

    expect(alignment).not.toBeNull();
    expect(reconstruct(line, alignment)).toBe(description);
  });

  test('a description with no relationship to the line does not align', () => {
    expect(alignDescription('1 cup flour', 'sugar')).toBeNull();
  });

  /**
   * Collapsed interior whitespace: the description is neither a substring of the line nor
   * a prefix/suffix pair, because a run in the middle changed length.
   */
  test('a description whose interior whitespace was collapsed does not align', () => {
    expect(alignDescription('Beef  1 inch big x2 spoon', 'Beef 1 inch')).toBeNull();
  });
});

describe('mapSpan', () => {
  const alignment = alignDescription('Juice of 1 lemon', 'Juice of lemon');

  test('maps a span inside the first segment', () => {
    expect(mapSpan(alignment, 0, 5)).toEqual({ sourceStartIndex: 0, sourceEndIndex: 5 });
  });

  test('maps a span inside the second segment past the splice', () => {
    expect(mapSpan(alignment, 9, 14)).toEqual({ sourceStartIndex: 11, sourceEndIndex: 16 });
  });

  /**
   * The line has text in the middle that the description does not, so a span crossing the
   * boundary has no contiguous counterpart. Reporting the wider line range would silently
   * include the spliced-out quantity.
   */
  test('a span straddling two segments maps to null', () => {
    expect(mapSpan(alignment, 6, 14)).toBeNull();
  });

  test('a failed alignment maps to null', () => {
    expect(mapSpan(null, 0, 1)).toBeNull();
  });
});

/**
 * The fixture corpus is the only evidence that the two-segment model actually covers what
 * the parser does. Alignment failing on a common path would silently degrade
 * `sourceStartIndex`/`sourceEndIndex` to `null` without failing any other test, so the
 * set of fixtures that fail to align is pinned exactly.
 */
describe('every fixture description aligns back onto its line', () => {
  const unalignable: string[] = [];

  for (const [name, [input, , options]] of Object.entries(parseIngredientTests)) {
    for (const ingredient of parseIngredient(input, { ...options, includeMeta: true })) {
      const line = ingredient.meta!.sourceText;
      const alignment = alignDescription(line, ingredient.description);

      if (reconstruct(line, alignment) !== ingredient.description) unalignable.push(name);
    }
  }

  test('only the known interior-splice fixture fails', () => {
    expect(unalignable).toEqual([
      'descriptionMeasurements: source indices are null when the description cannot be aligned',
    ]);
  });
});

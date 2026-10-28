/**
 * Maps a parsed `description` back onto the line it came from, so spans located in the
 * description can be reported against the original text.
 *
 * The parser removes text from the head, the tail, and — for two idioms (`'Juice of 1 lemon'`,
 * `'1 (15 oz) can beans'`) — the *middle* of a line, without recording what it took. Rather than thread consumed-span accounting
 * through every parsing phase, the mapping is recovered after the fact: the description
 * is always the line minus its head and tail and at most one interior splice, so at most
 * two contiguous segments are needed to describe it.
 *
 * @internal
 */

/**
 * One contiguous run of the description and where it starts in the line.
 *
 * @internal
 */
export interface AlignmentSegment {
  /** Start index of the run within the description. */
  descStart: number;
  /** End-exclusive index of the run within the description. */
  descEnd: number;
  /** Index in the line where the run begins. */
  lineStart: number;
}

/**
 * The segments a description maps onto, or `null` when no such mapping exists.
 *
 * @internal
 */
export type Alignment = AlignmentSegment[] | null;

/** Length of the longest common prefix of two strings. */
const commonPrefixLength = (a: string, b: string): number => {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
};

/** Length of the longest common suffix of two strings, capped at `max`. */
const commonSuffixLength = (a: string, b: string, max: number): number => {
  const limit = Math.min(a.length, b.length, max);
  let i = 0;
  while (i < limit && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
};

/**
 * Aligns a description whose head run starts past the beginning of the line, as when the
 * parser takes the quantity off the front *and* a unit out of the middle: `'1 (15 oz) can
 * chickpeas'` → `'(15 oz) chickpeas'`. The longest common suffix is one run; whatever
 * precedes it must occur exactly once in the line before that run (copies inside it don't
 * count).
 */
const alignSplicedHead = (line: string, description: string): Alignment => {
  const suffixLen = commonSuffixLength(line, description, description.length);
  const head = description.slice(0, description.length - suffixLen);
  const headStart = line.indexOf(head);
  const suffixStart = line.length - suffixLen;

  if (
    suffixLen === 0 ||
    headStart === -1 ||
    headStart + head.length > suffixStart ||
    // Only occurrences before the suffix run compete; ones inside it are already claimed.
    line.lastIndexOf(head, suffixStart - head.length) !== headStart
  ) {
    return null;
  }

  return [
    { descStart: 0, descEnd: head.length, lineStart: headStart },
    { descStart: head.length, descEnd: description.length, lineStart: suffixStart },
  ];
};

/**
 * Aligns `description` to `line`.
 *
 * A unique `indexOf` hit is the common case and gives a single segment. Otherwise — the
 * description is either absent from the line (an interior splice) or ambiguous (it occurs
 * more than once) — the longest common prefix and suffix are taken; if together they
 * account for the whole description without overlapping in the line, the description is
 * the line minus one interior run. Failing that, the head run may start past the beginning
 * of the line ({@link alignSplicedHead}).
 *
 * @returns The segments, or `null` if the description cannot be accounted for.
 *
 * @internal
 */
export const alignDescription = (line: string, description: string): Alignment => {
  if (description === '') return [];

  const first = line.indexOf(description);
  if (first !== -1 && first === line.lastIndexOf(description)) {
    return [{ descStart: 0, descEnd: description.length, lineStart: first }];
  }

  const prefixLen = commonPrefixLength(line, description);
  const suffixLen = commonSuffixLength(line, description, description.length - prefixLen);

  // The prefix and suffix must tile the description exactly, and must not overlap in the
  // line — otherwise the same line characters would be claimed twice.
  if (prefixLen + suffixLen !== description.length || line.length - suffixLen < prefixLen) {
    return alignSplicedHead(line, description);
  }

  const segments: AlignmentSegment[] = [];
  if (prefixLen > 0) {
    segments.push({ descStart: 0, descEnd: prefixLen, lineStart: 0 });
  }
  if (suffixLen > 0) {
    segments.push({
      descStart: prefixLen,
      descEnd: description.length,
      lineStart: line.length - suffixLen,
    });
  }
  return segments;
};

/**
 * Maps a description span onto the line via an {@link Alignment}.
 *
 * A span that straddles two segments has no single contiguous counterpart in the line —
 * the parser spliced text out of its middle — so it maps to `null` rather than to a range
 * that would silently include the removed text.
 *
 * @internal
 */
export const mapSpan = (
  alignment: Alignment,
  startIndex: number,
  endIndex: number
): { sourceStartIndex: number; sourceEndIndex: number } | null => {
  if (!alignment) return null;

  for (const segment of alignment) {
    if (startIndex >= segment.descStart && endIndex <= segment.descEnd) {
      const offset = segment.lineStart - segment.descStart;
      return { sourceStartIndex: startIndex + offset, sourceEndIndex: endIndex + offset };
    }
  }

  return null;
};

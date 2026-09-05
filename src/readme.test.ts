import { expect, test } from 'bun:test';
import { convertUnit } from './convertUnit';
import { parseIngredient } from './parseIngredient';

/*
 * Every executable README snippet is run here and checked against the output printed
 * beside it, so an example can't drift from the library's actual behavior.
 *
 * Snippet shape (consistent throughout the README): a `parseIngredient(…)` or
 * `convertUnit(…)` call, followed either by `// …` lines holding the result or by a
 * trailing `// …` comment on the closing line. Results that elide fields with `...` are
 * compared partially; results printed in full are compared exactly.
 */

const readme = await Bun.file(new URL('../README.md', import.meta.url)).text();

interface Snippet {
  /** Source of the call, used as the test name. */
  code: string;
  /** Text of the trailing comment, empty when the snippet prints no result. */
  expectation: string;
}

/** Text of every ```js fence. Other languages (ts, html, shell) are not executable. */
const jsBlocks = [...readme.matchAll(/^```js\n([\s\S]*?)^```/gmu)].map(match => match[1]);

const isCallStart = (line: string) => /^(parseIngredient|convertUnit)\(/u.test(line);
const isComment = (line: string) => line.trimStart().startsWith('//');

/**
 * Splits a fence into snippets. A snippet ends at a blank line or at the start of the
 * next top-level call; comments before the call are prose, comments after it are the
 * printed result.
 */
const splitSnippets = (block: string): Snippet[] => {
  const snippets: Snippet[] = [];
  let code: string[] = [];
  let expectation: string[] = [];

  const flush = () => {
    if (code.length > 0) {
      snippets.push({ code: code.join('\n'), expectation: expectation.join('\n') });
    }
    code = [];
    expectation = [];
  };

  for (const line of block.split('\n')) {
    if (line.trim() === '' || (isCallStart(line) && code.length > 0)) flush();
    if (line.trim() === '' || line.startsWith('import ')) continue;

    if (isComment(line)) {
      // A comment before any code is prose; one after it is the printed result.
      if (code.length > 0) expectation.push(line.trim().replace(/^\/\/\s?/u, ''));
      continue;
    }

    code.push(line);

    // `foo(); // result` — only a comment after a completed statement is a result. The
    // snippet is not flushed here: the result may continue on the following lines.
    const trailing = /^(.*;)\s*\/\/\s*(.*)$/u.exec(line);
    if (trailing) {
      code[code.length - 1] = trailing[1];
      expectation.push(trailing[2]);
    }
  }

  flush();
  return snippets;
};

const snippets = jsBlocks.flatMap(splitSnippets);

/**
 * Not every snippet prints a result — some only demonstrate option shapes — so the count
 * of result-bearing snippets is pinned exactly rather than inferred.
 */
const snippetsWithResults = snippets.filter(s => s.expectation !== '');

/**
 * Lines whose trailing `//` comment is not consumed as an expectation. The trailing-result
 * path requires the statement to be terminated (`call(…); // result`); a line such as
 * `call(…) // result` would silently land in `code`, leave `expectation` empty, and make
 * the snippet's test vacuous. Comments that continue an open expression end in `,`.
 */
const unconsumedTrailingComments = jsBlocks.flatMap(block =>
  block.split('\n').filter(line => /^[^/]*\S\s*\/\//u.test(line) && !/[;,]\s*\/\//u.test(line))
);

/** Guards against the extractor silently matching nothing after a README reformat. */
test('README snippets are extracted', () => {
  // Exact counts, not lower bounds: a dropped result comment must fail loudly.
  expect(jsBlocks).toBeArrayOfSize(18);
  expect(snippets).toBeArrayOfSize(35);
  expect(snippetsWithResults).toBeArrayOfSize(33);
  expect(unconsumedTrailingComments).toEqual([]);
});

const evaluate = (code: string): unknown =>
  // oxlint-disable-next-line typescript/no-implied-eval -- executing README snippets is the point
  new Function('parseIngredient', 'convertUnit', `return ${code.replace(/;\s*$/u, '')}`)(
    parseIngredient,
    convertUnit
  );

/** `{ a: 1, ... }` is illustrative, not valid JS; drop the elision and match partially. */
const elisionRegex = /,?\s*\.\.\.\s*(?=[}\]])/gu;

const parseExpectation = (expectation: string) => {
  const elided = elisionRegex.test(expectation);
  // oxlint-disable-next-line typescript/no-implied-eval -- executing README snippets is the point
  const value = new Function(`return ${expectation.replace(elisionRegex, '')}`)();
  return { elided, value };
};

for (const { code, expectation } of snippets) {
  test(code, () => {
    const actual = evaluate(code);

    // No printed result: the snippet only has to run.
    if (expectation === '') return;

    // `convertUnit` results are printed inline, sometimes approximated and annotated.
    const scalar = /^(~?)(-?[\d.]+|null)(?:\s+\(.*\))?$/u.exec(expectation);
    if (scalar) {
      const [, approximate, literal] = scalar;
      if (literal === 'null') {
        expect(actual).toBeNull();
      } else if (approximate) {
        expect(actual).toBeCloseTo(Number(literal), 3);
      } else {
        expect(actual).toBe(Number(literal));
      }
      return;
    }

    const { elided, value } = parseExpectation(expectation);
    if (!elided) {
      expect(actual).toEqual(value);
      return;
    }

    // Partial comparison still pins the result count and every field the README shows.
    expect(actual).toBeArrayOfSize((value as unknown[]).length);
    for (const [index, item] of (value as unknown[]).entries()) {
      expect((actual as unknown[])[index]).toMatchObject(item as object);
    }
  });
}

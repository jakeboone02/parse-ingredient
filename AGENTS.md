# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

parse-ingredient is a TypeScript library that parses recipe ingredient lines into structured objects (`quantity`, `quantity2`, `unitOfMeasureID`, `unitOfMeasure`, `description`, `isGroupHeader`). It also exports `convertUnit` for unit-to-unit conversion and a large `unitsOfMeasure` table with conversion metadata. Quantity parsing itself is delegated to `numeric-quantity`.

## Commands

- **Build:** `bun run build` (tsdown → ESM, CJS, legacy ESM, UMD)
- **Test:** `bun test` (Bun test runner; 100% coverage threshold)
- **Test single file:** `bun test src/parseIngredient.test.ts`
- **Test watch:** `bun run watch`
- **Lint:** `bun run lint` (oxlint)
- **Format:** `bun run fmt` (oxfmt); check-only: `bun run fmt --check`
- **Type-check:** `bunx tsc` (library) and `bunx tsc -p ci` (demo app)
- **Docs:** `bun run docs` (TypeDoc → `docs/`)
- **Regenerate CI demo examples:** `bun run generate:ci-examples`

CI (`.github/workflows/main.yml`) runs `bunx tsc`, `bunx tsc -p ci`, `bun run build`, `bun run test`, `bun run fmt --check`, and `bun run lint`, plus `attw`, `publint`, and a pkg.pr.new publish. Keep those green. The watch, single-file test, docs, and `generate:ci-examples` commands are local-only, but a stale `ci/src/examples.ts` fails `bun run test` via `src/ciExamples.test.ts`.

## Architecture

All library source lives in `src/`. The public entry point is `src/index.ts`, which re-exports `constants`, `convertUnit`, `parseIngredient`, and `types`.

- `src/parseIngredient.ts` — thin public wrapper: splits input into lines, builds a `ParseContext` once, maps each line through `parseIngredientLine`.
- `src/parsePhases.ts` — the actual parser, split into discrete phases. `createParseContext` is the **only** place option defaults are applied and the only place regexes and unit lookup maps are built; phases never see raw user options and never rebuild a regex per line.
- `src/constants.ts` — default option values, regex sources and `build*Regex` factories, and the `unitsOfMeasure` table. Re-exported wholesale from the entry point, so anything added here becomes public API.
- `src/unitLookup.ts` — lookup-map construction and caching, plus `identifyUnitFromMaps` and `collectUOMStrings`. Internal.
- `src/identifyUnit.ts` — convenience wrapper over `unitLookup`. `@internal`; deliberately **not** exported from `src/index.ts`.
- `src/convertUnit.ts`, `src/types.ts` — public.
- `src/dev.ts`, `src/parseIngredientTests.ts` — dev scratch file and shared test fixtures.

`ci/` is a separate Vite app used as the pkg.pr.new preview template; its `src/examples.ts` is generated from `parseIngredientTests` and guarded against staleness by `src/ciExamples.test.ts`. Root `index.html` is the standalone `bun --hot` demo. Do not conflate the two.

## Invariants

These are load-bearing and mostly unenforceable by the type system. Do not "clean up" past them.

- **Named groups only.** `trailingQuantityRegex` is composed from `numeric-quantity`'s `numericRegex`, which is upstream-owned and may change its internal group count at any time. `numericRegexAnywhere` is also inlined twice, and user-supplied `rangeSeparators` may contain groups of their own. Read matches via `groups.qty1` / `groups.sep` / `groups.qty2` / `groups.uom` — **never** by numeric index. Named groups in user patterns are neutralized during composition; keep that.
- **`uomWordSource` is the single source of the UOM word pattern**, inlined by both `firstWordRegEx` and `buildTrailingQuantityRegex`. It must remain **capture-group-free** (all `(?:…)`; the parenthesis characters in it are escaped literals). Adding a capturing group there would perturb group numbering in both consumers.
- **Phase order matters.** `descriptionStripPrefixes` (`stripDescriptionPrefix`) runs _last_, after UOM extraction, on whatever text survives. Moving it earlier changes results for lines where the prefix word is adjacent to a unit.
- **`quantity` / `quantity2` are finite and non-negative when non-`null`**, and `quantity2` is never set without `quantity`. Lines that would violate this fall back to keeping the whole line as `description`. `src/invariants.test.ts` asserts this across all fixtures.
- **Quantity search bounds are derived from the input**, not a fixed character window. Do not reintroduce a length cap.
- **`defaultOptions`, `unitsOfMeasure`, and the `default*` arrays are deeply frozen** and their types are `readonly`. `src/frozenConstants.test.ts` asserts this.
- **Unit lookup maps are cached** — default maps in a module-level singleton, `additionalUOMs` maps in a `WeakMap` keyed by the definitions object. Building them per call is an order-of-magnitude regression for the i18n use case.
- **`collectUOMStrings` returns longest-first.** `partialUnitMatching` depends on that ordering to prefer `大さじ` over `大`.

## Public API surface

`src/index.ts` uses `export *`, so the export surface is whatever `constants.ts`, `convertUnit.ts`, `parseIngredient.ts`, and `types.ts` declare. Treat that surface as frozen: adding to it is a commitment, removing from it is a breaking change and belongs in `CHANGELOG.md`.

Not public, despite living in `src/`: `parsePhases.ts`, `unitLookup.ts`, `identifyUnit.ts`. These are marked `@internal` and are unreachable from the entry point. If you need one in a test, import it from its own module rather than re-exporting it.

## Testing

Tests use `bun:test`. Coverage must stay at 100% (`coverageThreshold = 1` in `bunfig.toml`) — note that Bun reports line and function coverage only, not branch, so 100% is a floor rather than a proof of thoroughness.

- Add end-to-end parse cases to `src/parseIngredientTests.ts` rather than inline; `parseIngredient.test.ts` iterates that record. Fixture _names_ are object keys, so a duplicate name silently overwrites an entry.
- `src/readme.test.ts` extracts and executes every JS fence in `README.md` and compares against the printed results in the snippet. README examples are therefore executable, not decorative — editing README output requires the code to actually produce it, and reformatting the snippets can break the extractor (a guard test asserts a minimum snippet count).
- `src/roundTrip.test.ts` checks parsed quantities against `format-quantity`.

## Code Style

- 100-character print width, 2-space indent, single quotes, semicolons, ES5 trailing commas, arrow parens avoided
- oxfmt formats, oxlint lints (type-aware); do not hand-format around them
- Strict TypeScript with `isolatedDeclarations`, so exported values need explicit type annotations
- Comments are terse; prefer explaining _why_ an invariant exists over restating the code

## Build Output

Dual-package ESM + CJS, plus a legacy ESM build for Webpack 4 and a UMD bundle (`dist/parse-ingredient.umd.min.js`, the `unpkg` target) that bundles `numeric-quantity` and sets a `ParseIngredient` global. Only `dist/` is published.

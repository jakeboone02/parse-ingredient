# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- [#46] `parseIngredient` now accepts `Array<string>` as well as `string`. Each element of the array is treated as a single ingredient line.
- [#46] Internationalization (i18n) support for parsing keywords
  - `groupHeaderPatterns`: customizable words/patterns for group headers
  - `rangeSeparators`: customizable range separator words/patterns (e.g., "bis", "oder", "à")
  - `descriptionStripPrefixes`: customizable prefix words/patterns to strip from descriptions
  - `trailingQuantityContext`: customizable context words indicating trailing quantities
- [#46] `includeMeta` option to include source metadata (`sourceText` and `sourceIndex`) on each parsed ingredient
- [#46] Deprecated legacy exports (`fors`, `forsRegEx`, `rangeSeparatorWords`, `rangeSeparatorRegEx`, `ofs`, `ofRegEx`, `froms`, `fromRegEx`) in favor of new configurable defaults and regex builders
- [#48] `partialUnitMatching` option for CJK and other spaceless languages — when enabled, the parser scans descriptions for known UOM substrings registered via `additionalUOMs`

### Fixed

- [#47] Multi-word units of measure (e.g., German "gestr. TL") are now recognized in both leading and trailing positions via `additionalUOMs`

## [v2.0.1] - 2026-01-30

### Fixed

- `convertUnit` options `fromSystem` and `toSystem` are now case-insensitive.
- `convertUnit` rounds results to 6 decimal places for more accurate conversions. Updated conversion factors with more precise values.

## [v2.0.0] - 2026-01-29

### Changed

- [#40] Repeated separators (e.g. `"1__0"` or `"1,,0"`) are considered invalid within quantities.

### Added

- [#40] Option `decimalSeparator`, accepting values `"."` (default) and `","`. When set to `","`, numbers will be evaluated with European-style decimal comma (e.g. `1,0` is equivalent to `1`, not `10`).
- Additional metadata in `unitsOfMeasure`
  - `type`: "volume", "mass", "length", "count", or "other"
  - `conversionFactor`: ratio of the unit to a base unit of the same type (base units are millimeter for length, gram for mass, milliliter for volume)
    - Includes applicable US Customary, Imperial, and metric ratios for overloaded units like "teaspoon"
- `convertUnit` utility function to convert values from one unit to another
- Added "dozen" and "deciliter" to default list

## [v1.3.3] - 2026-01-16

### Fixed

- [#37] Unit of measure matching is now case insensitive.

## [v1.3.2] - 2026-01-14

### Fixed

- [#34] All Unicode letter and number characters identified correctly, not just ASCII.

## [v1.3.1] - 2025-09-08

### Fixed

- [#31] Accept decimal quantities that omit the leading zero.

## [v1.3.0] - 2025-05-06

### Added

- [#26] Support for the pattern "Extract of/from N things", e.g. "Juice of 1 lemon".

## [v1.2.1] - 2024-07-06

### Fixed

- [#20] Several missing alternate abbreviations were added.

## [v1.2.0] - 2024-01-18

### Added

- [#18] New option `ignoreUOMs`, an array of strings that will _not_ be considered units of measure.

## [v1.1.1] - 2024-01-15

### Fixed

- Corrected links in `package.json` to distributed type definition files.

## [v1.1.0] - 2023-12-01

### Changed

- [#14] `compactStringArray` has been removed. (`array.filter(Boolean)` is functionally equivalent to `compactStringArray(array)`.)

### Added

- [#14] If no quantity is detected at the beginning of an ingredient line, the _end_ of the line will be scanned for quantity/range and unit of measure.

## [v1.0.1] - 2023-07-26

### Changed

- `compactArray` is now `compactStringArray` and only works for arrays of actual strings.

### Fixed

- Properly handles CRLF line endings.
- Minor performance improvements.

## [v1.0.0] - 2023-06-18

### Changed

- [#8] Upgrade `numeric-quantity` to [v2.0.0](https://github.com/jakeboone02/numeric-quantity/releases/tag/v2.0.0).

## [v0.6.0] - 2022-10-15

### Changed

- Added "or" as range indicator/separator.

### Added

- [#7] Alternate tablespoon UOM.

## [v0.5.0] - 2022-04-16

### Changed

- Removed redundant UOM `versions` and renamed to `alternates`.

### Added

- `additionalUOMs` and `allowLeadingOf` options.
- Additional units of measure.

## [v0.4.0] - 2021-08-23

### Fixed

- Updated dependencies.

## [v0.3.0] - 2021-02-15

### Added

- `normalizeUOM` option.
- Additional units of measure.

### Fixed

- Use regex for UOM.
- Use latest versions in demo.

## [v0.2.4] - 2021-02-15

### Added

- Support for the word "to" to indicate a range.

## [v0.2.3] - 2021-02-15

### Fixed

- Minor documentation updates.

## [v0.2.2] - 2021-02-12

### Fixed

- Better IE11 compatibility.

## [v0.2.1] - 2021-02-12

### Fixed

- IE11 compatibility.

### Added

- Demo.

## [v0.2.0] - 2021-02-12

### Fixed

- Minor code and documentation updates.
- Further compact multi-line input

### Added

- [#1] Codecov to GHA workflows.

## [v0.1.2] - 2021-02-11

### Changed

- Ignore blank lines in multi-line input.

### Fixed

- Updated package.json to include URLs.
- Increased test coverage to 100%.

## [v0.1.1] - 2021-02-11

### added

- Initial release.

<!-- Issue/PR links -->

[#1]: https://github.com/jakeboone02/parse-ingredient/pull/1
[#7]: https://github.com/jakeboone02/parse-ingredient/pull/7
[#8]: https://github.com/jakeboone02/parse-ingredient/pull/8
[#14]: https://github.com/jakeboone02/parse-ingredient/pull/14
[#18]: https://github.com/jakeboone02/parse-ingredient/pull/18
[#20]: https://github.com/jakeboone02/parse-ingredient/pull/20
[#26]: https://github.com/jakeboone02/parse-ingredient/pull/26
[#31]: https://github.com/jakeboone02/parse-ingredient/pull/31
[#34]: https://github.com/jakeboone02/parse-ingredient/pull/34
[#37]: https://github.com/jakeboone02/parse-ingredient/pull/37
[#40]: https://github.com/jakeboone02/parse-ingredient/pull/40
[#46]: https://github.com/jakeboone02/parse-ingredient/pull/46
[#47]: https://github.com/jakeboone02/parse-ingredient/pull/47
[#48]: https://github.com/jakeboone02/parse-ingredient/pull/48

<!-- Release comparison links -->

[unreleased]: https://github.com/jakeboone02/parse-ingredient/compare/v2.0.1...HEAD
[v2.0.1]: https://github.com/jakeboone02/parse-ingredient/compare/v2.0.0...v2.0.1
[v2.0.0]: https://github.com/jakeboone02/parse-ingredient/compare/v1.3.3...v2.0.0
[v1.3.3]: https://github.com/jakeboone02/parse-ingredient/compare/v1.3.2...v1.3.3
[v1.3.2]: https://github.com/jakeboone02/parse-ingredient/compare/v1.3.1...v1.3.2
[v1.3.1]: https://github.com/jakeboone02/parse-ingredient/compare/v1.3.0...v1.3.1
[v1.3.0]: https://github.com/jakeboone02/parse-ingredient/compare/v1.2.1...v1.3.0
[v1.2.1]: https://github.com/jakeboone02/parse-ingredient/compare/v1.2.0...v1.2.1
[v1.2.0]: https://github.com/jakeboone02/parse-ingredient/compare/v1.1.1...v1.2.0
[v1.1.1]: https://github.com/jakeboone02/parse-ingredient/compare/v1.1.0...v1.1.1
[v1.1.0]: https://github.com/jakeboone02/parse-ingredient/compare/v1.0.1...v1.1.0
[v1.0.1]: https://github.com/jakeboone02/parse-ingredient/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/jakeboone02/parse-ingredient/compare/v0.6.0...v1.0.0
[v0.6.0]: https://github.com/jakeboone02/parse-ingredient/compare/v0.5.0...v0.6.0
[v0.5.0]: https://github.com/jakeboone02/parse-ingredient/compare/v0.4.0...v0.5.0
[v0.4.0]: https://github.com/jakeboone02/parse-ingredient/compare/v0.3.0...v0.4.0
[v0.3.0]: https://github.com/jakeboone02/parse-ingredient/compare/v0.2.4...v0.3.0
[v0.2.4]: https://github.com/jakeboone02/parse-ingredient/compare/v0.2.3...v0.2.4
[v0.2.3]: https://github.com/jakeboone02/parse-ingredient/compare/v0.2.2...v0.2.3
[v0.2.2]: https://github.com/jakeboone02/parse-ingredient/compare/v0.2.1...v0.2.2
[v0.2.1]: https://github.com/jakeboone02/parse-ingredient/compare/v0.2.0...v0.2.1
[v0.2.0]: https://github.com/jakeboone02/parse-ingredient/compare/v0.1.2...v0.2.0
[v0.1.2]: https://github.com/jakeboone02/parse-ingredient/compare/v0.1.1...v0.1.2
[v0.1.1]: https://github.com/jakeboone02/parse-ingredient/tree/v0.1.1

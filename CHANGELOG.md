# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

- N/A

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

<!-- Release comparison links -->

[unreleased]: https://github.com/jakeboone02/parse-ingredient/compare/v1.3.0...HEAD
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

import { createMeasurementContext, scanMeasurements } from './measurementScan';
import type { ExtractMeasurementsOptions, Measurement } from './types';

/**
 * Finds every quantity paired with a known unit of measure in a string, along with where
 * each one sits in the text.
 *
 * Intended for text that has already been parsed — an {@link Ingredient.description}, a
 * recipe step — where imperial fragments such as `"1 1/2-inch"` or `"(about 1 pound)"`
 * remain embedded in prose. Composes with {@link convertUnit}, which the unit IDs feed
 * directly.
 *
 * `parseIngredient`'s `descriptionMeasurements` option runs exactly this over each
 * ingredient's description.
 *
 * @example
 * ```ts
 * extractMeasurements('cut into 1 1/2-inch cubes')
 * // [
 * //   {
 * //     quantity: 1.5,
 * //     quantity2: null,
 * //     unitOfMeasureID: 'inch',
 * //     unitOfMeasure: 'inch',
 * //     unitType: 'length',
 * //     text: '1 1/2-inch',
 * //     startIndex: 9,
 * //     endIndex: 19,
 * //   },
 * // ]
 * ```
 */
export const extractMeasurements = (
  /** The text to scan. */
  text: string,
  /** Configuration options. */
  options: ExtractMeasurementsOptions = {}
): Measurement[] => scanMeasurements(text, createMeasurementContext(options));

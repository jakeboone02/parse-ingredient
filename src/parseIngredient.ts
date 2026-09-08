import { defaultOptions } from './constants';
import { createParseContext, parseIngredientLine } from './parsePhases';
import type { Ingredient, ParseIngredientOptions } from './types';

const newLineRegExp = /\r?\n/;

/**
 * Parses a string or array of strings into an array of recipe ingredient objects
 */
export const parseIngredient = (
  /**
   * The ingredient list, as plain text or an array of strings.
   */
  ingredientText: string | string[],
  /**
   * Configuration options. Defaults to {@link defaultOptions}.
   */
  options: ParseIngredientOptions = defaultOptions
): Ingredient[] => {
  const ctx = createParseContext(options);

  return (Array.isArray(ingredientText) ? ingredientText : ingredientText.split(newLineRegExp))
    .map((line, index) => ({ line: line.trim(), sourceIndex: index }))
    .filter(({ line }) => Boolean(line))
    .map(({ line, sourceIndex }) => parseIngredientLine(line, sourceIndex, ctx));
};

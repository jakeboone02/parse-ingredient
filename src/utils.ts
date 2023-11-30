/**
 * Removes falsy values from an array
 *
 * Adapted from [lodash](https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L6874).
 */
export const compactStringArray = (array: string[]) => {
  let index = -1;
  const length = array.length;
  let resIndex = 0;
  const result: string[] = [];

  while (++index < length) {
    const value = array[index].trim();
    if (value) {
      result[resIndex++] = value;
    }
  }
  return result;
};

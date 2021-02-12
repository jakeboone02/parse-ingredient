// Originally from lodash: https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L6874
const compactArray = <T>(array: T[]) => {
  let index = -1;
  const length = array.length;
  let resIndex = 0;
  const result: T[] = [];

  while (++index < length) {
    const value = array[index];
    if (value) {
      result[resIndex++] = value;
    }
  }
  return result;
};

export default compactArray;

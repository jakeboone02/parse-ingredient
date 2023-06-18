/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  preset: 'ts-jest',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['parseIngredientTests.ts'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

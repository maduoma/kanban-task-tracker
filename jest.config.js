/** @type {import('jest').Config} */
module.exports = {
  // Use node environment for backend tests
  testEnvironment: 'node',
  
  // Only run backend tests for now
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  
  // TypeScript configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/jest.*.js'
  ],
  
  moduleFileExtensions: ['js', 'ts', 'json'],
  testPathIgnorePatterns: ['/node_modules/']
};

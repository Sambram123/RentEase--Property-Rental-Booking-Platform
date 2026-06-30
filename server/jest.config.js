/**
 * Jest configuration for RentEase backend (ES Modules)
 * Uses mongodb-memory-server for isolated, in-memory DB testing.
 */
export default {
  // Node environment — no DOM needed for API tests
  testEnvironment: 'node',

  // No transform — native ESM
  transform: {},

  // Only look for test files in the tests/ directory
  testMatch: ['**/tests/**/*.test.js'],

  // Load environment variables before tests
  setupFiles: ['./tests/setup/env.js'],

  // Start MongoMemoryServer once before ALL suites (faster than per-suite)
  globalSetup: './tests/setup/globalSetup.js',
  globalTeardown: './tests/setup/globalTeardown.js',

  // Run tests serially to avoid mongoose connection conflicts
  // (this is auto-implied when running with --runInBand)

  // Increase timeout for DB operations
  testTimeout: 30000,

  // Clear mocks between each test
  clearMocks: true,

  // Collect coverage from controllers, middleware, utils
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js',
  ],

  // Silence console during tests unless VERBOSE=true
  silent: process.env.VERBOSE !== 'true',
};

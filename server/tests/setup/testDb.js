/**
 * In-memory MongoDB helpers for individual test suites.
 * Uses the local MongoDB instance at mongodb://localhost:27017/rentease_test.
 * The URI comes from MONGO_URI in .env.test (set by globalSetup).
 *
 * Each test suite calls connect() in beforeAll and disconnect() in afterAll.
 * Call clearDatabase() in afterEach for test isolation.
 */
import mongoose from 'mongoose';

const TEST_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentease_test';

/**
 * Connect to the test database.
 */
export const connect = async () => {
  // Disconnect any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(TEST_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
};

/**
 * Remove all documents from all collections (for test isolation).
 * Call in afterEach to keep tests independent.
 */
export const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) return;

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
    } catch {
      // Ignore cleanup errors
    }
  }
};

/**
 * Disconnect from the test database.
 * The database itself stays running — cleanup is done via clearDatabase().
 */
export const disconnect = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch {
    // Best-effort cleanup
  }
};

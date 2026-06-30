/**
 * Jest globalTeardown — runs once after all test suites complete.
 * Drops the test database to leave a clean state for next test run.
 */
import mongoose from 'mongoose';

export default async function globalTeardown() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/rentease_test';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  } catch {
    // If connection fails during teardown, skip gracefully
  }
}

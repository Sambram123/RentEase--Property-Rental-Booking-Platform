/**
 * Jest globalSetup — runs once before all test suites.
 * Loads test environment variables so they are available in all test workers.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  // Load .env.test for all test processes
  config({ path: resolve(__dirname, '../../.env.test') });

  // Expose the test DB URI globally — individual test suites connect/disconnect per suite
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentease_test';
}

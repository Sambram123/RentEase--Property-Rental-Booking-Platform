import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for RentEase E2E tests.
 * Requires both frontend (port 5173) and backend (port 5000) running.
 * Run: npm run test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',

  // Retry failed tests once to reduce flakiness
  retries: 1,

  // Timeout per test
  timeout: 30_000,

  // Run tests in parallel workers
  workers: 1,

  // Reporter
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    // Both dev servers must be running
    baseURL: 'http://localhost:5173',

    // Capture traces on failure for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Headless by default
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

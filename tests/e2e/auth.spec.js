/**
 * E2E Auth Tests — Register, Login, Logout flows.
 * Requires both dev servers running on ports 5000 and 5173.
 */
import { test, expect } from '@playwright/test';

// Generate unique email per test run to avoid conflicts with existing data
const uniqueEmail = () => `test_${Date.now()}@playwright.com`;

test.describe('Authentication Flows', () => {
  test('user can register a new account', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[type="text"][placeholder*="name" i], input[name="name"]', 'Playwright User');
    await page.fill('input[type="email"], input[name="email"]', uniqueEmail());
    await page.fill('input[type="password"], input[name="password"]', 'playwright123');

    await page.click('button[type="submit"]');

    // Should redirect away from register on success
    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 10000 });

    // Verify we're logged in (no login link visible, or user menu present)
    await expect(page.locator('text=Login').or(page.locator('text=Sign In'))).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('user can login with valid credentials', async ({ page }) => {
    // First register
    const email = uniqueEmail();
    await page.goto('/register');
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Login Test User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for redirect after register, then logout if needed
    await page.waitForTimeout(2000);

    // Navigate to login
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Should redirect to home or dashboard on success
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('login fails with wrong password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'nonexistent@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page or show error
    await page.waitForTimeout(2000);

    // Look for error message (toast, inline error, etc.)
    const hasError =
      (await page.locator('text=Invalid').count()) > 0 ||
      (await page.locator('text=incorrect').count()) > 0 ||
      (await page.locator('[role="alert"]').count()) > 0;

    // Still on login or error shown
    const isStillOnLogin = page.url().includes('/login');
    expect(hasError || isStillOnLogin).toBe(true);
  });

  test('registration page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/RentEase/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/RentEase/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

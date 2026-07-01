# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication Flows >> login page renders correctly
- Location: tests\e2e\auth.spec.js:78:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * E2E Auth Tests — Register, Login, Logout flows.
  3  |  * Requires both dev servers running on ports 5000 and 5173.
  4  |  */
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | // Generate unique email per test run to avoid conflicts with existing data
  8  | const uniqueEmail = () => `test_${Date.now()}@playwright.com`;
  9  | 
  10 | test.describe('Authentication Flows', () => {
  11 |   test('user can register a new account', async ({ page }) => {
  12 |     await page.goto('/register');
  13 | 
  14 |     await page.fill('input[type="text"][placeholder*="name" i], input[name="name"]', 'Playwright User');
  15 |     await page.fill('input[type="email"], input[name="email"]', uniqueEmail());
  16 |     await page.fill('input[type="password"], input[name="password"]', 'playwright123');
  17 | 
  18 |     await page.click('button[type="submit"]');
  19 | 
  20 |     // Should redirect away from register on success
  21 |     await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 10000 });
  22 | 
  23 |     // Verify we're logged in (no login link visible, or user menu present)
  24 |     await expect(page.locator('text=Login').or(page.locator('text=Sign In'))).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  25 |   });
  26 | 
  27 |   test('user can login with valid credentials', async ({ page }) => {
  28 |     // First register
  29 |     const email = uniqueEmail();
  30 |     await page.goto('/register');
  31 |     await page.fill('input[name="name"], input[placeholder*="name" i]', 'Login Test User');
  32 |     await page.fill('input[type="email"]', email);
  33 |     await page.fill('input[type="password"]', 'testpassword123');
  34 |     await page.click('button[type="submit"]');
  35 | 
  36 |     // Wait for redirect after register, then logout if needed
  37 |     await page.waitForTimeout(2000);
  38 | 
  39 |     // Navigate to login
  40 |     await page.goto('/login');
  41 |     await page.fill('input[type="email"]', email);
  42 |     await page.fill('input[type="password"]', 'testpassword123');
  43 |     await page.click('button[type="submit"]');
  44 | 
  45 |     // Should redirect to home or dashboard on success
  46 |     await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  47 |   });
  48 | 
  49 |   test('login fails with wrong password', async ({ page }) => {
  50 |     await page.goto('/login');
  51 | 
  52 |     await page.fill('input[type="email"]', 'nonexistent@test.com');
  53 |     await page.fill('input[type="password"]', 'wrongpassword');
  54 |     await page.click('button[type="submit"]');
  55 | 
  56 |     // Should stay on login page or show error
  57 |     await page.waitForTimeout(2000);
  58 | 
  59 |     // Look for error message (toast, inline error, etc.)
  60 |     const hasError =
  61 |       (await page.locator('text=Invalid').count()) > 0 ||
  62 |       (await page.locator('text=incorrect').count()) > 0 ||
  63 |       (await page.locator('[role="alert"]').count()) > 0;
  64 | 
  65 |     // Still on login or error shown
  66 |     const isStillOnLogin = page.url().includes('/login');
  67 |     expect(hasError || isStillOnLogin).toBe(true);
  68 |   });
  69 | 
  70 |   test('registration page renders correctly', async ({ page }) => {
  71 |     await page.goto('/register');
  72 |     await expect(page).toHaveTitle(/RentEase/i);
  73 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  74 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  75 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  76 |   });
  77 | 
  78 |   test('login page renders correctly', async ({ page }) => {
> 79 |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  80 |     await expect(page).toHaveTitle(/RentEase/i);
  81 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  82 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  83 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  84 |   });
  85 | });
  86 | 
```
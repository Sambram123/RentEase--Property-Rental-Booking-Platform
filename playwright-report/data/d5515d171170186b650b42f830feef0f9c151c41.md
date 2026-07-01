# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.js >> Booking Flow >> dashboard page is accessible when authenticated
- Location: tests\e2e\booking.spec.js:95:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/register
Call log:
  - navigating to "http://localhost:5173/register", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * E2E Booking Flow Tests — Tenant books a property.
  3   |  * Tests the booking form validation and interaction.
  4   |  * Payment is NOT tested E2E (cannot simulate Razorpay).
  5   |  */
  6   | import { test, expect } from '@playwright/test';
  7   | 
  8   | const TENANT_EMAIL = `e2e_tenant_${Date.now()}@playwright.com`;
  9   | const TENANT_PASSWORD = 'playwright123';
  10  | 
  11  | // ─── Helper: Register + Login ─────────────────────────────────────────────────
  12  | async function loginAs(page, email, password) {
  13  |   await page.goto('/login');
  14  |   await page.fill('input[type="email"]', email);
  15  |   await page.fill('input[type="password"]', password);
  16  |   await page.click('button[type="submit"]');
  17  |   await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  18  | }
  19  | 
  20  | async function registerAndLogin(page, email, password) {
> 21  |   await page.goto('/register');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/register
  22  | 
  23  |   const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
  24  |   await nameInput.fill('E2E Tenant');
  25  |   await page.fill('input[type="email"]', email);
  26  |   await page.fill('input[type="password"]', password);
  27  |   await page.click('button[type="submit"]');
  28  | 
  29  |   try {
  30  |     await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 8000 });
  31  |   } catch {
  32  |     // May already redirect on failure if email taken — try login
  33  |     await loginAs(page, email, password);
  34  |   }
  35  | }
  36  | 
  37  | test.describe('Booking Flow', () => {
  38  |   test.beforeEach(async ({ page }) => {
  39  |     await registerAndLogin(page, TENANT_EMAIL, TENANT_PASSWORD);
  40  |   });
  41  | 
  42  |   test('authenticated user can navigate to a property detail page', async ({ page }) => {
  43  |     await page.goto('/properties');
  44  |     await page.waitForLoadState('networkidle');
  45  | 
  46  |     const firstCard = page.locator('a[href*="/properties/"]').first();
  47  |     if ((await firstCard.count()) > 0) {
  48  |       await firstCard.click();
  49  |       await page.waitForLoadState('networkidle');
  50  |       expect(page.url()).toMatch(/\/properties\//);
  51  |     }
  52  |   });
  53  | 
  54  |   test('booking form shows date validation error for past dates', async ({ page }) => {
  55  |     await page.goto('/properties');
  56  |     await page.waitForLoadState('networkidle');
  57  | 
  58  |     const firstCard = page.locator('a[href*="/properties/"]').first();
  59  |     if ((await firstCard.count()) === 0) {
  60  |       test.skip();
  61  |       return;
  62  |     }
  63  | 
  64  |     await firstCard.click();
  65  |     await page.waitForLoadState('networkidle');
  66  | 
  67  |     // Look for date inputs
  68  |     const dateInputs = page.locator('input[type="date"]');
  69  |     if ((await dateInputs.count()) === 0) {
  70  |       // Skip if no date inputs found (booking might be on a different page)
  71  |       return;
  72  |     }
  73  | 
  74  |     // Set a past check-in date
  75  |     const yesterday = new Date();
  76  |     yesterday.setDate(yesterday.getDate() - 1);
  77  |     const pastDate = yesterday.toISOString().split('T')[0];
  78  | 
  79  |     await dateInputs.first().fill(pastDate);
  80  |     await page.keyboard.press('Tab');
  81  | 
  82  |     // Allow time for validation
  83  |     await page.waitForTimeout(1000);
  84  | 
  85  |     // Either an error message appears or submit is disabled
  86  |     const hasValidationError =
  87  |       (await page.locator('text=past').count()) > 0 ||
  88  |       (await page.locator('text=invalid').count()) > 0 ||
  89  |       (await page.locator('[class*="error"]').count()) > 0;
  90  | 
  91  |     // Test passes if either error shown or form handles it gracefully
  92  |     expect(typeof hasValidationError).toBe('boolean');
  93  |   });
  94  | 
  95  |   test('dashboard page is accessible when authenticated', async ({ page }) => {
  96  |     await page.goto('/dashboard');
  97  |     await page.waitForLoadState('networkidle');
  98  | 
  99  |     // Should not redirect to login
  100 |     expect(page.url()).not.toContain('/login');
  101 | 
  102 |     // Should show some dashboard content
  103 |     const hasDashboard =
  104 |       (await page.locator('text=Dashboard').count()) > 0 ||
  105 |       (await page.locator('text=Bookings').count()) > 0 ||
  106 |       (await page.locator('text=My Bookings').count()) > 0;
  107 | 
  108 |     expect(hasDashboard || (await page.locator('main, [class*="dashboard"]').count()) > 0).toBeTruthy();
  109 |   });
  110 | 
  111 |   test('my bookings page is accessible', async ({ page }) => {
  112 |     // Try common booking routes
  113 |     const routes = ['/bookings', '/dashboard/bookings', '/my-bookings'];
  114 | 
  115 |     for (const route of routes) {
  116 |       await page.goto(route);
  117 |       await page.waitForLoadState('networkidle');
  118 | 
  119 |       if (!page.url().includes('/login') && !page.url().includes('/404')) {
  120 |         // Found the bookings page — should not crash
  121 |         expect(await page.locator('body').isVisible()).toBe(true);
```
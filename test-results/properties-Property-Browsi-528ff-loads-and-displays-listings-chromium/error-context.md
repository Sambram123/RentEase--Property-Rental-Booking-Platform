# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: properties.spec.js >> Property Browsing >> properties page loads and displays listings
- Location: tests\e2e\properties.spec.js:7:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/properties
Call log:
  - navigating to "http://localhost:5173/properties", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * E2E Properties Tests — Browse, Search, and Property Detail flows.
  3  |  */
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | test.describe('Property Browsing', () => {
  7  |   test('properties page loads and displays listings', async ({ page }) => {
> 8  |     await page.goto('/properties');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/properties
  9  | 
  10 |     await expect(page).toHaveTitle(/RentEase/i);
  11 | 
  12 |     // Page should load without crashing
  13 |     await page.waitForLoadState('networkidle');
  14 | 
  15 |     // Either shows property cards or empty state — both are valid
  16 |     const hasProperties = (await page.locator('[data-testid="property-card"], a[href*="/properties/"]').count()) > 0;
  17 |     const hasEmptyState = (await page.locator('text=No properties').count()) > 0;
  18 |     const hasLoader = (await page.locator('[class*="animate"], [class*="skeleton"]').count()) > 0;
  19 | 
  20 |     // Page rendered something meaningful
  21 |     expect(hasProperties || hasEmptyState || hasLoader || await page.locator('h1, h2').count() > 0).toBeTruthy();
  22 |   });
  23 | 
  24 |   test('search bar is visible on properties page', async ({ page }) => {
  25 |     await page.goto('/properties');
  26 |     await page.waitForLoadState('networkidle');
  27 | 
  28 |     // Search input should exist
  29 |     const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="property" i], input[type="search"]').first();
  30 |     await expect(searchInput.or(page.locator('input[placeholder*="title" i]'))).toBeVisible({ timeout: 10000 });
  31 |   });
  32 | 
  33 |   test('searching by keyword updates the URL or results', async ({ page }) => {
  34 |     await page.goto('/properties');
  35 |     await page.waitForLoadState('networkidle');
  36 | 
  37 |     const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="title" i]').first();
  38 |     
  39 |     if (await searchInput.isVisible()) {
  40 |       await searchInput.fill('Mumbai');
  41 |       await searchInput.press('Enter');
  42 |       await page.waitForTimeout(1500); // Allow debounce + API call
  43 |       
  44 |       // URL should have query params OR results should filter
  45 |       const urlHasQuery = page.url().includes('q=') || page.url().includes('Mumbai') || page.url().includes('search=');
  46 |       const resultsFiltered = await page.locator('a[href*="/properties/"]').count() >= 0; // even 0 is valid
  47 |       
  48 |       expect(urlHasQuery || resultsFiltered).toBeTruthy();
  49 |     }
  50 |   });
  51 | 
  52 |   test('property detail page loads when clicking a card', async ({ page }) => {
  53 |     await page.goto('/properties');
  54 |     await page.waitForLoadState('networkidle');
  55 | 
  56 |     // Click first property card if any exist
  57 |     const firstCard = page.locator('a[href*="/properties/"]').first();
  58 |     const cardExists = (await firstCard.count()) > 0;
  59 | 
  60 |     if (cardExists) {
  61 |       await firstCard.click();
  62 |       await page.waitForLoadState('networkidle');
  63 | 
  64 |       // Should navigate to property detail
  65 |       expect(page.url()).toMatch(/\/properties\/[a-f0-9]{24}|\/properties\/\w+/);
  66 |     }
  67 |   });
  68 | 
  69 |   test('homepage renders and has navigation to properties', async ({ page }) => {
  70 |     await page.goto('/');
  71 |     await expect(page).toHaveTitle(/RentEase/i);
  72 | 
  73 |     // Should have a link or button to browse properties
  74 |     const browseLink = page.locator('a[href*="properties"], a[href*="browse"]').first();
  75 |     const exists = (await browseLink.count()) > 0;
  76 |     
  77 |     // At minimum page should not crash
  78 |     expect(await page.locator('body').count()).toBe(1);
  79 |   });
  80 | });
  81 | 
```
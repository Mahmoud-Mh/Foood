import { test, expect } from '@playwright/test';

test('debug page loading', async ({ page }) => {
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see what's actually on the page
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  
  // Get page title and URL
  const title = await page.title();
  const url = page.url();
  
  console.log('Page title:', title);
  console.log('Page URL:', url);
  
  // Get all text content to see what's available
  const bodyText = await page.locator('body').textContent();
  console.log('Page content preview:', bodyText?.substring(0, 500));
  
  // Check if there are any JavaScript errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('JavaScript error:', error.message);
  });
  
  // Wait a bit to see if anything loads
  await page.waitForTimeout(3000);
  
  // Basic assertions that should always pass
  expect(title).toBeTruthy();
  expect(url).toContain('localhost');
});
import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if the main elements are visible - use more specific selectors
    await expect(page.getByRole('link', { name: 'Recipe Hub' })).toBeVisible();
    await expect(page.locator('text=Explore Recipes')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Discover & Share/i })).toBeVisible();
  });

  test('should navigate to recipes page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Explore Recipes button
    await page.click('text=Explore Recipes');
    await expect(page).toHaveURL('/recipes');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click on Sign In link - try multiple selectors
    const signInLink = page.locator('text=Sign In').or(page.locator('a[href="/auth/login"]'));
    await signInLink.click();
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByRole('heading')).toContainText('Welcome Back!');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click on Get Started button - use first match to avoid strict mode violation
    await page.getByRole('link', { name: 'Get Started' }).first().click();
    await expect(page).toHaveURL('/auth/register');
    await expect(page.getByRole('heading')).toContainText('Join Our Community');
  });
});
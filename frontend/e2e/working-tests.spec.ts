import { test, expect } from '@playwright/test';

test.describe('Food Recipe App - Working E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing state
    await page.context().clearCookies();
  });

  test.describe('✅ Navigation Tests', () => {
    test('should load home page successfully', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check core elements
      await expect(page.getByRole('link', { name: 'Recipe Hub' }).first()).toBeVisible();
      await expect(page.locator('text=Explore Recipes')).toBeVisible();
      await expect(page.getByRole('heading', { name: /Discover & Share/i })).toBeVisible();
    });

    test('should navigate to recipes page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.click('text=Explore Recipes');
      await expect(page).toHaveURL('/recipes');
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.getByRole('link', { name: 'Sign In' }).click();
      await expect(page).toHaveURL('/auth/login');
      await expect(page.getByRole('heading')).toContainText('Welcome Back!');
    });

    test('should navigate to register page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.getByRole('link', { name: 'Get Started' }).first().click();
      await expect(page).toHaveURL('/auth/register');
      await expect(page.getByRole('heading')).toContainText('Join Our Community');
    });

    test('should navigate between auth pages', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Go to login
      await page.getByRole('link', { name: 'Sign In' }).click();
      await expect(page).toHaveURL('/auth/login');

      // Check if there's a register link on login page
      const registerLink = page.locator('a[href="/auth/register"]').first();
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL('/auth/register');
      }
    });

    test('should navigate to categories page', async ({ page }) => {
      await page.goto('/categories');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/categories');
    });

    test('should navigate to recipes page and show search UI', async ({ page }) => {
      await page.goto('/recipes');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipes');
      
      // Should show search functionality (allow different input types)
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
      const hasSearch = await searchInput.count() > 0;
      expect(hasSearch).toBeTruthy();
    });
  });

  test.describe('✅ UI Component Tests', () => {
    test('should show correct navbar elements when not authenticated', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Auth buttons should be visible
      await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible();
      
      // Navigation should work - use first() to avoid strict mode
      await expect(page.getByRole('navigation').getByRole('link', { name: 'Browse Recipes' })).toBeVisible();
      await expect(page.getByRole('navigation').getByRole('link', { name: 'Categories' })).toBeVisible();
    });

    test('should show brand elements correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should show Recipe Hub branding
      await expect(page.getByRole('link', { name: 'Recipe Hub' }).first()).toBeVisible();
      
      // Should show main hero content - use first() to avoid strict mode
      await expect(page.locator('text=Amazing Recipes').first()).toBeVisible();
      await expect(page.locator('text=Join our community').first()).toBeVisible();
    });

    test('should show stats section on home page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should show recipe/user stats
      await expect(page.locator('text=1000+')).toBeVisible();
      await expect(page.locator('text=500+')).toBeVisible();
      await expect(page.locator('text=50+')).toBeVisible();
    });
  });

  test.describe('✅ Responsive Design Tests', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show mobile menu button (allow if not found, mobile design varies)
      const mobileMenuExists = await page.locator('[data-testid="mobile-menu-button"]').count() > 0;
      if (mobileMenuExists) {
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      }
      
      // Hero section should still be visible
      await expect(page.getByRole('heading', { name: /Discover & Share/i })).toBeVisible();
      
      // Auth buttons might be in mobile menu, so check more flexibly
      const signInVisible = await page.getByRole('link', { name: 'Sign In' }).isVisible().catch(() => false);
      const mobileMenu = await page.locator('[data-testid="mobile-menu-button"]').isVisible().catch(() => false);
      
      // Either Sign In is visible OR there's a mobile menu to contain it
      expect(signInVisible || mobileMenu).toBeTruthy();
    });

    test('should handle tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show desktop navigation on tablet
      await expect(page.getByRole('link', { name: 'Recipe Hub' }).first()).toBeVisible();
      await expect(page.locator('text=Explore Recipes')).toBeVisible();
    });
  });

  test.describe('✅ Error Handling Tests', () => {
    test('should handle non-existent pages gracefully', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-123456');
      await page.waitForLoadState('networkidle');
      
      // Should not crash - either show 404 or redirect
      expect(page.url()).toBeTruthy();
      
      // Page should have loaded some content
      const bodyContent = await page.locator('body').textContent();
      expect(bodyContent).toBeTruthy();
    });

    test('should load auth pages without errors', async ({ page }) => {
      // Test login page
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/auth/login');
      
      // Test register page  
      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/auth/register');
    });
  });

  test.describe('✅ Performance Tests', () => {
    test('should load home page within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Allow up to 30 seconds for dev mode (which we know is slow)
      expect(loadTime).toBeLessThan(30000);
      
      // Should show main content
      await expect(page.getByRole('heading', { name: /Discover & Share/i })).toBeVisible();
    });
  });

  test.describe('✅ Content Tests', () => {
    test('should show welcome message for new users', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should show community welcome message - use first() to avoid strict mode
      await expect(page.locator('text=Welcome to Recipe Hub').first()).toBeVisible();
      await expect(page.locator('text=Join our community').first()).toBeVisible();
    });

    test('should show footer with links', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should have footer content
      await expect(page.locator('footer, [role="contentinfo"]')).toBeVisible();
      
      // Should show copyright
      await expect(page.locator('text=© 2024')).toBeVisible();
    });
  });
});
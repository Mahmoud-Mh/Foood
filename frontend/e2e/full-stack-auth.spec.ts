import { test, expect } from '@playwright/test';

test.describe('🚀 Full-Stack Authentication (Real Backend)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    // Navigate to a page first before trying to access localStorage
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        // localStorage might not be available in some contexts
        console.log('Could not clear storage:', error);
      }
    });
  });

  test.describe('✅ User Registration End-to-End', () => {
    test('should register new user successfully', async ({ page }) => {
      const uniqueEmail = `playwright_test_${Date.now()}@example.com`;
      
      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');

      // Fill registration form with unique data
      await page.fill('input[name="firstName"]', 'Playwright');
      await page.fill('input[name="lastName"]', 'TestUser');
      await page.fill('input[name="email"]', uniqueEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

      // Check the terms of service checkbox
      await page.check('input[type="checkbox"]');

      // Submit form - this will hit the real backend
      await page.click('button[type="submit"]');

      // Wait a bit for any potential error messages
      await page.waitForTimeout(2000);

      // Check if there are any error messages or alerts
      const alert = page.locator('[role="alert"]');
      const errorText = page.locator('text=error, text=Error, text=failed, text=Failed').first();
      
      if (await alert.count() > 0) {
        console.log('Alert found:', await alert.textContent());
      }
      
      if (await errorText.count() > 0) {
        console.log('Error text found:', await errorText.textContent());
      }

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
      
      // Should show welcome message with user's name
      await expect(page.locator('h1')).toContainText('Welcome back, Playwright');
      
      // Verify we can access dashboard content (proves authentication worked)
      await expect(page.locator('text=Ready to create something delicious today?')).toBeVisible();
      await expect(page.locator('text=Create New Recipe')).toBeVisible();

      // User should be authenticated - check for user menu (AuthContext should now be working)
      await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('should reject registration with duplicate email', async ({ page }) => {
      // Try to register with existing admin user email
      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="firstName"]', 'Duplicate');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', 'mahmoud.mouzoun@epitech.eu'); // Already exists (your admin account)
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

      // Check the terms of service checkbox
      await page.check('input[type="checkbox"]');

      await page.click('button[type="submit"]');

      // Should stay on registration page and show error
      await expect(page).toHaveURL('/auth/register');
      
      // Should show error message
      const errorMessage = page.locator('text=An account with this email already exists');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('✅ User Login End-to-End', () => {
    test('should login with valid credentials', async ({ page }) => {
      // First register a test user
      const testEmail = `login_test_${Date.now()}@example.com`;
      
      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="firstName"]', 'Login');
      await page.fill('input[name="lastName"]', 'TestUser');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.check('input[type="checkbox"]');
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard after registration
      await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
      
      // Logout to test login
      await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible({ timeout: 10000 });
      await page.click('[data-testid="user-menu-button"]');
      await page.click('text=Sign Out');
      await expect(page).toHaveURL('/');
      
      // Now test login with the created credentials
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
      
      // Should show welcome message
      await expect(page.locator('h1')).toContainText('Welcome back, Login');
      
      // Should show user menu
      await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible();
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');

      await page.click('button[type="submit"]');

      // Should stay on login page
      await expect(page).toHaveURL('/auth/login');
      
      // Should show error message
      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('should reject empty credentials', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Try to submit without filling anything
      await page.click('button[type="submit"]');

      // Should stay on login page
      await expect(page).toHaveURL('/auth/login');
      
      // Should show validation errors - check for specific validation messages
      const hasEmailRequired = await page.locator('text=Email is required').count() > 0;
      const hasPasswordRequired = await page.locator('text=Password is required').count() > 0;
      
      expect(hasEmailRequired || hasPasswordRequired).toBeTruthy();
    });
  });

  test.describe('✅ Authentication State & Protected Routes', () => {
    test('should access protected routes when authenticated', async ({ page }) => {
      // Login with existing admin account
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'mahmoud.mouzoun@epitech.eu');
      await page.fill('input[name="password"]', 'Mahmoud055@!!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');

      // Should be able to access recipe creation
      await page.goto('/recipes/create');
      await expect(page).toHaveURL('/recipes/create');
      
      // Should be able to access profile
      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
    });

    test('should redirect to login for protected routes when unauthenticated', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/auth/login');

      // Try to access recipe creation
      await page.goto('/recipes/create');
      await expect(page).toHaveURL('/auth/login');
    });

    test('should show different navbar for authenticated users', async ({ page }) => {
      // Check unauthenticated navbar
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('text=Sign In')).toBeVisible();
      await expect(page.locator('text=Get Started').first()).toBeVisible();

      // Login with admin account
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'mahmoud.mouzoun@epitech.eu');
      await page.fill('input[name="password"]', 'Mahmoud055@!!');
      await page.click('button[type="submit"]');
      
      // Check authenticated navbar
      await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible();
      await expect(page.locator('text=Create Recipe')).toBeVisible();
    });
  });

  test.describe('✅ User Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first with admin account
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'mahmoud.mouzoun@epitech.eu');
      await page.fill('input[name="password"]', 'Mahmoud055@!!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');

      // Logout via user menu
      await page.click('[data-testid="user-menu-button"]');
      await page.click('text=Sign Out');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
      
      // Should show login/register buttons again
      await expect(page.locator('text=Sign In')).toBeVisible();
      
      // Should not be able to access protected routes
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('✅ Admin Authentication', () => {
    test('should allow admin access to admin features', async ({ page }) => {
      // Login as admin
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'mahmoud.mouzoun@epitech.eu');
      await page.fill('input[name="password"]', 'Mahmoud055@!!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');

      // Should show welcome message with admin name
      await expect(page.locator('h1')).toContainText('Welcome back, Mahmoud');

      // Check admin menu access
      await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible({ timeout: 10000 });
      await page.click('[data-testid="user-menu-button"]');
      
      // Should see admin dashboard option
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
      
      // Should be able to access admin pages
      await page.click('text=Admin Dashboard');
      await expect(page).toHaveURL('/admin');
    });
  });

  test.describe('✅ Form Validation', () => {
    test('should validate registration form fields', async ({ page }) => {
      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');

      // Test invalid email
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'short');
      await page.check('input[type="checkbox"]');
      await page.click('button[type="submit"]');

      // Should show validation errors - check for specific client-side validation messages
      const hasEmailError = await page.locator('text=Email is invalid').count() > 0;
      const hasPasswordError = await page.locator('text=Password must be at least 8 characters').count() > 0;
      
      expect(hasEmailError || hasPasswordError).toBeTruthy();
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', 'test2@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
      
      // Check the terms of service checkbox
      await page.check('input[type="checkbox"]');
      
      await page.click('button[type="submit"]');

      // Should show password mismatch error
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });
  });
});
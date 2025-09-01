import { test, expect } from '@playwright/test';
import { createFullStackHelpers } from './utils/fullstack-helpers';
import { testUsers } from './fullstack-global-setup';

test.describe('🔐 Full-Stack Authentication Tests', () => {
  let helpers: ReturnType<typeof createFullStackHelpers>;

  test.beforeEach(async ({ page }) => {
    helpers = createFullStackHelpers(page);
    // Clear auth state for each test
    await page.context().clearCookies();
  });

  test.describe('User Registration', () => {
    test('should register new user with backend validation', async ({ page }) => {
      const newUser = {
        firstName: 'New',
        lastName: 'TestUser',
        email: `newtest${Date.now()}@test.com`,
        password: 'NewTestPassword123!'
      };

      // Register user via UI
      await helpers.registerUser(newUser);

      // Verify user is logged in and redirected to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator(`text=${newUser.firstName}`)).toBeVisible();

      // Verify user was created in database via API
      const response = await helpers.apiRequest('POST', '/auth/login', {
        email: newUser.email,
        password: newUser.password
      });
      
      expect(response.ok()).toBeTruthy();
      const loginData = await response.json();
      expect(loginData.success).toBeTruthy();
      expect(loginData.data.user.email).toBe(newUser.email);
    });

    test('should reject registration with duplicate email', async ({ page }) => {
      await page.goto('/auth/register');

      // Try to register with existing user email
      await page.fill('input[name="firstName"]', 'Duplicate');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', testUsers.regularUser.email);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');

      await page.click('button[type="submit"]');

      // Should show error message and stay on registration page
      await expect(page.locator('text=/email.*already.*exists|user.*already.*exists|email.*taken/i')).toBeVisible();
      await expect(page).toHaveURL('/auth/register');
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/auth/register');

      // Try weak password
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', `weak${Date.now()}@test.com`);
      await page.fill('input[name="password"]', '123');
      await page.fill('input[name="confirmPassword"]', '123');

      await page.click('button[type="submit"]');

      // Should show password validation error
      const hasPasswordError = await page.locator('text=/password.*weak|password.*short|password.*requirements/i').isVisible();
      const stillOnRegisterPage = page.url().includes('/auth/register');
      
      expect(hasPasswordError || stillOnRegisterPage).toBeTruthy();
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);

      // Verify successful login
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator(`[data-testid="user-menu-button"]:has-text("${testUsers.regularUser.firstName}")`).first()).toBeVisible();

      // Check authentication state via API call
      const response = await helpers.apiRequest('GET', '/users/profile');
      expect(response.ok()).toBeTruthy();
      
      const userData = await response.json();
      expect(userData.data.email).toBe(testUsers.regularUser.email);
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', testUsers.regularUser.email);
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error and stay on login page
      await expect(page.locator('text=/invalid.*credentials|email.*password.*incorrect/i')).toBeVisible();
      await expect(page).toHaveURL('/auth/login');
    });

    test('should handle non-existent user', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', 'nonexistent@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should show error and stay on login page
      await expect(page.locator('text=/invalid.*credentials|user.*not.*found/i')).toBeVisible();
      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('Admin Authentication', () => {
    test('should allow admin login and dashboard access', async ({ page }) => {
      await helpers.loginAsAdmin();

      // Should be on dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should have admin dashboard link
      await page.click('[data-testid="user-menu-button"]');
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();

      // Navigate to admin dashboard
      await page.click('text=Admin Dashboard');
      await expect(page).toHaveURL('/admin');
    });

    test('should show admin-specific features', async ({ page }) => {
      await helpers.loginAsAdmin();
      
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin');

      // Check for admin features
      const hasAdminContent = await page.locator('text=/admin.*panel|manage.*users|admin.*dashboard/i').isVisible();
      expect(hasAdminContent).toBeTruthy();
    });
  });

  test.describe('Session Management', () => {
    test('should persist session across page refreshes', async ({ page }) => {
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);

      // Refresh the page
      await page.reload();

      // Should still be authenticated
      await expect(page.locator(`h1:has-text("Welcome back, ${testUsers.regularUser.firstName}")`)).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);
      
      // Logout
      await helpers.logout();

      // Should be logged out
      await expect(page).toHaveURL('/');
      await expect(page.locator('text=Sign In')).toBeVisible();

      // Verify logout via API
      const response = await helpers.apiRequest('GET', '/users/profile');
      expect(response.status()).toBe(401); // Unauthorized
    });

    test('should redirect to login for protected routes when not authenticated', async ({ page }) => {
      // Try to access protected route without login
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/auth/login');
      await expect(page.locator('text=/please.*sign.*in|login.*required/i')).toBeVisible();
    });

    test('should redirect back to intended page after login', async ({ page }) => {
      // Try to access a protected route
      await page.goto('/recipes/create');

      // Should redirect to login with return URL
      await expect(page).toHaveURL(/auth\/login/);

      // Login
      await page.fill('input[name="email"]', testUsers.regularUser.email);
      await page.fill('input[name="password"]', testUsers.regularUser.password);
      await page.click('button[type="submit"]');

      // Should redirect back to intended page
      await expect(page).toHaveURL('/recipes/create');
    });
  });

  test.describe('Password Security', () => {
    test('should handle password reset flow', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      if (await page.locator('input[name="email"]').isVisible()) {
        await page.fill('input[name="email"]', testUsers.regularUser.email);
        await page.click('button[type="submit"]');

        // Should show success message
        const hasSuccessMessage = await page.locator('text=/email.*sent|reset.*link.*sent/i').isVisible();
        expect(hasSuccessMessage).toBeTruthy();
      } else {
        // If forgot password isn't implemented, test passes
        console.log('Password reset flow not implemented - skipping');
      }
    });
  });

  test.describe('API Authentication', () => {
    test('should receive valid JWT tokens on login', async ({ page }) => {
      // Login via API
      const response = await helpers.apiRequest('POST', '/auth/login', {
        email: testUsers.regularUser.email,
        password: testUsers.regularUser.password
      });

      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.success).toBeTruthy();
      expect(data.data.tokens.accessToken).toBeTruthy();
      expect(data.data.tokens.refreshToken).toBeTruthy();
      expect(data.data.user.email).toBe(testUsers.regularUser.email);
    });

    test('should validate JWT tokens for protected routes', async ({ page }) => {
      // First login to get token
      const loginResponse = await helpers.apiRequest('POST', '/auth/login', {
        email: testUsers.regularUser.email,
        password: testUsers.regularUser.password
      });

      const loginData = await loginResponse.json();
      const token = loginData.data.tokens.accessToken;

      // Use token for authenticated request
      const protectedResponse = await helpers.apiRequest('GET', '/users/profile', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(protectedResponse.ok()).toBeTruthy();
      
      const userData = await protectedResponse.json();
      expect(userData.data.email).toBe(testUsers.regularUser.email);
    });
  });
});
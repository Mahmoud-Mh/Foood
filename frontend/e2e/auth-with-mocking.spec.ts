import { test, expect } from '@playwright/test';
import { createTestHelpers } from './utils/test-helpers';
import { testUsers, mockApiResponses } from './fixtures/test-data';

test.describe('Authentication with API Mocking', () => {
  let helpers: ReturnType<typeof createTestHelpers>;

  test.beforeEach(async ({ page }) => {
    helpers = createTestHelpers(page);
    await page.context().clearCookies();
  });

  test.describe('🔐 User Registration Flow', () => {
    test('should successfully register a new user', async ({ page }) => {
      // Mock successful registration API response
      await helpers.mockApiResponse('/auth/register', {
        success: true,
        data: {
          user: testUsers.newUser,
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        }
      }, 201);

      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');

      // Fill registration form
      const newUser = {
        ...testUsers.newUser,
        email: `test${Date.now()}@example.com`
      };

      await page.fill('input[name="firstName"]', newUser.firstName);
      await page.fill('input[name="lastName"]', newUser.lastName);
      await page.fill('input[name="email"]', newUser.email);
      await page.fill('input[name="password"]', newUser.password);
      await page.fill('input[name="confirmPassword"]', newUser.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
      
      // Verify the API was called
      // Note: In a real test, you'd verify the request was made with correct data
    });

    test('should show error for duplicate email', async ({ page }) => {
      // Mock duplicate email error
      await helpers.mockApiResponse('/auth/register', {
        success: false,
        message: 'An account with this email already exists'
      }, 409);

      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');

      // Fill form with existing user email
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', testUsers.regularUser.email);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');

      await page.click('button[type="submit"]');

      // Should stay on register page and show error
      await expect(page).toHaveURL('/auth/register');
      await expect(page.locator('text=An account with this email already exists')).toBeVisible();
    });

    test('should show validation errors for invalid registration', async ({ page }) => {
      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');

      // Try to submit with invalid data
      await page.fill('input[name="firstName"]', 'A'); // Too short
      await page.fill('input[name="lastName"]', ''); // Empty
      await page.fill('input[name="email"]', 'invalid-email'); // Invalid format
      await page.fill('input[name="password"]', '123'); // Too short
      await page.fill('input[name="confirmPassword"]', '456'); // Doesn't match

      await page.click('button[type="submit"]');

      // Should show client-side validation errors
      await expect(page.locator('text=First name must be at least')).toBeVisible();
      await expect(page.locator('text=Last name is required')).toBeVisible();
      await expect(page.locator('text=Email is invalid')).toBeVisible();
      await expect(page.locator('text=Password must be at least')).toBeVisible();
    });
  });

  test.describe('🔑 User Login Flow', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      // Mock successful login
      await helpers.mockApiResponse('/auth/login', {
        success: true,
        data: {
          user: testUsers.regularUser,
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        }
      });

      // Mock user profile endpoint for dashboard
      await helpers.mockApiResponse('/auth/me', {
        success: true,
        data: testUsers.regularUser
      });

      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Fill login form
      await page.fill('input[name="email"]', testUsers.regularUser.email);
      await page.fill('input[name="password"]', testUsers.regularUser.password);

      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
      
      // Should show welcome message (if dashboard loads user data)
      // Note: This might need adjustment based on actual dashboard implementation
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Mock invalid credentials error
      await helpers.mockApiResponse('/auth/login', {
        success: false,
        message: 'Invalid email or password'
      }, 401);

      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Try login with invalid credentials
      await page.fill('input[name="email"]', 'wrong@email.com');
      await page.fill('input[name="password"]', 'wrongpassword');

      await page.click('button[type="submit"]');

      // Should stay on login page and show error
      await expect(page).toHaveURL('/auth/login');
      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('should show validation errors for empty login form', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show client-side validation
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });
  });

  test.describe('🚪 User Logout Flow', () => {
    test('should successfully logout authenticated user', async ({ page }) => {
      // Mock login first
      await helpers.mockApiResponse('/auth/login', mockApiResponses.authSuccess);
      await helpers.mockApiResponse('/auth/me', { success: true, data: testUsers.regularUser });
      
      // Mock logout
      await helpers.mockApiResponse('/auth/logout', { success: true, message: 'Logged out successfully' });

      // Login first
      await helpers.loginAsUser(testUsers.regularUser.email, testUsers.regularUser.password);
      
      // Should be on dashboard
      await expect(page).toHaveURL('/dashboard');

      // Logout via user menu
      await page.click('[data-testid="user-menu-button"]');
      await page.click('text=Sign Out');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
      
      // Should show login button again
      await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    });
  });

  test.describe('🛡️ Protected Routes', () => {
    test('should redirect to login when accessing protected route while unauthenticated', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/auth/login');
    });

    test('should allow access to protected route when authenticated', async ({ page }) => {
      // Mock authentication
      await helpers.mockApiResponse('/auth/me', { success: true, data: testUsers.regularUser });
      await helpers.mockApiResponse('/recipes/my', { success: true, data: [] });

      // Set auth token in localStorage to simulate logged-in state
      await page.addInitScript(() => {
        localStorage.setItem('accessToken', 'mock-token');
        localStorage.setItem('refreshToken', 'mock-refresh-token');
      });

      await page.goto('/dashboard');
      
      // Should stay on dashboard
      await expect(page).toHaveURL('/dashboard');
    });

    test('should show admin features for admin users', async ({ page }) => {
      // Mock admin authentication
      await helpers.mockApiResponse('/auth/me', { success: true, data: testUsers.adminUser });
      
      await page.addInitScript(() => {
        localStorage.setItem('accessToken', 'mock-admin-token');
      });

      await page.goto('/dashboard');
      
      // Click user menu to see admin options
      await page.click('[data-testid="user-menu-button"]');
      
      // Should show admin dashboard link
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    });
  });

  test.describe('📱 Mobile Authentication', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await helpers.mockApiResponse('/auth/login', mockApiResponses.authSuccess);

      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Should show mobile-optimized login form
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Form should be functional
      await page.fill('input[name="email"]', testUsers.regularUser.email);
      await page.fill('input[name="password"]', testUsers.regularUser.password);
      
      // Submit button should be accessible
      await page.click('button[type="submit"]');
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up mocked routes
    await helpers.clearApiMocks();
  });
});
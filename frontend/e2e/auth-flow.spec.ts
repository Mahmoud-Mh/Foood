import { test, expect } from "@playwright/test";
import { createTestHelpers } from "./utils/test-helpers";
import { testUsers } from "./fixtures/test-data";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.context().clearCookies();
    await page.goto("/");
  });

  test.describe("User Registration", () => {
    test("should allow new user registration with valid data", async ({
      page,
    }) => {
      const helpers = createTestHelpers(page);

      // Navigate to registration page - try multiple possible selectors
      const joinButton = page.locator("text=Join Community").or(page.locator("text=Get Started")).or(page.locator("a[href='/auth/register']")).first();
      await joinButton.click();
      await expect(page).toHaveURL("/auth/register");

      // Fill registration form
      const newUser = {
        ...testUsers.newUser,
        email: `test${Date.now()}@test.com`,
      };
      await page.fill('input[name=\"firstName\"]', newUser.firstName);
      await page.fill('input[name=\"lastName\"]', newUser.lastName);
      await page.fill('input[name=\"email\"]', newUser.email);
      await page.fill('input[name=\"password\"]', newUser.password);
      await page.fill('input[name=\"confirmPassword\"]', newUser.password);

      // Submit registration
      await page.click('button[type=\"submit\"]');

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL("/dashboard");
      await expect(page.locator("h1")).toContainText("Welcome back, " + newUser.firstName);

      // User should be logged in - check for user name in welcome message
      await expect(
        page.locator("text=" + newUser.firstName)
      ).toBeVisible();
    });

    test("should show validation errors for invalid registration data", async ({
      page,
    }) => {
      const joinButton = page.locator("text=Join Community").or(page.locator("text=Get Started")).or(page.locator("a[href='/auth/register']")).first();
      await joinButton.click();

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator("text=First name is required")).toBeVisible();
      await expect(page.locator("text=Last name is required")).toBeVisible();
      await expect(page.locator("text=Email is required")).toBeVisible();
      await expect(page.locator("text=Password is required")).toBeVisible();
    });

    test("should show error for duplicate email registration", async ({
      page,
    }) => {
      const joinButton = page.locator("text=Join Community").or(page.locator("text=Get Started")).or(page.locator("a[href='/auth/register']")).first();
      await joinButton.click();

      // Try to register with existing email
      await page.fill('input[name="firstName"]', "Test");
      await page.fill('input[name="lastName"]', "User");
      await page.fill('input[type="email"]', testUsers.regularUser.email);
      await page.fill('input[type="password"]', "NewPassword123!");

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator("text=Email already exists")).toBeVisible();
      await expect(page).toHaveURL("/auth/register");
    });
  });

  test.describe("User Login", () => {
    test("should allow user login with valid credentials", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.click("text=Sign In");
      await expect(page).toHaveURL("/auth/login");

      // Login with valid credentials
      await page.fill('input[name="email"]', testUsers.regularUser.email);
      await page.fill('input[name="password"]', testUsers.regularUser.password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL("/dashboard");
      await expect(page.locator("h1")).toContainText("Welcome back, " + testUsers.regularUser.firstName);

      // Should show user name in navigation
      await expect(
        page.locator("text=" + testUsers.regularUser.firstName)
      ).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.click("text=Sign In");

      // Try login with invalid credentials
      await page.fill('input[name="email"]', "invalid@test.com");
      await page.fill('input[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator("text=Invalid email or password")).toBeVisible();
      await expect(page).toHaveURL("/auth/login");
    });

    test("should show validation errors for empty login form", async ({
      page,
    }) => {
      await page.click("text=Sign In");

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator("text=Email is required")).toBeVisible();
      await expect(page.locator("text=Password is required")).toBeVisible();
    });
  });

  test.describe("User Logout", () => {
    test("should allow user to logout successfully", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login first
      await helpers.loginAsUser(
        testUsers.regularUser.email,
        testUsers.regularUser.password,
      );
      await expect(page).toHaveURL("/dashboard");

      // Logout
      await page.click('[data-testid="user-menu-button"]');
      await page.click("text=Sign Out");

      // Should redirect to home page
      await expect(page).toHaveURL("/");

      // Should show login/register options again
      await expect(page.locator("text=Sign In")).toBeVisible();
      await expect(page.locator("text=Get Started")).toBeVisible();
    });
  });

  test.describe("Admin Access", () => {
    test("should show admin dashboard for admin users", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login as admin
      await helpers.loginAsAdmin(
        testUsers.adminUser.email,
        testUsers.adminUser.password,
      );

      // Should have access to admin dashboard
      await page.click('[data-testid="user-menu-button"]');
      await expect(page.locator("text=Admin Dashboard")).toBeVisible();

      // Navigate to admin dashboard
      await page.click("text=Admin Dashboard");
      await expect(page).toHaveURL("/admin");
      await expect(page.locator("text=Admin Panel")).toBeVisible();
    });

    test("should not show admin options for regular users", async ({
      page,
    }) => {
      const helpers = createTestHelpers(page);

      // Login as regular user
      await helpers.loginAsUser(
        testUsers.regularUser.email,
        testUsers.regularUser.password,
      );

      // Should not see admin dashboard option
      await page.click('[data-testid="user-menu-button"]');
      await expect(page.locator("text=Admin Dashboard")).not.toBeVisible();
    });
  });

  test.describe("Session Management", () => {
    test("should maintain session after page refresh", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login
      await helpers.loginAsUser(
        testUsers.regularUser.email,
        testUsers.regularUser.password,
      );
      await expect(page).toHaveURL("/dashboard");

      // Refresh page
      await page.reload();

      // Should still be logged in
      await expect(
        page.locator(
          "text=" +
            testUsers.regularUser.firstName +
            " " +
            testUsers.regularUser.lastName,
        ),
      ).toBeVisible();
      await expect(page).toHaveURL("/dashboard");
    });

    test("should redirect to login when accessing protected routes while unauthenticated", async ({
      page,
    }) => {
      // Try to access protected route without authentication
      await page.goto("/dashboard");

      // Should redirect to login page
      await expect(page).toHaveURL("/auth/login");
      await expect(
        page.locator("text=Please sign in to continue"),
      ).toBeVisible();
    });

    test("should redirect back to intended page after login", async ({
      page,
    }) => {
      // Try to access protected route
      await page.goto("/recipes/create");

      // Should redirect to login
      await expect(page).toHaveURL(/.*auth\/login/);

      // Login
      await page.fill('input[type="email"]', testUsers.regularUser.email);
      await page.fill('input[type="password"]', testUsers.regularUser.password);
      await page.click('button[type="submit"]');

      // Should redirect back to intended page
      await expect(page).toHaveURL("/recipes/create");
    });
  });

  test.describe("Mobile Authentication", () => {
    test("should work on mobile devices", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const helpers = createTestHelpers(page);

      // Navigate to login via mobile menu
      await page.goto("/");

      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click("text=Sign In");

      // Login
      await page.fill('input[type="email"]', testUsers.regularUser.email);
      await page.fill('input[type="password"]', testUsers.regularUser.password);
      await page.click('button[type="submit"]');

      // Should be logged in
      await expect(page).toHaveURL("/dashboard");

      // Check mobile menu shows user options
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(
        page.locator(
          "text=" +
            testUsers.regularUser.firstName +
            " " +
            testUsers.regularUser.lastName,
        ),
      ).toBeVisible();
      await expect(page.locator("text=Sign Out")).toBeVisible();
    });
  });
});

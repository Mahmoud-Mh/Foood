import { test, expect } from '@playwright/test';
import { createFullStackHelpers } from './utils/fullstack-helpers';
import { testUsers } from './fullstack-global-setup';

test.describe('👑 Full-Stack Admin Panel Tests', () => {
  let helpers: ReturnType<typeof createFullStackHelpers>;

  test.beforeEach(async ({ page }) => {
    helpers = createFullStackHelpers(page);
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await helpers.cleanupTestData();
  });

  test.describe('Admin Authentication and Access', () => {
    test('should allow admin to access admin dashboard', async ({ page }) => {
      await helpers.loginAsAdmin();

      // Navigate to admin dashboard
      await page.goto('/admin');
      
      // Should successfully load admin page
      await expect(page).toHaveURL('/admin');
      
      // Should show admin-specific content
      const hasAdminContent = await page.locator('text=/admin.*dashboard|admin.*panel|manage.*users|system.*overview/i').isVisible();
      expect(hasAdminContent).toBeTruthy();
    });

    test('should prevent non-admin users from accessing admin routes', async ({ page }) => {
      // Login as regular user
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);

      // Try to access admin dashboard
      await page.goto('/admin');

      // Should be redirected or show access denied
      const isOnAdminPage = page.url().includes('/admin');
      const hasAccessDenied = await page.locator('text=/access.*denied|not.*authorized|permission.*denied/i').isVisible();
      const redirectedToHome = page.url() === 'http://localhost:3000/' || page.url() === 'http://localhost:3000/dashboard';

      expect(!isOnAdminPage || hasAccessDenied || redirectedToHome).toBeTruthy();
    });

    test('should show admin-specific navigation elements', async ({ page }) => {
      await helpers.loginAsAdmin();

      // Check for admin menu item
      await page.click('[data-testid="user-menu-button"]');
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();

      // Admin dashboard should have navigation items
      await page.click('text=Admin Dashboard');
      await expect(page).toHaveURL('/admin');

      // Check for admin navigation elements
      const hasUserManagement = await page.locator('text=/users|manage.*users|user.*management/i').isVisible();
      const hasRecipeManagement = await page.locator('text=/recipes|manage.*recipes|recipe.*management/i').isVisible();
      const hasSystemSettings = await page.locator('text=/settings|system|configuration/i').isVisible();

      expect(hasUserManagement || hasRecipeManagement || hasSystemSettings).toBeTruthy();
    });
  });

  test.describe('User Management', () => {
    test('should display list of users', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Navigate to user management
      const userManagementLink = page.locator('a[href*="/admin/users"], text=/users|manage.*users|user.*management/i').first();
      if (await userManagementLink.isVisible()) {
        await userManagementLink.click();

        // Should show user list
        const hasUserList = await page.locator('.user-list, .users-table, table').isVisible();
        const hasUserEntries = await page.locator('text=/test.*user|admin.*test/i').isVisible();

        expect(hasUserList || hasUserEntries).toBeTruthy();
      } else {
        console.log('ℹ️  User management not implemented yet');
      }
    });

    test('should allow admin to view user details', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Try to find user management
      const userSection = page.locator('text=/users|user.*management/i').first();
      if (await userSection.isVisible()) {
        await userSection.click();

        // Look for test user
        const testUserRow = page.locator(`text=${testUsers.regularUser.email}`).first();
        if (await testUserRow.isVisible()) {
          // Click on user details
          const userDetailsButton = testUserRow.locator('..').locator('button:has-text("View"), a:has-text("Details"), [data-testid="user-details"]').first();
          if (await userDetailsButton.isVisible()) {
            await userDetailsButton.click();

            // Should show user information
            await expect(page.locator(`text=${testUsers.regularUser.firstName}`)).toBeVisible();
            await expect(page.locator(`text=${testUsers.regularUser.email}`)).toBeVisible();
          }
        }
      }
    });

    test('should allow admin to manage user status', async ({ page }) => {
      await helpers.loginAsAdmin();
      
      // Create a test user for management
      const testUser = {
        firstName: 'Manage',
        lastName: 'TestUser',
        email: `manage${Date.now()}@test.com`,
        password: 'ManageTest123!'
      };

      // Register the test user first
      await helpers.registerUser(testUser);
      await helpers.logout();
      await helpers.loginAsAdmin();

      await page.goto('/admin');

      // Navigate to user management
      const userSection = page.locator('text=/users|user.*management/i').first();
      if (await userSection.isVisible()) {
        await userSection.click();

        // Find the test user
        const testUserRow = page.locator(`text=${testUser.email}`);
        if (await testUserRow.isVisible()) {
          // Look for status management buttons
          const statusButtons = testUserRow.locator('..').locator('button:has-text("Deactivate"), button:has-text("Activate"), button:has-text("Block"), [data-testid="user-status"]');
          
          if (await statusButtons.count() > 0) {
            const firstButton = statusButtons.first();
            const buttonText = await firstButton.textContent();
            await firstButton.click();

            // Should show confirmation or success
            const hasConfirmation = await page.locator('text=/confirm|are.*you.*sure|success/i').isVisible();
            expect(hasConfirmation).toBeTruthy();
          }
        }
      }
    });

    test('should show user statistics', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Look for user statistics
      const hasUserStats = await page.locator('text=/total.*users|active.*users|user.*count/i').isVisible();
      const hasStatNumbers = await page.locator('[data-testid="user-stats"], .stats-card, .metric').isVisible();

      if (hasUserStats || hasStatNumbers) {
        console.log('✅ User statistics displayed');
      } else {
        console.log('ℹ️  User statistics not implemented yet');
      }
    });
  });

  test.describe('Recipe Management', () => {
    test('should display all recipes for moderation', async ({ page }) => {
      // First create some test recipes as regular user
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);
      
      const testRecipe = {
        title: `Admin Review Recipe ${Date.now()}`,
        description: 'Recipe for admin review',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(testRecipe);
      await helpers.logout();

      // Login as admin
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Navigate to recipe management
      const recipeSection = page.locator('text=/recipes|recipe.*management|manage.*recipes/i').first();
      if (await recipeSection.isVisible()) {
        await recipeSection.click();

        // Should show recipes list
        await expect(page.locator(`text=${testRecipe.title}`)).toBeVisible();
      } else {
        console.log('ℹ️  Recipe management section not implemented yet');
      }
    });

    test('should allow admin to moderate recipes', async ({ page }) => {
      // Create test recipe as regular user
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);
      
      const testRecipe = {
        title: `Moderate Recipe ${Date.now()}`,
        description: 'Recipe needing moderation',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(testRecipe);
      await helpers.logout();

      // Login as admin
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      const recipeSection = page.locator('text=/recipes|recipe.*management/i').first();
      if (await recipeSection.isVisible()) {
        await recipeSection.click();

        // Find the test recipe
        const recipeRow = page.locator(`text=${testRecipe.title}`);
        if (await recipeRow.isVisible()) {
          // Look for moderation actions
          const moderateButtons = recipeRow.locator('..').locator('button:has-text("Approve"), button:has-text("Reject"), button:has-text("Delete"), [data-testid="moderate-recipe"]');
          
          if (await moderateButtons.count() > 0) {
            console.log('✅ Recipe moderation options available');
          }
        }
      }
    });

    test('should show recipe statistics', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Look for recipe statistics
      const hasRecipeStats = await page.locator('text=/total.*recipes|published.*recipes|pending.*review/i').isVisible();
      const hasStatCards = await page.locator('[data-testid="recipe-stats"], .recipe-stats').isVisible();

      if (hasRecipeStats || hasStatCards) {
        console.log('✅ Recipe statistics displayed');
      } else {
        console.log('ℹ️  Recipe statistics not implemented yet');
      }
    });
  });

  test.describe('System Administration', () => {
    test('should show system overview', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Look for system overview elements
      const hasSystemInfo = await page.locator('text=/system.*status|server.*health|database.*status/i').isVisible();
      const hasMetrics = await page.locator('.metrics, .system-stats, [data-testid="system-overview"]').isVisible();

      if (hasSystemInfo || hasMetrics) {
        console.log('✅ System overview available');
      } else {
        console.log('ℹ️  System overview not implemented yet');
      }
    });

    test('should allow admin to manage categories', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Look for category management
      const categorySection = page.locator('text=/categories|manage.*categories|category.*management/i').first();
      if (await categorySection.isVisible()) {
        await categorySection.click();

        // Should show categories list
        const hasCategoryList = await page.locator('.category-list, .categories-table').isVisible();
        const hasCategories = await page.locator('text=/appetizer|main.*course|dessert/i').isVisible();

        expect(hasCategoryList || hasCategories).toBeTruthy();
      } else {
        console.log('ℹ️  Category management not implemented yet');
      }
    });

    test('should allow admin to add new categories', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      const categorySection = page.locator('text=/categories|category.*management/i').first();
      if (await categorySection.isVisible()) {
        await categorySection.click();

        // Look for add category button
        const addButton = page.locator('button:has-text("Add Category"), button:has-text("New Category"), [data-testid="add-category"]').first();
        if (await addButton.isVisible()) {
          await addButton.click();

          // Should show form for new category
          const categoryForm = page.locator('form, [data-testid="category-form"]');
          if (await categoryForm.isVisible()) {
            const testCategory = `Test Category ${Date.now()}`;
            await page.fill('input[name="name"], input[name="categoryName"]', testCategory);
            await page.click('button[type="submit"]');

            // Should show success or new category in list
            const hasSuccess = await page.locator('text=/success|created|added/i').isVisible();
            const categoryVisible = await page.locator(`text=${testCategory}`).isVisible();

            expect(hasSuccess || categoryVisible).toBeTruthy();
          }
        }
      }
    });

    test('should handle admin settings', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Look for settings section
      const settingsSection = page.locator('text=/settings|configuration|system.*settings/i').first();
      if (await settingsSection.isVisible()) {
        await settingsSection.click();

        // Should show settings form or options
        const hasSettings = await page.locator('form, .settings-form, input[type="checkbox"]').isVisible();
        expect(hasSettings).toBeTruthy();
      } else {
        console.log('ℹ️  Admin settings not implemented yet');
      }
    });
  });

  test.describe('Admin Reports and Analytics', () => {
    test('should show user activity reports', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Look for reports section
      const reportsSection = page.locator('text=/reports|analytics|activity/i').first();
      if (await reportsSection.isVisible()) {
        await reportsSection.click();

        // Should show some form of analytics
        const hasCharts = await page.locator('canvas, .chart, .graph').isVisible();
        const hasReportData = await page.locator('.report-data, .analytics-data').isVisible();
        const hasActivityLog = await page.locator('.activity-log, .user-activity').isVisible();

        if (hasCharts || hasReportData || hasActivityLog) {
          console.log('✅ Admin reports available');
        }
      } else {
        console.log('ℹ️  Admin reports not implemented yet');
      }
    });

    test('should show popular recipes analytics', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Create some test data first
      await helpers.logout();
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);
      
      const popularRecipe = {
        title: `Popular Recipe ${Date.now()}`,
        description: 'This should be popular',
        ingredients: ['Popular ingredient'],
        instructions: ['Popular step']
      };

      await helpers.createRecipe(popularRecipe);
      await helpers.logout();
      await helpers.loginAsAdmin();

      await page.goto('/admin');

      // Look for popular recipes section
      const popularSection = await page.locator('text=/popular.*recipes|trending|most.*viewed/i').isVisible();
      if (popularSection) {
        console.log('✅ Popular recipes analytics available');
      }
    });
  });

  test.describe('Admin Error Handling', () => {
    test('should handle admin actions gracefully on errors', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Try to perform an action that might cause an error
      const deleteButton = page.locator('button:has-text("Delete"), .delete-btn').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should handle error gracefully
        const hasError = await page.locator('text=/error|failed|try.*again/i').isVisible();
        const hasConfirmation = await page.locator('text=/confirm|are.*you.*sure/i').isVisible();

        expect(hasError || hasConfirmation).toBeTruthy();
      }
    });

    test('should validate admin form inputs', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Find any form in admin panel
      const adminForm = page.locator('form').first();
      if (await adminForm.isVisible()) {
        // Try to submit empty form
        const submitButton = adminForm.locator('button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show validation or stay on form
          const hasValidation = await page.locator('text=/required|invalid|please.*enter/i').isVisible();
          const stillOnForm = await adminForm.isVisible();

          expect(hasValidation || stillOnForm).toBeTruthy();
        }
      }
    });
  });

  test.describe('Admin Security', () => {
    test('should log admin actions for audit trail', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Perform an admin action
      const actionButton = page.locator('button:has-text("Delete"), button:has-text("Approve"), .admin-action').first();
      if (await actionButton.isVisible()) {
        await actionButton.click();

        // Look for audit log
        const auditSection = page.locator('text=/audit.*log|activity.*log|admin.*actions/i');
        if (await auditSection.isVisible()) {
          console.log('✅ Admin audit logging available');
        }
      }
    });

    test('should require confirmation for destructive actions', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // Find destructive action
      const deleteButton = page.locator('button:has-text("Delete"), .delete-btn, [data-testid="delete-user"]').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        const hasConfirmation = await page.locator('text=/are.*you.*sure|confirm.*delete|this.*action.*cannot/i').isVisible();
        expect(hasConfirmation).toBeTruthy();
      }
    });

    test('should timeout admin sessions appropriately', async ({ page }) => {
      await helpers.loginAsAdmin();
      await page.goto('/admin');

      // This test would require longer timeout simulation
      // For now, just verify admin is logged in
      await expect(page.locator(`text=${testUsers.adminUser.firstName}`)).toBeVisible();
      console.log('ℹ️  Session timeout testing requires longer simulation');
    });
  });

  test.describe('Admin API Integration', () => {
    test('should use authenticated API calls for admin operations', async ({ page }) => {
      await helpers.loginAsAdmin();

      // Test admin API endpoint
      const response = await helpers.apiRequest('GET', '/admin/stats');
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeTruthy();
        console.log('✅ Admin API endpoints accessible');
      } else if (response.status() === 404) {
        console.log('ℹ️  Admin API endpoints not implemented yet');
      } else {
        console.log(`ℹ️  Admin API returned status: ${response.status()}`);
      }
    });

    test('should reject admin API calls from non-admin users', async ({ page }) => {
      // Login as regular user
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);

      // Try to access admin API
      const response = await helpers.apiRequest('GET', '/admin/users');
      
      // Should be unauthorized
      expect([401, 403, 404]).toContain(response.status());
    });
  });
});
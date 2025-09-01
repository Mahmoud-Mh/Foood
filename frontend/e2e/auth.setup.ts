import { test as setup, expect } from '@playwright/test';
import { testUsers } from './fullstack-global-setup';

const authFile = 'test-results/.auth/user.json';

setup('authenticate as regular user', async ({ page, request }) => {
  // Create the directory if it doesn't exist
  await page.evaluate(() => {
    // This will be handled by the file system
  });

  // Go to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  // Login with test user
  await page.fill('input[name="email"]', testUsers.regularUser.email);
  await page.fill('input[name="password"]', testUsers.regularUser.password);
  await page.click('button[type="submit"]');

  // Wait for successful login and redirect
  await expect(page).toHaveURL('/dashboard');
  
  // Verify we're logged in by checking for user-specific content
  await expect(page.locator(`text=${testUsers.regularUser.firstName}`)).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication setup complete');
});
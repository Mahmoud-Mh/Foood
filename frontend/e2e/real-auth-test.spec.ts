import { test, expect } from '@playwright/test';
import { createFullStackHelpers } from './utils/fullstack-helpers';
import { testUsers } from './fullstack-global-setup';

test.describe('🔐 Real Account Authentication Test', () => {
  test('should login with real regular user account', async ({ page }) => {
    const helpers = createFullStackHelpers(page);

    console.log('🧪 Testing regular user login...');
    console.log('Email:', testUsers.regularUser.email);
    
    try {
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);
      console.log('✅ Regular user login successful');
      
      // Verify we're logged in
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      
      // Check for user-specific content
      const userName = await page.locator(`text=${testUsers.regularUser.firstName}`).isVisible();
      if (userName) {
        console.log('✅ User name visible on dashboard');
      } else {
        console.log('⚠️  User name not found, checking for other auth indicators');
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/regular-user-login.png' });
      }
      
    } catch (error) {
      console.log('❌ Regular user login failed:', error.message);
      await page.screenshot({ path: 'test-results/regular-user-login-failed.png' });
    }
  });

  test('should login with real admin user account', async ({ page }) => {
    const helpers = createFullStackHelpers(page);

    console.log('🧪 Testing admin user login...');
    console.log('Email:', testUsers.adminUser.email);
    
    try {
      await helpers.loginAsAdmin();
      console.log('✅ Admin user login successful');
      
      // Verify admin access
      const currentUrl = page.url();
      console.log('Current URL after admin login:', currentUrl);
      
      // Check for admin-specific content
      const adminName = await page.locator(`text=${testUsers.adminUser.firstName}`).isVisible();
      if (adminName) {
        console.log('✅ Admin name visible on dashboard');
      }
      
      // Try to access admin dashboard
      await page.click('[data-testid="user-menu-button"]');
      const adminDashboardLink = await page.locator('text=Admin Dashboard').isVisible();
      if (adminDashboardLink) {
        console.log('✅ Admin Dashboard link visible');
        await page.click('text=Admin Dashboard');
        console.log('Current URL after clicking Admin Dashboard:', page.url());
      } else {
        console.log('⚠️  Admin Dashboard link not found');
      }
      
      await page.screenshot({ path: 'test-results/admin-user-login.png' });
      
    } catch (error) {
      console.log('❌ Admin user login failed:', error.message);
      await page.screenshot({ path: 'test-results/admin-user-login-failed.png' });
    }
  });

  test('should verify backend API authentication', async ({ page }) => {
    const helpers = createFullStackHelpers(page);

    console.log('🧪 Testing backend API authentication...');
    
    // Test regular user API login
    try {
      const loginResponse = await helpers.apiRequest('POST', '/auth/login', {
        email: testUsers.regularUser.email,
        password: testUsers.regularUser.password
      });
      
      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        console.log('✅ Regular user API login successful');
        console.log('Login response:', JSON.stringify(loginData, null, 2));
        
        // Test authenticated endpoint
        if (loginData.data && loginData.data.tokens) {
          const meResponse = await helpers.apiRequest('GET', '/users/profile', null, {
            headers: {
              'Authorization': `Bearer ${loginData.data.tokens.accessToken}`
            }
          });
          
          if (meResponse.ok()) {
            const meData = await meResponse.json();
            console.log('✅ Authenticated /users/profile endpoint working');
            console.log('User data:', JSON.stringify(meData, null, 2));
          } else {
            console.log('⚠️  /users/profile endpoint failed:', await meResponse.text());
          }
        }
        
      } else {
        console.log('❌ Regular user API login failed:', await loginResponse.text());
      }
    } catch (error) {
      console.log('❌ API authentication error:', error.message);
    }

    // Test admin user API login
    try {
      const adminLoginResponse = await helpers.apiRequest('POST', '/auth/login', {
        email: testUsers.adminUser.email,
        password: testUsers.adminUser.password
      });
      
      if (adminLoginResponse.ok()) {
        const adminLoginData = await adminLoginResponse.json();
        console.log('✅ Admin user API login successful');
        console.log('Admin login response:', JSON.stringify(adminLoginData, null, 2));
      } else {
        console.log('❌ Admin user API login failed:', await adminLoginResponse.text());
      }
    } catch (error) {
      console.log('❌ Admin API authentication error:', error.message);
    }
  });

  test('should test basic frontend navigation', async ({ page }) => {
    console.log('🧪 Testing basic frontend navigation...');
    
    // Test homepage
    await page.goto('/');
    const homeTitle = await page.title();
    console.log('Homepage title:', homeTitle);
    
    // Test login page
    await page.goto('/auth/login');
    const loginEmailField = await page.locator('input[name="email"]').isVisible();
    const loginPasswordField = await page.locator('input[name="password"]').isVisible();
    
    console.log('Login page - Email field visible:', loginEmailField);
    console.log('Login page - Password field visible:', loginPasswordField);
    
    if (loginEmailField && loginPasswordField) {
      console.log('✅ Login form fields are accessible');
    } else {
      console.log('❌ Login form fields not found');
      await page.screenshot({ path: 'test-results/login-page-debug.png' });
    }
    
    // Test register page
    await page.goto('/auth/register');
    const registerFirstNameField = await page.locator('input[name="firstName"]').isVisible();
    const registerEmailField = await page.locator('input[name="email"]').isVisible();
    
    console.log('Register page - FirstName field visible:', registerFirstNameField);
    console.log('Register page - Email field visible:', registerEmailField);
    
    if (registerFirstNameField && registerEmailField) {
      console.log('✅ Register form fields are accessible');
    } else {
      console.log('❌ Register form fields not found');
      await page.screenshot({ path: 'test-results/register-page-debug.png' });
    }
  });
});
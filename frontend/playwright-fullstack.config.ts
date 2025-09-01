import { defineConfig, devices } from '@playwright/test';

/**
 * Full-stack configuration for tests that require both backend and frontend
 * Backend: http://localhost:3001
 * Frontend: http://localhost:3000
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*fullstack*.spec.ts', '**/real-auth-test.spec.ts'],
  fullyParallel: false, // Sequential for database consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2, // Limit workers for database integrity
  
  // Global setup for test data
  globalSetup: './e2e/fullstack-global-setup.ts',
  
  reporter: [
    ['html', { outputFolder: 'playwright-report-fullstack' }],
    ['list'],
    ['json', { outputFile: 'test-results/fullstack-results.json' }],
  ],
  
  outputDir: 'test-results-fullstack',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
    
    // Store authentication state (will be set by setup project)
    // storageState: 'test-results/.auth/user.json',
  },

  projects: [
    // Main test project
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Mobile testing
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Use existing servers (backend on 3001, frontend on 3000)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 60000,
  //   env: {
  //     NEXT_PUBLIC_API_URL: 'http://localhost:3001/api/v1',
  //     NODE_ENV: 'test',
  //   },
  // },
});
import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration for UI-only tests that don't require backend
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/fixed-ui-tests.spec.ts', '**/form-validation-tests.spec.ts', '**/recipe-app-coverage.spec.ts', '**/basic-navigation.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report-ui-only' }],
    ['list'],
    ['json', { outputFile: 'test-results/ui-only-results.json' }],
  ],
  outputDir: 'test-results-ui-only',
  use: {
    baseURL: 'http://localhost:3006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only start frontend for UI tests
  webServer: {
    command: 'npm run dev -- --port 3006',
    url: 'http://localhost:3006',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      // Mock backend URL to avoid backend calls
      NEXT_PUBLIC_API_URL: 'http://localhost:9999/api/v1',
      PORT: '3006',
    },
  },
});
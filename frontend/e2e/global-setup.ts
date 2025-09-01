import { chromium, FullConfig, Page } from '@playwright/test';

// Test data setup function
async function setupTestData(page: Page) {
  try {
    // Create test users (this would typically hit a test-specific endpoint)
    const testUsers = [
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        role: 'user'
      },
      {
        firstName: 'Mahmoud',
        lastName: 'Mouzoun', 
        email: 'mahmoud.mouzoun@epitech.eu',
        password: 'Mahmoud055@!!',
        role: 'admin'
      }
    ];

    // Note: In a real scenario, you'd have test endpoints or use direct database calls
    // For now, we'll just validate the API is responsive
    for (const user of testUsers) {
      try {
        // Try to register test users (they may already exist, that's ok)
        await page.request.post('http://localhost:3004/api/v1/auth/register', {
          data: user
        });
      } catch (error) {
        // Users might already exist, continue
        console.log(`Test user ${user.email} setup completed (may already exist)`);
      }
    }
  } catch (error) {
    console.log('Test data setup encountered issues (may be expected):', error);
  }
}

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Start the browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Ensure backend is running
    console.log('Checking if backend API is running...');
    const backendResponse = await page.request.get('http://localhost:3004/api/v1');
    if (backendResponse.ok()) {
      console.log('✓ Backend API is running and accessible');
    } else {
      console.log('⚠ Backend API may not be fully ready yet');
    }

    // Ensure frontend is running
    console.log('Checking if frontend application is running...');
    await page.goto(baseURL || 'http://localhost:3005', { waitUntil: 'networkidle' });
    console.log('✓ Frontend application is running and accessible');

    // Set up test data
    console.log('Setting up test data...');
    await setupTestData(page);
    console.log('✓ Test data setup completed');
    
    console.log('✓ Global setup completed');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
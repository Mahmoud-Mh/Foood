import { chromium, FullConfig } from '@playwright/test';

// Real test users for consistent testing
export const testUsers = {
  regularUser: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@gmail.com',
    password: 'Mahmoud055@!!'
  },
  adminUser: {
    firstName: 'Mahmoud',
    lastName: 'Mouzoun',
    email: 'mahmoud.mouzoun@epitech.eu', 
    password: 'Mahmoud055@!!'
  },
  newUser: {
    firstName: 'New',
    lastName: 'User',
    email: `newuser${Date.now()}@test.com`,
    password: 'NewPassword123!'
  }
};

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🚀 Setting up full-stack test environment...');
    
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend API...');
    let backendReady = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!backendReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get('http://localhost:3001/api/v1/health');
        if (response.ok()) {
          console.log('✅ Backend API is ready');
          backendReady = true;
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!backendReady) {
      throw new Error('❌ Backend API failed to start after 60 seconds');
    }

    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend...');
    let frontendReady = false;
    attempts = 0;
    
    while (!frontendReady && attempts < maxAttempts) {
      try {
        await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 5000 });
        console.log('✅ Frontend is ready');
        frontendReady = true;
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!frontendReady) {
      throw new Error('❌ Frontend failed to start after 60 seconds');
    }

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await cleanupTestData(page);

    // Using real user accounts - skipping user creation
    console.log('👥 Using existing real user accounts...');

    console.log('✅ Global setup completed successfully!');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page) {
  try {
    // Delete test users if they exist
    for (const user of Object.values(testUsers)) {
      try {
        const response = await page.request.delete(`http://localhost:3001/api/v1/test/users/${user.email}`);
        if (response.ok()) {
          console.log(`🗑️  Deleted existing test user: ${user.email}`);
        }
      } catch (error) {
        // User might not exist, continue
      }
    }
  } catch (error) {
    console.log('⚠️  Cleanup encountered issues (may be expected)');
  }
}

async function createTestUsers(page) {
  for (const [key, user] of Object.entries(testUsers)) {
    try {
      const response = await page.request.post('http://localhost:3001/api/v1/auth/register', {
        data: user,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok()) {
        console.log(`✅ Created test user: ${user.email} (${key})`);
      } else {
        const errorText = await response.text();
        if (errorText.includes('already exists') || errorText.includes('duplicate')) {
          console.log(`ℹ️  Test user already exists: ${user.email}`);
        } else {
          console.log(`⚠️  Failed to create ${user.email}: ${errorText}`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Error creating user ${user.email}:`, error.message);
    }
  }
}

export default globalSetup;
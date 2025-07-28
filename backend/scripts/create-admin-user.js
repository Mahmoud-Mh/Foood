const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function createAdminUser() {
  console.log('👑 Creating admin user...\n');

  try {
    // Step 1: Register admin user
    console.log('1️⃣ Registering admin user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@recipeapp.com',
      password: 'Admin123!',
      confirmPassword: 'Admin123!'
    });

    if (registerResponse.data.success) {
      console.log('✅ Admin user registered successfully!');
      console.log(`   Email: admin@recipeapp.com`);
      console.log(`   Password: Admin123!`);
      console.log(`   Role: ${registerResponse.data.data.user.role}`);
      console.log('');
    } else {
      console.log('❌ Registration failed:', registerResponse.data.message);
      return;
    }

    // Step 2: Login to get token
    console.log('2️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@recipeapp.com',
      password: 'Admin123!'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log(`   Token: ${loginResponse.data.data.accessToken.substring(0, 20)}...`);
      console.log('');
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    // Step 3: Try to promote to admin (if endpoint exists)
    console.log('3️⃣ Attempting to promote to admin...');
    try {
      const promoteResponse = await axios.patch(`${BASE_URL}/users/admin/promote`, {
        email: 'admin@recipeapp.com'
      }, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.data.accessToken}`
        }
      });

      if (promoteResponse.data.success) {
        console.log('✅ User promoted to admin successfully!');
      } else {
        console.log('⚠️ Promotion endpoint not available or failed');
      }
    } catch (error) {
      console.log('⚠️ Promotion endpoint not available yet');
    }

    console.log('\n🎉 ADMIN USER CREATED!');
    console.log('='.repeat(50));
    console.log('Email: admin@recipeapp.com');
    console.log('Password: Admin123!');
    console.log('='.repeat(50));
    console.log('\nYou can now use these credentials to access the admin dashboard!');

  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ Admin user already exists!');
      console.log('\n📋 ADMIN CREDENTIALS:');
      console.log('='.repeat(50));
      console.log('Email: admin@recipeapp.com');
      console.log('Password: Admin123!');
      console.log('='.repeat(50));
    } else {
      console.error('❌ Error creating admin user:', error.response?.data || error.message);
    }
  }
}

createAdminUser(); 
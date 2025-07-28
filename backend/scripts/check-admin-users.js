const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function checkAdminUsers() {
  console.log('🔍 Checking for admin users in the database...\n');

  try {
    // Test 1: Try to login with known admin credentials
    const adminCredentials = [
      {
        email: 'admin@recipeapp.com',
        password: 'admin123'
      },
      {
        email: 'test.chef@recipeapp.com',
        password: 'TestChef123!'
      },
      {
        email: 'mahmoud.mouzoun@epitech.eu',
        password: 'Mahmoud055@!!'
      }
    ];

    for (const creds of adminCredentials) {
      try {
        console.log(`Testing login with: ${creds.email}`);
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: creds.email,
          password: creds.password
        });

        if (loginResponse.data.success) {
          const user = loginResponse.data.data.user;
          console.log('✅ Login successful!');
          console.log(`   Name: ${user.firstName} ${user.lastName}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   ID: ${user.id}`);
          
          if (user.role === 'admin') {
            console.log('\n🎉 ADMIN USER FOUND!');
            console.log('='.repeat(50));
            console.log(`Email: ${creds.email}`);
            console.log(`Password: ${creds.password}`);
            console.log(`Role: ${user.role}`);
            console.log('='.repeat(50));
          }
          console.log('');
        } else {
          console.log('❌ Login failed:', loginResponse.data.message);
        }
      } catch (error) {
        console.log(`❌ Error with ${creds.email}:`, error.response?.data?.message || error.message);
      }
    }

    // Test 2: Try to get all users (if admin endpoint exists)
    console.log('🔍 Trying to get all users...');
    try {
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test.chef@recipeapp.com',
        password: 'TestChef123!'
      });

      if (adminLogin.data.success) {
        const token = adminLogin.data.data.accessToken;
        
        // Try to get users (this endpoint might not exist yet)
        try {
          const usersResponse = await axios.get(`${BASE_URL}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (usersResponse.data.success) {
            console.log('✅ Found users:');
            usersResponse.data.data.forEach(user => {
              console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
            });
          }
        } catch (error) {
          console.log('⚠️ Users endpoint not available yet');
        }
      }
    } catch (error) {
      console.log('❌ Could not test users endpoint');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

checkAdminUsers(); 
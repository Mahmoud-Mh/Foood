const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testUsersEndpoint() {
  try {
    // First, let's login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@recipeapp.com',
      password: 'Admin123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful');

    // Test the users endpoint with search
    console.log('\n🔍 Testing users endpoint with search...');
    const usersResponse = await axios.get(`${BASE_URL}/users?search=admin&page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Users endpoint response:', {
      success: usersResponse.data.success,
      message: usersResponse.data.message,
      totalUsers: usersResponse.data.data?.data?.length || 0,
      total: usersResponse.data.data?.total || 0
    });

    // Test without search
    console.log('\n🔍 Testing users endpoint without search...');
    const usersResponse2 = await axios.get(`${BASE_URL}/users?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Users endpoint response (no search):', {
      success: usersResponse2.data.success,
      message: usersResponse2.data.message,
      totalUsers: usersResponse2.data.data?.data?.length || 0,
      total: usersResponse2.data.data?.total || 0
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testUsersEndpoint(); 
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testAuthToken() {
  console.log('🔍 Testing Authentication Token...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mahmoud.mouzoun@epitech.eu',
      password: 'Mahmoud055@!!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...');
    console.log('');

    // Step 2: Test token with a simple request
    console.log('2️⃣ Testing token with /auth/me...');
    try {
      const meResponse = await axios.post(`${BASE_URL}/auth/me`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Token works! User:', meResponse.data.data.firstName, meResponse.data.data.lastName);
      console.log('');
      
    } catch (error) {
      console.log('❌ Token test failed');
      console.log('Status:', error.response?.status);
      console.log('Response:', error.response?.data);
      return;
    }

    // Step 3: Test with recipes endpoint
    console.log('3️⃣ Testing token with /recipes (GET)...');
    try {
      const recipesResponse = await axios.get(`${BASE_URL}/recipes?page=1&limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Recipes endpoint works with token!');
      console.log('');
      
    } catch (error) {
      console.log('❌ Recipes endpoint failed');
      console.log('Status:', error.response?.status);
      console.log('Response:', error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuthToken(); 
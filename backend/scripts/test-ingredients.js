const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testIngredients() {
  console.log('🧪 Testing ingredients endpoint...\n');

  try {
    // Test public ingredients endpoint
    console.log('📋 Testing public ingredients endpoint...');
    const publicResponse = await axios.get(`${BASE_URL}/ingredients/public`);
    console.log('✅ Public ingredients response:', publicResponse.data);

    // Test authenticated ingredients endpoint
    console.log('\n🔐 Testing authenticated ingredients endpoint...');
    const authResponse = await axios.get(`${BASE_URL}/ingredients?limit=10`);
    console.log('✅ Authenticated ingredients response:', authResponse.data);

  } catch (error) {
    console.error('❌ Error testing ingredients:', error.response?.data || error.message);
  }
}

testIngredients(); 
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testIngredientsPublic() {
  console.log('🧪 Testing Ingredients Public Endpoints...\n');

  try {
    // Test 1: Get all active ingredients (should be public)
    console.log('1️⃣ Testing GET /ingredients/active...');
    const activeIngredientsResponse = await axios.get(`${BASE_URL}/ingredients/active`);
    console.log('✅ Success:', activeIngredientsResponse.data.message);
    console.log(`   Found ${activeIngredientsResponse.data.data.length} active ingredients`);
    console.log('');

    // Test 2: Get ingredients by category (should be public)
    console.log('2️⃣ Testing GET /ingredients/category/vegetable...');
    const categoryIngredientsResponse = await axios.get(`${BASE_URL}/ingredients/category/vegetable`);
    console.log('✅ Success:', categoryIngredientsResponse.data.message);
    console.log(`   Found ${categoryIngredientsResponse.data.data.length} vegetable ingredients`);
    console.log('');

    // Test 3: Get most used ingredients (should be public)
    console.log('3️⃣ Testing GET /ingredients/most-used...');
    const mostUsedResponse = await axios.get(`${BASE_URL}/ingredients/most-used`);
    console.log('✅ Success:', mostUsedResponse.data.message);
    console.log(`   Found ${mostUsedResponse.data.data.length} most used ingredients`);
    console.log('');

    // Test 4: Test without any authentication headers
    console.log('4️⃣ Testing completely public access (no headers)...');
    const publicResponse = await axios.get(`${BASE_URL}/ingredients/active`, {
      headers: {}
    });
    console.log('✅ Success: Completely public access works!');
    console.log(`   Found ${publicResponse.data.data.length} ingredients without any auth`);
    console.log('');

    console.log('🎉 All ingredients public endpoints are working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testIngredientsPublic(); 
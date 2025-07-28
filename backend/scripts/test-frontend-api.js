const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testFrontendAPI() {
  console.log('🧪 Testing Frontend API calls...\n');

  try {
    // Test the exact call the frontend makes
    console.log('📋 Testing /recipes/published (frontend call)...');
    const response = await axios.get(`${BASE_URL}/recipes/published`, {
      params: {
        limit: 12,
        page: 1
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data structure:', Object.keys(response.data));
    console.log('✅ Success:', response.data.success);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Total recipes:', response.data.data.total);
    console.log('✅ Items returned:', response.data.data.items.length);
    
    if (response.data.data.items.length > 0) {
      console.log('✅ First recipe:', {
        id: response.data.data.items[0].id,
        title: response.data.data.items[0].title,
        status: response.data.data.items[0].status
      });
    }

    // Test categories endpoint
    console.log('\n📋 Testing /categories/active...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    console.log('✅ Categories response:');
    console.log(`   Status: ${categoriesResponse.status}`);
    console.log(`   Categories returned: ${categoriesResponse.data.data.length}`);

  } catch (error) {
    console.error('❌ Error testing frontend API:', error.response?.data || error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

testFrontendAPI(); 
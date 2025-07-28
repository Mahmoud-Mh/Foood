const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function debugAPIResponse() {
  console.log('🔍 Debugging API response structure...\n');

  try {
    // Get published recipes
    console.log('📋 Testing /recipes/published...');
    const response = await axios.get(`${BASE_URL}/recipes/published?limit=5`);
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data keys:', Object.keys(response.data));
    console.log('✅ Success:', response.data.success);
    console.log('✅ Message:', response.data.message);
    
    if (response.data.data) {
      console.log('✅ Data keys:', Object.keys(response.data.data));
      console.log('✅ Total:', response.data.data.total);
      console.log('✅ Items type:', typeof response.data.data.items);
      
      if (response.data.data.items) {
        console.log('✅ Items length:', response.data.data.items.length);
        if (response.data.data.items.length > 0) {
          console.log('✅ First item keys:', Object.keys(response.data.data.items[0]));
          console.log('✅ First item:', JSON.stringify(response.data.data.items[0], null, 2));
        }
      } else {
        console.log('❌ Items is undefined or null');
      }
    } else {
      console.log('❌ Data is undefined or null');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugAPIResponse(); 
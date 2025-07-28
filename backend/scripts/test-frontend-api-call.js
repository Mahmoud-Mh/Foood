const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testFrontendApiCall() {
  console.log('🧪 Testing Frontend API Call...\n');

  try {
    // Test 1: Get categories (what frontend does first)
    console.log('1️⃣ Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    
    if (!categoriesResponse.data.success) {
      console.log('❌ Failed to get categories:', categoriesResponse.data.message);
      return;
    }

    const categories = categoriesResponse.data.data;
    console.log('✅ Success: Found categories');
    console.log(`   Found ${categories.length} categories`);
    console.log('');

    // Test 2: Simulate frontend API call for recipes by category
    const firstCategory = categories[0];
    console.log(`2️⃣ Testing frontend API call for category: ${firstCategory.name}`);
    console.log(`   Category ID: ${firstCategory.id}`);
    
    try {
      // This is exactly what the frontend is calling
      const recipesResponse = await axios.get(`${BASE_URL}/recipes/published`, {
        params: {
          categoryId: firstCategory.id,
          limit: 6,
          page: 1
        }
      });
      
      console.log('✅ API Response:', recipesResponse.data);
      
      if (recipesResponse.data.success) {
        const recipes = recipesResponse.data.data.data || [];
        console.log(`   Found ${recipes.length} recipes`);
        if (recipes.length > 0) {
          console.log(`   Sample recipe: ${recipes[0].title}`);
        }
      } else {
        console.log(`   ❌ Failed: ${recipesResponse.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Full error:`, error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendApiCall(); 
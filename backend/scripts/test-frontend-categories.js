const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testFrontendCategories() {
  console.log('🧪 Testing Frontend Category API Calls...\n');

  try {
    // Test 1: Simulate frontend getAllPublicCategories() call
    console.log('1️⃣ Testing frontend getAllPublicCategories()...');
    const activeCategoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    console.log('✅ Success:', activeCategoriesResponse.data.message);
    console.log(`   Found ${activeCategoriesResponse.data.data.length} categories`);
    
    // Show first few categories
    activeCategoriesResponse.data.data.slice(0, 3).forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name} (${category.slug})`);
    });
    console.log('');

    // Test 2: Simulate frontend getCategoryById() call
    if (activeCategoriesResponse.data.data.length > 0) {
      const firstCategory = activeCategoriesResponse.data.data[0];
      console.log(`2️⃣ Testing frontend getCategoryById(${firstCategory.id})...`);
      const categoryByIdResponse = await axios.get(`${BASE_URL}/categories/${firstCategory.id}`);
      console.log('✅ Success:', categoryByIdResponse.data.message);
      console.log(`   Category: ${categoryByIdResponse.data.data.name}`);
      console.log(`   Description: ${categoryByIdResponse.data.data.description || 'No description'}`);
      console.log(`   Active: ${categoryByIdResponse.data.data.isActive}`);
      console.log('');

      // Test 3: Test category with recipes
      console.log(`3️⃣ Testing category with recipes (${firstCategory.name})...`);
      try {
        const recipesResponse = await axios.get(`${BASE_URL}/recipes/category/${firstCategory.id}?page=1&limit=5`);
        console.log('✅ Success: Found recipes for category');
        console.log(`   Found ${recipesResponse.data.data.data.length} recipes`);
        recipesResponse.data.data.data.slice(0, 3).forEach((recipe, index) => {
          console.log(`   ${index + 1}. ${recipe.title} (${recipe.status})`);
        });
      } catch (error) {
        console.log('⚠️ No recipes found for this category');
      }
      console.log('');
    }

    // Test 4: Test without any authentication headers
    console.log('4️⃣ Testing completely public access (no headers)...');
    const publicResponse = await axios.get(`${BASE_URL}/categories/active`, {
      headers: {}
    });
    console.log('✅ Success: Completely public access works!');
    console.log(`   Found ${publicResponse.data.data.length} categories without any auth`);
    console.log('');

    console.log('🎉 All frontend category tests passed! Categories are fully public and accessible.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendCategories(); 
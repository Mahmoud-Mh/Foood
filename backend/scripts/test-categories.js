const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testCategories() {
  console.log('🧪 Testing Categories Endpoints...\n');

  try {
    // Test 1: Get all categories (paginated)
    console.log('1️⃣ Testing GET /categories (paginated)...');
    const allCategoriesResponse = await axios.get(`${BASE_URL}/categories?page=1&limit=10`);
    console.log('✅ Success:', allCategoriesResponse.data.message);
    console.log(`   Found ${allCategoriesResponse.data.data.data.length} categories`);
    console.log('');

    // Test 2: Get active categories
    console.log('2️⃣ Testing GET /categories/active...');
    const activeCategoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    console.log('✅ Success:', activeCategoriesResponse.data.message);
    console.log(`   Found ${activeCategoriesResponse.data.data.length} active categories`);
    console.log('');

    // Test 3: Get category by ID (if categories exist)
    if (activeCategoriesResponse.data.data.length > 0) {
      const firstCategory = activeCategoriesResponse.data.data[0];
      console.log(`3️⃣ Testing GET /categories/${firstCategory.id}...`);
      const categoryByIdResponse = await axios.get(`${BASE_URL}/categories/${firstCategory.id}`);
      console.log('✅ Success:', categoryByIdResponse.data.message);
      console.log(`   Category: ${categoryByIdResponse.data.data.name}`);
      console.log('');

      // Test 4: Get category by slug
      console.log(`4️⃣ Testing GET /categories/slug/${firstCategory.slug}...`);
      const categoryBySlugResponse = await axios.get(`${BASE_URL}/categories/slug/${firstCategory.slug}`);
      console.log('✅ Success:', categoryBySlugResponse.data.message);
      console.log(`   Category: ${categoryBySlugResponse.data.data.name}`);
      console.log('');
    }

    // Test 5: Test without authentication (should work for public endpoints)
    console.log('5️⃣ Testing public access (no auth token)...');
    const publicResponse = await axios.get(`${BASE_URL}/categories/active`);
    console.log('✅ Success: Public access works!');
    console.log(`   Found ${publicResponse.data.data.length} categories without authentication`);
    console.log('');

    console.log('🎉 All category tests passed! Categories are properly public.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCategories(); 
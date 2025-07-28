const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testCategoryRecipes() {
  console.log('🧪 Testing Category Recipes...\n');

  try {
    // Test 1: Get all categories
    console.log('1️⃣ Getting all categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    
    if (!categoriesResponse.data.success) {
      console.log('❌ Failed to get categories:', categoriesResponse.data.message);
      return;
    }

    const categories = categoriesResponse.data.data;
    console.log('✅ Success: Found categories');
    console.log(`   Found ${categories.length} categories`);
    console.log('');

    // Test 2: Get recipes for each category
    for (const category of categories.slice(0, 3)) { // Test first 3 categories
      console.log(`2️⃣ Testing recipes for category: ${category.name} (${category.id})`);
      
      try {
        const recipesResponse = await axios.get(`${BASE_URL}/recipes/category/${category.id}`);
        
        if (recipesResponse.data.success) {
          const recipes = recipesResponse.data.data.data || [];
          console.log(`   ✅ Found ${recipes.length} recipes`);
          if (recipes.length > 0) {
            console.log(`   Sample recipe: ${recipes[0].title}`);
          }
        } else {
          console.log(`   ❌ Failed: ${recipesResponse.data.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
      console.log('');
    }

    // Test 3: Get published recipes with category filter
    console.log('3️⃣ Testing published recipes with category filter...');
    try {
      const publishedResponse = await axios.get(`${BASE_URL}/recipes/published?categoryId=${categories[0].id}`);
      
      if (publishedResponse.data.success) {
        const recipes = publishedResponse.data.data.data || [];
        console.log(`   ✅ Found ${recipes.length} published recipes for category ${categories[0].name}`);
      } else {
        console.log(`   ❌ Failed: ${publishedResponse.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCategoryRecipes(); 
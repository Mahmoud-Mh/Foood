const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function checkDatabase() {
  console.log('🔍 Checking database state...\n');

  try {
    // Check categories
    console.log('📋 Checking categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    console.log(`✅ Found ${categoriesResponse.data.data.length} categories`);
    categoriesResponse.data.data.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.recipeCount || 0} recipes)`);
    });

    // Check recipes
    console.log('\n🍳 Checking recipes...');
    const recipesResponse = await axios.get(`${BASE_URL}/recipes/published?limit=1`);
    console.log(`✅ Found ${recipesResponse.data.data.total} published recipes`);

    // Check ingredients
    console.log('\n🥕 Checking ingredients...');
    const ingredientsResponse = await axios.get(`${BASE_URL}/ingredients?limit=1`);
    console.log(`✅ Found ${ingredientsResponse.data.data.total} ingredients`);

    // Check users
    console.log('\n👥 Checking users...');
    const usersResponse = await axios.get(`${BASE_URL}/users?limit=1`);
    console.log(`✅ Found ${usersResponse.data.data.total} users`);

    console.log('\n📊 Database Summary:');
    console.log(`   Categories: ${categoriesResponse.data.data.length}`);
    console.log(`   Published Recipes: ${recipesResponse.data.data.total}`);
    console.log(`   Ingredients: ${ingredientsResponse.data.data.total}`);
    console.log(`   Users: ${usersResponse.data.data.total}`);

  } catch (error) {
    console.error('❌ Error checking database:', error.response?.data || error.message);
  }
}

checkDatabase(); 
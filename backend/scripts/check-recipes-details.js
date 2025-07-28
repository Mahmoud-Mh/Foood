const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function checkRecipesDetails() {
  console.log('🔍 Checking recipe details...\n');

  try {
    // Get published recipes
    console.log('📋 Getting published recipes...');
    const response = await axios.get(`${BASE_URL}/recipes/published?limit=10`);
    
    console.log('✅ Published recipes found:', response.data.data.total);
    console.log('✅ Items returned:', response.data.data.items.length);
    
    if (response.data.data.items.length > 0) {
      console.log('\n📝 Recipe details:');
      response.data.data.items.forEach((recipe, index) => {
        console.log(`\n${index + 1}. ${recipe.title}`);
        console.log(`   ID: ${recipe.id}`);
        console.log(`   Status: ${recipe.status}`);
        console.log(`   Difficulty: ${recipe.difficulty}`);
        console.log(`   Category: ${recipe.category?.name || 'N/A'}`);
        console.log(`   Author: ${recipe.author?.name || 'N/A'}`);
        console.log(`   Views: ${recipe.viewsCount || 0}`);
        console.log(`   Ingredients: ${recipe.ingredients?.length || 0}`);
        console.log(`   Steps: ${recipe.steps?.length || 0}`);
      });
    }

    // Test individual recipe endpoint
    if (response.data.data.items.length > 0) {
      const firstRecipe = response.data.data.items[0];
      console.log(`\n🍳 Testing individual recipe endpoint: /recipes/${firstRecipe.id}`);
      
      const singleResponse = await axios.get(`${BASE_URL}/recipes/${firstRecipe.id}`);
      console.log('✅ Individual recipe response:');
      console.log(`   Title: ${singleResponse.data.data.title}`);
      console.log(`   Status: ${singleResponse.data.data.status}`);
      console.log(`   Ingredients: ${singleResponse.data.data.ingredients?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error checking recipes:', error.response?.data || error.message);
  }
}

checkRecipesDetails(); 
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testRecipesAPI() {
  console.log('🧪 Testing Recipes API endpoints...\n');

  try {
    // Test published recipes endpoint
    console.log('📋 Testing /recipes/published...');
    const publishedResponse = await axios.get(`${BASE_URL}/recipes/published?limit=5`);
    console.log('✅ Published recipes response:');
    console.log(`   Status: ${publishedResponse.status}`);
    console.log(`   Total recipes: ${publishedResponse.data.data.total}`);
    console.log(`   Recipes returned: ${publishedResponse.data.data.items.length}`);
    
    if (publishedResponse.data.data.items.length > 0) {
      console.log('   Sample recipe:', publishedResponse.data.data.items[0].title);
    }

    // Test featured recipes endpoint
    console.log('\n⭐ Testing /recipes/featured...');
    const featuredResponse = await axios.get(`${BASE_URL}/recipes/featured?limit=5`);
    console.log('✅ Featured recipes response:');
    console.log(`   Status: ${featuredResponse.status}`);
    console.log(`   Total recipes: ${featuredResponse.data.data.total}`);
    console.log(`   Recipes returned: ${featuredResponse.data.data.items.length}`);

    // Test search endpoint
    console.log('\n🔍 Testing /recipes/search...');
    const searchResponse = await axios.get(`${BASE_URL}/recipes/search?q=eggs&limit=5`);
    console.log('✅ Search recipes response:');
    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Total recipes: ${searchResponse.data.data.total}`);
    console.log(`   Recipes returned: ${searchResponse.data.data.items.length}`);

    // Test individual recipe endpoint
    if (publishedResponse.data.data.items.length > 0) {
      const firstRecipeId = publishedResponse.data.data.items[0].id;
      console.log(`\n🍳 Testing /recipes/${firstRecipeId}...`);
      const singleResponse = await axios.get(`${BASE_URL}/recipes/${firstRecipeId}`);
      console.log('✅ Single recipe response:');
      console.log(`   Status: ${singleResponse.status}`);
      console.log(`   Recipe title: ${singleResponse.data.data.title}`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testRecipesAPI(); 
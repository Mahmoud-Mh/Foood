const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function publishUserRecipes() {
  console.log('📝 Publishing user recipes...\n');

  try {
    // Login with your user account
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mahmoud.mouzoun@epitech.eu',
      password: 'Mahmoud055@!!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Logged in successfully');

    // Get your recipes
    console.log('\n📋 Getting your recipes...');
    const myRecipesResponse = await axios.get(`${BASE_URL}/recipes/my/recipes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const recipes = myRecipesResponse.data.data.data;
    console.log(`✅ Found ${recipes.length} recipes`);

    // Publish each draft recipe
    let publishedCount = 0;
    for (const recipe of recipes) {
      if (recipe.status === 'draft') {
        console.log(`\n📝 Publishing recipe: ${recipe.title}`);
        
        try {
          const updateResponse = await axios.patch(
            `${BASE_URL}/recipes/${recipe.id}`,
            {
              status: 'published'
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log(`✅ Successfully published: ${recipe.title}`);
          publishedCount++;
        } catch (error) {
          console.error(`❌ Failed to publish ${recipe.title}:`, error.response?.data || error.message);
        }
      } else {
        console.log(`⏭️ Skipping ${recipe.title} - already ${recipe.status}`);
      }
    }

    console.log(`\n🎉 Publishing completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Published: ${publishedCount} recipes`);
    console.log(`   Total processed: ${recipes.length}`);

    // Show final status
    console.log('\n📋 Checking final status...');
    const finalRecipesResponse = await axios.get(`${BASE_URL}/recipes/my/recipes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n📝 Final recipe status:');
    finalRecipesResponse.data.data.data.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.title} - ${recipe.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

publishUserRecipes(); 
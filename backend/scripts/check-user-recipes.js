const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function checkUserRecipes() {
  console.log('👤 Checking user recipes...\n');

  try {
    // Login with your user account (replace with your actual email)
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mahmoud.mouzoun@epitech.eu',
      password: 'Mahmoud055@!!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Logged in successfully');

    // Get your recipes (including drafts)
    console.log('\n📋 Getting your recipes...');
    const myRecipesResponse = await axios.get(`${BASE_URL}/recipes/my/recipes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Your recipes found:', myRecipesResponse.data.data.total);
    
    if (myRecipesResponse.data.data.data.length > 0) {
      console.log('\n📝 Your recipes:');
      myRecipesResponse.data.data.data.forEach((recipe, index) => {
        console.log(`\n${index + 1}. ${recipe.title}`);
        console.log(`   ID: ${recipe.id}`);
        console.log(`   Status: ${recipe.status}`);
        console.log(`   Category: ${recipe.category?.name || 'N/A'}`);
        console.log(`   Created: ${recipe.createdAt}`);
        console.log(`   Views: ${recipe.viewsCount || 0}`);
      });
    } else {
      console.log('❌ No recipes found for your account');
    }

    // Check all recipes (admin view)
    console.log('\n📋 Getting all recipes (admin view)...');
    const allRecipesResponse = await axios.get(`${BASE_URL}/recipes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Total recipes in system:', allRecipesResponse.data.data.total);
    
    if (allRecipesResponse.data.data.data.length > 0) {
      console.log('\n📝 All recipes by status:');
      const recipesByStatus = {};
      allRecipesResponse.data.data.data.forEach(recipe => {
        if (!recipesByStatus[recipe.status]) {
          recipesByStatus[recipe.status] = [];
        }
        recipesByStatus[recipe.status].push(recipe.title);
      });
      
      Object.entries(recipesByStatus).forEach(([status, titles]) => {
        console.log(`\n${status.toUpperCase()} (${titles.length}):`);
        titles.forEach(title => console.log(`  - ${title}`));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.log('\n💡 To use this script:');
    console.log('1. Replace "your.email@example.com" with your actual email');
    console.log('2. Replace "your-password" with your actual password');
  }
}

checkUserRecipes(); 
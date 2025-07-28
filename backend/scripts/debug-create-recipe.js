const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function debugCreateRecipe() {
  console.log('🔍 Debugging Recipe Creation...\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mahmoud.mouzoun@epitech.eu',
      password: 'Mahmoud055@!!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    console.log('');

    // Step 2: Get categories
    console.log('2️⃣ Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    const firstCategory = categoriesResponse.data.data[0];
    console.log(`✅ Found category: ${firstCategory.name} (${firstCategory.id})`);
    console.log('');

    // Step 3: Get ingredients
    console.log('3️⃣ Getting ingredients...');
    const ingredientsResponse = await axios.get(`${BASE_URL}/ingredients/category/vegetable`);
    const firstIngredient = ingredientsResponse.data.data[0];
    console.log(`✅ Found ingredient: ${firstIngredient.name} (${firstIngredient.id})`);
    console.log('');

    // Step 4: Create test recipe data
    console.log('4️⃣ Creating test recipe data...');
    const testRecipeData = {
      title: 'Test Recipe - Debug',
      description: 'A test recipe for debugging',
      instructions: 'This is a test recipe for debugging purposes.',
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      servings: 4,
      categoryId: firstCategory.id,
      difficulty: 'easy',
      status: 'draft',
      ingredients: [
        {
          ingredientId: firstIngredient.id,
          quantity: 2,
          unit: 'cups',
          preparation: 'finely chopped'
        }
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Prepare ingredients',
          instructions: 'Wash and chop all vegetables'
        },
        {
          stepNumber: 2,
          title: 'Cook vegetables',
          instructions: 'Heat oil in pan and cook vegetables for 10 minutes'
        }
      ]
    };

    console.log('📋 Recipe data to send:');
    console.log(JSON.stringify(testRecipeData, null, 2));
    console.log('');

    // Step 5: Try to create recipe
    console.log('5️⃣ Attempting to create recipe...');
    try {
      const createResponse = await axios.post(`${BASE_URL}/recipes`, testRecipeData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Recipe created successfully!');
      console.log('Response:', createResponse.data);
      
    } catch (error) {
      console.log('❌ Recipe creation failed');
      console.log('Status:', error.response?.status);
      console.log('Status Text:', error.response?.statusText);
      console.log('Response Data:', error.response?.data);
      console.log('Full Error:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugCreateRecipe(); 
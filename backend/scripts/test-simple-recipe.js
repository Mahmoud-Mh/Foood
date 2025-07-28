const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testSimpleRecipe() {
  console.log('🧪 Testing Simple Recipe Creation...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mahmoud.mouzoun@epitech.eu',
      password: 'Mahmoud055@!!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    console.log('');

    // Step 2: Get category
    console.log('2️⃣ Getting category...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    const category = categoriesResponse.data.data[0];
    console.log(`✅ Using category: ${category.name}`);
    console.log('');

    // Step 3: Create minimal recipe
    console.log('3️⃣ Creating minimal recipe...');
    const minimalRecipe = {
      title: 'Test Recipe',
      description: 'A test recipe',
      instructions: 'Test instructions',
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      servings: 2,
      categoryId: category.id,
      difficulty: 'easy',
      status: 'draft',
      ingredients: [
        {
          ingredientId: 'test-ingredient',
          quantity: 1,
          unit: 'cup'
        }
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1',
          instructions: 'Do something'
        }
      ]
    };

    console.log('📋 Sending data:');
    console.log(JSON.stringify(minimalRecipe, null, 2));
    console.log('');

    try {
      const createResponse = await axios.post(`${BASE_URL}/recipes`, minimalRecipe, {
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
      console.log('Error Message:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSimpleRecipe(); 
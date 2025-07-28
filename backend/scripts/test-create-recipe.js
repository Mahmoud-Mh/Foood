const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testCreateRecipe() {
  console.log('🧪 Testing Create Recipe Functionality...\n');

  try {
    // Test 1: Try to create recipe without authentication (should fail)
    console.log('1️⃣ Testing create recipe without authentication...');
    try {
      await axios.post(`${BASE_URL}/recipes`, {
        title: 'Test Recipe',
        description: 'A test recipe',
        instructions: 'Test instructions',
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        difficulty: 'easy',
        status: 'draft',
        ingredients: [
          {
            ingredientId: 'test-id',
            quantity: 1,
            unit: 'cup',
            notes: 'Test ingredient'
          }
        ],
        steps: [
          {
            title: 'Step 1',
            instructions: 'Test step instructions',
            order: 1
          }
        ]
      });
      console.log('❌ FAILED: Should have required authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Success: Authentication required (401 Unauthorized)');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }
    console.log('');

    // Test 2: Login to get authentication token
    console.log('2️⃣ Logging in to get authentication token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mahmoud.mouzoun@epitech.eu',
      password: 'Mahmoud055@!!'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.accessToken;
      console.log('✅ Success: Login successful');
      console.log(`   User: ${loginResponse.data.data.user.firstName} ${loginResponse.data.data.user.lastName}`);
      console.log('');

      // Test 3: Get categories for recipe creation
      console.log('3️⃣ Getting categories for recipe creation...');
      const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
      console.log('✅ Success: Categories retrieved');
      console.log(`   Found ${categoriesResponse.data.data.length} categories`);
      
      const firstCategory = categoriesResponse.data.data[0];
      console.log(`   Using category: ${firstCategory.name} (${firstCategory.id})`);
      console.log('');

      // Test 4: Get ingredients for recipe creation
      console.log('4️⃣ Getting ingredients for recipe creation...');
      const ingredientsResponse = await axios.get(`${BASE_URL}/ingredients/category/vegetable`);
      console.log('✅ Success: Ingredients retrieved');
      console.log(`   Found ${ingredientsResponse.data.data.length} vegetable ingredients`);
      
      const firstIngredient = ingredientsResponse.data.data[0];
      console.log(`   Using ingredient: ${firstIngredient.name} (${firstIngredient.id})`);
      console.log('');

      // Test 5: Create a test recipe with authentication
      console.log('5️⃣ Creating test recipe with authentication...');
      const createRecipeData = {
        title: 'Test Recipe - API Test',
        description: 'A test recipe created via API',
        instructions: 'This is a test recipe created to verify the create recipe functionality works correctly.',
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
            notes: 'Fresh vegetables'
          }
        ],
        steps: [
          {
            title: 'Prepare ingredients',
            instructions: 'Wash and chop all vegetables',
            order: 1
          },
          {
            title: 'Cook vegetables',
            instructions: 'Heat oil in pan and cook vegetables for 10 minutes',
            order: 2
          },
          {
            title: 'Serve',
            instructions: 'Plate and serve hot',
            order: 3
          }
        ]
      };

      const createResponse = await axios.post(`${BASE_URL}/recipes`, createRecipeData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (createResponse.data.success) {
        console.log('✅ Success: Recipe created successfully!');
        console.log(`   Recipe ID: ${createResponse.data.data.id}`);
        console.log(`   Title: ${createResponse.data.data.title}`);
        console.log(`   Status: ${createResponse.data.data.status}`);
        console.log(`   Author: ${createResponse.data.data.author.firstName} ${createResponse.data.data.author.lastName}`);
        console.log(`   Ingredients: ${createResponse.data.data.ingredients.length}`);
        console.log(`   Steps: ${createResponse.data.data.steps.length}`);
        console.log('');
      } else {
        console.log('❌ Failed to create recipe:', createResponse.data.message);
      }

    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

    console.log('🎉 Create recipe functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCreateRecipe(); 
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testEditRecipe() {
  console.log('🧪 Testing Edit Recipe Functionality...\n');

  try {
    // Test 1: Login to get authentication token
    console.log('1️⃣ Logging in to get authentication token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mahmoud.mouzoun@epitech.eu',
      password: 'Mahmoud055@!!'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Success: Login successful');
    console.log(`   User: ${loginResponse.data.data.user.firstName} ${loginResponse.data.data.user.lastName}`);
    console.log('');

    // Test 2: Get user's recipes
    console.log('2️⃣ Getting user recipes...');
    const myRecipesResponse = await axios.get(`${BASE_URL}/recipes/my/recipes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!myRecipesResponse.data.success) {
      console.log('❌ Failed to get user recipes:', myRecipesResponse.data.message);
      return;
    }

    const recipes = myRecipesResponse.data.data.data;
    console.log('✅ Success: Found user recipes');
    console.log(`   Found ${recipes.length} recipes`);

    if (recipes.length === 0) {
      console.log('⚠️ No recipes found. Please create a recipe first.');
      return;
    }

    const firstRecipe = recipes[0];
    console.log(`   Using recipe: ${firstRecipe.title} (${firstRecipe.id})`);
    console.log(`   Current status: ${firstRecipe.status}`);
    console.log('');

    // Test 3: Update recipe status
    console.log('3️⃣ Testing recipe status update...');
    const newStatus = firstRecipe.status === 'published' ? 'draft' : 'published';
    
    const updateResponse = await axios.patch(`${BASE_URL}/recipes/${firstRecipe.id}`, {
      status: newStatus
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (updateResponse.data.success) {
      console.log('✅ Success: Recipe status updated!');
      console.log(`   New status: ${updateResponse.data.data.status}`);
      console.log('');
    } else {
      console.log('❌ Failed to update recipe status:', updateResponse.data.message);
      return;
    }

    // Test 4: Update recipe title
    console.log('4️⃣ Testing recipe title update...');
    const newTitle = `${firstRecipe.title} (Updated)`;
    
    const titleUpdateResponse = await axios.patch(`${BASE_URL}/recipes/${firstRecipe.id}`, {
      title: newTitle
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (titleUpdateResponse.data.success) {
      console.log('✅ Success: Recipe title updated!');
      console.log(`   New title: ${titleUpdateResponse.data.data.title}`);
      console.log('');
    } else {
      console.log('❌ Failed to update recipe title:', titleUpdateResponse.data.message);
      return;
    }

    // Test 5: Test without authentication (should fail)
    console.log('5️⃣ Testing update without authentication...');
    try {
      await axios.patch(`${BASE_URL}/recipes/${firstRecipe.id}`, {
        title: 'Should fail'
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

    console.log('🎉 Edit recipe functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEditRecipe(); 
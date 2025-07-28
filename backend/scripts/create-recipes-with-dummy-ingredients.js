const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Basic recipes with dummy ingredients
const basicRecipes = [
  {
    title: 'Simple Scrambled Eggs',
    description: 'Quick and easy scrambled eggs for breakfast',
    instructions: 'Make perfect fluffy scrambled eggs in just a few minutes. Crack eggs into a bowl and whisk lightly. Melt butter in a non-stick pan over medium heat. Pour eggs into pan and stir gently until set. Season with salt and pepper before serving.',
    prepTimeMinutes: 2,
    cookTimeMinutes: 5,
    servings: 2,
    difficulty: 'easy',
    categoryName: 'Breakfast',
    ingredients: [
      { ingredientId: 'dummy-egg-id', quantity: 2, unit: 'pieces' },
      { ingredientId: 'dummy-butter-id', quantity: 15, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, title: 'Crack eggs', instructions: 'Crack eggs into a bowl and whisk lightly' },
      { stepNumber: 2, title: 'Heat pan', instructions: 'Melt butter in a non-stick pan over medium heat' },
      { stepNumber: 3, title: 'Cook eggs', instructions: 'Pour eggs into pan and stir gently until set' },
      { stepNumber: 4, title: 'Season', instructions: 'Season with salt and pepper before serving' }
    ]
  },
  {
    title: 'Basic Pasta with Tomato Sauce',
    description: 'Simple pasta dish with tomato sauce',
    instructions: 'Cook pasta and serve with a simple tomato sauce. Cook pasta in salted water until al dente. Dice tomatoes and mince garlic. Sauté garlic in olive oil, add tomatoes. Toss pasta with sauce and fresh basil.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Italian Cuisine',
    ingredients: [
      { ingredientId: 'dummy-pasta-id', quantity: 400, unit: 'g' },
      { ingredientId: 'dummy-tomato-id', quantity: 4, unit: 'pieces' }
    ],
    steps: [
      { stepNumber: 1, title: 'Boil pasta', instructions: 'Cook pasta in salted water until al dente' },
      { stepNumber: 2, title: 'Prepare sauce', instructions: 'Dice tomatoes and mince garlic' },
      { stepNumber: 3, title: 'Cook sauce', instructions: 'Sauté garlic in olive oil, add tomatoes' },
      { stepNumber: 4, title: 'Combine', instructions: 'Toss pasta with sauce and fresh basil' }
    ]
  },
  {
    title: 'Simple Rice Bowl',
    description: 'Basic rice bowl with vegetables',
    instructions: 'Create a simple and healthy rice bowl with fresh vegetables. Cook rice according to package instructions. Chop carrots, bell pepper, and broccoli. Steam vegetables until tender-crisp. Serve rice topped with vegetables and soy sauce.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: 'easy',
    categoryName: 'Quick & Easy',
    ingredients: [
      { ingredientId: 'dummy-rice-id', quantity: 200, unit: 'g' },
      { ingredientId: 'dummy-carrot-id', quantity: 2, unit: 'pieces' }
    ],
    steps: [
      { stepNumber: 1, title: 'Cook rice', instructions: 'Cook rice according to package instructions' },
      { stepNumber: 2, title: 'Prepare vegetables', instructions: 'Chop carrots, bell pepper, and broccoli' },
      { stepNumber: 3, title: 'Steam vegetables', instructions: 'Steam vegetables until tender-crisp' },
      { stepNumber: 4, title: 'Assemble', instructions: 'Serve rice topped with vegetables and soy sauce' }
    ]
  },
  {
    title: 'Greek Salad',
    description: 'Fresh Mediterranean salad with feta and olives',
    instructions: 'Prepare a refreshing Greek salad with authentic Mediterranean flavors. Chop cucumber, tomatoes, and red onion. Combine vegetables in a large bowl. Add crumbled feta cheese and olives. Drizzle with olive oil and lemon juice. Season with salt and oregano.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 1,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Mediterranean',
    ingredients: [
      { ingredientId: 'dummy-cucumber-id', quantity: 1, unit: 'piece' },
      { ingredientId: 'dummy-tomato-id', quantity: 4, unit: 'pieces' }
    ],
    steps: [
      { stepNumber: 1, title: 'Chop vegetables', instructions: 'Chop cucumber, tomatoes, and red onion' },
      { stepNumber: 2, title: 'Combine', instructions: 'Combine vegetables in a large bowl' },
      { stepNumber: 3, title: 'Add cheese', instructions: 'Add crumbled feta cheese and olives' },
      { stepNumber: 4, title: 'Dress', instructions: 'Drizzle with olive oil and lemon juice' },
      { stepNumber: 5, title: 'Season', instructions: 'Season with salt and oregano' }
    ]
  },
  {
    title: 'Grilled Salmon with Lemon',
    description: 'Simple grilled salmon with fresh lemon and herbs',
    instructions: 'Grill perfect salmon fillets with a crispy skin and tender, flaky flesh. Preheat grill to medium-high heat. Season salmon with salt, pepper, and garlic. Brush with olive oil and lemon juice. Grill for 6-8 minutes per side. Garnish with fresh dill and lemon wedges.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Seafood',
    ingredients: [
      { ingredientId: 'dummy-salmon-id', quantity: 600, unit: 'g' },
      { ingredientId: 'dummy-lemon-id', quantity: 2, unit: 'pieces' }
    ],
    steps: [
      { stepNumber: 1, title: 'Preheat grill', instructions: 'Preheat grill to medium-high heat' },
      { stepNumber: 2, title: 'Season salmon', instructions: 'Season salmon with salt, pepper, and garlic' },
      { stepNumber: 3, title: 'Brush with oil', instructions: 'Brush with olive oil and lemon juice' },
      { stepNumber: 4, title: 'Grill', instructions: 'Grill for 6-8 minutes per side' },
      { stepNumber: 5, title: 'Garnish', instructions: 'Garnish with fresh dill and lemon wedges' }
    ]
  }
];

async function createRecipesWithDummyIngredients() {
  console.log('🍳 Creating recipes with dummy ingredients...\n');

  try {
    // Login with existing test user
    console.log('👤 Logging in with test user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.chef@recipeapp.com',
      password: 'TestChef123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Test user logged in successfully');

    // Get all categories
    console.log('\n📋 Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    const categories = categoriesResponse.data.data;
    console.log(`✅ Found ${categories.length} categories`);

    // Create recipes
    let totalRecipes = 0;
    for (const recipe of basicRecipes) {
      try {
        // Find category
        const category = categories.find(cat => cat.name === recipe.categoryName);
        if (!category) {
          console.warn(`⚠️ Category not found: ${recipe.categoryName}`);
          continue;
        }

        const recipeData = {
          title: recipe.title,
          description: recipe.description,
          instructions: recipe.instructions,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          categoryId: category.id,
          status: 'published',
          ingredients: recipe.ingredients,
          steps: recipe.steps
        };

        const response = await axios.post(
          `${BASE_URL}/recipes`,
          recipeData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ Created: ${recipe.title}`);
        totalRecipes++;
      } catch (error) {
        console.error(`❌ Failed to create ${recipe.title}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${totalRecipes} recipes!`);
    console.log('\n📊 Summary:');
    console.log(`   Total recipes created: ${totalRecipes}`);
    console.log(`   Categories with recipes: ${basicRecipes.length}`);

  } catch (error) {
    console.error('❌ Error creating recipes:', error.response?.data || error.message);
  }
}

createRecipesWithDummyIngredients(); 
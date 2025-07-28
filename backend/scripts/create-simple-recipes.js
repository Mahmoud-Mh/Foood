const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Simple recipes using basic ingredients
const simpleRecipes = [
  {
    title: 'Simple Scrambled Eggs',
    description: 'Quick and easy scrambled eggs for breakfast',
    instructions: 'Make perfect fluffy scrambled eggs in just a few minutes.',
    prepTimeMinutes: 2,
    cookTimeMinutes: 5,
    servings: 2,
    difficulty: 'easy',
    categoryName: 'Breakfast',
    ingredients: [
      { name: 'Eggs', amount: 4, unit: 'pieces' },
      { name: 'Butter', amount: 15, unit: 'g' },
      { name: 'Salt', amount: 2, unit: 'g' },
      { name: 'Black Pepper', amount: 1, unit: 'g' }
    ],
    steps: [
      { title: 'Crack eggs', instructions: 'Crack eggs into a bowl and whisk lightly' },
      { title: 'Heat pan', instructions: 'Melt butter in a non-stick pan over medium heat' },
      { title: 'Cook eggs', instructions: 'Pour eggs into pan and stir gently until set' },
      { title: 'Season', instructions: 'Season with salt and pepper before serving' }
    ]
  },
  {
    title: 'Basic Pasta with Tomato Sauce',
    description: 'Simple pasta dish with tomato sauce',
    instructions: 'Cook pasta and serve with a simple tomato sauce.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Italian Cuisine',
    ingredients: [
      { name: 'Pasta', amount: 400, unit: 'g' },
      { name: 'Tomato', amount: 4, unit: 'pieces' },
      { name: 'Garlic', amount: 2, unit: 'cloves' },
      { name: 'Olive Oil', amount: 30, unit: 'ml' },
      { name: 'Basil', amount: 5, unit: 'g' }
    ],
    steps: [
      { title: 'Boil pasta', instructions: 'Cook pasta in salted water until al dente' },
      { title: 'Prepare sauce', instructions: 'Dice tomatoes and mince garlic' },
      { title: 'Cook sauce', instructions: 'Sauté garlic in olive oil, add tomatoes' },
      { title: 'Combine', instructions: 'Toss pasta with sauce and fresh basil' }
    ]
  },
  {
    title: 'Simple Rice Bowl',
    description: 'Basic rice bowl with vegetables',
    instructions: 'Create a simple and healthy rice bowl with fresh vegetables.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: 'easy',
    categoryName: 'Quick & Easy',
    ingredients: [
      { name: 'Rice', amount: 200, unit: 'g' },
      { name: 'Carrot', amount: 2, unit: 'pieces' },
      { name: 'Bell Pepper', amount: 1, unit: 'piece' },
      { name: 'Broccoli', amount: 100, unit: 'g' },
      { name: 'Soy Sauce', amount: 30, unit: 'ml' }
    ],
    steps: [
      { title: 'Cook rice', instructions: 'Cook rice according to package instructions' },
      { title: 'Prepare vegetables', instructions: 'Chop carrots, bell pepper, and broccoli' },
      { title: 'Steam vegetables', instructions: 'Steam vegetables until tender-crisp' },
      { title: 'Assemble', instructions: 'Serve rice topped with vegetables and soy sauce' }
    ]
  }
];

async function createSimpleRecipes() {
  console.log('🍳 Creating simple recipes...\n');

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

    // Get ingredients
    console.log('\n🥕 Getting ingredients...');
    const ingredientsResponse = await axios.get(`${BASE_URL}/ingredients?limit=100`);
    const ingredients = ingredientsResponse.data.data.items || [];
    console.log(`✅ Found ${ingredients.length} ingredients`);
    
    // Log available ingredients
    console.log('\n📝 Available ingredients:');
    ingredients.forEach(ing => {
      console.log(`   - ${ing.name} (${ing.category})`);
    });

    // Create a map of ingredient names to IDs
    const ingredientMap = {};
    ingredients.forEach(ing => {
      ingredientMap[ing.name.toLowerCase()] = ing.id;
    });

    // Create recipes
    let totalRecipes = 0;
    for (const recipe of simpleRecipes) {
      try {
        // Find category
        const category = categories.find(cat => cat.name === recipe.categoryName);
        if (!category) {
          console.warn(`⚠️ Category not found: ${recipe.categoryName}`);
          continue;
        }

        // Map ingredients to ingredient IDs
        const mappedIngredients = recipe.ingredients.map(ing => {
          const ingredientId = ingredientMap[ing.name.toLowerCase()];
          if (!ingredientId) {
            console.warn(`⚠️ Ingredient not found: ${ing.name}`);
            return null;
          }
          return {
            ingredientId: ingredientId,
            quantity: ing.amount,
            unit: ing.unit
          };
        }).filter(Boolean);

        if (mappedIngredients.length === 0) {
          console.warn(`⚠️ Skipping ${recipe.title} - no valid ingredients found`);
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
          ingredients: mappedIngredients,
          steps: recipe.steps.map((step, index) => ({
            stepNumber: index + 1,
            title: step.title,
            instructions: step.instructions
          }))
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

    console.log(`\n🎉 Successfully created ${totalRecipes} simple recipes!`);

  } catch (error) {
    console.error('❌ Error creating simple recipes:', error.response?.data || error.message);
  }
}

createSimpleRecipes(); 
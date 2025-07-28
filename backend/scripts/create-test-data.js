const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Basic ingredients to create
const basicIngredients = [
  { name: 'Eggs', category: 'protein', description: 'Large eggs' },
  { name: 'Butter', category: 'dairy', description: 'Unsalted butter' },
  { name: 'Salt', category: 'spice', description: 'Table salt' },
  { name: 'Black Pepper', category: 'spice', description: 'Ground black pepper' },
  { name: 'Pasta', category: 'grain', description: 'Spaghetti pasta' },
  { name: 'Tomato', category: 'vegetable', description: 'Fresh tomatoes' },
  { name: 'Garlic', category: 'vegetable', description: 'Fresh garlic cloves' },
  { name: 'Olive Oil', category: 'condiment', description: 'Extra virgin olive oil' },
  { name: 'Basil', category: 'spice', description: 'Dried basil' },
  { name: 'Rice', category: 'grain', description: 'Long grain white rice' },
  { name: 'Carrot', category: 'vegetable', description: 'Fresh carrots' },
  { name: 'Bell Pepper', category: 'vegetable', description: 'Sweet bell peppers' },
  { name: 'Soy Sauce', category: 'condiment', description: 'Light soy sauce' },
  { name: 'Cucumber', category: 'vegetable', description: 'Fresh cucumber' },
  { name: 'Feta Cheese', category: 'dairy', description: 'Crumbled feta cheese' },
  { name: 'Kalamata Olives', category: 'other', description: 'Kalamata olives' },
  { name: 'Red Onion', category: 'vegetable', description: 'Red onion' },
  { name: 'Salmon', category: 'protein', description: 'Fresh salmon fillet' },
  { name: 'Lemon', category: 'fruit', description: 'Fresh lemons' },
  { name: 'Flour', category: 'grain', description: 'All-purpose flour' },
  { name: 'Milk', category: 'dairy', description: 'Whole milk' },
  { name: 'Sugar', category: 'other', description: 'Granulated sugar' },
  { name: 'Baking Powder', category: 'other', description: 'Baking powder' },
  { name: 'Dark Chocolate', category: 'other', description: 'Dark chocolate' }
];

// Basic recipes
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
      { name: 'Eggs', quantity: 2, unit: 'pieces' },
      { name: 'Butter', quantity: 15, unit: 'g' },
      { name: 'Salt', quantity: 2, unit: 'g' },
      { name: 'Black Pepper', quantity: 1, unit: 'g' }
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
      { name: 'Pasta', quantity: 400, unit: 'g' },
      { name: 'Tomato', quantity: 4, unit: 'pieces' },
      { name: 'Garlic', quantity: 2, unit: 'cloves' },
      { name: 'Olive Oil', quantity: 30, unit: 'ml' },
      { name: 'Basil', quantity: 5, unit: 'g' }
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
      { name: 'Rice', quantity: 200, unit: 'g' },
      { name: 'Carrot', quantity: 2, unit: 'pieces' },
      { name: 'Bell Pepper', quantity: 1, unit: 'piece' },
      { name: 'Soy Sauce', quantity: 30, unit: 'ml' }
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
      { name: 'Cucumber', quantity: 1, unit: 'piece' },
      { name: 'Tomato', quantity: 4, unit: 'pieces' },
      { name: 'Feta Cheese', quantity: 150, unit: 'g' },
      { name: 'Kalamata Olives', quantity: 100, unit: 'g' },
      { name: 'Red Onion', quantity: 1, unit: 'piece' }
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
      { name: 'Salmon', quantity: 600, unit: 'g' },
      { name: 'Lemon', quantity: 2, unit: 'pieces' },
      { name: 'Olive Oil', quantity: 30, unit: 'ml' },
      { name: 'Salt', quantity: 5, unit: 'g' },
      { name: 'Black Pepper', quantity: 3, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, title: 'Preheat grill', instructions: 'Preheat grill to medium-high heat' },
      { stepNumber: 2, title: 'Season salmon', instructions: 'Season salmon with salt, pepper, and garlic' },
      { stepNumber: 3, title: 'Brush with oil', instructions: 'Brush with olive oil and lemon juice' },
      { stepNumber: 4, title: 'Grill', instructions: 'Grill for 6-8 minutes per side' },
      { stepNumber: 5, title: 'Garnish', instructions: 'Garnish with fresh dill and lemon wedges' }
    ]
  },
  {
    title: 'Fluffy Pancakes',
    description: 'Light and fluffy breakfast pancakes',
    instructions: 'Make perfect fluffy pancakes with a golden brown exterior and tender interior. Mix flour, baking powder, and salt. Whisk eggs, milk, and melted butter. Combine wet and dry ingredients. Cook on a greased griddle until bubbles form. Flip and cook until golden brown. Serve with maple syrup and butter.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Breakfast',
    ingredients: [
      { name: 'Flour', quantity: 200, unit: 'g' },
      { name: 'Milk', quantity: 300, unit: 'ml' },
      { name: 'Eggs', quantity: 2, unit: 'pieces' },
      { name: 'Butter', quantity: 30, unit: 'g' },
      { name: 'Baking Powder', quantity: 10, unit: 'g' },
      { name: 'Sugar', quantity: 30, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, title: 'Mix dry ingredients', instructions: 'Mix flour, baking powder, and salt' },
      { stepNumber: 2, title: 'Whisk wet ingredients', instructions: 'Whisk eggs, milk, and melted butter' },
      { stepNumber: 3, title: 'Combine', instructions: 'Combine wet and dry ingredients' },
      { stepNumber: 4, title: 'Cook', instructions: 'Cook on a greased griddle until bubbles form' },
      { stepNumber: 5, title: 'Flip', instructions: 'Flip and cook until golden brown' },
      { stepNumber: 6, title: 'Serve', instructions: 'Serve with maple syrup and butter' }
    ]
  },
  {
    title: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center',
    instructions: 'Create individual chocolate lava cakes with a gooey center and crisp exterior. Melt chocolate and butter together. Beat eggs and sugar until fluffy. Fold chocolate mixture into eggs. Add flour and mix gently. Bake at 425°F for 12 minutes. Serve immediately while warm.',
    prepTimeMinutes: 20,
    cookTimeMinutes: 12,
    servings: 4,
    difficulty: 'medium',
    categoryName: 'Desserts',
    ingredients: [
      { name: 'Dark Chocolate', quantity: 200, unit: 'g' },
      { name: 'Butter', quantity: 100, unit: 'g' },
      { name: 'Eggs', quantity: 4, unit: 'pieces' },
      { name: 'Sugar', quantity: 100, unit: 'g' },
      { name: 'Flour', quantity: 60, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, title: 'Melt chocolate', instructions: 'Melt chocolate and butter together' },
      { stepNumber: 2, title: 'Beat eggs', instructions: 'Beat eggs and sugar until fluffy' },
      { stepNumber: 3, title: 'Combine', instructions: 'Fold chocolate mixture into eggs' },
      { stepNumber: 4, title: 'Add flour', instructions: 'Add flour and mix gently' },
      { stepNumber: 5, title: 'Bake', instructions: 'Bake at 425°F for 12 minutes' },
      { stepNumber: 6, title: 'Serve', instructions: 'Serve immediately while warm' }
    ]
  }
];

async function createTestData() {
  console.log('🚀 Starting test data creation...\n');

  try {
    // Create admin user
    console.log('👤 Creating admin user...');
    const userData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.test@recipeapp.com',
      password: 'AdminTest123!',
      confirmPassword: 'AdminTest123!'
    };

    let token;
    let userId;

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
      token = registerResponse.data.data.tokens.accessToken;
      userId = registerResponse.data.data.user.id;
      console.log('✅ Admin user created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Admin user already exists, logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        token = loginResponse.data.data.tokens.accessToken;
        userId = loginResponse.data.data.user.id;
      } else {
        throw error;
      }
    }

    // Promote to admin
    try {
      await axios.patch(
        `${BASE_URL}/users/${userId}/role`,
        { role: 'admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('🔑 User promoted to admin');
    } catch (error) {
      console.log('⚠️ User might already be admin');
    }

    // Create ingredients
    console.log('\n🥕 Creating ingredients...');
    const ingredientMap = {};
    let createdIngredients = 0;

    for (const ingredient of basicIngredients) {
      try {
        const response = await axios.post(
          `${BASE_URL}/ingredients`,
          ingredient,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        ingredientMap[ingredient.name.toLowerCase()] = response.data.data.id;
        console.log(`✅ Created ingredient: ${ingredient.name}`);
        createdIngredients++;
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️ Ingredient already exists: ${ingredient.name}`);
          // Try to get the existing ingredient ID
          try {
            const searchResponse = await axios.get(`${BASE_URL}/ingredients/search?name=${ingredient.name}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (searchResponse.data.data.length > 0) {
              ingredientMap[ingredient.name.toLowerCase()] = searchResponse.data.data[0].id;
            }
          } catch (searchError) {
            console.log(`⚠️ Could not find existing ingredient: ${ingredient.name}`);
          }
        } else {
          console.error(`❌ Failed to create ingredient ${ingredient.name}:`, error.response?.data || error.message);
        }
      }
    }

    console.log(`\n📊 Ingredients created: ${createdIngredients}`);

    // Get categories
    console.log('\n📋 Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    const categories = categoriesResponse.data.data;
    console.log(`✅ Found ${categories.length} categories`);

    // Create recipes
    console.log('\n🍳 Creating recipes...');
    let createdRecipes = 0;

    for (const recipe of basicRecipes) {
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
            quantity: ing.quantity,
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

        console.log(`✅ Created recipe: ${recipe.title}`);
        createdRecipes++;
      } catch (error) {
        console.error(`❌ Failed to create ${recipe.title}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n🎉 Test data creation completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Ingredients created: ${createdIngredients}`);
    console.log(`   Recipes created: ${createdRecipes}`);

  } catch (error) {
    console.error('❌ Error creating test data:', error.response?.data || error.message);
  }
}

createTestData(); 
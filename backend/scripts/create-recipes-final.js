const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Sample recipes with ingredients that should exist
const sampleRecipes = [
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
  },
  {
    title: 'Pad Thai',
    description: 'Stir-fried rice noodles with shrimp, tofu, and peanuts',
    instructions: 'Create a delicious Pad Thai with perfectly balanced flavors and textures. Soak rice noodles in warm water for 30 minutes. Stir-fry shrimp and tofu in a wok. Add noodles and pad thai sauce. Add bean sprouts and eggs. Garnish with crushed peanuts and lime.',
    prepTimeMinutes: 25,
    cookTimeMinutes: 10,
    servings: 4,
    difficulty: 'medium',
    categoryName: 'Asian Cuisine',
    ingredients: [
      { name: 'Rice', quantity: 300, unit: 'g' },
      { name: 'Shrimp', quantity: 200, unit: 'g' },
      { name: 'Tofu', quantity: 150, unit: 'g' },
      { name: 'Soy Sauce', quantity: 60, unit: 'ml' },
      { name: 'Lemon', quantity: 2, unit: 'pieces' }
    ],
    steps: [
      { stepNumber: 1, title: 'Soak noodles', instructions: 'Soak rice noodles in warm water for 30 minutes' },
      { stepNumber: 2, title: 'Stir-fry protein', instructions: 'Stir-fry shrimp and tofu in a wok' },
      { stepNumber: 3, title: 'Add noodles', instructions: 'Add noodles and pad thai sauce' },
      { stepNumber: 4, title: 'Add vegetables', instructions: 'Add bean sprouts and eggs' },
      { stepNumber: 5, title: 'Garnish', instructions: 'Garnish with crushed peanuts and lime' }
    ]
  },
  {
    title: 'Classic BBQ Ribs',
    description: 'Slow-cooked BBQ ribs with homemade sauce',
    instructions: 'Master the art of slow-cooked BBQ ribs with a perfect bark and fall-off-the-bone tenderness. Season ribs with dry rub and let marinate. Preheat smoker to 225°F (107°C). Smoke ribs for 3-4 hours until tender. Brush with BBQ sauce in the last 30 minutes. Let rest for 10 minutes before serving.',
    prepTimeMinutes: 30,
    cookTimeMinutes: 240,
    servings: 6,
    difficulty: 'hard',
    categoryName: 'Grilling & BBQ',
    ingredients: [
      { name: 'Pork Ribs', quantity: 1000, unit: 'g' },
      { name: 'BBQ Sauce', quantity: 200, unit: 'ml' },
      { name: 'Salt', quantity: 20, unit: 'g' },
      { name: 'Black Pepper', quantity: 10, unit: 'g' },
      { name: 'Sugar', quantity: 50, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, title: 'Season ribs', instructions: 'Season ribs with dry rub and let marinate' },
      { stepNumber: 2, title: 'Preheat smoker', instructions: 'Preheat smoker to 225°F (107°C)' },
      { stepNumber: 3, title: 'Smoke ribs', instructions: 'Smoke ribs for 3-4 hours until tender' },
      { stepNumber: 4, title: 'Brush with sauce', instructions: 'Brush with BBQ sauce in the last 30 minutes' },
      { stepNumber: 5, title: 'Rest', instructions: 'Let rest for 10 minutes before serving' }
    ]
  },
  {
    title: 'Margherita Pizza',
    description: 'Classic Italian pizza with tomato sauce and mozzarella',
    instructions: 'Create an authentic Margherita pizza with a crispy crust and fresh toppings. Prepare pizza dough and let it rise. Roll out the dough and add tomato sauce. Top with fresh mozzarella and basil. Bake in a hot oven until the crust is golden and cheese is melted.',
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: 'medium',
    categoryName: 'Italian Cuisine',
    ingredients: [
      { name: 'Pizza Dough', quantity: 500, unit: 'g' },
      { name: 'Tomato Sauce', quantity: 200, unit: 'ml' },
      { name: 'Fresh Mozzarella', quantity: 200, unit: 'g' },
      { name: 'Fresh Basil', quantity: 20, unit: 'g' },
      { name: 'Olive Oil', quantity: 30, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, title: 'Prepare dough', instructions: 'Prepare pizza dough and let it rise' },
      { stepNumber: 2, title: 'Roll out dough', instructions: 'Roll out the dough and add tomato sauce' },
      { stepNumber: 3, title: 'Add toppings', instructions: 'Top with fresh mozzarella and basil' },
      { stepNumber: 4, title: 'Bake', instructions: 'Bake in a hot oven until the crust is golden and cheese is melted' }
    ]
  }
];

async function createRecipesFinal() {
  console.log('🍳 Creating recipes with existing ingredients...\n');

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

    // Get all ingredients
    console.log('\n🥕 Getting ingredients...');
    const ingredientsResponse = await axios.get(`${BASE_URL}/ingredients/active`);
    const ingredients = ingredientsResponse.data.data;
    console.log(`✅ Found ${ingredients.length} ingredients`);

    // Create ingredient map
    const ingredientMap = {};
    ingredients.forEach(ingredient => {
      ingredientMap[ingredient.name.toLowerCase()] = ingredient.id;
    });

    console.log('\n📝 Available ingredients:');
    Object.keys(ingredientMap).forEach(name => {
      console.log(`  - ${name}`);
    });

    // Create recipes
    console.log('\n🍳 Creating recipes...');
    let createdRecipes = 0;
    let skippedRecipes = 0;

    for (const recipe of sampleRecipes) {
      try {
        // Find category
        const category = categories.find(cat => cat.name === recipe.categoryName);
        if (!category) {
          console.warn(`⚠️ Category not found: ${recipe.categoryName}`);
          skippedRecipes++;
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
          skippedRecipes++;
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
        skippedRecipes++;
      }
    }

    console.log(`\n🎉 Recipe creation completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Created: ${createdRecipes} recipes`);
    console.log(`   Skipped: ${skippedRecipes} recipes`);
    console.log(`   Total processed: ${sampleRecipes.length}`);

    // Show final recipe count
    console.log('\n📋 Checking final recipe count...');
    const recipesResponse = await axios.get(`${BASE_URL}/recipes/published?limit=1`);
    const totalRecipes = recipesResponse.data.data.total;
    console.log(`📊 Total published recipes in database: ${totalRecipes}`);

  } catch (error) {
    console.error('❌ Error creating recipes:', error.response?.data || error.message);
  }
}

createRecipesFinal(); 
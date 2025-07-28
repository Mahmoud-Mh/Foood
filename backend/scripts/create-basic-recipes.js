const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Basic recipes without ingredients (for now)
const basicRecipes = [
  {
    title: 'Simple Scrambled Eggs',
    description: 'Quick and easy scrambled eggs for breakfast',
    instructions: 'Make perfect fluffy scrambled eggs in just a few minutes. Crack eggs into a bowl and whisk lightly. Melt butter in a non-stick pan over medium heat. Pour eggs into pan and stir gently until set. Season with salt and pepper before serving.',
    prepTimeMinutes: 2,
    cookTimeMinutes: 5,
    servings: 2,
    difficulty: 'easy',
    categoryName: 'Breakfast'
  },
  {
    title: 'Basic Pasta with Tomato Sauce',
    description: 'Simple pasta dish with tomato sauce',
    instructions: 'Cook pasta and serve with a simple tomato sauce. Cook pasta in salted water until al dente. Dice tomatoes and mince garlic. Sauté garlic in olive oil, add tomatoes. Toss pasta with sauce and fresh basil.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Italian Cuisine'
  },
  {
    title: 'Simple Rice Bowl',
    description: 'Basic rice bowl with vegetables',
    instructions: 'Create a simple and healthy rice bowl with fresh vegetables. Cook rice according to package instructions. Chop carrots, bell pepper, and broccoli. Steam vegetables until tender-crisp. Serve rice topped with vegetables and soy sauce.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: 'easy',
    categoryName: 'Quick & Easy'
  },
  {
    title: 'Greek Salad',
    description: 'Fresh Mediterranean salad with feta and olives',
    instructions: 'Prepare a refreshing Greek salad with authentic Mediterranean flavors. Chop cucumber, tomatoes, and red onion. Combine vegetables in a large bowl. Add crumbled feta cheese and olives. Drizzle with olive oil and lemon juice. Season with salt and oregano.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 1,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Mediterranean'
  },
  {
    title: 'Fluffy Pancakes',
    description: 'Light and fluffy breakfast pancakes',
    instructions: 'Make perfect fluffy pancakes with a golden brown exterior and tender interior. Mix flour, baking powder, and salt. Whisk eggs, milk, and melted butter. Combine wet and dry ingredients. Cook on a greased griddle until bubbles form. Flip and cook until golden brown. Serve with maple syrup and butter.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Breakfast'
  },
  {
    title: 'Grilled Salmon with Lemon',
    description: 'Simple grilled salmon with fresh lemon and herbs',
    instructions: 'Grill perfect salmon fillets with a crispy skin and tender, flaky flesh. Preheat grill to medium-high heat. Season salmon with salt, pepper, and garlic. Brush with olive oil and lemon juice. Grill for 6-8 minutes per side. Garnish with fresh dill and lemon wedges.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Seafood'
  },
  {
    title: 'Vegetarian Buddha Bowl',
    description: 'Healthy vegetarian bowl with quinoa and roasted vegetables',
    instructions: 'Create a nutritious and colorful Buddha bowl packed with plant-based goodness. Cook quinoa according to package instructions. Roast sweet potato and chickpeas with olive oil. Massage kale with lemon juice and olive oil. Assemble bowls with quinoa, vegetables, and avocado. Drizzle with tahini dressing.',
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'easy',
    categoryName: 'Vegetarian'
  },
  {
    title: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center',
    instructions: 'Create individual chocolate lava cakes with a gooey center and crisp exterior. Melt chocolate and butter together. Beat eggs and sugar until fluffy. Fold chocolate mixture into eggs. Add flour and mix gently. Bake at 425°F for 12 minutes. Serve immediately while warm.',
    prepTimeMinutes: 20,
    cookTimeMinutes: 12,
    servings: 4,
    difficulty: 'medium',
    categoryName: 'Desserts'
  },
  {
    title: 'Pad Thai',
    description: 'Stir-fried rice noodles with shrimp, tofu, and peanuts',
    instructions: 'Create a delicious Pad Thai with perfectly balanced flavors and textures. Soak rice noodles in warm water for 30 minutes. Stir-fry shrimp and tofu in a wok. Add noodles and pad thai sauce. Add bean sprouts and eggs. Garnish with crushed peanuts and lime.',
    prepTimeMinutes: 25,
    cookTimeMinutes: 10,
    servings: 4,
    difficulty: 'medium',
    categoryName: 'Asian Cuisine'
  },
  {
    title: 'Classic BBQ Ribs',
    description: 'Slow-cooked BBQ ribs with homemade sauce',
    instructions: 'Master the art of slow-cooked BBQ ribs with a perfect bark and fall-off-the-bone tenderness. Season ribs with dry rub and let marinate. Preheat smoker to 225°F (107°C). Smoke ribs for 3-4 hours until tender. Brush with BBQ sauce in the last 30 minutes. Let rest for 10 minutes before serving.',
    prepTimeMinutes: 30,
    cookTimeMinutes: 240,
    servings: 6,
    difficulty: 'hard',
    categoryName: 'Grilling & BBQ'
  }
];

async function createBasicRecipes() {
  console.log('🍳 Creating basic recipes...\n');

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
          ingredients: [], // Empty ingredients array for now
          steps: [] // Empty steps array for now
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

    console.log(`\n🎉 Successfully created ${totalRecipes} basic recipes!`);
    console.log('\n📊 Summary:');
    console.log(`   Total recipes created: ${totalRecipes}`);
    console.log(`   Categories with recipes: ${basicRecipes.length}`);

  } catch (error) {
    console.error('❌ Error creating basic recipes:', error.response?.data || error.message);
  }
}

createBasicRecipes(); 
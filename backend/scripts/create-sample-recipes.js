const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Sample recipes for each category
const sampleRecipes = {
  'Italian Cuisine': [
    {
      title: 'Classic Margherita Pizza',
      description: 'A traditional Italian pizza with fresh mozzarella, basil, and tomato sauce',
      prepTimeMinutes: 30,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'EASY',
      ingredients: [
        { name: 'Pizza dough', amount: 1, unit: 'piece' },
        { name: 'Fresh mozzarella', amount: 200, unit: 'g' },
        { name: 'Tomato sauce', amount: 150, unit: 'ml' },
        { name: 'Fresh basil', amount: 10, unit: 'leaves' },
        { name: 'Olive oil', amount: 30, unit: 'ml' }
      ],
      steps: [
        'Preheat oven to 450°F (230°C)',
        'Roll out the pizza dough on a floured surface',
        'Spread tomato sauce evenly over the dough',
        'Add fresh mozzarella slices',
        'Bake for 12-15 minutes until crust is golden',
        'Add fresh basil leaves before serving'
      ]
    },
    {
      title: 'Spaghetti Carbonara',
      description: 'Creamy pasta with eggs, cheese, and pancetta',
      prepTimeMinutes: 20,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'MEDIUM',
      ingredients: [
        { name: 'Spaghetti', amount: 400, unit: 'g' },
        { name: 'Pancetta', amount: 150, unit: 'g' },
        { name: 'Eggs', amount: 4, unit: 'pieces' },
        { name: 'Parmesan cheese', amount: 100, unit: 'g' },
        { name: 'Black pepper', amount: 5, unit: 'g' }
      ],
      steps: [
        'Cook spaghetti in salted water until al dente',
        'Fry pancetta in a large pan until crispy',
        'Beat eggs with grated parmesan and pepper',
        'Drain pasta and add to pancetta pan',
        'Remove from heat and quickly stir in egg mixture',
        'Serve immediately with extra parmesan'
      ]
    }
  ],
  'Mexican Cuisine': [
    {
      title: 'Authentic Tacos al Pastor',
      description: 'Marinated pork tacos with pineapple and cilantro',
      prepTimeMinutes: 45,
      cookTimeMinutes: 20,
      servings: 6,
      difficulty: 'MEDIUM',
      ingredients: [
        { name: 'Pork shoulder', amount: 500, unit: 'g' },
        { name: 'Corn tortillas', amount: 12, unit: 'pieces' },
        { name: 'Pineapple', amount: 200, unit: 'g' },
        { name: 'Cilantro', amount: 50, unit: 'g' },
        { name: 'Lime', amount: 3, unit: 'pieces' }
      ],
      steps: [
        'Marinate pork with spices and pineapple juice',
        'Grill pork until charred and cooked through',
        'Warm tortillas on a griddle',
        'Slice pork thinly and serve on tortillas',
        'Top with fresh pineapple, cilantro, and lime'
      ]
    }
  ],
  'Asian Cuisine': [
    {
      title: 'Pad Thai',
      description: 'Stir-fried rice noodles with shrimp, tofu, and peanuts',
      prepTimeMinutes: 25,
      cookTimeMinutes: 10,
      servings: 4,
      difficulty: 'MEDIUM',
      ingredients: [
        { name: 'Rice noodles', amount: 200, unit: 'g' },
        { name: 'Shrimp', amount: 300, unit: 'g' },
        { name: 'Tofu', amount: 200, unit: 'g' },
        { name: 'Bean sprouts', amount: 100, unit: 'g' },
        { name: 'Peanuts', amount: 50, unit: 'g' }
      ],
      steps: [
        'Soak rice noodles in warm water for 30 minutes',
        'Stir-fry shrimp and tofu in a wok',
        'Add noodles and pad thai sauce',
        'Add bean sprouts and eggs',
        'Garnish with crushed peanuts and lime'
      ]
    }
  ],
  'Mediterranean': [
    {
      title: 'Greek Salad',
      description: 'Fresh Mediterranean salad with feta and olives',
      prepTimeMinutes: 15,
      cookTimeMinutes: 0,
      servings: 4,
      difficulty: 'EASY',
      ingredients: [
        { name: 'Cucumber', amount: 1, unit: 'piece' },
        { name: 'Tomatoes', amount: 4, unit: 'pieces' },
        { name: 'Feta cheese', amount: 150, unit: 'g' },
        { name: 'Kalamata olives', amount: 100, unit: 'g' },
        { name: 'Red onion', amount: 1, unit: 'piece' }
      ],
      steps: [
        'Chop cucumber, tomatoes, and red onion',
        'Combine vegetables in a large bowl',
        'Add crumbled feta cheese and olives',
        'Drizzle with olive oil and lemon juice',
        'Season with salt and oregano'
      ]
    }
  ],
  'Desserts': [
    {
      title: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center',
      prepTimeMinutes: 20,
      cookTimeMinutes: 12,
      servings: 4,
      difficulty: 'MEDIUM',
      ingredients: [
        { name: 'Dark chocolate', amount: 200, unit: 'g' },
        { name: 'Butter', amount: 100, unit: 'g' },
        { name: 'Eggs', amount: 4, unit: 'pieces' },
        { name: 'Sugar', amount: 100, unit: 'g' },
        { name: 'Flour', amount: 60, unit: 'g' }
      ],
      steps: [
        'Melt chocolate and butter together',
        'Beat eggs and sugar until fluffy',
        'Fold chocolate mixture into eggs',
        'Add flour and mix gently',
        'Bake at 425°F for 12 minutes',
        'Serve immediately while warm'
      ]
    }
  ],
  'Breakfast': [
    {
      title: 'Fluffy Pancakes',
      description: 'Light and fluffy breakfast pancakes',
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'EASY',
      ingredients: [
        { name: 'All-purpose flour', amount: 200, unit: 'g' },
        { name: 'Milk', amount: 300, unit: 'ml' },
        { name: 'Eggs', amount: 2, unit: 'pieces' },
        { name: 'Butter', amount: 30, unit: 'g' },
        { name: 'Baking powder', amount: 10, unit: 'g' }
      ],
      steps: [
        'Mix flour, baking powder, and salt',
        'Whisk eggs, milk, and melted butter',
        'Combine wet and dry ingredients',
        'Cook on a greased griddle until bubbles form',
        'Flip and cook until golden brown',
        'Serve with maple syrup and butter'
      ]
    }
  ],
  'Quick & Easy': [
    {
      title: '5-Minute Microwave Omelette',
      description: 'Quick and easy microwave omelette',
      prepTimeMinutes: 2,
      cookTimeMinutes: 3,
      servings: 1,
      difficulty: 'EASY',
      ingredients: [
        { name: 'Eggs', amount: 2, unit: 'pieces' },
        { name: 'Cheese', amount: 30, unit: 'g' },
        { name: 'Ham', amount: 50, unit: 'g' },
        { name: 'Bell pepper', amount: 0.25, unit: 'piece' }
      ],
      steps: [
        'Beat eggs in a microwave-safe bowl',
        'Add cheese, ham, and diced bell pepper',
        'Microwave for 2-3 minutes until set',
        'Let stand for 1 minute before serving'
      ]
    }
  ],
  'Vegetarian': [
    {
      title: 'Vegetarian Buddha Bowl',
      description: 'Healthy vegetarian bowl with quinoa and roasted vegetables',
      prepTimeMinutes: 20,
      cookTimeMinutes: 25,
      servings: 4,
      difficulty: 'EASY',
      ingredients: [
        { name: 'Quinoa', amount: 200, unit: 'g' },
        { name: 'Sweet potato', amount: 2, unit: 'pieces' },
        { name: 'Chickpeas', amount: 400, unit: 'g' },
        { name: 'Kale', amount: 100, unit: 'g' },
        { name: 'Avocado', amount: 2, unit: 'pieces' }
      ],
      steps: [
        'Cook quinoa according to package instructions',
        'Roast sweet potato and chickpeas with olive oil',
        'Massage kale with lemon juice and olive oil',
        'Assemble bowls with quinoa, vegetables, and avocado',
        'Drizzle with tahini dressing'
      ]
    }
  ],
  'Seafood': [
    {
      title: 'Grilled Salmon with Lemon',
      description: 'Simple grilled salmon with fresh lemon and herbs',
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      servings: 4,
      difficulty: 'EASY',
      ingredients: [
        { name: 'Salmon fillets', amount: 600, unit: 'g' },
        { name: 'Lemon', amount: 2, unit: 'pieces' },
        { name: 'Fresh dill', amount: 20, unit: 'g' },
        { name: 'Olive oil', amount: 30, unit: 'ml' },
        { name: 'Garlic', amount: 4, unit: 'cloves' }
      ],
      steps: [
        'Preheat grill to medium-high heat',
        'Season salmon with salt, pepper, and garlic',
        'Brush with olive oil and lemon juice',
        'Grill for 6-8 minutes per side',
        'Garnish with fresh dill and lemon wedges'
      ]
    }
  ],
  'Grilling & BBQ': [
    {
      title: 'Classic BBQ Ribs',
      description: 'Slow-cooked BBQ ribs with homemade sauce',
      prepTimeMinutes: 30,
      cookTimeMinutes: 240,
      servings: 6,
      difficulty: 'HARD',
      ingredients: [
        { name: 'Pork ribs', amount: 1000, unit: 'g' },
        { name: 'BBQ sauce', amount: 500, unit: 'ml' },
        { name: 'Brown sugar', amount: 100, unit: 'g' },
        { name: 'Paprika', amount: 20, unit: 'g' },
        { name: 'Garlic powder', amount: 15, unit: 'g' }
      ],
      steps: [
        'Season ribs with dry rub and let marinate',
        'Preheat smoker to 225°F (107°C)',
        'Smoke ribs for 3-4 hours until tender',
        'Brush with BBQ sauce in the last 30 minutes',
        'Let rest for 10 minutes before serving'
      ]
    }
  ]
};

async function createSampleRecipes() {
  console.log('🍳 Creating sample recipes...\n');

  try {
    // First, we need to create a user to be the author of the recipes
    console.log('👤 Creating test user...');
    const userResponse = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Test',
      lastName: 'Chef',
      email: 'test.chef@recipeapp.com',
      password: 'TestChef123!',
      confirmPassword: 'TestChef123!'
    });

    const token = userResponse.data.data.tokens.accessToken;
    const userId = userResponse.data.data.user.id;

    console.log('✅ Test user created successfully');

    // Get all categories
    console.log('\n📋 Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    const categories = categoriesResponse.data.data;

    console.log(`✅ Found ${categories.length} categories`);

    // Create recipes for each category
    let totalRecipes = 0;
    for (const category of categories) {
      const recipes = sampleRecipes[category.name] || [];
      
      if (recipes.length > 0) {
        console.log(`\n🍽️ Creating recipes for ${category.name}...`);
        
        for (const recipe of recipes) {
          try {
            const recipeData = {
              title: recipe.title,
              description: recipe.description,
              prepTimeMinutes: recipe.prepTimeMinutes,
              cookTimeMinutes: recipe.cookTimeMinutes,
              servings: recipe.servings,
              difficulty: recipe.difficulty,
              categoryId: category.id,
              status: 'PUBLISHED',
              ingredients: recipe.ingredients.map(ing => ({
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit
              })),
              steps: recipe.steps.map((step, index) => ({
                stepNumber: index + 1,
                description: step
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
      }
    }

    console.log(`\n🎉 Successfully created ${totalRecipes} sample recipes!`);
    console.log('\n📊 Summary:');
    console.log(`   Total recipes created: ${totalRecipes}`);
    console.log(`   Categories with recipes: ${Object.keys(sampleRecipes).length}`);

  } catch (error) {
    console.error('❌ Error creating sample recipes:', error.response?.data || error.message);
  }
}

createSampleRecipes(); 
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Sample recipes for each category
const sampleRecipes = {
  'Italian Cuisine': [
    {
      title: 'Classic Margherita Pizza',
      description: 'A traditional Italian pizza with fresh mozzarella, basil, and tomato sauce',
      instructions: 'Follow these steps to create an authentic Margherita pizza with a crispy crust and fresh toppings.',
      prepTimeMinutes: 30,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'easy',
      ingredients: [
        { name: 'Pizza dough', amount: 1, unit: 'piece' },
        { name: 'Fresh mozzarella', amount: 200, unit: 'g' },
        { name: 'Tomato sauce', amount: 150, unit: 'ml' },
        { name: 'Fresh basil', amount: 10, unit: 'leaves' },
        { name: 'Olive oil', amount: 30, unit: 'ml' }
      ],
      steps: [
        { title: 'Preheat oven', instructions: 'Preheat oven to 450°F (230°C)' },
        { title: 'Roll dough', instructions: 'Roll out the pizza dough on a floured surface' },
        { title: 'Add sauce', instructions: 'Spread tomato sauce evenly over the dough' },
        { title: 'Add cheese', instructions: 'Add fresh mozzarella slices' },
        { title: 'Bake', instructions: 'Bake for 12-15 minutes until crust is golden' },
        { title: 'Garnish', instructions: 'Add fresh basil leaves before serving' }
      ]
    },
    {
      title: 'Spaghetti Carbonara',
      description: 'Creamy pasta with eggs, cheese, and pancetta',
      instructions: 'Create a classic Italian carbonara with perfectly cooked pasta and a rich, creamy sauce.',
      prepTimeMinutes: 20,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'medium',
      ingredients: [
        { name: 'Spaghetti', amount: 400, unit: 'g' },
        { name: 'Pancetta', amount: 150, unit: 'g' },
        { name: 'Eggs', amount: 4, unit: 'pieces' },
        { name: 'Parmesan cheese', amount: 100, unit: 'g' },
        { name: 'Black pepper', amount: 5, unit: 'g' }
      ],
      steps: [
        { title: 'Cook pasta', instructions: 'Cook spaghetti in salted water until al dente' },
        { title: 'Fry pancetta', instructions: 'Fry pancetta in a large pan until crispy' },
        { title: 'Prepare sauce', instructions: 'Beat eggs with grated parmesan and pepper' },
        { title: 'Combine', instructions: 'Drain pasta and add to pancetta pan' },
        { title: 'Finish', instructions: 'Remove from heat and quickly stir in egg mixture' },
        { title: 'Serve', instructions: 'Serve immediately with extra parmesan' }
      ]
    }
  ],
  'Mexican Cuisine': [
    {
      title: 'Authentic Tacos al Pastor',
      description: 'Marinated pork tacos with pineapple and cilantro',
      instructions: 'Prepare authentic Mexican tacos al pastor with marinated pork and fresh toppings.',
      prepTimeMinutes: 45,
      cookTimeMinutes: 20,
      servings: 6,
      difficulty: 'medium',
      ingredients: [
        { name: 'Pork shoulder', amount: 500, unit: 'g' },
        { name: 'Corn tortillas', amount: 12, unit: 'pieces' },
        { name: 'Pineapple', amount: 200, unit: 'g' },
        { name: 'Cilantro', amount: 50, unit: 'g' },
        { name: 'Lime', amount: 3, unit: 'pieces' }
      ],
      steps: [
        { title: 'Marinate pork', instructions: 'Marinate pork with spices and pineapple juice' },
        { title: 'Grill pork', instructions: 'Grill pork until charred and cooked through' },
        { title: 'Warm tortillas', instructions: 'Warm tortillas on a griddle' },
        { title: 'Slice pork', instructions: 'Slice pork thinly and serve on tortillas' },
        { title: 'Garnish', instructions: 'Top with fresh pineapple, cilantro, and lime' }
      ]
    }
  ],
  'Asian Cuisine': [
    {
      title: 'Pad Thai',
      description: 'Stir-fried rice noodles with shrimp, tofu, and peanuts',
      instructions: 'Create a delicious Pad Thai with perfectly balanced flavors and textures.',
      prepTimeMinutes: 25,
      cookTimeMinutes: 10,
      servings: 4,
      difficulty: 'medium',
      ingredients: [
        { name: 'Rice noodles', amount: 200, unit: 'g' },
        { name: 'Shrimp', amount: 300, unit: 'g' },
        { name: 'Tofu', amount: 200, unit: 'g' },
        { name: 'Bean sprouts', amount: 100, unit: 'g' },
        { name: 'Peanuts', amount: 50, unit: 'g' }
      ],
      steps: [
        { title: 'Soak noodles', instructions: 'Soak rice noodles in warm water for 30 minutes' },
        { title: 'Stir-fry proteins', instructions: 'Stir-fry shrimp and tofu in a wok' },
        { title: 'Add noodles', instructions: 'Add noodles and pad thai sauce' },
        { title: 'Add vegetables', instructions: 'Add bean sprouts and eggs' },
        { title: 'Garnish', instructions: 'Garnish with crushed peanuts and lime' }
      ]
    }
  ],
  'Mediterranean': [
    {
      title: 'Greek Salad',
      description: 'Fresh Mediterranean salad with feta and olives',
      instructions: 'Prepare a refreshing Greek salad with authentic Mediterranean flavors.',
      prepTimeMinutes: 15,
      cookTimeMinutes: 1,
      servings: 4,
      difficulty: 'easy',
      ingredients: [
        { name: 'Cucumber', amount: 1, unit: 'piece' },
        { name: 'Tomatoes', amount: 4, unit: 'pieces' },
        { name: 'Feta cheese', amount: 150, unit: 'g' },
        { name: 'Kalamata olives', amount: 100, unit: 'g' },
        { name: 'Red onion', amount: 1, unit: 'piece' }
      ],
      steps: [
        { title: 'Chop vegetables', instructions: 'Chop cucumber, tomatoes, and red onion' },
        { title: 'Combine', instructions: 'Combine vegetables in a large bowl' },
        { title: 'Add cheese', instructions: 'Add crumbled feta cheese and olives' },
        { title: 'Dress', instructions: 'Drizzle with olive oil and lemon juice' },
        { title: 'Season', instructions: 'Season with salt and oregano' }
      ]
    }
  ],
  'Desserts': [
    {
      title: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center',
      instructions: 'Create individual chocolate lava cakes with a gooey center and crisp exterior.',
      prepTimeMinutes: 20,
      cookTimeMinutes: 12,
      servings: 4,
      difficulty: 'medium',
      ingredients: [
        { name: 'Dark chocolate', amount: 200, unit: 'g' },
        { name: 'Butter', amount: 100, unit: 'g' },
        { name: 'Eggs', amount: 4, unit: 'pieces' },
        { name: 'Sugar', amount: 100, unit: 'g' },
        { name: 'Flour', amount: 60, unit: 'g' }
      ],
      steps: [
        { title: 'Melt chocolate', instructions: 'Melt chocolate and butter together' },
        { title: 'Beat eggs', instructions: 'Beat eggs and sugar until fluffy' },
        { title: 'Combine', instructions: 'Fold chocolate mixture into eggs' },
        { title: 'Add flour', instructions: 'Add flour and mix gently' },
        { title: 'Bake', instructions: 'Bake at 425°F for 12 minutes' },
        { title: 'Serve', instructions: 'Serve immediately while warm' }
      ]
    }
  ],
  'Breakfast': [
    {
      title: 'Fluffy Pancakes',
      description: 'Light and fluffy breakfast pancakes',
      instructions: 'Make perfect fluffy pancakes with a golden brown exterior and tender interior.',
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'easy',
      ingredients: [
        { name: 'All-purpose flour', amount: 200, unit: 'g' },
        { name: 'Milk', amount: 300, unit: 'ml' },
        { name: 'Eggs', amount: 2, unit: 'pieces' },
        { name: 'Butter', amount: 30, unit: 'g' },
        { name: 'Baking powder', amount: 10, unit: 'g' }
      ],
      steps: [
        { title: 'Mix dry ingredients', instructions: 'Mix flour, baking powder, and salt' },
        { title: 'Whisk wet ingredients', instructions: 'Whisk eggs, milk, and melted butter' },
        { title: 'Combine', instructions: 'Combine wet and dry ingredients' },
        { title: 'Cook', instructions: 'Cook on a greased griddle until bubbles form' },
        { title: 'Flip', instructions: 'Flip and cook until golden brown' },
        { title: 'Serve', instructions: 'Serve with maple syrup and butter' }
      ]
    }
  ],
  'Quick & Easy': [
    {
      title: '5-Minute Microwave Omelette',
      description: 'Quick and easy microwave omelette',
      instructions: 'Make a quick and healthy omelette in just 5 minutes using your microwave.',
      prepTimeMinutes: 2,
      cookTimeMinutes: 3,
      servings: 1,
      difficulty: 'easy',
      ingredients: [
        { name: 'Eggs', amount: 2, unit: 'pieces' },
        { name: 'Cheese', amount: 30, unit: 'g' },
        { name: 'Ham', amount: 50, unit: 'g' },
        { name: 'Bell pepper', amount: 0.25, unit: 'piece' }
      ],
      steps: [
        { title: 'Beat eggs', instructions: 'Beat eggs in a microwave-safe bowl' },
        { title: 'Add ingredients', instructions: 'Add cheese, ham, and diced bell pepper' },
        { title: 'Microwave', instructions: 'Microwave for 2-3 minutes until set' },
        { title: 'Rest', instructions: 'Let stand for 1 minute before serving' }
      ]
    }
  ],
  'Vegetarian': [
    {
      title: 'Vegetarian Buddha Bowl',
      description: 'Healthy vegetarian bowl with quinoa and roasted vegetables',
      instructions: 'Create a nutritious and colorful Buddha bowl packed with plant-based goodness.',
      prepTimeMinutes: 20,
      cookTimeMinutes: 25,
      servings: 4,
      difficulty: 'easy',
      ingredients: [
        { name: 'Quinoa', amount: 200, unit: 'g' },
        { name: 'Sweet potato', amount: 2, unit: 'pieces' },
        { name: 'Chickpeas', amount: 400, unit: 'g' },
        { name: 'Kale', amount: 100, unit: 'g' },
        { name: 'Avocado', amount: 2, unit: 'pieces' }
      ],
      steps: [
        { title: 'Cook quinoa', instructions: 'Cook quinoa according to package instructions' },
        { title: 'Roast vegetables', instructions: 'Roast sweet potato and chickpeas with olive oil' },
        { title: 'Prepare kale', instructions: 'Massage kale with lemon juice and olive oil' },
        { title: 'Assemble', instructions: 'Assemble bowls with quinoa, vegetables, and avocado' },
        { title: 'Dress', instructions: 'Drizzle with tahini dressing' }
      ]
    }
  ],
  'Seafood': [
    {
      title: 'Grilled Salmon with Lemon',
      description: 'Simple grilled salmon with fresh lemon and herbs',
      instructions: 'Grill perfect salmon fillets with a crispy skin and tender, flaky flesh.',
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      servings: 4,
      difficulty: 'easy',
      ingredients: [
        { name: 'Salmon fillets', amount: 600, unit: 'g' },
        { name: 'Lemon', amount: 2, unit: 'pieces' },
        { name: 'Fresh dill', amount: 20, unit: 'g' },
        { name: 'Olive oil', amount: 30, unit: 'ml' },
        { name: 'Garlic', amount: 4, unit: 'cloves' }
      ],
      steps: [
        { title: 'Preheat grill', instructions: 'Preheat grill to medium-high heat' },
        { title: 'Season salmon', instructions: 'Season salmon with salt, pepper, and garlic' },
        { title: 'Brush with oil', instructions: 'Brush with olive oil and lemon juice' },
        { title: 'Grill', instructions: 'Grill for 6-8 minutes per side' },
        { title: 'Garnish', instructions: 'Garnish with fresh dill and lemon wedges' }
      ]
    }
  ],
  'Grilling & BBQ': [
    {
      title: 'Classic BBQ Ribs',
      description: 'Slow-cooked BBQ ribs with homemade sauce',
      instructions: 'Master the art of slow-cooked BBQ ribs with a perfect bark and fall-off-the-bone tenderness.',
      prepTimeMinutes: 30,
      cookTimeMinutes: 240,
      servings: 6,
      difficulty: 'hard',
      ingredients: [
        { name: 'Pork ribs', amount: 1000, unit: 'g' },
        { name: 'BBQ sauce', amount: 500, unit: 'ml' },
        { name: 'Brown sugar', amount: 100, unit: 'g' },
        { name: 'Paprika', amount: 20, unit: 'g' },
        { name: 'Garlic powder', amount: 15, unit: 'g' }
      ],
      steps: [
        { title: 'Season ribs', instructions: 'Season ribs with dry rub and let marinate' },
        { title: 'Preheat smoker', instructions: 'Preheat smoker to 225°F (107°C)' },
        { title: 'Smoke ribs', instructions: 'Smoke ribs for 3-4 hours until tender' },
        { title: 'Add sauce', instructions: 'Brush with BBQ sauce in the last 30 minutes' },
        { title: 'Rest', instructions: 'Let rest for 10 minutes before serving' }
      ]
    }
  ]
};

async function createSampleRecipes() {
  console.log('🍳 Creating sample recipes...\n');

  try {
    // Login with existing test user
    console.log('👤 Logging in with test user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.chef@recipeapp.com',
      password: 'TestChef123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    const userId = loginResponse.data.data.user.id;

    console.log('✅ Test user logged in successfully');

    // Get all categories
    console.log('\n📋 Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/active`);
    const categories = categoriesResponse.data.data;

    console.log(`✅ Found ${categories.length} categories`);

    // Get ingredients to map names to IDs
    console.log('\n🥕 Getting ingredients...');
    const ingredientsResponse = await axios.get(`${BASE_URL}/ingredients?limit=100`);
    const ingredients = ingredientsResponse.data.data.items || [];
    
    // Create a map of ingredient names to IDs
    const ingredientMap = {};
    ingredients.forEach(ing => {
      ingredientMap[ing.name.toLowerCase()] = ing.id;
    });

    console.log(`✅ Found ${ingredients.length} ingredients`);

    // Create recipes for each category
    let totalRecipes = 0;
    for (const category of categories) {
      const recipes = sampleRecipes[category.name] || [];
      
      if (recipes.length > 0) {
        console.log(`\n🍽️ Creating recipes for ${category.name}...`);
        
        for (const recipe of recipes) {
          try {
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
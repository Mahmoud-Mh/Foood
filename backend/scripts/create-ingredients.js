const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Ingredients to create
const ingredients = [
  // Vegetables
  { name: 'Onion', category: 'vegetable', description: 'Basic cooking onion' },
  { name: 'Garlic', category: 'vegetable', description: 'Fresh garlic cloves' },
  { name: 'Tomato', category: 'vegetable', description: 'Fresh tomatoes' },
  { name: 'Bell Pepper', category: 'vegetable', description: 'Sweet bell peppers' },
  { name: 'Carrot', category: 'vegetable', description: 'Fresh carrots' },
  { name: 'Potato', category: 'vegetable', description: 'Russet or red potatoes' },
  { name: 'Spinach', category: 'vegetable', description: 'Fresh spinach leaves' },
  { name: 'Broccoli', category: 'vegetable', description: 'Fresh broccoli florets' },
  { name: 'Mushroom', category: 'vegetable', description: 'Button or cremini mushrooms' },
  { name: 'Zucchini', category: 'vegetable', description: 'Fresh zucchini' },

  // Fruits
  { name: 'Lemon', category: 'fruit', description: 'Fresh lemons' },
  { name: 'Lime', category: 'fruit', description: 'Fresh limes' },
  { name: 'Apple', category: 'fruit', description: 'Fresh apples' },
  { name: 'Banana', category: 'fruit', description: 'Ripe bananas' },
  { name: 'Strawberry', category: 'fruit', description: 'Fresh strawberries' },
  { name: 'Orange', category: 'fruit', description: 'Fresh oranges' },

  // Meat
  { name: 'Chicken Breast', category: 'meat', description: 'Boneless chicken breast' },
  { name: 'Ground Beef', category: 'meat', description: 'Lean ground beef' },
  { name: 'Pork Chop', category: 'meat', description: 'Pork chops' },
  { name: 'Bacon', category: 'meat', description: 'Smoked bacon' },
  { name: 'Turkey', category: 'meat', description: 'Ground turkey' },

  // Seafood
  { name: 'Salmon', category: 'seafood', description: 'Fresh salmon fillet' },
  { name: 'Shrimp', category: 'seafood', description: 'Large shrimp' },
  { name: 'Tuna', category: 'seafood', description: 'Fresh tuna steak' },
  { name: 'Cod', category: 'seafood', description: 'Fresh cod fillet' },

  // Dairy
  { name: 'Milk', category: 'dairy', description: 'Whole milk' },
  { name: 'Cheese', category: 'dairy', description: 'Cheddar cheese' },
  { name: 'Butter', category: 'dairy', description: 'Unsalted butter' },
  { name: 'Yogurt', category: 'dairy', description: 'Plain Greek yogurt' },
  { name: 'Cream', category: 'dairy', description: 'Heavy cream' },
  { name: 'Eggs', category: 'dairy', description: 'Large eggs' },

  // Grains
  { name: 'Rice', category: 'grain', description: 'Long grain white rice' },
  { name: 'Pasta', category: 'grain', description: 'Spaghetti or penne pasta' },
  { name: 'Bread', category: 'grain', description: 'Fresh bread' },
  { name: 'Flour', category: 'grain', description: 'All-purpose flour' },
  { name: 'Oats', category: 'grain', description: 'Rolled oats' },

  // Spices
  { name: 'Salt', category: 'spice', description: 'Table salt' },
  { name: 'Black Pepper', category: 'spice', description: 'Ground black pepper' },
  { name: 'Oregano', category: 'spice', description: 'Dried oregano' },
  { name: 'Basil', category: 'spice', description: 'Dried basil' },
  { name: 'Cumin', category: 'spice', description: 'Ground cumin' },
  { name: 'Paprika', category: 'spice', description: 'Sweet paprika' },
  { name: 'Cinnamon', category: 'spice', description: 'Ground cinnamon' },

  // Herbs
  { name: 'Parsley', category: 'herb', description: 'Fresh parsley' },
  { name: 'Cilantro', category: 'herb', description: 'Fresh cilantro' },
  { name: 'Rosemary', category: 'herb', description: 'Fresh rosemary' },
  { name: 'Thyme', category: 'herb', description: 'Fresh thyme' },
  { name: 'Mint', category: 'herb', description: 'Fresh mint' },

  // Condiments
  { name: 'Olive Oil', category: 'condiment', description: 'Extra virgin olive oil' },
  { name: 'Soy Sauce', category: 'condiment', description: 'Light soy sauce' },
  { name: 'Ketchup', category: 'condiment', description: 'Tomato ketchup' },
  { name: 'Mustard', category: 'condiment', description: 'Dijon mustard' },
  { name: 'Mayonnaise', category: 'condiment', description: 'Mayonnaise' },

  // Baking
  { name: 'Sugar', category: 'baking', description: 'Granulated sugar' },
  { name: 'Baking Powder', category: 'baking', description: 'Baking powder' },
  { name: 'Baking Soda', category: 'baking', description: 'Baking soda' },
  { name: 'Vanilla Extract', category: 'baking', description: 'Pure vanilla extract' },
  { name: 'Chocolate Chips', category: 'baking', description: 'Semi-sweet chocolate chips' },

  // Other
  { name: 'Honey', category: 'other', description: 'Pure honey' },
  { name: 'Peanut Butter', category: 'other', description: 'Smooth peanut butter' },
  { name: 'Nuts', category: 'other', description: 'Mixed nuts' },
  { name: 'Broth', category: 'other', description: 'Chicken or vegetable broth' }
];

async function createIngredients() {
  try {
    console.log('🚀 Starting ingredient creation...');
    
    // First, try to register a user (or use existing)
    console.log('📝 Checking/registering user...');
    
    const userData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@recipeapp.com',
      password: 'Admin123!',
      confirmPassword: 'Admin123!'
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ User already exists, proceeding...');
      } else {
        throw error;
      }
    }

    // Bootstrap the user to admin
    console.log('🔑 Promoting user to admin...');
    const bootstrapResponse = await axios.patch(`${BASE_URL}/users/bootstrap-admin/admin@recipeapp.com`);
    console.log('✅ User promoted to admin successfully');

    // Get the new admin tokens
    const adminTokens = bootstrapResponse.data.data.tokens;
    const accessToken = adminTokens.accessToken;
    console.log('🔑 Admin access token obtained');

    // Set up axios with admin auth header
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Create ingredients
    console.log('📋 Creating ingredients...');
    
    for (const ingredient of ingredients) {
      try {
        const response = await api.post('/ingredients', ingredient);
        console.log(`✅ Created ingredient: ${ingredient.name} (${ingredient.category})`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️  Ingredient already exists: ${ingredient.name}`);
        } else {
          console.error(`❌ Failed to create ingredient ${ingredient.name}:`, error.response?.data || error.message);
        }
      }
    }

    console.log('🎉 Ingredient creation completed!');
    
    // List all ingredients to verify
    console.log('📋 Listing all ingredients...');
    const ingredientsResponse = await api.get('/ingredients');
    console.log('Available ingredients:');
    ingredientsResponse.data.data.data.forEach(ing => {
      console.log(`  - ${ing.name} (${ing.category})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the script
createIngredients(); 
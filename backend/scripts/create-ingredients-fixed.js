const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Ingredients to create with correct categories
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
  { name: 'Cucumber', category: 'vegetable', description: 'Fresh cucumber' },

  // Fruits
  { name: 'Lemon', category: 'fruit', description: 'Fresh lemons' },
  { name: 'Lime', category: 'fruit', description: 'Fresh limes' },
  { name: 'Apple', category: 'fruit', description: 'Fresh apples' },
  { name: 'Banana', category: 'fruit', description: 'Ripe bananas' },
  { name: 'Strawberry', category: 'fruit', description: 'Fresh strawberries' },
  { name: 'Orange', category: 'fruit', description: 'Fresh oranges' },
  { name: 'Pineapple', category: 'fruit', description: 'Fresh pineapple' },

  // Protein
  { name: 'Chicken Breast', category: 'protein', description: 'Boneless chicken breast' },
  { name: 'Ground Beef', category: 'protein', description: 'Lean ground beef' },
  { name: 'Pork Chop', category: 'protein', description: 'Pork chops' },
  { name: 'Bacon', category: 'protein', description: 'Smoked bacon' },
  { name: 'Turkey', category: 'protein', description: 'Ground turkey' },
  { name: 'Salmon', category: 'protein', description: 'Fresh salmon fillet' },
  { name: 'Shrimp', category: 'protein', description: 'Large shrimp' },
  { name: 'Tuna', category: 'protein', description: 'Fresh tuna steak' },
  { name: 'Cod', category: 'protein', description: 'Fresh cod fillet' },
  { name: 'Eggs', category: 'protein', description: 'Large eggs' },

  // Dairy
  { name: 'Milk', category: 'dairy', description: 'Whole milk' },
  { name: 'Cheese', category: 'dairy', description: 'Cheddar cheese' },
  { name: 'Butter', category: 'dairy', description: 'Unsalted butter' },
  { name: 'Yogurt', category: 'dairy', description: 'Plain Greek yogurt' },
  { name: 'Cream', category: 'dairy', description: 'Heavy cream' },
  { name: 'Feta Cheese', category: 'dairy', description: 'Crumbled feta cheese' },

  // Grains
  { name: 'Rice', category: 'grain', description: 'Long grain white rice' },
  { name: 'Pasta', category: 'grain', description: 'Spaghetti or penne pasta' },
  { name: 'Bread', category: 'grain', description: 'Fresh bread' },
  { name: 'Flour', category: 'grain', description: 'All-purpose flour' },
  { name: 'Oats', category: 'grain', description: 'Rolled oats' },
  { name: 'Quinoa', category: 'grain', description: 'Quinoa grains' },

  // Spices
  { name: 'Salt', category: 'spice', description: 'Table salt' },
  { name: 'Black Pepper', category: 'spice', description: 'Ground black pepper' },
  { name: 'Oregano', category: 'spice', description: 'Dried oregano' },
  { name: 'Basil', category: 'spice', description: 'Dried basil' },
  { name: 'Cumin', category: 'spice', description: 'Ground cumin' },
  { name: 'Paprika', category: 'spice', description: 'Sweet paprika' },
  { name: 'Cinnamon', category: 'spice', description: 'Ground cinnamon' },
  { name: 'Garlic Powder', category: 'spice', description: 'Dried garlic powder' },

  // Herbs
  { name: 'Parsley', category: 'herb', description: 'Fresh parsley' },
  { name: 'Cilantro', category: 'herb', description: 'Fresh cilantro' },
  { name: 'Rosemary', category: 'herb', description: 'Fresh rosemary' },
  { name: 'Thyme', category: 'herb', description: 'Fresh thyme' },
  { name: 'Mint', category: 'herb', description: 'Fresh mint' },
  { name: 'Fresh Dill', category: 'herb', description: 'Fresh dill' },

  // Condiments
  { name: 'Olive Oil', category: 'condiment', description: 'Extra virgin olive oil' },
  { name: 'Soy Sauce', category: 'condiment', description: 'Light soy sauce' },
  { name: 'Ketchup', category: 'condiment', description: 'Tomato ketchup' },
  { name: 'Mustard', category: 'condiment', description: 'Dijon mustard' },
  { name: 'Mayonnaise', category: 'condiment', description: 'Mayonnaise' },
  { name: 'BBQ Sauce', category: 'condiment', description: 'Barbecue sauce' },

  // Other
  { name: 'Sugar', category: 'other', description: 'Granulated sugar' },
  { name: 'Baking Powder', category: 'other', description: 'Baking powder' },
  { name: 'Baking Soda', category: 'other', description: 'Baking soda' },
  { name: 'Vanilla Extract', category: 'other', description: 'Pure vanilla extract' },
  { name: 'Chocolate Chips', category: 'other', description: 'Semi-sweet chocolate chips' },
  { name: 'Dark Chocolate', category: 'other', description: 'Dark chocolate' },
  { name: 'Honey', category: 'other', description: 'Pure honey' },
  { name: 'Peanut Butter', category: 'other', description: 'Smooth peanut butter' },
  { name: 'Nuts', category: 'other', description: 'Mixed nuts' },
  { name: 'Broth', category: 'other', description: 'Chicken or vegetable broth' },
  { name: 'Brown Sugar', category: 'other', description: 'Brown sugar' },
  { name: 'Tofu', category: 'other', description: 'Firm tofu' },
  { name: 'Bean Sprouts', category: 'other', description: 'Fresh bean sprouts' },
  { name: 'Peanuts', category: 'other', description: 'Roasted peanuts' },
  { name: 'Kalamata Olives', category: 'other', description: 'Kalamata olives' },
  { name: 'Red Onion', category: 'other', description: 'Red onion' },
  { name: 'Sweet Potato', category: 'other', description: 'Sweet potato' },
  { name: 'Chickpeas', category: 'other', description: 'Canned chickpeas' },
  { name: 'Kale', category: 'other', description: 'Fresh kale' },
  { name: 'Avocado', category: 'other', description: 'Ripe avocado' },
  { name: 'Pork Shoulder', category: 'other', description: 'Pork shoulder' },
  { name: 'Corn Tortillas', category: 'other', description: 'Corn tortillas' },
  { name: 'Pizza Dough', category: 'other', description: 'Fresh pizza dough' },
  { name: 'Fresh Mozzarella', category: 'other', description: 'Fresh mozzarella cheese' },
  { name: 'Tomato Sauce', category: 'other', description: 'Tomato sauce' },
  { name: 'Fresh Basil', category: 'other', description: 'Fresh basil leaves' },
  { name: 'Spaghetti', category: 'other', description: 'Spaghetti pasta' },
  { name: 'Pancetta', category: 'other', description: 'Pancetta' },
  { name: 'Parmesan Cheese', category: 'other', description: 'Parmesan cheese' },
  { name: 'Pork Ribs', category: 'other', description: 'Pork ribs' },
  { name: 'Salmon Fillets', category: 'other', description: 'Salmon fillets' },
  { name: 'All-purpose Flour', category: 'other', description: 'All-purpose flour' },
  { name: 'Ham', category: 'other', description: 'Sliced ham' }
];

async function createIngredients() {
  try {
    console.log('🚀 Starting ingredient creation...');
    
    // First, try to register a user (or use existing)
    console.log('📝 Checking/registering user...');
    
    const userData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.ingredients@recipeapp.com',
      password: 'AdminIngredients123!',
      confirmPassword: 'AdminIngredients123!'
    };

    let token;
    let userId;

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
      token = registerResponse.data.data.tokens.accessToken;
      userId = registerResponse.data.data.user.id;
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ User already exists, proceeding...');
        // Try to login instead
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

    // Promote to admin if needed
    try {
      await axios.patch(
        `${BASE_URL}/users/${userId}/role`,
        { role: 'admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('🔑 Promoting user to admin...');
    } catch (error) {
      console.log('⚠️ User might already be admin or promotion failed');
    }

    console.log('\n🥕 Creating ingredients...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const ingredient of ingredients) {
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
        console.log(`✅ Created ingredient: ${ingredient.name} (${ingredient.category})`);
        createdCount++;
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️  Ingredient already exists: ${ingredient.name}`);
          skippedCount++;
        } else {
          console.error(`❌ Failed to create ingredient ${ingredient.name}:`, error.response?.data || error.message);
        }
      }
    }

    console.log(`\n🎉 Ingredient creation completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Skipped (already exists): ${skippedCount}`);
    console.log(`   Total processed: ${ingredients.length}`);

    // List all ingredients
    console.log('\n📋 Listing all ingredients...');
    const ingredientsResponse = await axios.get(`${BASE_URL}/ingredients?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const allIngredients = ingredientsResponse.data.data.items || [];
    console.log('Available ingredients:');
    allIngredients.forEach(ing => {
      console.log(`  - ${ing.name} (${ing.category})`);
    });

  } catch (error) {
    console.error('❌ Error creating ingredients:', error.response?.data || error.message);
  }
}

createIngredients(); 
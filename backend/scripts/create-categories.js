const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Categories to create
const categories = [
  {
    name: 'Italian Cuisine',
    description: 'Traditional Italian dishes and recipes',
    icon: '🍝',
    sortOrder: 1
  },
  {
    name: 'Mexican Cuisine',
    description: 'Authentic Mexican recipes and dishes',
    icon: '🌮',
    sortOrder: 2
  },
  {
    name: 'Asian Cuisine',
    description: 'Diverse Asian recipes from various regions',
    icon: '🍜',
    sortOrder: 3
  },
  {
    name: 'Mediterranean',
    description: 'Healthy Mediterranean diet recipes',
    icon: '🥗',
    sortOrder: 4
  },
  {
    name: 'Desserts',
    description: 'Sweet treats and dessert recipes',
    icon: '🍰',
    sortOrder: 5
  },
  {
    name: 'Breakfast',
    description: 'Morning meals and breakfast recipes',
    icon: '🥞',
    sortOrder: 6
  },
  {
    name: 'Quick & Easy',
    description: 'Fast and simple recipes for busy days',
    icon: '⚡',
    sortOrder: 7
  },
  {
    name: 'Vegetarian',
    description: 'Plant-based and vegetarian recipes',
    icon: '🥬',
    sortOrder: 8
  },
  {
    name: 'Seafood',
    description: 'Fish and seafood recipes',
    icon: '🐟',
    sortOrder: 9
  },
  {
    name: 'Grilling & BBQ',
    description: 'Outdoor cooking and barbecue recipes',
    icon: '🔥',
    sortOrder: 10
  }
];

async function createCategories() {
  try {
    console.log('🚀 Starting category creation...');
    
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

    // Create categories
    console.log('📋 Creating categories...');
    
    for (const category of categories) {
      try {
        const response = await api.post('/categories', category);
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️  Category already exists: ${category.name}`);
        } else {
          console.error(`❌ Failed to create category ${category.name}:`, error.response?.data || error.message);
        }
      }
    }

    console.log('🎉 Category creation completed!');
    
    // List all categories to verify
    console.log('📋 Listing all categories...');
    const categoriesResponse = await api.get('/categories');
    console.log('Available categories:');
    categoriesResponse.data.data.data.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.icon})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the script
createCategories(); 
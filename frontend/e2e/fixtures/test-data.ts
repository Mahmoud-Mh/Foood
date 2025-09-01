export const testUsers = {
  regularUser: {
    firstName: 'John',
    lastName: 'Doe', 
    email: 'john.doe@test.com',
    password: 'TestPassword123!',
    role: 'user'
  },
  adminUser: {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com', 
    password: 'AdminPassword123!',
    role: 'admin'
  },
  newUser: {
    firstName: 'New',
    lastName: 'User',
    email: 'new.user@test.com',
    password: 'NewPassword123!',
    role: 'user'
  }
};

export const testRecipes = {
  chocolateCake: {
    title: 'Ultimate Chocolate Cake',
    description: 'A rich and moist chocolate cake that will satisfy any chocolate lover.',
    category: 'Dessert',
    difficulty: 'Medium',
    prepTime: 30,
    cookTime: 45,
    servings: 8,
    ingredients: [
      '2 cups all-purpose flour',
      '2 cups granulated sugar', 
      '3/4 cup cocoa powder',
      '2 teaspoons baking soda',
      '1 teaspoon baking powder',
      '1 teaspoon salt',
      '2 large eggs',
      '1 cup buttermilk',
      '1/2 cup vegetable oil',
      '2 teaspoons vanilla extract'
    ],
    instructions: [
      'Preheat oven to 350°F. Grease two 9-inch round cake pans.',
      'In a large bowl, whisk together flour, sugar, cocoa powder, baking soda, baking powder, and salt.',
      'In another bowl, beat eggs, buttermilk, oil, and vanilla extract.',
      'Pour wet ingredients into dry ingredients and mix until just combined.',
      'Divide batter between prepared pans and bake for 30-35 minutes.',
      'Cool completely before frosting.'
    ]
  },
  chickenCurry: {
    title: 'Creamy Chicken Curry',
    description: 'A flavorful and aromatic chicken curry perfect with rice or naan.',
    category: 'Main Course',
    difficulty: 'Easy',
    prepTime: 15,
    cookTime: 35,
    servings: 4,
    ingredients: [
      '2 lbs boneless chicken, cut into pieces',
      '2 tablespoons vegetable oil',
      '1 large onion, diced',
      '3 cloves garlic, minced',
      '1 inch ginger, grated',
      '2 tablespoons curry powder',
      '1 can coconut milk',
      '1 can diced tomatoes',
      '1 teaspoon salt',
      'Fresh cilantro for garnish'
    ],
    instructions: [
      'Heat oil in a large skillet over medium-high heat.',
      'Add chicken pieces and cook until browned on all sides.',
      'Add onion, garlic, and ginger. Cook until onion is translucent.',
      'Stir in curry powder and cook for 1 minute.',
      'Add coconut milk, diced tomatoes, and salt.',
      'Simmer for 20-25 minutes until chicken is cooked through.',
      'Garnish with fresh cilantro and serve.'
    ]
  },
  caesarSalad: {
    title: 'Classic Caesar Salad',
    description: 'Crisp romaine lettuce with homemade Caesar dressing and croutons.',
    category: 'Salad',
    difficulty: 'Easy',
    prepTime: 20,
    cookTime: 0,
    servings: 4,
    ingredients: [
      '1 large head romaine lettuce, chopped',
      '1/2 cup grated Parmesan cheese',
      '1/4 cup olive oil',
      '2 tablespoons lemon juice',
      '2 cloves garlic, minced',
      '2 anchovy fillets, minced',
      '1 teaspoon Dijon mustard',
      '1/2 teaspoon Worcestershire sauce',
      '1 cup croutons',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Wash and dry romaine lettuce, then chop into bite-sized pieces.',
      'In a small bowl, whisk together olive oil, lemon juice, garlic, anchovies, mustard, and Worcestershire sauce.',
      'In a large bowl, toss lettuce with dressing.',
      'Add Parmesan cheese and croutons.',
      'Season with salt and pepper to taste.',
      'Serve immediately.'
    ]
  }
};

export const testCategories = [
  'Appetizer',
  'Main Course', 
  'Dessert',
  'Salad',
  'Soup',
  'Side Dish',
  'Beverage',
  'Snack'
];

export const testSearchQueries = [
  'chocolate',
  'chicken', 
  'salad',
  'curry',
  'cake',
  'easy recipes',
  'quick dinner',
  'healthy meals'
];

export const mockApiResponses = {
  authSuccess: {
    success: true,
    data: {
      user: testUsers.regularUser,
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    }
  },
  authError: {
    success: false,
    message: 'Invalid credentials'
  },
  recipesSuccess: {
    success: true,
    data: {
      recipes: Object.values(testRecipes),
      total: 3,
      page: 1,
      pages: 1
    }
  },
  createRecipeSuccess: {
    success: true,
    data: {
      id: '123',
      ...testRecipes.chocolateCake,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: testUsers.regularUser
    }
  }
};
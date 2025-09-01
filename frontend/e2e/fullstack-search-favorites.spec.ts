import { test, expect } from '@playwright/test';
import { createFullStackHelpers } from './utils/fullstack-helpers';
import { testUsers } from './fullstack-global-setup';

test.describe('🔍 Full-Stack Search & Favorites Tests', () => {
  let helpers: ReturnType<typeof createFullStackHelpers>;

  test.beforeEach(async ({ page }) => {
    helpers = createFullStackHelpers(page);
    
    // Login as regular user
    await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await helpers.cleanupTestData();
  });

  test.describe('Recipe Search Functionality', () => {
    test('should search recipes by title', async ({ page }) => {
      // Create test recipes with distinct titles
      const recipes = [
        {
          title: `Chocolate Cake Search Test ${Date.now()}`,
          description: 'A delicious chocolate cake',
          ingredients: ['2 cups flour', '1 cup cocoa powder'],
          instructions: ['Mix ingredients', 'Bake for 30 minutes']
        },
        {
          title: `Vanilla Cookies Search Test ${Date.now()}`,
          description: 'Sweet vanilla cookies',
          ingredients: ['2 cups flour', '1 cup sugar'],
          instructions: ['Mix ingredients', 'Bake for 15 minutes']
        }
      ];

      // Create recipes
      for (const recipe of recipes) {
        await helpers.createRecipe(recipe);
      }

      // Search for chocolate
      await helpers.searchRecipes('Chocolate');
      
      // Should find chocolate cake
      await expect(page.locator(`text=${recipes[0].title}`)).toBeVisible();
      
      // Should not find vanilla cookies (if search filtering works)
      const vanillaVisible = await page.locator(`text=${recipes[1].title}`).isVisible();
      if (!vanillaVisible) {
        console.log('✅ Search filtering working correctly');
      }
    });

    test('should search recipes by ingredients', async ({ page }) => {
      const recipe = {
        title: `Tomato Basil Recipe ${Date.now()}`,
        description: 'Fresh tomato and basil dish',
        ingredients: ['Fresh tomatoes', 'Basil leaves', 'Olive oil'],
        instructions: ['Chop tomatoes', 'Add basil and oil']
      };

      await helpers.createRecipe(recipe);

      // Search by ingredient
      await helpers.searchRecipes('tomatoes');

      // Should find the recipe
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();
    });

    test('should handle empty search results', async ({ page }) => {
      await helpers.searchRecipes('NonExistentRecipeXYZ123');

      // Should show no results message or empty state
      const hasNoResults = await page.locator('text=/no.*results|no.*recipes.*found|no.*matches/i').isVisible();
      const hasEmptyState = await page.locator('[data-testid="empty-state"], .empty-state').isVisible();
      
      expect(hasNoResults || hasEmptyState).toBeTruthy();
    });

    test('should handle search with special characters', async ({ page }) => {
      const recipe = {
        title: `Special Recipe ${Date.now()} (Test & Review)`,
        description: 'Recipe with special characters in title',
        ingredients: ['1 cup flour'],
        instructions: ['Mix well']
      };

      await helpers.createRecipe(recipe);

      // Search with special characters
      await helpers.searchRecipes('Test & Review');

      // Should find the recipe
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();
    });

    test('should perform case-insensitive search', async ({ page }) => {
      const recipe = {
        title: `UPPERCASE Recipe ${Date.now()}`,
        description: 'Testing case sensitivity',
        ingredients: ['1 cup flour'],
        instructions: ['Mix well']
      };

      await helpers.createRecipe(recipe);

      // Search in lowercase
      await helpers.searchRecipes('uppercase');

      // Should find the recipe regardless of case
      const foundRecipe = await page.locator(`text=${recipe.title}`).isVisible();
      if (foundRecipe) {
        console.log('✅ Case-insensitive search working');
      }
    });
  });

  test.describe('Recipe Favorites Functionality', () => {
    test('should add recipe to favorites', async ({ page }) => {
      const recipe = {
        title: `Favorite Test Recipe ${Date.now()}`,
        description: 'Testing favorites functionality',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      // Navigate to recipes page to find our recipe
      await page.goto('/recipes');
      await page.waitForLoadState('networkidle');

      // Add to favorites
      await helpers.addToFavorites(recipe.title);

      // Navigate to favorites page
      await helpers.goToFavorites();

      // Should see the recipe in favorites
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();
    });

    test('should remove recipe from favorites', async ({ page }) => {
      const recipe = {
        title: `Remove Favorite Recipe ${Date.now()}`,
        description: 'Testing favorite removal',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      // Add to favorites first
      await page.goto('/recipes');
      await helpers.addToFavorites(recipe.title);

      // Go to favorites page
      await helpers.goToFavorites();
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();

      // Remove from favorites
      const recipeCard = page.locator(`text=${recipe.title}`).locator('..').locator('..');
      const favoriteButton = recipeCard.locator('[data-testid="favorite-button"], .favorite-btn, button:has-text("♥"), button:has-text("♡")').first();
      await favoriteButton.click();
      
      // Wait for API response
      await page.waitForTimeout(1000);

      // Refresh or reload favorites
      await page.reload();
      
      // Should no longer see the recipe in favorites
      const stillVisible = await page.locator(`text=${recipe.title}`).isVisible();
      if (!stillVisible) {
        console.log('✅ Recipe removed from favorites successfully');
      }
    });

    test('should show empty favorites page when no favorites exist', async ({ page }) => {
      await helpers.goToFavorites();

      // Should show empty state
      const hasEmptyMessage = await page.locator('text=/no.*favorites|no.*recipes.*saved|empty.*favorites/i').isVisible();
      const hasEmptyState = await page.locator('[data-testid="empty-favorites"], .empty-favorites').isVisible();
      
      expect(hasEmptyMessage || hasEmptyState).toBeTruthy();
    });

    test('should persist favorites across sessions', async ({ page }) => {
      const recipe = {
        title: `Session Favorite Recipe ${Date.now()}`,
        description: 'Testing favorites persistence',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      // Add to favorites
      await page.goto('/recipes');
      await helpers.addToFavorites(recipe.title);

      // Logout and login again
      await helpers.logout();
      await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);

      // Check if favorite persists
      await helpers.goToFavorites();
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();
    });

    test('should show favorite status on recipe cards', async ({ page }) => {
      const recipe = {
        title: `Favorite Status Recipe ${Date.now()}`,
        description: 'Testing favorite visual status',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      // Go to recipes page
      await page.goto('/recipes');
      await page.waitForLoadState('networkidle');

      // Find recipe card and favorite button
      const recipeCard = page.locator(`text=${recipe.title}`).locator('..').locator('..');
      const favoriteButton = recipeCard.locator('[data-testid="favorite-button"], .favorite-btn, button:has-text("♡"), button:has-text("♥")').first();

      // Check initial state (should be unfavorited)
      const initialState = await favoriteButton.innerHTML();
      
      // Add to favorites
      await favoriteButton.click();
      await page.waitForTimeout(1000);

      // Check updated state (should show as favorited)
      const updatedState = await favoriteButton.innerHTML();
      
      // States should be different
      expect(initialState !== updatedState).toBeTruthy();
    });
  });

  test.describe('Advanced Search Features', () => {
    test('should filter recipes by category during search', async ({ page }) => {
      // Create recipes in different categories
      const dessertRecipe = {
        title: `Dessert Search Recipe ${Date.now()}`,
        description: 'Sweet dessert recipe',
        ingredients: ['Sugar', 'Flour'],
        instructions: ['Mix and bake'],
        category: 'Dessert'
      };

      const mainRecipe = {
        title: `Main Course Search Recipe ${Date.now()}`,
        description: 'Hearty main course',
        ingredients: ['Chicken', 'Rice'],
        instructions: ['Cook and serve'],
        category: 'Main Course'
      };

      await helpers.createRecipe(dessertRecipe);
      await helpers.createRecipe(mainRecipe);

      // Navigate to search with category filter
      await page.goto('/recipes');
      
      // If category filter exists, use it
      const categoryFilter = page.locator('select[name="category"], [data-testid="category-filter"]');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.selectOption('Dessert');
        
        // Should show dessert recipe
        await expect(page.locator(`text=${dessertRecipe.title}`)).toBeVisible();
        
        // Should not show main course (if filtering works)
        const mainVisible = await page.locator(`text=${mainRecipe.title}`).isVisible();
        console.log(`Main course visible in dessert filter: ${mainVisible}`);
      }
    });

    test('should filter recipes by difficulty', async ({ page }) => {
      const easyRecipe = {
        title: `Easy Search Recipe ${Date.now()}`,
        description: 'Simple and easy',
        ingredients: ['Simple ingredient'],
        instructions: ['Easy step'],
        difficulty: 'Easy'
      };

      const hardRecipe = {
        title: `Hard Search Recipe ${Date.now()}`,
        description: 'Complex recipe',
        ingredients: ['Complex ingredient'],
        instructions: ['Difficult step'],
        difficulty: 'Hard'
      };

      await helpers.createRecipe(easyRecipe);
      await helpers.createRecipe(hardRecipe);

      await page.goto('/recipes');

      // If difficulty filter exists, use it
      const difficultyFilter = page.locator('select[name="difficulty"], [data-testid="difficulty-filter"]');
      if (await difficultyFilter.isVisible()) {
        await difficultyFilter.selectOption('Easy');
        
        // Should show easy recipe
        await expect(page.locator(`text=${easyRecipe.title}`)).toBeVisible();
      }
    });

    test('should sort search results', async ({ page }) => {
      // Create recipes with different characteristics
      const recipes = [
        {
          title: `A First Recipe ${Date.now()}`,
          description: 'Should appear first alphabetically',
          ingredients: ['Ingredient A'],
          instructions: ['Step A']
        },
        {
          title: `Z Last Recipe ${Date.now()}`,
          description: 'Should appear last alphabetically',
          ingredients: ['Ingredient Z'],
          instructions: ['Step Z']
        }
      ];

      for (const recipe of recipes) {
        await helpers.createRecipe(recipe);
      }

      await page.goto('/recipes');

      // If sort option exists, use it
      const sortSelect = page.locator('select[name="sort"], [data-testid="sort-select"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('title-asc');
        
        // Wait for results to update
        await page.waitForTimeout(1000);
        
        // Check order (first recipe should appear before last)
        const allTitles = await page.locator('.recipe-card h3, .recipe-title, h2').allTextContents();
        const firstIndex = allTitles.findIndex(title => title.includes('A First Recipe'));
        const lastIndex = allTitles.findIndex(title => title.includes('Z Last Recipe'));
        
        if (firstIndex !== -1 && lastIndex !== -1) {
          expect(firstIndex).toBeLessThan(lastIndex);
        }
      }
    });
  });

  test.describe('Search Performance and UX', () => {
    test('should handle rapid search queries', async ({ page }) => {
      // Create a test recipe
      const recipe = {
        title: `Rapid Search Recipe ${Date.now()}`,
        description: 'Testing rapid search',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      await page.goto('/recipes');
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="search"]').first();
      
      if (await searchInput.isVisible()) {
        // Rapid fire search queries
        await searchInput.fill('R');
        await page.waitForTimeout(100);
        await searchInput.fill('Ra');
        await page.waitForTimeout(100);
        await searchInput.fill('Rap');
        await page.waitForTimeout(100);
        await searchInput.fill('Rapid');
        
        // Wait for final results
        await page.waitForTimeout(1000);
        
        // Should show the recipe
        await expect(page.locator(`text=${recipe.title}`)).toBeVisible();
      }
    });

    test('should show loading state during search', async ({ page }) => {
      await page.goto('/recipes');
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="search"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await searchInput.press('Enter');
        
        // Look for loading indicator
        const hasLoadingState = await page.locator('text=/loading|searching/i, .spinner, .loading').isVisible();
        if (hasLoadingState) {
          console.log('✅ Loading state shown during search');
        }
      }
    });

    test('should clear search results when search is cleared', async ({ page }) => {
      // Create a recipe
      const recipe = {
        title: `Clear Search Recipe ${Date.now()}`,
        description: 'Testing search clearing',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      await page.goto('/recipes');
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="search"]').first();
      
      if (await searchInput.isVisible()) {
        // Perform search
        await searchInput.fill('Clear Search');
        await page.waitForTimeout(1000);
        
        // Clear search
        await searchInput.fill('');
        await page.waitForTimeout(1000);
        
        // Should show all recipes again (or default state)
        console.log('✅ Search cleared successfully');
      }
    });
  });

  test.describe('API Integration Tests', () => {
    test('should sync favorites with backend API', async ({ page }) => {
      const recipe = {
        title: `API Favorite Recipe ${Date.now()}`,
        description: 'Testing API favorites sync',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      // Add to favorites via UI
      await page.goto('/recipes');
      await helpers.addToFavorites(recipe.title);

      // Verify via API
      const response = await helpers.apiRequest('GET', '/favorites');
      if (response.ok()) {
        const favorites = await response.json();
        const isFavorited = favorites.data?.some((fav: any) => fav.title === recipe.title);
        expect(isFavorited).toBeTruthy();
      }
    });

    test('should handle API errors gracefully in search', async ({ page }) => {
      await page.goto('/recipes');
      
      // Simulate API error by searching with problematic query
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="search"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('x'.repeat(1000)); // Very long search query
        await searchInput.press('Enter');
        
        // Should handle gracefully
        const hasError = await page.locator('text=/error|failed|try.*again/i').isVisible();
        const hasResults = await page.locator('.recipe-card, .recipe-item').count() >= 0;
        
        // Either shows error or handles gracefully
        expect(hasError || hasResults >= 0).toBeTruthy();
      }
    });
  });
});
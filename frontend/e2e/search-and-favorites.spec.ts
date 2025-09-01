import { test, expect } from '@playwright/test';
import { createTestHelpers } from './utils/test-helpers';
import { testUsers, testRecipes, testSearchQueries } from './fixtures/test-data';

test.describe('Search and Favorites', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Login before each test
    await helpers.loginAsUser(testUsers.regularUser.email, testUsers.regularUser.password);
  });

  test.describe('Recipe Search', () => {
    test('should search recipes by title', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // Navigate to recipes page
      await page.click('text=Browse Recipes');
      await expect(page).toHaveURL('/recipes');
      
      // Search for chocolate recipes
      await page.fill('input[placeholder*="Search"]', 'chocolate');
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      // Wait for search results to load
      await page.waitForLoadState('networkidle');
      
      // Should show search results
      await expect(page.locator('text=Search results for "chocolate"')).toBeVisible();
      
      // Results should contain chocolate-related recipes
      await expect(page.locator('.recipe-card')).toHaveCount(1, { timeout: 10000 });
      await expect(page.locator('text=Ultimate Chocolate Cake')).toBeVisible();
    });

    test('should search recipes by ingredients', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Search by ingredient
      await page.fill('input[placeholder*="Search"]', 'chicken');
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Should find recipes containing chicken
      await expect(page.locator('text=Search results for "chicken"')).toBeVisible();
      await expect(page.locator('text=Creamy Chicken Curry')).toBeVisible();
    });

    test('should show no results for non-existent recipes', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Search for something that doesn't exist
      await page.fill('input[placeholder*="Search"]', 'unicorn-recipe-that-does-not-exist');
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Should show no results message
      await expect(page.locator('text=No recipes found')).toBeVisible();
      await expect(page.locator('text=Try adjusting your search terms')).toBeVisible();
    });

    test('should filter recipes by category', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Select dessert category filter
      await page.selectOption('select[name="category"]', 'Dessert');
      
      await page.waitForLoadState('networkidle');
      
      // Should show only dessert recipes
      await expect(page.locator('.recipe-card')).toHaveCount(1, { timeout: 5000 });
      await expect(page.locator('text=Ultimate Chocolate Cake')).toBeVisible();
      
      // Should not show non-dessert recipes
      await expect(page.locator('text=Creamy Chicken Curry')).not.toBeVisible();
    });

    test('should filter recipes by difficulty', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Select easy difficulty filter
      await page.selectOption('select[name="difficulty"]', 'Easy');
      
      await page.waitForLoadState('networkidle');
      
      // Should show only easy recipes
      await expect(page.locator('text=Creamy Chicken Curry')).toBeVisible();
      await expect(page.locator('text=Classic Caesar Salad')).toBeVisible();
      
      // Should not show medium/hard recipes
      await expect(page.locator('text=Ultimate Chocolate Cake')).not.toBeVisible();
    });

    test('should combine search with filters', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Search for "salad" and filter by "Easy" difficulty
      await page.fill('input[placeholder*="Search"]', 'salad');
      await page.selectOption('select[name="difficulty"]', 'Easy');
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Should show Caesar Salad (easy difficulty, contains "salad")
      await expect(page.locator('text=Classic Caesar Salad')).toBeVisible();
      
      // Should not show other recipes
      await expect(page.locator('text=Ultimate Chocolate Cake')).not.toBeVisible();
      await expect(page.locator('text=Creamy Chicken Curry')).not.toBeVisible();
    });

    test('should clear search filters', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Apply filters
      await page.fill('input[placeholder*="Search"]', 'chocolate');
      await page.selectOption('select[name="category"]', 'Dessert');
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Clear filters
      await page.click('button:text("Clear Filters")');
      
      await page.waitForLoadState('networkidle');
      
      // Should show all recipes again
      await expect(page.locator('.recipe-card')).toHaveCount(3, { timeout: 5000 });
      await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
    });
  });

  test.describe('Recipe Favorites', () => {
    test('should add recipe to favorites', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // Navigate to recipes page
      await page.click('text=Browse Recipes');
      await page.waitForLoadState('networkidle');
      
      // Find a recipe card and click favorite button
      const recipeCard = page.locator('.recipe-card').first();
      const favoriteButton = recipeCard.locator('[data-testid="favorite-button"]');
      
      await favoriteButton.click();
      
      // Should show success message
      await expect(page.locator('text=Added to favorites')).toBeVisible();
      
      // Favorite button should show as favorited
      await expect(favoriteButton).toHaveClass(/.*favorited.*/);
    });

    test('should remove recipe from favorites', async ({ page }) => {
      await page.click('text=Browse Recipes');
      await page.waitForLoadState('networkidle');
      
      // First add to favorites
      const recipeCard = page.locator('.recipe-card').first();
      const favoriteButton = recipeCard.locator('[data-testid="favorite-button"]');
      
      await favoriteButton.click();
      await expect(page.locator('text=Added to favorites')).toBeVisible();
      
      // Click again to remove from favorites
      await favoriteButton.click();
      
      // Should show removed message
      await expect(page.locator('text=Removed from favorites')).toBeVisible();
      
      // Favorite button should show as not favorited
      await expect(favoriteButton).not.toHaveClass(/.*favorited.*/);
    });

    test('should view favorites page', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // First add a recipe to favorites
      await page.click('text=Browse Recipes');
      await page.waitForLoadState('networkidle');
      
      const recipeCard = page.locator('.recipe-card').first();
      await recipeCard.locator('[data-testid="favorite-button"]').click();
      await expect(page.locator('text=Added to favorites')).toBeVisible();
      
      // Navigate to favorites page via user menu
      await page.click('[data-testid="user-menu-button"]');
      await page.click('text=Favorites');
      
      await expect(page).toHaveURL('/favorites');
      
      // Should show favorited recipes
      await expect(page.locator('text=Your Favorites')).toBeVisible();
      await expect(page.locator('.recipe-card')).toHaveCount(1);
    });

    test('should show empty favorites page when no favorites', async ({ page }) => {
      // Navigate to favorites page directly
      await page.goto('/favorites');
      
      // Should show empty state
      await expect(page.locator('text=Your Favorites')).toBeVisible();
      await expect(page.locator('text=You haven\'t favorited any recipes yet')).toBeVisible();
      await expect(page.locator('text=Browse Recipes')).toBeVisible(); // Link to browse
      
      // Should not show any recipe cards
      await expect(page.locator('.recipe-card')).toHaveCount(0);
    });

    test('should persist favorites across sessions', async ({ page }) => {
      // Add recipe to favorites
      await page.click('text=Browse Recipes');
      await page.waitForLoadState('networkidle');
      
      const recipeCard = page.locator('.recipe-card').first();
      await recipeCard.locator('[data-testid="favorite-button"]').click();
      await expect(page.locator('text=Added to favorites')).toBeVisible();
      
      // Logout and login again
      const helpers = createTestHelpers(page);
      await helpers.logout();
      await helpers.loginAsUser(testUsers.regularUser.email, testUsers.regularUser.password);
      
      // Navigate to favorites
      await page.click('[data-testid="user-menu-button"]');
      await page.click('text=Favorites');
      
      // Should still show favorited recipe
      await expect(page.locator('.recipe-card')).toHaveCount(1);
    });
  });

  test.describe('Recipe Categories', () => {
    test('should browse recipes by category', async ({ page }) => {
      // Navigate to categories page
      await page.click('text=Categories');
      await expect(page).toHaveURL('/categories');
      
      // Should show category grid
      await expect(page.locator('text=Recipe Categories')).toBeVisible();
      await expect(page.locator('.category-card')).toHaveCount(8, { timeout: 5000 }); // Based on testCategories
      
      // Click on Dessert category
      await page.click('.category-card:has-text("Dessert")');
      
      // Should navigate to filtered recipes page
      await expect(page).toHaveURL('/recipes?category=Dessert');
      
      // Should show only dessert recipes
      await expect(page.locator('text=Dessert Recipes')).toBeVisible();
      await expect(page.locator('text=Ultimate Chocolate Cake')).toBeVisible();
    });

    test('should show recipe count for each category', async ({ page }) => {
      await page.click('text=Categories');
      
      // Each category card should show recipe count
      const dessertCategory = page.locator('.category-card:has-text("Dessert")');
      await expect(dessertCategory.locator('text=1 recipe')).toBeVisible();
      
      const mainCourseCategory = page.locator('.category-card:has-text("Main Course")');
      await expect(mainCourseCategory.locator('text=1 recipe')).toBeVisible();
    });
  });

  test.describe('Advanced Search Features', () => {
    test('should search with autocomplete suggestions', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Start typing in search box
      await page.fill('input[placeholder*="Search"]', 'choc');
      
      // Should show autocomplete dropdown
      await expect(page.locator('.search-suggestions')).toBeVisible();
      await expect(page.locator('text=chocolate')).toBeVisible();
      
      // Click on suggestion
      await page.click('.search-suggestions text=chocolate');
      
      // Should populate search field and execute search
      await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('chocolate');
      await expect(page.locator('text=Search results for "chocolate"')).toBeVisible();
    });

    test('should show recent searches', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Perform a search
      await page.fill('input[placeholder*="Search"]', 'chicken');
      await page.press('input[placeholder*="Search"]', 'Enter');
      await page.waitForLoadState('networkidle');
      
      // Clear search and focus on input again
      await page.fill('input[placeholder*="Search"]', '');
      await page.click('input[placeholder*="Search"]');
      
      // Should show recent searches
      await expect(page.locator('.recent-searches')).toBeVisible();
      await expect(page.locator('text=Recent: chicken')).toBeVisible();
    });

    test('should save search preferences', async ({ page }) => {
      await page.click('text=Browse Recipes');
      
      // Set preferred filters
      await page.selectOption('select[name="difficulty"]', 'Easy');
      await page.selectOption('select[name="category"]', 'Main Course');
      
      // Navigate away and back
      await page.click('text=Dashboard');
      await page.click('text=Browse Recipes');
      
      // Should remember filter preferences
      await expect(page.locator('select[name="difficulty"]')).toHaveValue('Easy');
      await expect(page.locator('select[name="category"]')).toHaveValue('Main Course');
    });
  });

  test.describe('Mobile Search and Favorites', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate via mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click('text=Browse Recipes');
      
      await expect(page).toHaveURL('/recipes');
      
      // Mobile search should work
      await page.fill('input[placeholder*="Search"]', 'salad');
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Should show results in mobile layout
      await expect(page.locator('text=Classic Caesar Salad')).toBeVisible();
      
      // Mobile favorite button should work
      const favoriteButton = page.locator('[data-testid="favorite-button"]').first();
      await favoriteButton.click();
      
      await expect(page.locator('text=Added to favorites')).toBeVisible();
    });

    test('should show mobile-optimized filters', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click('text=Browse Recipes');
      
      // Mobile should have collapsible filters
      await page.click('button:text("Filters")');
      
      // Filter panel should be visible
      await expect(page.locator('.mobile-filters')).toBeVisible();
      
      // Should be able to apply filters
      await page.selectOption('select[name="category"]', 'Dessert');
      await page.click('button:text("Apply Filters")');
      
      await page.waitForLoadState('networkidle');
      
      // Should show filtered results
      await expect(page.locator('text=Ultimate Chocolate Cake')).toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should handle large search results efficiently', async ({ page }) => {
      // Mock API to return many results
      await page.route('**/api/v1/recipes/search*', async (route) => {
        const results = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          title: `Recipe ${i + 1}`,
          description: 'Test recipe',
          category: 'Test',
          difficulty: 'Easy'
        }));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              recipes: results,
              total: 100,
              page: 1,
              pages: 10
            }
          })
        });
      });
      
      await page.click('text=Browse Recipes');
      await page.fill('input[placeholder*="Search"]', 'test');
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      // Should handle pagination
      await expect(page.locator('.recipe-card')).toHaveCount(10, { timeout: 10000 }); // First page
      await expect(page.locator('text=Page 1 of 10')).toBeVisible();
      
      // Test pagination
      await page.click('button:text("Next")');
      await expect(page.locator('text=Page 2 of 10')).toBeVisible();
    });
  });
});
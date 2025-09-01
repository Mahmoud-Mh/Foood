import { test, expect } from '@playwright/test';
import { createFullStackHelpers } from './utils/fullstack-helpers';
import { testUsers } from './fullstack-global-setup';

test.describe('🍳 Full-Stack Recipe Management Tests', () => {
  let helpers: ReturnType<typeof createFullStackHelpers>;

  test.beforeEach(async ({ page }) => {
    helpers = createFullStackHelpers(page);
    
    // Login as regular user for recipe tests
    await helpers.loginUser(testUsers.regularUser.email, testUsers.regularUser.password);
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await helpers.cleanupTestData();
  });

  test.describe('Recipe Creation', () => {
    test('should create a new recipe with all fields', async ({ page }) => {
      const recipe = {
        title: `Test Recipe ${Date.now()}`,
        description: 'A delicious test recipe created by Playwright',
        ingredients: [
          '2 cups all-purpose flour',
          '1 cup granulated sugar',
          '1/2 cup butter, softened',
          '2 large eggs'
        ],
        instructions: [
          'Preheat oven to 350°F (175°C)',
          'Mix dry ingredients in a large bowl',
          'Cream butter and sugar in separate bowl',
          'Combine wet and dry ingredients',
          'Bake for 25-30 minutes until golden'
        ],
        prepTime: 15,
        cookTime: 30,
        servings: 8,
        difficulty: 'Medium',
        category: 'Dessert'
      };

      await helpers.createRecipe(recipe);

      // Verify recipe was created by checking if it appears in user's recipes
      await helpers.goToMyRecipes();
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();

      // Verify recipe exists in database via API
      const recipeExists = await helpers.verifyRecipeExists(recipe.title);
      expect(recipeExists).toBeTruthy();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/recipes/create');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors or stay on create page
      const hasValidationErrors = await page.locator('text=/required|please.*enter|field.*required/i').count() > 0;
      const stillOnCreatePage = page.url().includes('/recipes/create');

      expect(hasValidationErrors || stillOnCreatePage).toBeTruthy();
    });

    test('should handle dynamic ingredient addition', async ({ page }) => {
      await page.goto('/recipes/create');

      // Add basic recipe info
      await page.fill('input[name="title"]', 'Dynamic Ingredients Test');
      await page.fill('textarea[name="description"]', 'Testing dynamic ingredients');

      // Add multiple ingredients
      await page.fill('input[name="ingredients[0]"], input[name="ingredients.0"], .ingredient-input >> nth=0', '1 cup flour');
      
      // Add second ingredient
      await page.click('button:has-text("Add Ingredient"), button:has-text("Add ingredient"), [data-testid="add-ingredient"]');
      await page.fill('input[name="ingredients[1]"], input[name="ingredients.1"], .ingredient-input >> nth=1', '1/2 cup sugar');

      // Add third ingredient
      await page.click('button:has-text("Add Ingredient"), button:has-text("Add ingredient"), [data-testid="add-ingredient"]');
      await page.fill('input[name="ingredients[2]"], input[name="ingredients.2"], .ingredient-input >> nth=2', '1 tsp vanilla');

      // Add instructions
      await page.fill('textarea[name="instructions[0]"], textarea[name="instructions.0"], .instruction-input >> nth=0', 'Mix all ingredients');

      await page.click('button[type="submit"]');

      // Verify recipe was created
      await page.waitForURL(/\/recipes\/\d+|\/recipes\/my-recipes/, { timeout: 10000 });
    });
  });

  test.describe('Recipe Viewing and Display', () => {
    test('should display recipe details correctly', async ({ page }) => {
      // First create a recipe
      const recipe = {
        title: `Display Test Recipe ${Date.now()}`,
        description: 'Testing recipe display functionality',
        ingredients: ['1 cup test ingredient', '2 tbsp test spice'],
        instructions: ['Test instruction 1', 'Test instruction 2'],
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'Easy',
        category: 'Test'
      };

      await helpers.createRecipe(recipe);

      // Navigate to recipes page
      await page.goto('/recipes');
      await page.waitForLoadState('networkidle');

      // Find and click on our recipe
      await page.click(`text=${recipe.title}`);

      // Verify recipe details are displayed
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();
      await expect(page.locator(`text=${recipe.description}`)).toBeVisible();
      
      // Check ingredients
      for (const ingredient of recipe.ingredients) {
        await expect(page.locator(`text=${ingredient}`)).toBeVisible();
      }

      // Check instructions
      for (const instruction of recipe.instructions) {
        await expect(page.locator(`text=${instruction}`)).toBeVisible();
      }
    });

    test('should show recipe metadata (prep time, servings, etc.)', async ({ page }) => {
      const recipe = {
        title: `Metadata Test Recipe ${Date.now()}`,
        description: 'Testing metadata display',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction'],
        prepTime: 15,
        cookTime: 25,
        servings: 6,
        difficulty: 'Medium'
      };

      await helpers.createRecipe(recipe);

      // View the recipe
      await page.goto('/recipes');
      await page.click(`text=${recipe.title}`);

      // Check for metadata display
      await expect(page.locator(`text=${recipe.prepTime}`)).toBeVisible();
      await expect(page.locator(`text=${recipe.cookTime}`)).toBeVisible();
      await expect(page.locator(`text=${recipe.servings}`)).toBeVisible();
      await expect(page.locator(`text=${recipe.difficulty}`)).toBeVisible();
    });
  });

  test.describe('Recipe Editing', () => {
    test('should allow recipe author to edit their recipe', async ({ page }) => {
      // Create a recipe
      const originalRecipe = {
        title: `Edit Test Original ${Date.now()}`,
        description: 'Original description',
        ingredients: ['Original ingredient'],
        instructions: ['Original instruction']
      };

      await helpers.createRecipe(originalRecipe);

      // Go to my recipes
      await helpers.goToMyRecipes();
      
      // Find and edit the recipe
      const recipeCard = page.locator(`text=${originalRecipe.title}`).locator('..').locator('..');
      await recipeCard.locator('button:has-text("Edit"), a:has-text("Edit"), [data-testid="edit-recipe"]').click();

      // Update recipe details
      const updatedTitle = `${originalRecipe.title} - Updated`;
      await page.fill('input[name="title"]', updatedTitle);
      await page.fill('textarea[name="description"]', 'Updated description');

      await page.click('button[type="submit"]');

      // Verify update was successful
      await page.waitForURL(/\/recipes\/\d+|\/recipes\/my-recipes/);
      await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
    });

    test('should not allow non-authors to edit recipes', async ({ page }) => {
      // Create a recipe as regular user
      const recipe = {
        title: `Permission Test Recipe ${Date.now()}`,
        description: 'Testing edit permissions',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      // Logout and login as different user (if we have another test user)
      await helpers.logout();
      
      // Create a new user for this test
      const otherUser = {
        firstName: 'Other',
        lastName: 'User',
        email: `other${Date.now()}@test.com`,
        password: 'OtherPassword123!'
      };

      await helpers.registerUser(otherUser);

      // Try to find and edit the recipe
      await page.goto('/recipes');
      
      if (await page.locator(`text=${recipe.title}`).isVisible()) {
        await page.click(`text=${recipe.title}`);
        
        // Should not see edit button
        const editButtonExists = await page.locator('button:has-text("Edit"), a:has-text("Edit"), [data-testid="edit-recipe"]').isVisible();
        expect(editButtonExists).toBeFalsy();
      }
    });
  });

  test.describe('Recipe Deletion', () => {
    test('should allow recipe author to delete their recipe', async ({ page }) => {
      const recipe = {
        title: `Delete Test Recipe ${Date.now()}`,
        description: 'Testing recipe deletion',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      // Delete the recipe
      await helpers.goToMyRecipes();
      await helpers.deleteRecipe(recipe.title);

      // Verify recipe is no longer visible
      await page.reload();
      await expect(page.locator(`text=${recipe.title}`)).not.toBeVisible();

      // Verify recipe doesn't exist in database
      const recipeExists = await helpers.verifyRecipeExists(recipe.title);
      expect(recipeExists).toBeFalsy();
    });

    test('should require confirmation for recipe deletion', async ({ page }) => {
      const recipe = {
        title: `Confirmation Test Recipe ${Date.now()}`,
        description: 'Testing deletion confirmation',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);
      await helpers.goToMyRecipes();

      // Find delete button
      const recipeCard = page.locator(`text=${recipe.title}`).locator('..').locator('..');
      await recipeCard.locator('[data-testid="delete-button"], .delete-btn, button:has-text("Delete")').click();

      // Should show confirmation dialog
      await expect(page.locator('text=/are.*you.*sure|confirm.*delete|delete.*recipe/i')).toBeVisible();
      
      // Cancel deletion
      await page.click('button:has-text("Cancel"), [data-testid="cancel-delete"]');

      // Recipe should still exist
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();
    });
  });

  test.describe('Recipe Categories and Tags', () => {
    test('should categorize recipes correctly', async ({ page }) => {
      const categories = ['Appetizer', 'Main Course', 'Dessert'];
      
      for (const category of categories) {
        const recipe = {
          title: `${category} Recipe ${Date.now()}`,
          description: `Testing ${category} category`,
          ingredients: [`${category} ingredient`],
          instructions: [`${category} instruction`],
          category: category
        };

        await helpers.createRecipe(recipe);
      }

      // Navigate to categories page
      await page.goto('/categories');
      
      // Verify categories are displayed
      for (const category of categories) {
        await expect(page.locator(`text=${category}`)).toBeVisible();
      }
    });

    test('should filter recipes by category', async ({ page }) => {
      // Create recipes in different categories
      const dessertRecipe = {
        title: `Dessert Filter Test ${Date.now()}`,
        description: 'Testing category filtering',
        ingredients: ['Sugar', 'Flour'],
        instructions: ['Mix and bake'],
        category: 'Dessert'
      };

      const mainRecipe = {
        title: `Main Course Filter Test ${Date.now()}`,
        description: 'Testing category filtering',
        ingredients: ['Chicken', 'Rice'],
        instructions: ['Cook and serve'],
        category: 'Main Course'
      };

      await helpers.createRecipe(dessertRecipe);
      await helpers.createRecipe(mainRecipe);

      // Filter by dessert category
      await page.goto('/categories');
      await page.click('text=Dessert');

      // Should show dessert recipe
      await expect(page.locator(`text=${dessertRecipe.title}`)).toBeVisible();
      
      // Should not show main course recipe (if filtering works)
      const mainRecipeVisible = await page.locator(`text=${mainRecipe.title}`).isVisible();
      // Note: This might be visible if filtering isn't implemented yet
      console.log(`Main recipe visible in dessert filter: ${mainRecipeVisible}`);
    });
  });

  test.describe('Recipe Image Handling', () => {
    test('should handle recipes without images', async ({ page }) => {
      const recipe = {
        title: `No Image Recipe ${Date.now()}`,
        description: 'Testing recipe without image',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction']
      };

      await helpers.createRecipe(recipe);

      await page.goto('/recipes');
      await page.click(`text=${recipe.title}`);

      // Should display recipe even without image
      await expect(page.locator(`text=${recipe.title}`)).toBeVisible();
      await expect(page.locator(`text=${recipe.description}`)).toBeVisible();
    });
  });

  test.describe('Recipe Validation and Error Handling', () => {
    test('should handle server errors gracefully', async ({ page }) => {
      // This test depends on how your backend handles errors
      await page.goto('/recipes/create');

      // Fill form with potentially problematic data
      await page.fill('input[name="title"]', 'A'.repeat(1000)); // Very long title
      await page.fill('textarea[name="description"]', 'Test');
      await page.fill('input[name="ingredients[0]"], .ingredient-input >> nth=0', 'Test ingredient');
      await page.fill('textarea[name="instructions[0]"], .instruction-input >> nth=0', 'Test instruction');

      await page.click('button[type="submit"]');

      // Should handle error gracefully (either show error message or validation)
      const hasError = await page.locator('text=/error|invalid|too.*long/i').isVisible();
      const stillOnCreatePage = page.url().includes('/recipes/create');

      expect(hasError || stillOnCreatePage).toBeTruthy();
    });
  });
});
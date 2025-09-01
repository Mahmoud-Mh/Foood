import { test, expect } from '@playwright/test';
import { createTestHelpers } from './utils/test-helpers';
import { testUsers, testRecipes } from './fixtures/test-data';

test.describe('Recipe Management', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Login before each test
    await helpers.loginAsUser(testUsers.regularUser.email, testUsers.regularUser.password);
  });

  test.describe('Recipe Creation', () => {
    test('should create a new recipe with all required fields', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // Navigate to create recipe page
      await page.click('text=Create Recipe');
      await expect(page).toHaveURL('/recipes/create');
      
      const recipe = testRecipes.chocolateCake;
      
      // Fill basic information
      await page.fill('input[name="title"]', recipe.title);
      await page.fill('textarea[name="description"]', recipe.description);
      
      // Select category
      await page.selectOption('select[name="category"]', recipe.category);
      
      // Select difficulty
      await page.selectOption('select[name="difficulty"]', recipe.difficulty);
      
      // Fill timing and servings
      await page.fill('input[name="prepTime"]', recipe.prepTime.toString());
      await page.fill('input[name="cookTime"]', recipe.cookTime.toString());
      await page.fill('input[name="servings"]', recipe.servings.toString());
      
      // Add ingredients
      for (let i = 0; i < recipe.ingredients.length; i++) {
        if (i > 0) {
          await page.click('button:text("Add Ingredient")');
        }
        await page.fill(`input[name="ingredients[${i}]"]`, recipe.ingredients[i]);
      }
      
      // Add instructions
      for (let i = 0; i < recipe.instructions.length; i++) {
        if (i > 0) {
          await page.click('button:text("Add Step")');
        }
        await page.fill(`textarea[name="instructions[${i}]"]`, recipe.instructions[i]);
      }
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Recipe created successfully')).toBeVisible();
      
      // Should redirect to the new recipe page
      await expect(page).toHaveURL(/.*recipes\/[a-f0-9-]+$/);
      
      // Verify recipe details are displayed
      await expect(page.locator('h1:text("' + recipe.title + '")')).toBeVisible();
      await expect(page.locator('text=' + recipe.description)).toBeVisible();
      await expect(page.locator('text=' + recipe.category)).toBeVisible();
      await expect(page.locator('text=' + recipe.difficulty)).toBeVisible();
    });

    test('should show validation errors for missing required fields', async ({ page }) => {
      await page.click('text=Create Recipe');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Title is required')).toBeVisible();
      await expect(page.locator('text=Description is required')).toBeVisible();
      await expect(page.locator('text=At least one ingredient is required')).toBeVisible();
      await expect(page.locator('text=At least one instruction is required')).toBeVisible();
    });

    test('should allow adding and removing ingredients dynamically', async ({ page }) => {
      await page.click('text=Create Recipe');
      
      // Add multiple ingredients
      await page.fill('input[name="ingredients[0]"]', 'First ingredient');
      
      await page.click('button:text("Add Ingredient")');
      await page.fill('input[name="ingredients[1]"]', 'Second ingredient');
      
      await page.click('button:text("Add Ingredient")');
      await page.fill('input[name="ingredients[2]"]', 'Third ingredient');
      
      // Verify all ingredients are present
      await expect(page.locator('input[name="ingredients[0]"]')).toHaveValue('First ingredient');
      await expect(page.locator('input[name="ingredients[1]"]')).toHaveValue('Second ingredient');
      await expect(page.locator('input[name="ingredients[2]"]')).toHaveValue('Third ingredient');
      
      // Remove middle ingredient
      await page.click('button[data-testid="remove-ingredient-1"]');
      
      // Verify ingredient was removed and others shifted
      await expect(page.locator('input[name="ingredients[0]"]')).toHaveValue('First ingredient');
      await expect(page.locator('input[name="ingredients[1]"]')).toHaveValue('Third ingredient');
      await expect(page.locator('input[name="ingredients[2]"]')).not.toBeVisible();
    });

    test('should allow adding and removing instructions dynamically', async ({ page }) => {
      await page.click('text=Create Recipe');
      
      // Add multiple instructions
      await page.fill('textarea[name="instructions[0]"]', 'First step');
      
      await page.click('button:text("Add Step")');
      await page.fill('textarea[name="instructions[1]"]', 'Second step');
      
      await page.click('button:text("Add Step")');
      await page.fill('textarea[name="instructions[2]"]', 'Third step');
      
      // Remove middle instruction
      await page.click('button[data-testid="remove-instruction-1"]');
      
      // Verify instruction was removed and others shifted
      await expect(page.locator('textarea[name="instructions[0]"]')).toHaveValue('First step');
      await expect(page.locator('textarea[name="instructions[1]"]')).toHaveValue('Third step');
      await expect(page.locator('textarea[name="instructions[2]"]')).not.toBeVisible();
    });
  });

  test.describe('Recipe Editing', () => {
    test('should allow editing an existing recipe', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // First create a recipe
      const originalRecipe = await helpers.createRecipe(testRecipes.caesarSalad);
      
      // Navigate to edit page
      await page.click('text=Edit Recipe');
      await expect(page).toHaveURL(/.*recipes\/[a-f0-9-]+\/edit$/);
      
      // Modify the recipe
      const updatedTitle = originalRecipe.title + ' - Updated';
      await page.fill('input[name="title"]', updatedTitle);
      
      // Update description
      await page.fill('textarea[name="description"]', 'Updated description');
      
      // Submit changes
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Recipe updated successfully')).toBeVisible();
      
      // Verify changes are reflected
      await expect(page.locator('h1:text("' + updatedTitle + '")')).toBeVisible();
      await expect(page.locator('text=Updated description')).toBeVisible();
    });

    test('should only allow recipe author to edit their recipes', async ({ page }) => {
      // Login as different user and try to edit someone else's recipe
      const helpers = createTestHelpers(page);
      
      // Assuming there's a recipe created by another user with ID '123'
      await page.goto('/recipes/123/edit');
      
      // Should show unauthorized message or redirect
      await expect(page.locator('text=You can only edit your own recipes')).toBeVisible();
    });
  });

  test.describe('Recipe Deletion', () => {
    test('should allow deleting a recipe with confirmation', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // Create a recipe to delete
      const recipe = await helpers.createRecipe(testRecipes.chickenCurry);
      
      // Click delete button
      await page.click('button:text("Delete Recipe")');
      
      // Should show confirmation dialog
      await expect(page.locator('text=Are you sure you want to delete this recipe?')).toBeVisible();
      
      // Confirm deletion
      await page.click('button:text("Yes, Delete")');
      
      // Should show success message and redirect
      await expect(page.locator('text=Recipe deleted successfully')).toBeVisible();
      await expect(page).toHaveURL('/dashboard');
      
      // Recipe should no longer be accessible
      await page.goto(`/recipes/${recipe.id}`);
      await expect(page.locator('text=Recipe not found')).toBeVisible();
    });

    test('should cancel deletion when user cancels confirmation', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // Create a recipe
      const recipe = await helpers.createRecipe(testRecipes.caesarSalad);
      
      // Click delete button
      await page.click('button:text("Delete Recipe")');
      
      // Cancel deletion
      await page.click('button:text("Cancel")');
      
      // Should still be on recipe page
      await expect(page.locator('h1:text("' + recipe.title + '")')).toBeVisible();
      
      // Recipe should still be accessible
      await page.reload();
      await expect(page.locator('h1:text("' + recipe.title + '")')).toBeVisible();
    });
  });

  test.describe('Recipe Image Upload', () => {
    test('should allow uploading a recipe image', async ({ page }) => {
      await page.click('text=Create Recipe');
      
      // Fill basic required fields
      await page.fill('input[name="title"]', 'Test Recipe with Image');
      await page.fill('textarea[name="description"]', 'A test recipe');
      await page.fill('input[name="ingredients[0]"]', 'Test ingredient');
      await page.fill('textarea[name="instructions[0]"]', 'Test instruction');
      
      // Upload image
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'recipe-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-content')
      });
      
      // Should show image preview
      await expect(page.locator('img[alt="Recipe preview"]')).toBeVisible();
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Recipe created successfully')).toBeVisible();
      
      // Recipe page should show the uploaded image
      await expect(page.locator('img[alt*="Test Recipe with Image"]')).toBeVisible();
    });

    test('should validate image file types and size', async ({ page }) => {
      await page.click('text=Create Recipe');
      
      // Try to upload invalid file type
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'invalid-file.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not an image')
      });
      
      // Should show error message
      await expect(page.locator('text=Please upload a valid image file')).toBeVisible();
    });
  });

  test.describe('Recipe Validation', () => {
    test('should validate recipe timing fields', async ({ page }) => {
      await page.click('text=Create Recipe');
      
      // Try negative values
      await page.fill('input[name="prepTime"]', '-5');
      await page.fill('input[name="cookTime"]', '-10');
      await page.fill('input[name="servings"]', '0');
      
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Prep time must be greater than 0')).toBeVisible();
      await expect(page.locator('text=Cook time must be greater than 0')).toBeVisible();
      await expect(page.locator('text=Servings must be at least 1')).toBeVisible();
    });

    test('should validate recipe title length', async ({ page }) => {
      await page.click('text=Create Recipe');
      
      // Try very long title
      const longTitle = 'A'.repeat(101); // Assuming max length is 100
      await page.fill('input[name="title"]', longTitle);
      
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=Title must be 100 characters or less')).toBeVisible();
    });
  });

  test.describe('Mobile Recipe Creation', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open mobile menu and navigate to create recipe
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click('text=Create Recipe');
      
      await expect(page).toHaveURL('/recipes/create');
      
      // Fill form on mobile
      const recipe = testRecipes.caesarSalad;
      await page.fill('input[name="title"]', recipe.title);
      await page.fill('textarea[name="description"]', recipe.description);
      
      // Mobile form should be responsive
      await expect(page.locator('input[name="title"]')).toBeVisible();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
      
      // Add ingredients with mobile UI
      await page.fill('input[name="ingredients[0]"]', recipe.ingredients[0]);
      await page.click('button:text("Add Ingredient")');
      await page.fill('input[name="ingredients[1]"]', recipe.ingredients[1]);
      
      // Add instructions
      await page.fill('textarea[name="instructions[0]"]', recipe.instructions[0]);
      
      // Mobile form submission should work
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Recipe created successfully')).toBeVisible();
    });
  });
});
import { Page, expect, APIRequestContext } from '@playwright/test';
import { testUsers } from '../fullstack-global-setup';

export class FullStackHelpers {
  constructor(private page: Page) {}

  /**
   * Register a new user via API and UI
   */
  async registerUser(userDetails: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    // Navigate to registration page
    await this.page.goto('/auth/register');
    await this.page.waitForLoadState('networkidle');

    // Fill registration form
    await this.page.fill('input[name="firstName"]', userDetails.firstName);
    await this.page.fill('input[name="lastName"]', userDetails.lastName);
    await this.page.fill('input[name="email"]', userDetails.email);
    await this.page.fill('input[name="password"]', userDetails.password);
    await this.page.fill('input[name="confirmPassword"]', userDetails.password);

    // Submit form
    await this.page.click('button[type="submit"]');

    // Wait for success (should redirect to dashboard)
    await expect(this.page).toHaveURL('/dashboard');
    await expect(page.locator(`text=${userDetails.firstName}`)).toBeVisible();

    return userDetails;
  }

  /**
   * Login user via UI
   */
  async loginUser(email: string, password: string) {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');

    // Wait for successful login
    await expect(this.page).toHaveURL('/dashboard');
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    await this.loginUser(testUsers.adminUser.email, testUsers.adminUser.password);
    
    // Verify admin access
    await this.page.click('[data-testid="user-menu-button"]');
    await expect(this.page.locator('text=Admin Dashboard')).toBeVisible();
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click('[data-testid="user-menu-button"]');
    await this.page.click('text=Sign Out');
    
    // Wait for logout and redirect
    await expect(this.page).toHaveURL('/');
    await expect(this.page.locator('text=Sign In')).toBeVisible();
  }

  /**
   * Create a recipe via UI
   */
  async createRecipe(recipe: {
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    difficulty?: string;
    category?: string;
    image?: string;
  }) {
    // Navigate to create recipe page
    await this.page.goto('/recipes/create');
    await this.page.waitForLoadState('networkidle');

    // Fill basic information
    await this.page.fill('input[name="title"]', recipe.title);
    await this.page.fill('textarea[name="description"]', recipe.description);

    // Fill ingredients
    for (let i = 0; i < recipe.ingredients.length; i++) {
      if (i > 0) {
        // Add new ingredient field if needed
        await this.page.click('button:has-text("Add Ingredient"), button:has-text("Add ingredient"), [data-testid="add-ingredient"]');
      }
      await this.page.fill(`input[name="ingredients[${i}]"], input[name="ingredients.${i}"], .ingredient-input >> nth=${i}`, recipe.ingredients[i]);
    }

    // Fill instructions
    for (let i = 0; i < recipe.instructions.length; i++) {
      if (i > 0) {
        // Add new instruction field if needed
        await this.page.click('button:has-text("Add Step"), button:has-text("Add instruction"), [data-testid="add-instruction"]');
      }
      await this.page.fill(`textarea[name="instructions[${i}]"], textarea[name="instructions.${i}"], .instruction-input >> nth=${i}`, recipe.instructions[i]);
    }

    // Fill additional details if provided
    if (recipe.prepTime) {
      await this.page.fill('input[name="prepTime"]', recipe.prepTime.toString());
    }
    if (recipe.cookTime) {
      await this.page.fill('input[name="cookTime"]', recipe.cookTime.toString());
    }
    if (recipe.servings) {
      await this.page.fill('input[name="servings"]', recipe.servings.toString());
    }
    if (recipe.difficulty) {
      await this.page.selectOption('select[name="difficulty"]', recipe.difficulty);
    }
    if (recipe.category) {
      await this.page.selectOption('select[name="category"]', recipe.category);
    }

    // Submit the form
    await this.page.click('button[type="submit"]');

    // Wait for success (should redirect or show success message)
    await this.page.waitForURL(/\/recipes\/\d+|\/recipes\/my-recipes/, { timeout: 10000 });
    
    return recipe;
  }

  /**
   * Search for recipes
   */
  async searchRecipes(query: string) {
    await this.page.goto('/recipes');
    await this.page.waitForLoadState('networkidle');

    // Find and use search input
    const searchInput = this.page.locator('input[type="search"], input[placeholder*="search"], input[name="search"]').first();
    await searchInput.fill(query);
    await searchInput.press('Enter');

    // Wait for search results
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Allow for API response
  }

  /**
   * Add recipe to favorites
   */
  async addToFavorites(recipeTitle: string) {
    // Find recipe card and favorite button
    const recipeCard = this.page.locator(`text=${recipeTitle}`).locator('..').locator('..');
    const favoriteButton = recipeCard.locator('[data-testid="favorite-button"], .favorite-btn, button:has-text("♡"), button:has-text("♥")').first();
    
    await favoriteButton.click();
    
    // Wait for API response
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to favorites page
   */
  async goToFavorites() {
    // Try multiple possible navigation paths to favorites
    const possibleSelectors = [
      'a[href="/favorites"]',
      'a[href="/recipes/favorites"]', 
      'text=Favorites',
      '[data-testid="favorites-link"]',
      '.favorites-link'
    ];

    for (const selector of possibleSelectors) {
      if (await this.page.locator(selector).isVisible()) {
        await this.page.click(selector);
        break;
      }
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to user's recipes
   */
  async goToMyRecipes() {
    await this.page.goto('/recipes/my-recipes');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(recipeTitle: string) {
    // Find recipe and delete button
    const recipeCard = this.page.locator(`text=${recipeTitle}`).locator('..').locator('..');
    const deleteButton = recipeCard.locator('[data-testid="delete-button"], .delete-btn, button:has-text("Delete")').first();
    
    await deleteButton.click();
    
    // Confirm deletion in modal/dialog
    await this.page.click('button:has-text("Delete"), button:has-text("Confirm"), [data-testid="confirm-delete"]');
    
    // Wait for API response
    await this.page.waitForTimeout(1000);
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');

    if (profileData.firstName) {
      await this.page.fill('input[name="firstName"]', profileData.firstName);
    }
    if (profileData.lastName) {
      await this.page.fill('input[name="lastName"]', profileData.lastName);
    }
    if (profileData.email) {
      await this.page.fill('input[name="email"]', profileData.email);
    }
    if (profileData.currentPassword) {
      await this.page.fill('input[name="currentPassword"]', profileData.currentPassword);
    }
    if (profileData.newPassword) {
      await this.page.fill('input[name="newPassword"]', profileData.newPassword);
    }

    await this.page.click('button[type="submit"]');
    
    // Wait for success message or page update
    await this.page.waitForTimeout(2000);
  }

  /**
   * API Helper: Make direct API requests for testing
   */
  async apiRequest(method: string, endpoint: string, data?: any, options?: any) {
    return await this.page.request.fetch(`http://localhost:3001/api/v1${endpoint}`, {
      method: method.toUpperCase(),
      data: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });
  }

  /**
   * Wait for API response after action
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout: number = 5000) {
    return await this.page.waitForResponse(response => 
      typeof urlPattern === 'string' 
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url()),
      { timeout }
    );
  }

  /**
   * Verify recipe exists in database via API
   */
  async verifyRecipeExists(recipeTitle: string): Promise<boolean> {
    const response = await this.apiRequest('GET', `/recipes?search=${encodeURIComponent(recipeTitle)}`);
    if (response.ok()) {
      const data = await response.json();
      return data.recipes?.some((recipe: any) => recipe.title === recipeTitle) || false;
    }
    return false;
  }

  /**
   * Clean up test data created during tests
   */
  async cleanupTestData() {
    try {
      // Delete test recipes
      const response = await this.apiRequest('DELETE', '/test/cleanup');
      if (!response.ok()) {
        console.warn('Test data cleanup failed');
      }
    } catch (error) {
      console.warn('Test data cleanup encountered error:', error);
    }
  }
}

// Export helper function
export const createFullStackHelpers = (page: Page) => new FullStackHelpers(page);
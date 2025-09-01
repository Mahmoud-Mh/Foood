import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login with test user credentials
   */
  async loginAsUser(email: string = 'test@example.com', password: string = 'password123') {
    await this.page.goto('/auth/login');
    
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect
    await this.page.waitForURL('/dashboard');
    await expect(this.page.locator('text=Dashboard')).toBeVisible();
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin(email: string = 'admin@example.com', password: string = 'admin123') {
    await this.loginAsUser(email, password);
    // Admin should have access to admin dashboard
    await expect(this.page.locator('text=Admin Dashboard')).toBeVisible();
  }

  /**
   * Register a new user
   */
  async registerUser(
    firstName: string = 'Test',
    lastName: string = 'User',
    email: string = `test${Date.now()}@example.com`,
    password: string = 'password123'
  ) {
    await this.page.goto('/auth/register');
    
    await this.page.fill('input[name="firstName"]', firstName);
    await this.page.fill('input[name="lastName"]', lastName);
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for registration success and redirect
    await this.page.waitForURL('/dashboard');
    return { firstName, lastName, email, password };
  }

  /**
   * Logout current user
   */
  async logout() {
    // Click on user profile dropdown
    await this.page.click('[data-testid="user-menu-button"]');
    await this.page.click('text=Sign Out');
    
    // Wait for logout and redirect to home
    await this.page.waitForURL('/');
    await expect(this.page.locator('text=Sign In')).toBeVisible();
  }

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a test recipe
   */
  async createRecipe(recipe: {
    title?: string;
    description?: string;
    ingredients?: string[];
    instructions?: string[];
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    difficulty?: string;
    category?: string;
  } = {}) {
    const defaultRecipe = {
      title: `Test Recipe ${Date.now()}`,
      description: 'A delicious test recipe',
      ingredients: ['2 cups flour', '1 cup sugar', '1/2 cup butter'],
      instructions: ['Mix ingredients', 'Bake at 350°F', 'Enjoy!'],
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'Easy',
      category: 'Dessert',
      ...recipe
    };

    await this.navigateTo('/recipes/create');
    
    // Fill basic information
    await this.page.fill('input[name="title"]', defaultRecipe.title);
    await this.page.fill('textarea[name="description"]', defaultRecipe.description);
    
    // Fill ingredients
    for (let i = 0; i < defaultRecipe.ingredients.length; i++) {
      const ingredient = defaultRecipe.ingredients[i];
      if (i > 0) {
        await this.page.click('button:text("Add Ingredient")');
      }
      await this.page.fill(`input[name="ingredients[${i}]"]`, ingredient);
    }
    
    // Fill instructions
    for (let i = 0; i < defaultRecipe.instructions.length; i++) {
      const instruction = defaultRecipe.instructions[i];
      if (i > 0) {
        await this.page.click('button:text("Add Step")');
      }
      await this.page.fill(`textarea[name="instructions[${i}]"]`, instruction);
    }
    
    // Fill additional details
    await this.page.fill('input[name="prepTime"]', defaultRecipe.prepTime.toString());
    await this.page.fill('input[name="cookTime"]', defaultRecipe.cookTime.toString());
    await this.page.fill('input[name="servings"]', defaultRecipe.servings.toString());
    
    // Select difficulty
    await this.page.selectOption('select[name="difficulty"]', defaultRecipe.difficulty);
    
    // Select category
    await this.page.selectOption('select[name="category"]', defaultRecipe.category);
    
    // Submit the form
    await this.page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await expect(this.page.locator('text=Recipe created successfully')).toBeVisible();
    
    return defaultRecipe;
  }

  /**
   * Search for recipes
   */
  async searchRecipes(query: string) {
    await this.navigateTo('/recipes');
    
    await this.page.fill('input[placeholder*="Search"]', query);
    await this.page.press('input[placeholder*="Search"]', 'Enter');
    
    // Wait for search results to load
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add recipe to favorites
   */
  async addToFavorites(recipeTitle: string) {
    // Find the recipe card and click favorite button
    const recipeCard = this.page.locator(`text=${recipeTitle}`).locator('..').locator('..');
    await recipeCard.locator('[data-testid="favorite-button"]').click();
    
    // Wait for success indication
    await expect(this.page.locator('text=Added to favorites')).toBeVisible();
  }

  /**
   * Wait for an element to be visible with custom timeout
   */
  async waitForVisible(selector: string, timeout: number = 5000) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.page.locator('[data-testid="user-menu-button"]').waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    if (!(await this.isAuthenticated())) {
      return false;
    }
    
    try {
      await this.page.click('[data-testid="user-menu-button"]');
      await this.page.locator('text=Admin Dashboard').waitFor({ timeout: 1000 });
      await this.page.click('[data-testid="user-menu-button"]'); // Close dropdown
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mock API responses for testing
   */
  async mockApiResponse(url: string, response: any, status: number = 200) {
    await this.page.route(`**/api/v1${url}`, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Clear all mocked routes
   */
  async clearApiMocks() {
    await this.page.unrouteAll();
  }
}

// Export helper function to create TestHelpers instance
export const createTestHelpers = (page: Page) => new TestHelpers(page);
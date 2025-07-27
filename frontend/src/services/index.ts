import { HttpService } from './base/http.service';
import { AuthService } from './auth.service';
import { RecipeService } from './recipe.service';
import { CategoryService } from './category.service';
import { IngredientService } from './ingredient.service';
import { UserService } from './user.service';

// Service Manager following Singleton pattern
export class ServiceManager {
  private static instance: ServiceManager;
  private httpService: HttpService;
  private authService: AuthService;
  private recipeService: RecipeService;
  private categoryService: CategoryService;
  private ingredientService: IngredientService;
  private userService: UserService;

  private constructor() {
    // Initialize HTTP service with shared configuration
    this.httpService = new HttpService();
    
    // Initialize all services with shared HTTP service
    this.authService = new AuthService(this.httpService);
    this.recipeService = new RecipeService(this.httpService);
    this.categoryService = new CategoryService(this.httpService);
    this.ingredientService = new IngredientService(this.httpService);
    this.userService = new UserService(this.httpService);

    // Initialize auth service (set token if exists)
    this.authService.initialize();
  }

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  // Getter methods for accessing services
  public get auth(): AuthService {
    return this.authService;
  }

  public get recipes(): RecipeService {
    return this.recipeService;
  }

  public get categories(): CategoryService {
    return this.categoryService;
  }

  public get ingredients(): IngredientService {
    return this.ingredientService;
  }

  public get users(): UserService {
    return this.userService;
  }

  public get http(): HttpService {
    return this.httpService;
  }

  // Method to reset all services (useful for logout)
  public reset(): void {
    this.httpService.removeAuthToken();
    // Reinitialize services if needed
  }
}

// Create a single instance and export individual services
const serviceManager = ServiceManager.getInstance();

export const authService = serviceManager.auth;
export const recipeService = serviceManager.recipes;
export const categoryService = serviceManager.categories;
export const ingredientService = serviceManager.ingredients;
export const userService = serviceManager.users;
export const httpService = serviceManager.http;

// Export service manager for advanced usage
export { serviceManager };

// Export all service classes for type definitions
export { AuthService } from './auth.service';
export { RecipeService } from './recipe.service';
export { CategoryService } from './category.service';
export { IngredientService } from './ingredient.service';
export { UserService } from './user.service';
export { HttpService, HttpError } from './base/http.service';

// Export types
export type { RequestConfig } from './base/http.service';
export type { CreateCategoryForm } from './category.service';
export type { CreateIngredientForm } from './ingredient.service';
export type { UpdateProfileData } from './user.service'; 
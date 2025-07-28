import { HttpService } from './base/http.service';
import { 
  Recipe, 
  ApiResponse, 
  PaginatedResult, 
  CreateRecipeForm,
  Category,
  Ingredient
} from '@/types/api.types';

export interface SearchParams {
  query?: string;
  category?: string;
  difficulty?: string;
  maxPrepTime?: number;
  tags?: string[];
}

export interface RecipeListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  difficulty?: string;
  sortBy?: 'newest' | 'popular' | 'rating' | 'prepTime';
  sortOrder?: 'asc' | 'desc';
}

export class RecipeService {
  private httpService: HttpService;

  constructor(httpService?: HttpService) {
    this.httpService = httpService || new HttpService();
  }

  // Recipe Management
  public async createRecipe(recipeData: CreateRecipeForm): Promise<Recipe> {
    const response = await this.httpService.post<Recipe>('/recipes', recipeData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create recipe');
    }
    
    return response.data;
  }

  public async updateRecipe(id: string, recipeData: Partial<CreateRecipeForm>): Promise<Recipe> {
    const response = await this.httpService.patch<Recipe>(`/recipes/${id}`, recipeData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update recipe');
    }
    
    return response.data;
  }

  public async deleteRecipe(id: string): Promise<void> {
    const response = await this.httpService.delete<null>(`/recipes/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete recipe');
    }
  }

  // Get recipes
  public async getPublicRecipes(params: RecipeListParams = {}): Promise<PaginatedResult<Recipe>> {
    // If search term is provided, use the search endpoint
    if (params.search) {
      const searchParams: any = {
        q: params.search,
        page: params.page || 1,
        limit: params.limit || 10,
      };
      
      if (params.categoryId) searchParams.categoryId = params.categoryId;
      if (params.difficulty) searchParams.difficulty = params.difficulty;
      
      const response = await this.httpService.get<PaginatedResult<Recipe>>('/recipes/search', {
        params: searchParams
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to search recipes');
      }
      
      return response.data;
    }
    
    // Otherwise use the published recipes endpoint
    const publishedParams: any = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    
    if (params.categoryId) publishedParams.categoryId = params.categoryId;
    if (params.difficulty) publishedParams.difficulty = params.difficulty;
    
    const response = await this.httpService.get<PaginatedResult<Recipe>>('/recipes/published', {
      params: publishedParams
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch recipes');
    }
    
    return response.data;
  }

  public async getPublicRecipeById(id: string): Promise<Recipe> {
    const response = await this.httpService.get<Recipe>(`/recipes/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch recipe');
    }
    
    return response.data;
  }

  public async searchPublicRecipes(params: SearchParams): Promise<PaginatedResult<Recipe>> {
    const response = await this.httpService.get<PaginatedResult<Recipe>>('/recipes/search', {
      params: params as Record<string, any>
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to search recipes');
    }
    
    return response.data;
  }

  // User-specific recipes
  public async getMyRecipes(params: RecipeListParams = {}): Promise<PaginatedResult<Recipe>> {
    const response = await this.httpService.get<PaginatedResult<Recipe>>('/recipes/my/recipes', {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...params
      }
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch my recipes');
    }
    
    return response.data;
  }

  public async getRecipeById(id: string): Promise<Recipe> {
    const response = await this.httpService.get<Recipe>(`/recipes/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch recipe');
    }
    
    return response.data;
  }

  // Categories and Ingredients
  public async getActiveCategories(): Promise<Category[]> {
    const response = await this.httpService.get<Category[]>('/categories/active');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch categories');
    }
    
    return response.data;
  }

  public async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    const response = await this.httpService.get<Ingredient[]>(`/ingredients/category/${category}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ingredients');
    }
    
    return response.data;
  }
} 
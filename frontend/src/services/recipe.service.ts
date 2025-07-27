import { HttpService } from './base/http.service';
import { 
  Recipe,
  RecipeListItem,
  CreateRecipeForm,
  PaginatedResult,
  SearchParams,
  RecipeFilters,
  ApiResponse 
} from '@/types/api.types';

export class RecipeService {
  private httpService: HttpService;

  constructor(httpService?: HttpService) {
    this.httpService = httpService || new HttpService();
  }

  public async getRecipes(params?: SearchParams): Promise<PaginatedResult<RecipeListItem>> {
    const queryParams = this.buildSearchParams(params);
    const response = await this.httpService.get<PaginatedResult<RecipeListItem>>(
      '/recipes', 
      { params: queryParams }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch recipes');
    }
    
    return response.data;
  }

  public async getPublicRecipes(params?: SearchParams): Promise<PaginatedResult<RecipeListItem>> {
    const queryParams = this.buildSearchParams(params);
    const response = await this.httpService.get<PaginatedResult<RecipeListItem>>(
      '/recipes/published',
      { params: queryParams }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch public recipes');
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

  public async getPublicRecipeById(id: string): Promise<Recipe> {
    const response = await this.httpService.get<Recipe>(`/recipes/published/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch recipe');
    }
    
    return response.data;
  }

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
    const response = await this.httpService.delete<void>(`/recipes/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete recipe');
    }
  }

  public async searchRecipes(query: string, params?: SearchParams): Promise<PaginatedResult<RecipeListItem>> {
    const searchParams = this.buildSearchParams({ ...params, query });
    const response = await this.httpService.get<PaginatedResult<RecipeListItem>>(
      '/recipes/search',
      { params: searchParams }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to search recipes');
    }
    
    return response.data;
  }

  public async searchPublicRecipes(query: string, params?: SearchParams): Promise<PaginatedResult<RecipeListItem>> {
    const searchParams = this.buildSearchParams({ ...params, query });
    const response = await this.httpService.get<PaginatedResult<RecipeListItem>>(
      '/recipes/published/search',
      { params: searchParams }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to search public recipes');
    }
    
    return response.data;
  }

  public async getFeaturedRecipes(limit: number = 10): Promise<RecipeListItem[]> {
    const response = await this.httpService.get<RecipeListItem[]>(
      '/recipes/published/featured',
      { params: { limit } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch featured recipes');
    }
    
    return response.data;
  }

  public async getPopularRecipes(limit: number = 10): Promise<RecipeListItem[]> {
    const response = await this.httpService.get<RecipeListItem[]>(
      '/recipes/published/popular',
      { params: { limit } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch popular recipes');
    }
    
    return response.data;
  }

  public async getRecentRecipes(limit: number = 10): Promise<RecipeListItem[]> {
    const response = await this.httpService.get<RecipeListItem[]>(
      '/recipes/published/recent',
      { params: { limit } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch recent recipes');
    }
    
    return response.data;
  }

  public async getUserRecipes(userId: string, params?: SearchParams): Promise<PaginatedResult<RecipeListItem>> {
    const queryParams = this.buildSearchParams(params);
    const response = await this.httpService.get<PaginatedResult<RecipeListItem>>(
      `/recipes/author/${userId}`,
      { params: queryParams }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch user recipes');
    }
    
    return response.data;
  }

  public async getMyRecipes(params?: SearchParams): Promise<PaginatedResult<RecipeListItem>> {
    const queryParams = this.buildSearchParams(params);
    // Fixed: Changed from '/recipes/my-recipes' to '/recipes/my/recipes' to match backend
    const response = await this.httpService.get<PaginatedResult<RecipeListItem>>(
      '/recipes/my/recipes',
      { params: queryParams }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch your recipes');
    }
    
    return response.data;
  }

  public async rateRecipe(id: string, rating: number): Promise<void> {
    const response = await this.httpService.post<void>(`/recipes/${id}/rate`, { rating });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to rate recipe');
    }
  }

  public async incrementViewCount(id: string): Promise<void> {
    const response = await this.httpService.post<void>(`/recipes/${id}/view`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to increment view count');
    }
  }

  private buildSearchParams(params?: SearchParams): Record<string, string | number> {
    const queryParams: Record<string, string | number> = {};
    
    if (!params) {
      return queryParams;
    }

    if (params.query) {
      queryParams.query = params.query;
    }

    if (params.page) {
      queryParams.page = params.page;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    if (params.sortBy) {
      queryParams.sortBy = params.sortBy;
    }

    if (params.sortOrder) {
      queryParams.sortOrder = params.sortOrder;
    }

    // Handle filters
    if (params.filters) {
      const filters = params.filters;
      
      if (filters.category) {
        queryParams.category = filters.category;
      }

      if (filters.difficulty) {
        queryParams.difficulty = filters.difficulty;
      }

      if (filters.maxTime) {
        queryParams.maxTime = filters.maxTime;
      }

      if (filters.rating) {
        queryParams.rating = filters.rating;
      }

      if (filters.status) {
        queryParams.status = filters.status;
      }

      if (filters.tags && filters.tags.length > 0) {
        queryParams.tags = filters.tags.join(',');
      }
    }

    return queryParams;
  }
} 
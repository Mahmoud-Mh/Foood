import { HttpService } from './base/http.service';
import { Ingredient, PaginatedResult, NutritionalInfo, ApiResponse } from '@/types/api.types';

export interface CreateIngredientForm {
  name: string;
  description?: string;
  category: string;
  unit: string;
  imageUrl?: string;
  nutritionalInfo?: NutritionalInfo;
}

export class IngredientService {
  private httpService: HttpService;

  constructor(httpService?: HttpService) {
    this.httpService = httpService || new HttpService();
  }

  public async getIngredients(
    page: number = 1, 
    limit: number = 50
  ): Promise<PaginatedResult<Ingredient>> {
    const response = await this.httpService.get<PaginatedResult<Ingredient>>(
      '/ingredients',
      { params: { page, limit } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ingredients');
    }
    
    return response.data;
  }

  public async getPublicIngredients(
    page: number = 1, 
    limit: number = 50
  ): Promise<PaginatedResult<Ingredient>> {
    const response = await this.httpService.get<PaginatedResult<Ingredient>>(
      '/ingredients/public',
      { params: { page, limit } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch public ingredients');
    }
    
    return response.data;
  }

  public async getAllIngredients(): Promise<Ingredient[]> {
    const response = await this.httpService.get<Ingredient[]>('/ingredients/all');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch all ingredients');
    }
    
    return response.data;
  }

  public async getAllPublicIngredients(): Promise<Ingredient[]> {
    const response = await this.httpService.get<Ingredient[]>('/ingredients/active');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch all public ingredients');
    }
    
    return response.data;
  }

  public async getIngredientById(id: string): Promise<Ingredient> {
    const response = await this.httpService.get<Ingredient>(`/ingredients/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ingredient');
    }
    
    return response.data;
  }

  public async getPublicIngredientById(id: string): Promise<Ingredient> {
    const response = await this.httpService.get<Ingredient>(`/ingredients/public/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ingredient');
    }
    
    return response.data;
  }

  public async createIngredient(ingredientData: CreateIngredientForm): Promise<Ingredient> {
    const response = await this.httpService.post<Ingredient>('/ingredients', ingredientData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create ingredient');
    }
    
    return response.data;
  }

  public async updateIngredient(id: string, ingredientData: Partial<CreateIngredientForm>): Promise<Ingredient> {
    const response = await this.httpService.patch<Ingredient>(`/ingredients/${id}`, ingredientData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update ingredient');
    }
    
    return response.data;
  }

  public async deleteIngredient(id: string): Promise<void> {
    const response = await this.httpService.delete<void>(`/ingredients/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete ingredient');
    }
  }

  public async searchIngredients(query: string): Promise<Ingredient[]> {
    const response = await this.httpService.get<Ingredient[]>(
      '/ingredients/search',
      { params: { query } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to search ingredients');
    }
    
    return response.data;
  }

  public async searchPublicIngredients(query: string): Promise<Ingredient[]> {
    const response = await this.httpService.get<Ingredient[]>(
      '/ingredients/public/search',
      { params: { query } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to search public ingredients');
    }
    
    return response.data;
  }

  public async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    const response = await this.httpService.get<Ingredient[]>(
      `/ingredients/category/${category}`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ingredients by category');
    }
    
    return response.data;
  }

  public async getPublicIngredientsByCategory(category: string): Promise<Ingredient[]> {
    const response = await this.httpService.get<Ingredient[]>(
      `/ingredients/category/${category}`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch public ingredients by category');
    }
    
    return response.data;
  }

  public async getPopularIngredients(limit: number = 20): Promise<Ingredient[]> {
    const response = await this.httpService.get<Ingredient[]>(
      '/ingredients/public/popular',
      { params: { limit } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch popular ingredients');
    }
    
    return response.data;
  }
} 
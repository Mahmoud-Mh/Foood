import { HttpService } from './base/http.service';
import { Category, PaginatedResult, ApiResponse } from '@/types/api.types';

export interface CreateCategoryForm {
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

export class CategoryService {
  private httpService: HttpService;

  constructor(httpService?: HttpService) {
    this.httpService = httpService || new HttpService();
  }

  public async getCategories(
    page: number = 1, 
    limit: number = 50
  ): Promise<PaginatedResult<Category>> {
    const response = await this.httpService.get<PaginatedResult<Category>>(
      '/categories',
      { params: { page, limit } }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch categories');
    }
    
    return response.data;
  }

  public async getAllPublicCategories(): Promise<Category[]> {
    const response = await this.httpService.get<Category[]>('/categories/active');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch all public categories');
    }
    
    return response.data;
  }

  public async getCategoryById(id: string): Promise<Category> {
    const response = await this.httpService.get<Category>(`/categories/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch category');
    }
    
    return response.data;
  }

  public async createCategory(categoryData: CreateCategoryForm): Promise<Category> {
    const response = await this.httpService.post<Category>('/categories', categoryData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create category');
    }
    
    return response.data;
  }

  public async updateCategory(id: string, categoryData: Partial<CreateCategoryForm>): Promise<Category> {
    const response = await this.httpService.patch<Category>(`/categories/${id}`, categoryData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update category');
    }
    
    return response.data;
  }

  public async deleteCategory(id: string): Promise<void> {
    const response = await this.httpService.delete<void>(`/categories/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete category');
    }
  }


} 
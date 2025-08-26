import { HttpService } from './base/http.service';
import { Category, PaginatedResult } from '@/types/api.types';

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
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch categories');
  }

  public async getAllPublicCategories(): Promise<Category[]> {
    const response = await this.httpService.get<Category[]>('/categories/active');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch all public categories');
  }

  public async getCategoryById(id: string): Promise<Category> {
    const response = await this.httpService.get<Category>(`/categories/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch category');
  }

  public async createCategory(categoryData: CreateCategoryForm): Promise<Category> {
    const response = await this.httpService.post<Category>('/categories', categoryData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to create category');
  }

  public async updateCategory(id: string, categoryData: Partial<CreateCategoryForm>): Promise<Category> {
    const response = await this.httpService.patch<Category>(`/categories/${id}`, categoryData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update category');
  }

  public async deleteCategory(id: string): Promise<void> {
    const response = await this.httpService.delete<void>(`/categories/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete category');
    }
  }
} 
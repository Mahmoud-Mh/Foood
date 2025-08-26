import { HttpService } from './base/http.service';
import { User, PaginatedResult, UserRole } from '@/types/api.types';

export interface UpdateProfileData {
  avatar?: string;
  bio?: string;
}

export interface GetAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export class UserService {
  private httpService: HttpService;

  constructor(httpService?: HttpService) {
    this.httpService = httpService || new HttpService();
  }

  public async updateProfile(profileData: UpdateProfileData): Promise<User> {
    const response = await this.httpService.patch<User>('/users/profile', profileData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update profile');
  }

  public async getCurrentUserProfile(): Promise<User> {
    const response = await this.httpService.post<User>('/auth/me');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get user profile');
  }

  public async deleteAccount(): Promise<void> {
    const response = await this.httpService.delete<null>('/users/me/account');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete account');
    }
  }

  // Admin methods
  public async getAllUsers(params: GetAllUsersParams = {}): Promise<PaginatedResult<User>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);

    const response = await this.httpService.get<PaginatedResult<User>>(`/users?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get users');
  }

  public async deleteUser(userId: string): Promise<void> {
    const response = await this.httpService.delete<null>(`/users/${userId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user');
    }
  }

  public async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const response = await this.httpService.patch<User>(`/users/${userId}/role`, { role });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update user role');
  }

  public async getUserById(userId: string): Promise<User> {
    const response = await this.httpService.get<User>(`/users/${userId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get user');
  }
} 
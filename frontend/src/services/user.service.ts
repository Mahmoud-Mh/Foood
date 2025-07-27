import { HttpService } from './base/http.service';
import { User, ApiResponse } from '@/types/api.types';

export interface UpdateProfileData {
  avatar?: string;
  bio?: string;
}

export class UserService {
  private httpService: HttpService;

  constructor(httpService?: HttpService) {
    this.httpService = httpService || new HttpService();
  }

  public async updateProfile(profileData: UpdateProfileData): Promise<User> {
    const response = await this.httpService.patch<User>('/users/profile', profileData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }
    
    return response.data;
  }

  public async getCurrentUserProfile(): Promise<User> {
    const response = await this.httpService.post<User>('/auth/me');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to get user profile');
    }
    
    return response.data;
  }

  public async deleteAccount(): Promise<void> {
    const response = await this.httpService.delete<null>('/users/me/account');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete account');
    }
  }
} 
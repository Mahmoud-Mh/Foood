import { httpService } from './base/http.service';
import { ApiResponse, PaginatedResult } from '../types/api.types';

export interface UserFavorite {
  id: string;
  userId: string;
  recipeId: string;
  createdAt: string;
}

export interface CreateFavoriteRequest {
  recipeId: string;
}

export interface FavoriteStatusResponse {
  isFavorite: boolean;
}

export interface FavoriteRecipeIdsResponse {
  recipeIds: string[];
}

class FavoritesService {
  async addToFavorites(recipeId: string): Promise<ApiResponse<UserFavorite>> {
    return httpService.post('/users/favorites', { recipeId });
  }

  async removeFromFavorites(recipeId: string): Promise<ApiResponse<null>> {
    return httpService.delete(`/users/favorites/${recipeId}`);
  }

  async getUserFavorites(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResult<UserFavorite>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return httpService.get(`/users/favorites?${params}`);
  }

  async checkFavoriteStatus(recipeId: string): Promise<ApiResponse<FavoriteStatusResponse>> {
    return httpService.get(`/users/favorites/${recipeId}/check`);
  }

  async getFavoriteRecipeIds(): Promise<ApiResponse<FavoriteRecipeIdsResponse>> {
    return httpService.get('/users/favorites/recipe-ids');
  }

  async toggleFavorite(recipeId: string): Promise<ApiResponse<UserFavorite | null>> {
    try {
      // Check current status
      const statusResponse = await this.checkFavoriteStatus(recipeId);
      
      if (statusResponse.data.isFavorite) {
        // Remove from favorites
        await this.removeFromFavorites(recipeId);
        return { success: true, message: 'Removed from favorites', data: null };
      } else {
        // Add to favorites
        const addResponse = await this.addToFavorites(recipeId);
        return { success: true, message: 'Added to favorites', data: addResponse.data };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
}

export const favoritesService = new FavoritesService();
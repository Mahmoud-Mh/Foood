import { HttpService, HttpError } from './base/http.service';
import { 
  Rating, 
  CreateRatingForm, 
  UpdateRatingForm,
  RatingSummary,
  RatingStats,
  PaginatedResult 
} from '@/types/api.types';

export interface GetRatingsParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating' | 'helpful';
  sortOrder?: 'asc' | 'desc';
  rating?: number; // Filter by specific star rating
}

export interface GetUserRatingsParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export class RatingService {
  private httpService: HttpService;

  constructor(httpService?: HttpService) {
    this.httpService = httpService || new HttpService();
  }

  // Create a new rating
  public async createRating(recipeId: string, ratingData: CreateRatingForm): Promise<Rating> {
    const response = await this.httpService.post<Rating>('/ratings', {
      recipeId,
      ...ratingData
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to create rating');
  }

  // Update user's existing rating
  public async updateRating(ratingId: string, ratingData: UpdateRatingForm): Promise<Rating> {
    const response = await this.httpService.patch<Rating>(`/ratings/${ratingId}`, ratingData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update rating');
  }

  // Delete user's rating
  public async deleteRating(ratingId: string): Promise<void> {
    const response = await this.httpService.delete<null>(`/ratings/${ratingId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete rating');
    }
  }

  // Get ratings for a specific recipe
  public async getRecipeRatings(
    recipeId: string, 
    params: GetRatingsParams = {}
  ): Promise<PaginatedResult<Rating>> {
    const queryParams: Record<string, string | number> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params.rating) queryParams.rating = params.rating;

    const response = await this.httpService.get<PaginatedResult<Rating>>(
      `/ratings/recipe/${recipeId}`, 
      { params: queryParams }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch recipe ratings');
  }

  // Get user's rating for a specific recipe
  public async getUserRecipeRating(recipeId: string): Promise<Rating | null> {
    try {
      const response = await this.httpService.get<Rating>(`/ratings/recipe/${recipeId}/my-rating`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null; // User hasn't rated this recipe
    } catch (error) {
      // If 404, user hasn't rated this recipe
      if (error instanceof HttpError && error.isNotFoundError()) {
        return null;
      }
      throw error;
    }
  }

  // Get rating summary for a recipe
  public async getRecipeRatingSummary(recipeId: string): Promise<RatingSummary> {
    const response = await this.httpService.get<RatingSummary>(`/ratings/recipe/${recipeId}/summary`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch rating summary');
  }

  // Get all ratings by current user
  public async getMyRatings(params: GetUserRatingsParams = {}): Promise<PaginatedResult<Rating>> {
    const queryParams: Record<string, string | number> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await this.httpService.get<PaginatedResult<Rating>>(
      '/ratings/my-ratings', 
      { params: queryParams }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch my ratings');
  }

  // Get ratings by a specific user (public endpoint)
  public async getUserRatings(
    userId: string, 
    params: GetUserRatingsParams = {}
  ): Promise<PaginatedResult<Rating>> {
    const queryParams: Record<string, string | number> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await this.httpService.get<PaginatedResult<Rating>>(
      `/ratings/user/${userId}`, 
      { params: queryParams }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch user ratings');
  }

  // Get user's rating statistics
  public async getMyRatingStats(): Promise<RatingStats> {
    const response = await this.httpService.get<RatingStats>('/ratings/my-stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch rating statistics');
  }

  // Mark a rating as helpful
  public async markHelpful(ratingId: string): Promise<void> {
    const response = await this.httpService.post<null>(`/ratings/${ratingId}/helpful`, {});
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark rating as helpful');
    }
  }

  // Report a rating
  public async reportRating(ratingId: string, reason?: string): Promise<void> {
    const response = await this.httpService.post<null>(`/ratings/${ratingId}/report`, { reason });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to report rating');
    }
  }

  // Get a specific rating by ID
  public async getRating(ratingId: string): Promise<Rating> {
    const response = await this.httpService.get<Rating>(`/ratings/${ratingId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch rating');
  }

  // Bulk operations for admin/moderation
  public async deleteMultipleRatings(ratingIds: string[]): Promise<void> {
    const response = await this.httpService.post<null>('/ratings/bulk/delete', { ratingIds });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete ratings');
    }
  }

  // Get recent ratings across all recipes (for admin/analytics)
  public async getRecentRatings(params: GetRatingsParams = {}): Promise<PaginatedResult<Rating>> {
    const queryParams: Record<string, string | number> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params.rating) queryParams.rating = params.rating;

    const response = await this.httpService.get<PaginatedResult<Rating>>(
      '/ratings/recent', 
      { params: queryParams }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch recent ratings');
  }
}
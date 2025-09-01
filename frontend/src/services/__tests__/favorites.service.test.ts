import { favoritesService } from '../favorites.service';

// Mock the httpService
jest.mock('../index', () => ({
  httpService: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockUserFavorite = {
  id: 'fav-1',
  userId: 'user-1',
  recipeId: 'recipe-1',
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('FavoritesService', () => {
  const { httpService } = require('../index');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToFavorites', () => {
    it('should add recipe to favorites successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockUserFavorite,
        message: 'Recipe added to favorites'
      };

      httpService.post.mockResolvedValue(mockResponse);

      const result = await favoritesService.addToFavorites('recipe-1');

      expect(httpService.post).toHaveBeenCalledWith('/users/favorites', { 
        recipeId: 'recipe-1' 
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle add to favorites error', async () => {
      const mockError = new Error('Failed to add to favorites');
      httpService.post.mockRejectedValue(mockError);

      await expect(favoritesService.addToFavorites('recipe-1')).rejects.toThrow('Failed to add to favorites');
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove recipe from favorites successfully', async () => {
      const mockResponse = {
        success: true,
        data: null,
        message: 'Recipe removed from favorites'
      };

      httpService.delete.mockResolvedValue(mockResponse);

      const result = await favoritesService.removeFromFavorites('recipe-1');

      expect(httpService.delete).toHaveBeenCalledWith('/users/favorites/recipe-1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle remove from favorites error', async () => {
      const mockError = new Error('Failed to remove from favorites');
      httpService.delete.mockRejectedValue(mockError);

      await expect(favoritesService.removeFromFavorites('recipe-1')).rejects.toThrow('Failed to remove from favorites');
    });
  });

  describe('getUserFavorites', () => {
    it('should get user favorites with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockUserFavorite],
          totalCount: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 10
        }
      };

      httpService.get.mockResolvedValue(mockResponse);

      const result = await favoritesService.getUserFavorites();

      expect(httpService.get).toHaveBeenCalledWith('/users/favorites?page=1&limit=10');
      expect(result).toEqual(mockResponse);
    });

    it('should get user favorites with custom pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockUserFavorite],
          totalCount: 5,
          currentPage: 2,
          totalPages: 3,
          pageSize: 2
        }
      };

      httpService.get.mockResolvedValue(mockResponse);

      const result = await favoritesService.getUserFavorites(2, 2);

      expect(httpService.get).toHaveBeenCalledWith('/users/favorites?page=2&limit=2');
      expect(result).toEqual(mockResponse);
    });

    it('should handle get user favorites error', async () => {
      const mockError = new Error('Failed to get favorites');
      httpService.get.mockRejectedValue(mockError);

      await expect(favoritesService.getUserFavorites()).rejects.toThrow('Failed to get favorites');
    });
  });

  describe('checkFavoriteStatus', () => {
    it('should check if recipe is favorited', async () => {
      const mockResponse = {
        success: true,
        data: { isFavorite: true }
      };

      httpService.get.mockResolvedValue(mockResponse);

      const result = await favoritesService.checkFavoriteStatus('recipe-1');

      expect(httpService.get).toHaveBeenCalledWith('/users/favorites/recipe-1/check');
      expect(result).toEqual(mockResponse);
    });

    it('should check if recipe is not favorited', async () => {
      const mockResponse = {
        success: true,
        data: { isFavorite: false }
      };

      httpService.get.mockResolvedValue(mockResponse);

      const result = await favoritesService.checkFavoriteStatus('recipe-1');

      expect(httpService.get).toHaveBeenCalledWith('/users/favorites/recipe-1/check');
      expect(result).toEqual(mockResponse);
    });

    it('should handle check favorite status error', async () => {
      const mockError = new Error('Failed to check favorite status');
      httpService.get.mockRejectedValue(mockError);

      await expect(favoritesService.checkFavoriteStatus('recipe-1')).rejects.toThrow('Failed to check favorite status');
    });
  });

  describe('getFavoriteRecipeIds', () => {
    it('should get favorite recipe IDs successfully', async () => {
      const mockResponse = {
        success: true,
        data: { recipeIds: ['recipe-1', 'recipe-2', 'recipe-3'] }
      };

      httpService.get.mockResolvedValue(mockResponse);

      const result = await favoritesService.getFavoriteRecipeIds();

      expect(httpService.get).toHaveBeenCalledWith('/users/favorites/recipe-ids');
      expect(result).toEqual(mockResponse);
    });

    it('should handle get favorite recipe IDs error', async () => {
      const mockError = new Error('Failed to get favorite recipe IDs');
      httpService.get.mockRejectedValue(mockError);

      await expect(favoritesService.getFavoriteRecipeIds()).rejects.toThrow('Failed to get favorite recipe IDs');
    });
  });

  describe('toggleFavorite', () => {
    it('should add recipe to favorites when not favorited', async () => {
      // Mock status check - not favorited
      const statusResponse = {
        success: true,
        data: { isFavorite: false }
      };

      // Mock add response
      const addResponse = {
        success: true,
        data: mockUserFavorite
      };

      httpService.get.mockResolvedValue(statusResponse);
      httpService.post.mockResolvedValue(addResponse);

      const result = await favoritesService.toggleFavorite('recipe-1');

      expect(httpService.get).toHaveBeenCalledWith('/users/favorites/recipe-1/check');
      expect(httpService.post).toHaveBeenCalledWith('/users/favorites', { recipeId: 'recipe-1' });
      expect(result).toEqual({
        success: true,
        message: 'Added to favorites',
        data: mockUserFavorite
      });
    });

    it('should remove recipe from favorites when favorited', async () => {
      // Mock status check - favorited
      const statusResponse = {
        success: true,
        data: { isFavorite: true }
      };

      // Mock remove response
      const removeResponse = {
        success: true,
        data: null
      };

      httpService.get.mockResolvedValue(statusResponse);
      httpService.delete.mockResolvedValue(removeResponse);

      const result = await favoritesService.toggleFavorite('recipe-1');

      expect(httpService.get).toHaveBeenCalledWith('/users/favorites/recipe-1/check');
      expect(httpService.delete).toHaveBeenCalledWith('/users/favorites/recipe-1');
      expect(result).toEqual({
        success: true,
        message: 'Removed from favorites',
        data: null
      });
    });

    it('should handle toggle favorite error during status check', async () => {
      const mockError = new Error('Status check failed');
      httpService.get.mockRejectedValue(mockError);

      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(favoritesService.toggleFavorite('recipe-1')).rejects.toThrow('Status check failed');

      expect(consoleSpy).toHaveBeenCalledWith('Error toggling favorite:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('should handle toggle favorite error during add operation', async () => {
      // Mock status check - not favorited
      const statusResponse = {
        success: true,
        data: { isFavorite: false }
      };

      const mockError = new Error('Add operation failed');
      httpService.get.mockResolvedValue(statusResponse);
      httpService.post.mockRejectedValue(mockError);

      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(favoritesService.toggleFavorite('recipe-1')).rejects.toThrow('Add operation failed');

      expect(consoleSpy).toHaveBeenCalledWith('Error toggling favorite:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('should handle toggle favorite error during remove operation', async () => {
      // Mock status check - favorited
      const statusResponse = {
        success: true,
        data: { isFavorite: true }
      };

      const mockError = new Error('Remove operation failed');
      httpService.get.mockResolvedValue(statusResponse);
      httpService.delete.mockRejectedValue(mockError);

      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(favoritesService.toggleFavorite('recipe-1')).rejects.toThrow('Remove operation failed');

      expect(consoleSpy).toHaveBeenCalledWith('Error toggling favorite:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('should handle undefined status response data', async () => {
      // Mock status check with undefined data
      const statusResponse = {
        success: true,
        data: undefined
      };

      // Mock add response (since undefined is falsy, should add)
      const addResponse = {
        success: true,
        data: mockUserFavorite
      };

      httpService.get.mockResolvedValue(statusResponse);
      httpService.post.mockResolvedValue(addResponse);

      const result = await favoritesService.toggleFavorite('recipe-1');

      expect(httpService.post).toHaveBeenCalledWith('/users/favorites', { recipeId: 'recipe-1' });
      expect(result).toEqual({
        success: true,
        message: 'Added to favorites',
        data: mockUserFavorite
      });
    });
  });
});
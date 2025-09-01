import { recipeService } from '../index';

// Mock fetch globally
global.fetch = jest.fn();

const mockRecipe = {
  id: 'recipe-1',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  imageUrl: '/images/test-recipe.jpg',
  prepTimeMinutes: 15,
  cookTimeMinutes: 30,
  servings: 4,
  difficulty: 'medium' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  authorId: 'author-1',
  categoryId: 'category-1',
  status: 'approved' as const,
  viewsCount: 100,
};

const mockCreateRecipeData = {
  title: 'New Recipe',
  description: 'A new test recipe',
  prepTimeMinutes: 20,
  cookTimeMinutes: 25,
  servings: 6,
  difficulty: 'easy' as const,
  categoryId: 'category-1',
  ingredients: [
    { name: 'Flour', quantity: '2 cups', order: 1 },
    { name: 'Sugar', quantity: '1 cup', order: 2 }
  ],
  instructions: [
    { stepNumber: 1, instruction: 'Mix ingredients' },
    { stepNumber: 2, instruction: 'Bake for 25 minutes' }
  ]
};

describe('RecipeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('getPublicRecipes', () => {
    it('should fetch public recipes with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          recipes: [mockRecipe],
          totalCount: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 10
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.getPublicRecipes();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/published?page=1&limit=10'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch recipes with custom pagination and filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          recipes: [mockRecipe],
          totalCount: 1,
          currentPage: 2,
          totalPages: 5,
          pageSize: 5
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.getPublicRecipes({
        page: 2,
        limit: 5,
        search: 'pasta',
        categoryId: 'italian',
        difficulty: 'medium'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/search?q=pasta&page=2&limit=5&categoryId=italian&difficulty=medium'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPublicRecipeById', () => {
    it('should fetch public recipe by id successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockRecipe
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.getPublicRecipeById('recipe-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/recipe-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle recipe not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Recipe not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(recipeService.getPublicRecipeById('non-existent')).rejects.toThrow('Recipe not found');
    });
  });

  describe('getRecipeById', () => {
    it('should fetch recipe by id for authenticated user successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockRecipe
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.getRecipeById('recipe-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/recipe-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createRecipe', () => {
    it('should create recipe successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'new-recipe-id', ...mockCreateRecipeData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await recipeService.createRecipe(mockCreateRecipeData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockCreateRecipeData),
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle validation errors', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Validation failed',
        errors: { title: ['Title is required'] }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      });

      await expect(recipeService.createRecipe({
        ...mockCreateRecipeData,
        title: '' // Invalid title
      })).rejects.toThrow('Validation failed');
    });
  });

  describe('updateRecipe', () => {
    it('should update recipe successfully', async () => {
      const updateData = { title: 'Updated Recipe Title' };
      const mockResponse = {
        success: true,
        data: { ...mockRecipe, ...updateData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.updateRecipe('recipe-1', updateData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/recipe-1'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updateData),
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Recipe deleted successfully'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await recipeService.deleteRecipe('recipe-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/recipe-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle delete authorization errors', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized to delete this recipe'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      });

      await expect(recipeService.deleteRecipe('recipe-1')).rejects.toThrow('Unauthorized to delete this recipe');
    });
  });

  describe('searchPublicRecipes', () => {
    it('should search recipes successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          recipes: [mockRecipe],
          totalCount: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 10
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.searchPublicRecipes({
        query: 'pasta',
        category: 'italian',
        difficulty: 'medium'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/search?query=pasta&category=italian&difficulty=medium'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getMyRecipes', () => {
    it('should fetch user\'s recipes with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          recipes: [mockRecipe],
          totalCount: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 10
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.getMyRecipes();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/my/recipes?page=1&limit=10'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle authentication errors', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      await expect(recipeService.getMyRecipes()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getActiveCategories', () => {
    it('should fetch active categories successfully', async () => {
      const mockCategories = [
        { id: 'cat1', name: 'Italian', description: 'Italian cuisine' },
        { id: 'cat2', name: 'Asian', description: 'Asian cuisine' }
      ];

      const mockResponse = {
        success: true,
        data: mockCategories
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.getActiveCategories();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories/active'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getIngredientsByCategory', () => {
    it('should fetch ingredients by category successfully', async () => {
      const mockIngredients = [
        { id: 'ing1', name: 'Flour', category: 'baking' },
        { id: 'ing2', name: 'Sugar', category: 'baking' }
      ];

      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recipeService.getIngredientsByCategory('baking');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/category/baking'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });
});
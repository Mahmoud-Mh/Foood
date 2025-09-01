import { ingredientService } from '../index';

// Mock fetch globally
global.fetch = jest.fn();

const mockIngredient = {
  id: 'ing-1',
  name: 'Tomato',
  description: 'Fresh red tomatoes',
  category: 'vegetables',
  unit: 'piece',
  imageUrl: '/images/tomato.jpg',
  nutritionalInfo: {
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
    fiber: 1.2,
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockCreateIngredientData = {
  name: 'Onion',
  description: 'Fresh yellow onions',
  category: 'vegetables',
  unit: 'piece',
  imageUrl: '/images/onion.jpg',
  nutritionalInfo: {
    calories: 40,
    protein: 1.1,
    carbs: 9.3,
    fat: 0.1,
    fiber: 1.7,
  },
};

describe('IngredientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('getIngredients', () => {
    it('should get ingredients with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockIngredient],
          totalCount: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 50
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getIngredients();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should get ingredients with custom pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockIngredient],
          totalCount: 10,
          currentPage: 2,
          totalPages: 5,
          pageSize: 2
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getIngredients(2, 2);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle get ingredients error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Failed to fetch ingredients'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.getIngredients()).rejects.toThrow('Failed to fetch ingredients');
    });
  });

  describe('getPublicIngredients', () => {
    it('should get public ingredients successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockIngredient],
          totalCount: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 50
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getPublicIngredients();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/public'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle get public ingredients error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Failed to fetch public ingredients'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.getPublicIngredients()).rejects.toThrow('Failed to fetch public ingredients');
    });
  });

  describe('getAllIngredients', () => {
    it('should get all ingredients successfully', async () => {
      const mockIngredients = [mockIngredient, { ...mockIngredient, id: 'ing-2', name: 'Onion' }];
      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getAllIngredients();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/all'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredients);
    });
  });

  describe('getAllPublicIngredients', () => {
    it('should get all public ingredients successfully', async () => {
      const mockIngredients = [mockIngredient];
      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getAllPublicIngredients();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/active'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredients);
    });
  });

  describe('getIngredientById', () => {
    it('should get ingredient by id successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockIngredient
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getIngredientById('ing-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/ing-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredient);
    });

    it('should handle ingredient not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Ingredient not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.getIngredientById('non-existent')).rejects.toThrow('Ingredient not found');
    });
  });

  describe('getPublicIngredientById', () => {
    it('should get public ingredient by id successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockIngredient
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getPublicIngredientById('ing-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/public/ing-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredient);
    });
  });

  describe('createIngredient', () => {
    it('should create ingredient successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'new-ing-id', ...mockCreateIngredientData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await ingredientService.createIngredient(mockCreateIngredientData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockCreateIngredientData),
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle create ingredient validation error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Validation failed',
        errors: { name: ['Name is required'] }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.createIngredient({
        ...mockCreateIngredientData,
        name: ''
      })).rejects.toThrow('Validation failed');
    });
  });

  describe('updateIngredient', () => {
    it('should update ingredient successfully', async () => {
      const updateData = { name: 'Updated Tomato', description: 'Updated description' };
      const mockResponse = {
        success: true,
        data: { ...mockIngredient, ...updateData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.updateIngredient('ing-1', updateData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/ing-1'),
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

    it('should handle update ingredient not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Ingredient not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.updateIngredient('non-existent', { name: 'Updated' })).rejects.toThrow('Ingredient not found');
    });
  });

  describe('deleteIngredient', () => {
    it('should delete ingredient successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Ingredient deleted successfully'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await ingredientService.deleteIngredient('ing-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/ing-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle delete ingredient error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Cannot delete ingredient used in recipes'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.deleteIngredient('ing-1')).rejects.toThrow('Cannot delete ingredient used in recipes');
    });
  });

  describe('searchIngredients', () => {
    it('should search ingredients successfully', async () => {
      const mockIngredients = [mockIngredient];
      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.searchIngredients('tomato');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/search'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredients);
    });

    it('should handle search ingredients error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Search failed'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.searchIngredients('tomato')).rejects.toThrow('Search failed');
    });
  });

  describe('searchPublicIngredients', () => {
    it('should search public ingredients successfully', async () => {
      const mockIngredients = [mockIngredient];
      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.searchPublicIngredients('tomato');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/public/search'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredients);
    });
  });

  describe('getIngredientsByCategory', () => {
    it('should get ingredients by category successfully', async () => {
      const mockIngredients = [mockIngredient];
      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getIngredientsByCategory('vegetables');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/category/vegetables'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredients);
    });

    it('should handle get ingredients by category error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Category not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.getIngredientsByCategory('invalid')).rejects.toThrow('Category not found');
    });
  });

  describe('getPublicIngredientsByCategory', () => {
    it('should get public ingredients by category successfully', async () => {
      const mockIngredients = [mockIngredient];
      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getPublicIngredientsByCategory('vegetables');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/category/vegetables'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredients);
    });
  });

  describe('getPopularIngredients', () => {
    it('should get popular ingredients with default limit', async () => {
      const mockIngredients = [mockIngredient];
      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getPopularIngredients();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients/public/popular'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockIngredients);
    });

    it('should get popular ingredients with custom limit', async () => {
      const mockIngredients = [mockIngredient];
      const mockResponse = {
        success: true,
        data: mockIngredients
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ingredientService.getPopularIngredients(5);

      expect(result).toEqual(mockIngredients);
    });

    it('should handle get popular ingredients error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Failed to fetch popular ingredients'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      await expect(ingredientService.getPopularIngredients()).rejects.toThrow('Failed to fetch popular ingredients');
    });
  });
});
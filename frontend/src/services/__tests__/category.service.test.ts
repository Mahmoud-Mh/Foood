import { categoryService } from '../index';

// Mock fetch globally
global.fetch = jest.fn();

const mockCategory = {
  id: 'cat-1',
  name: 'Italian',
  description: 'Delicious Italian cuisine',
  color: '#ff6b6b',
  icon: '🍝',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockCreateCategoryData = {
  name: 'Mexican',
  description: 'Spicy Mexican dishes',
  color: '#51cf66',
  icon: '🌮',
};

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('getCategories', () => {
    it('should get categories with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockCategory],
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

      const result = await categoryService.getCategories();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should get categories with custom pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockCategory],
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

      const result = await categoryService.getCategories(2, 2);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle get categories error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Failed to fetch categories'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.getCategories()).rejects.toThrow('Failed to fetch categories');
    });
  });

  describe('getAllPublicCategories', () => {
    it('should get all public categories successfully', async () => {
      const mockCategories = [mockCategory, { ...mockCategory, id: 'cat-2', name: 'Chinese' }];
      const mockResponse = {
        success: true,
        data: mockCategories
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await categoryService.getAllPublicCategories();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories/active'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockCategories);
    });

    it('should handle get public categories error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Failed to fetch all public categories'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.getAllPublicCategories()).rejects.toThrow('Failed to fetch all public categories');
    });
  });

  describe('getCategoryById', () => {
    it('should get category by id successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockCategory
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await categoryService.getCategoryById('cat-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories/cat-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockCategory);
    });

    it('should handle category not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Category not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.getCategoryById('non-existent')).rejects.toThrow('Category not found');
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'new-cat-id', ...mockCreateCategoryData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await categoryService.createCategory(mockCreateCategoryData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockCreateCategoryData),
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle create category validation error', async () => {
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

      await expect(categoryService.createCategory({
        ...mockCreateCategoryData,
        name: ''
      })).rejects.toThrow('Validation failed');
    });

    it('should handle create category authorization error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.createCategory(mockCreateCategoryData)).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updateData = { name: 'Updated Italian', color: '#339af0' };
      const mockResponse = {
        success: true,
        data: { ...mockCategory, ...updateData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await categoryService.updateCategory('cat-1', updateData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories/cat-1'),
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

    it('should handle update category not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Category not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.updateCategory('non-existent', { name: 'Updated' })).rejects.toThrow('Category not found');
    });

    it('should handle update category authorization error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized to update this category'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.updateCategory('cat-1', { name: 'Updated' })).rejects.toThrow('Unauthorized to update this category');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Category deleted successfully'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await categoryService.deleteCategory('cat-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories/cat-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle delete category not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Category not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.deleteCategory('non-existent')).rejects.toThrow('Category not found');
    });

    it('should handle delete category authorization error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized to delete this category'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.deleteCategory('cat-1')).rejects.toThrow('Unauthorized to delete this category');
    });

    it('should handle delete category with dependencies error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Cannot delete category with existing recipes'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockErrorResponse,
      });

      await expect(categoryService.deleteCategory('cat-1')).rejects.toThrow('Cannot delete category with existing recipes');
    });
  });
});
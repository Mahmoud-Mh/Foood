import { userService } from '../index';
import { UserRole } from '@/types/api.types';

// Mock fetch globally
global.fetch = jest.fn();

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user' as UserRole,
  avatar: '/avatars/user-1.jpg',
  bio: 'Test user bio',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = { avatar: '/new-avatar.jpg', bio: 'Updated bio' };
      const mockResponse = {
        success: true,
        data: { ...mockUser, ...updateData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await userService.updateProfile(updateData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/profile'),
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

    it('should handle update profile error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Validation failed'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      });

      await expect(userService.updateProfile({ bio: 'test' })).rejects.toThrow('Validation failed');
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should get current user profile successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockUser
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await userService.getCurrentUserProfile();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result).toEqual(mockUser);
    });

    it('should handle get current user profile unauthorized error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      await expect(userService.getCurrentUserProfile()).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Account deleted successfully'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await userService.deleteAccount();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/account'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle delete account error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Cannot delete account with active recipes'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockErrorResponse,
      });

      await expect(userService.deleteAccount()).rejects.toThrow('Cannot delete account with active recipes');
    });
  });

  describe('getAllUsers', () => {
    it('should get all users with default parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockUser],
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

      const result = await userService.getAllUsers();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users?'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should get all users with custom parameters', async () => {
      const params = {
        page: 2,
        limit: 5,
        search: 'john',
        role: 'admin'
      };

      const mockResponse = {
        success: true,
        data: {
          data: [mockUser],
          totalCount: 1,
          currentPage: 2,
          totalPages: 1,
          pageSize: 5
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await userService.getAllUsers(params);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users?page=2&limit=5&search=john&role=admin'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle get all users unauthorized error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized - admin access required'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      });

      await expect(userService.getAllUsers()).rejects.toThrow('Unauthorized - admin access required');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User deleted successfully'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await userService.deleteUser('user-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle delete user not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'User not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(userService.deleteUser('non-existent')).rejects.toThrow('User not found');
    });

    it('should handle delete user authorization error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized to delete this user'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      });

      await expect(userService.deleteUser('user-1')).rejects.toThrow('Unauthorized to delete this user');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const newRole = UserRole.ADMIN;
      const mockResponse = {
        success: true,
        data: { ...mockUser, role: newRole }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await userService.updateUserRole('user-1', newRole);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-1/role'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ role: newRole }),
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle update user role not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'User not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(userService.updateUserRole('non-existent', UserRole.ADMIN)).rejects.toThrow('User not found');
    });

    it('should handle update user role authorization error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized - admin access required'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      });

      await expect(userService.updateUserRole('user-1', UserRole.ADMIN)).rejects.toThrow('Unauthorized - admin access required');
    });
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockUser
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await userService.getUserById('user-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockUser);
    });

    it('should handle get user by id not found error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'User not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(userService.getUserById('non-existent')).rejects.toThrow('User not found');
    });

    it('should handle get user by id authorization error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Unauthorized to access this user'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      });

      await expect(userService.getUserById('user-1')).rejects.toThrow('Unauthorized to access this user');
    });
  });
});
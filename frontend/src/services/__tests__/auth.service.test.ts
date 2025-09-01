import { authService } from '../index';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          tokens: {
            accessToken: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token'
          },
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user'
          }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.login({ email: 'test@example.com', password: 'password' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        })
      );

      expect(result).toEqual(mockResponse.data);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('recipe_app_token', 'mock-jwt-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('recipe_app_refresh_token', 'mock-refresh-token');
    });

    it('should handle login failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      await expect(authService.login({ email: 'test@example.com', password: 'wrong-password' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = {
        success: true,
        data: {
          tokens: {
            accessToken: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token'
          },
          user: {
            id: '1',
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
            role: 'user'
          }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const result = await authService.register(registerData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(registerData),
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle registration failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: 'Email already exists',
        }),
      });

      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      await expect(authService.register(registerData))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', () => {
      authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('recipe_app_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('recipe_app_refresh_token');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      localStorageMock.getItem.mockReturnValue('mock-jwt-token');
      
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should return null when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle unauthorized access and return null', async () => {
      localStorageMock.getItem.mockReturnValue('mock-jwt-token');

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when token is expired', () => {
      // Create a mock expired JWT token
      const expiredToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 100 })) + '.signature';
      localStorageMock.getItem.mockReturnValue(expiredToken);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return true when token is valid', () => {
      // Create a mock valid JWT token
      const validToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signature';
      localStorageMock.getItem.mockReturnValue(validToken);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when JWT payload is malformed', () => {
      const malformedToken = 'header.invalid-base64.signature';
      localStorageMock.getItem.mockReturnValue(malformedToken);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when JWT has no expiry field', () => {
      const tokenWithoutExp = 'header.' + btoa(JSON.stringify({ sub: 'user123' })) + '.signature';
      localStorageMock.getItem.mockReturnValue(tokenWithoutExp);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('valid-jwt-token');
      localStorageMock.setItem.mockClear();
    });

    it('should refresh token successfully', async () => {
      const mockRefreshResponse = {
        success: true,
        data: {
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user'
          }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      });

      const result = await authService.refreshToken();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken: 'valid-jwt-token' }),
        })
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith('recipe_app_token', 'new-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('recipe_app_refresh_token', 'new-refresh-token');
      expect(result).toEqual(mockRefreshResponse.data);
    });

    it('should return null when no refresh token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await authService.refreshToken();

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle refresh token failure and logout', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid refresh token'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      const logoutSpy = jest.spyOn(authService, 'logout');

      const result = await authService.refreshToken();

      expect(result).toBeNull();
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('should handle concurrent refresh token calls', async () => {
      const mockRefreshResponse = {
        success: true,
        data: {
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user'
          }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      });

      // Start multiple concurrent refresh calls
      const promise1 = authService.refreshToken();
      const promise2 = authService.refreshToken();
      const promise3 = authService.refreshToken();

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      // Should only make one API call
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // All promises should resolve to the same result
      expect(result1).toEqual(mockRefreshResponse.data);
      expect(result2).toEqual(mockRefreshResponse.data);
      expect(result3).toEqual(mockRefreshResponse.data);
    });

    it('should handle network error during refresh', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const logoutSpy = jest.spyOn(authService, 'logout');

      const result = await authService.refreshToken();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
      expect(logoutSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Password changed successfully' }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await authService.changePassword('oldPassword123', 'newPassword456');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/change-password'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            currentPassword: 'oldPassword123',
            newPassword: 'newPassword456'
          }),
        })
      );
    });

    it('should handle change password failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Current password is incorrect'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(authService.changePassword('wrongPassword', 'newPassword456'))
        .rejects.toThrow('Current password is incorrect');
    });

    it('should handle change password network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.changePassword('oldPassword123', 'newPassword456'))
        .rejects.toThrow('Network error');
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password email successfully', async () => {
      const mockResponse = {
        success: true,
        data: null
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await authService.forgotPassword('user@example.com');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
        })
      );
    });

    it('should handle forgot password failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Email not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(authService.forgotPassword('nonexistent@example.com'))
        .rejects.toThrow('Email not found');
    });

    it('should handle forgot password with fallback error message', async () => {
      const mockErrorResponse = {
        success: false
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(authService.forgotPassword('user@example.com'))
        .rejects.toThrow('HTTP undefined: undefined');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockResponse = {
        success: true,
        data: null
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await authService.resetPassword('reset-token-123', 'newPassword456');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/reset-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            token: 'reset-token-123',
            newPassword: 'newPassword456'
          }),
        })
      );
    });

    it('should handle invalid reset token', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid or expired reset token'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(authService.resetPassword('invalid-token', 'newPassword456'))
        .rejects.toThrow('Invalid or expired reset token');
    });

    it('should handle reset password with fallback error message', async () => {
      const mockErrorResponse = {
        success: false
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(authService.resetPassword('token-123', 'newPassword456'))
        .rejects.toThrow('HTTP undefined: undefined');
    });
  });

  describe('logout', () => {
    it('should clear all authentication data on logout', () => {
      // Mock that tokens exist
      localStorageMock.getItem.mockReturnValue('some-token');
      
      authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('recipe_app_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('recipe_app_refresh_token');
      // Cookie should be cleared
      expect(document.cookie).toContain('auth_token=; Max-Age=0');
    });

    it('should handle logout when no tokens exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      // Should not throw error
      expect(() => authService.logout()).not.toThrow();
      
      // Should still attempt to clear storage
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('recipe_app_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('recipe_app_refresh_token');
    });
  });

  describe('getCurrentUser with token refresh flow', () => {
    it('should retry getCurrentUser after successful token refresh', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token');

      // First call fails (token expired)
      // Second call (refresh token) succeeds
      // Third call (retry getCurrentUser) succeeds
      const mockUserResponse = {
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user'
        }
      };

      const mockRefreshResponse = {
        success: true,
        data: {
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user'
          }
        }
      };

      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Token expired')) // First /auth/me call fails
        .mockResolvedValueOnce({ // Refresh call succeeds
          ok: true,
          json: async () => mockRefreshResponse,
        })
        .mockResolvedValueOnce({ // Retry /auth/me call succeeds
          ok: true,
          json: async () => mockUserResponse,
        });

      const result = await authService.getCurrentUser();

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      });
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should logout when refresh fails during getCurrentUser retry', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token');

      const logoutSpy = jest.spyOn(authService, 'logout');

      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Token expired')) // First /auth/me call fails
        .mockRejectedValueOnce(new Error('Invalid refresh token')); // Refresh call fails

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('should logout when retry getCurrentUser fails after successful refresh', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token');

      const logoutSpy = jest.spyOn(authService, 'logout');

      const mockRefreshResponse = {
        success: true,
        data: {
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user'
          }
        }
      };

      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Token expired')) // First /auth/me call fails
        .mockResolvedValueOnce({ // Refresh call succeeds
          ok: true,
          json: async () => mockRefreshResponse,
        })
        .mockRejectedValueOnce(new Error('Still unauthorized')); // Retry /auth/me call fails

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JWT tokens gracefully', () => {
      const malformedTokens = [
        'not.a.jwt',
        'missing-dots',
        'too.many.dots.here.invalid',
        'header..signature', // empty payload
        '', // empty string
      ];

      malformedTokens.forEach(token => {
        localStorageMock.getItem.mockReturnValue(token);
        expect(authService.isAuthenticated()).toBe(false);
      });
    });

    it('should handle server-side rendering (no window)', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(authService.getToken()).toBeNull();

      global.window = originalWindow;
    });

    it('should handle JSON parsing errors in JWT payload', () => {
      // Create token with invalid JSON in payload
      const invalidJsonToken = 'header.' + btoa('invalid json {') + '.signature';
      localStorageMock.getItem.mockReturnValue(invalidJsonToken);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should handle atob decoding errors', () => {
      // Create token with invalid base64 in payload
      const invalidBase64Token = 'header.!!!invalid-base64!!!.signature';
      localStorageMock.getItem.mockReturnValue(invalidBase64Token);

      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
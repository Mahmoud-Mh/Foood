import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from '../AuthContext';
import { AuthService } from '@/services/auth.service';
import { User, UserRole } from '@/types/api.types';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('@/services/auth.service');

const mockToast = toast as jest.Mocked<typeof toast>;
const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.USER,
  avatar: '/avatars/test.jpg',
  bio: 'Test user bio',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockAuthResponse = {
  user: mockUser,
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
};

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, register, logout, refreshUser } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password'
      })}>Register</button>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshUser}>Refresh User</button>
    </div>
  );
};

describe('AuthContext', () => {
  let mockAuthServiceInstance: jest.Mocked<AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthServiceInstance = {
      initialize: jest.fn(),
      isAuthenticated: jest.fn(),
      getCurrentUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    } as any;

    mockAuthService.mockImplementation(() => mockAuthServiceInstance);
  });

  describe('AuthProvider initialization', () => {
    it('should initialize with loading state and no user', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(false);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('should initialize and load user when authenticated', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(true);
      mockAuthServiceInstance.getCurrentUser.mockResolvedValue(mockUser);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuthServiceInstance.initialize).toHaveBeenCalled();
        expect(mockAuthServiceInstance.getCurrentUser).toHaveBeenCalled();
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });

    it('should handle initialization error and logout user', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(true);
      mockAuthServiceInstance.getCurrentUser.mockRejectedValue(new Error('Auth failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Auth initialization error:', expect.any(Error));
        expect(mockAuthServiceInstance.logout).toHaveBeenCalled();
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(false);
      mockAuthServiceInstance.login.mockResolvedValue(mockAuthResponse);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Login' }).click();
      });

      await waitFor(() => {
        expect(mockAuthServiceInstance.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        });
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
        expect(mockToast.success).toHaveBeenCalledWith('Successfully logged in!');
      });
    });

  });

  describe('register', () => {
    it('should successfully register user', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(false);
      mockAuthServiceInstance.register.mockResolvedValue(mockAuthResponse);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Register' }).click();
      });

      await waitFor(() => {
        expect(mockAuthServiceInstance.register).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password',
          confirmPassword: 'password'
        });
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
        expect(mockToast.success).toHaveBeenCalledWith('Registration successful!');
      });
    });

  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(true);
      mockAuthServiceInstance.getCurrentUser.mockResolvedValue(mockUser);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Logout' }).click();
      });

      expect(mockAuthServiceInstance.logout).toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(mockToast.success).toHaveBeenCalledWith('Successfully logged out');
    });
  });

  describe('refreshUser', () => {
    it('should successfully refresh user data', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(false);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      const updatedUser = { ...mockUser, firstName: 'Updated' };
      mockAuthServiceInstance.getCurrentUser.mockResolvedValue(updatedUser);

      await act(async () => {
        screen.getByRole('button', { name: 'Refresh User' }).click();
      });

      await waitFor(() => {
        expect(mockAuthServiceInstance.getCurrentUser).toHaveBeenCalled();
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(updatedUser));
      });
    });

    it('should handle refresh user when no user returned', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(false);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      mockAuthServiceInstance.getCurrentUser.mockResolvedValue(null);

      await act(async () => {
        screen.getByRole('button', { name: 'Refresh User' }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });

    it('should handle refresh user error', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(false);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      mockAuthServiceInstance.getCurrentUser.mockRejectedValue(new Error('Refresh failed'));

      await act(async () => {
        screen.getByRole('button', { name: 'Refresh User' }).click();
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error refreshing user:', expect.any(Error));
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside of AuthProvider', () => {
      const TestComponentWithoutProvider = () => {
        useAuth();
        return <div>Test</div>;
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => render(<TestComponentWithoutProvider />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('authentication state management', () => {
    it('should properly compute isAuthenticated based on user and service state', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(true);
      mockAuthServiceInstance.getCurrentUser.mockResolvedValue(mockUser);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Logout should clear authentication
      await act(async () => {
        screen.getByRole('button', { name: 'Logout' }).click();
      });

      // Should show as not authenticated after logout
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('should handle loading states properly during authentication operations', async () => {
      mockAuthServiceInstance.isAuthenticated.mockReturnValue(false);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      // Mock a delayed login
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockAuthServiceInstance.login.mockReturnValue(loginPromise);

      await act(async () => {
        screen.getByRole('button', { name: 'Login' }).click();
      });

      // Should show loading during login
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');

      // Resolve the login
      await act(async () => {
        resolveLogin!(mockAuthResponse);
        await loginPromise;
      });

      // Should not be loading after login completes
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });
  });
});
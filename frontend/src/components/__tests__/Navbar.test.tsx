import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import React from 'react';
import Navbar from '../Navbar';

const mockPush = jest.fn();
const mockLogout = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => {
    return <a href={href} onClick={onClick}>{children}</a>;
  };
});

// Mock Next.js Image
jest.mock('next/image', () => {
  return ({ src, alt, width, height, className }: any) => {
    return <img src={src} alt={alt} width={width} height={height} className={className} />;
  };
});

// Mock the AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isLoading: false,
    logout: mockLogout,
  })),
}));

// Mock FormatUtils
jest.mock('@/utils/formatters', () => ({
  FormatUtils: {
    getAvatarUrl: jest.fn((avatar: string, name: string) => `https://avatar.vercel.sh/${name}`),
    formatUserName: jest.fn((firstName: string, lastName: string) => `${firstName} ${lastName}`),
  },
}));

describe('Navbar', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user' as const,
    avatar: null
  };

  const mockAdminUser = {
    ...mockUser,
    role: 'admin' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window size for dropdown positioning tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Basic rendering', () => {
    it('renders the navbar with logo and brand name', () => {
      render(<Navbar />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Recipe Hub')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /recipe hub/i })).toHaveAttribute('href', '/');
    });

    it('shows loading state during authentication check', () => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: null,
        isLoading: true,
        logout: mockLogout,
      });

      render(<Navbar />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Recipe Hub')).toBeInTheDocument();
      // Loading state shows animated placeholder
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated state', () => {
    beforeEach(() => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: mockLogout,
      });
    });

    it('shows login and register links when user is not authenticated', () => {
      render(<Navbar />);
      
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login');
      expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/auth/register');
    });

    it('shows basic navigation links', () => {
      render(<Navbar />);
      
      expect(screen.getByRole('link', { name: /browse recipes/i })).toHaveAttribute('href', '/recipes');
      expect(screen.getByRole('link', { name: /categories/i })).toHaveAttribute('href', '/categories');
      // Create Recipe should not be visible for unauthenticated users
      expect(screen.queryByText('Create Recipe')).not.toBeInTheDocument();
    });

    it('shows mobile menu for unauthenticated users', () => {
      render(<Navbar />);
      
      const mobileMenuButton = screen.getByRole('button');
      fireEvent.click(mobileMenuButton);
      
      // Mobile menu should show navigation links
      expect(screen.getAllByRole('link', { name: /browse recipes/i })).toHaveLength(2); // Desktop + mobile
      expect(screen.getAllByRole('link', { name: /categories/i })).toHaveLength(2); // Desktop + mobile
      expect(screen.getAllByRole('link', { name: /sign in/i })).toHaveLength(2); // Desktop + mobile
      expect(screen.getAllByRole('link', { name: /get started/i })).toHaveLength(2); // Desktop + mobile
    });
  });

  describe('Authenticated regular user', () => {
    beforeEach(() => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        logout: mockLogout,
      });
    });

    it('shows user menu with profile information', () => {
      render(<Navbar />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Profile' })).toHaveAttribute('src', 'https://avatar.vercel.sh/John Doe');
    });

    it('shows Create Recipe link when authenticated', () => {
      render(<Navbar />);
      
      expect(screen.getByRole('link', { name: /create recipe/i })).toHaveAttribute('href', '/recipes/create');
    });

    it('does not show admin dashboard link for regular users', () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(profileButton);
      
      expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
    });

    it('toggles user dropdown menu', () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      
      // Dropdown should be closed initially
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      
      // Open dropdown
      fireEvent.click(profileButton);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      
      // Close dropdown
      fireEvent.click(profileButton);
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('shows correct user information in dropdown', () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(profileButton);
      
      expect(screen.getAllByText('John Doe')).toHaveLength(2); // Button + dropdown
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('handles logout functionality', () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(profileButton);
      
      const logoutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('closes dropdown when clicking dropdown links', () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(profileButton);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      fireEvent.click(dashboardLink);
      
      // Dropdown should close (Dashboard link should not be visible)
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated admin user', () => {
    beforeEach(() => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: mockAdminUser,
        isLoading: false,
        logout: mockLogout,
      });
    });

    it('shows admin dashboard link for admin users', () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /admin dashboard/i })).toHaveAttribute('href', '/admin');
    });
  });

  describe('Mobile menu functionality', () => {
    beforeEach(() => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        logout: mockLogout,
      });
    });

    it('toggles mobile menu', () => {
      render(<Navbar />);
      
      // Find the mobile menu button by its SVG content (hamburger icon)
      const mobileMenuButton = screen.getByRole('button', { name: '' }); // Empty name for the hamburger button
      expect(screen.queryByText('Browse Recipes')).toBeInTheDocument(); // Desktop version
      
      // Open mobile menu
      fireEvent.click(mobileMenuButton);
      expect(screen.getAllByText('Browse Recipes')).toHaveLength(2); // Desktop + mobile
      
      // Close mobile menu
      fireEvent.click(mobileMenuButton);
      expect(screen.getAllByText('Browse Recipes')).toHaveLength(1); // Only desktop
    });

    it('shows authenticated user options in mobile menu', () => {
      render(<Navbar />);
      
      const mobileMenuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(mobileMenuButton);
      
      expect(screen.getAllByText('John Doe')).toHaveLength(2); // Button + mobile menu
      expect(screen.getAllByText('Dashboard')).toHaveLength(1); // Only in mobile menu
      expect(screen.getAllByText('Profile')).toHaveLength(1); // Only in mobile menu
    });

    it('shows admin options in mobile menu for admin users', () => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: mockAdminUser,
        isLoading: false,
        logout: mockLogout,
      });

      render(<Navbar />);
      
      const mobileMenuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(mobileMenuButton);
      
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('closes mobile menu when clicking navigation links', () => {
      render(<Navbar />);
      
      const mobileMenuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(mobileMenuButton);
      
      const mobileRecipesLink = screen.getAllByRole('link', { name: /browse recipes/i })[1]; // Mobile version
      fireEvent.click(mobileRecipesLink);
      
      // Mobile menu should close
      expect(screen.getAllByText('Browse Recipes')).toHaveLength(1); // Only desktop version
    });

    it('handles mobile logout', () => {
      render(<Navbar />);
      
      const mobileMenuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(mobileMenuButton);
      
      const mobileLogoutButton = screen.getAllByText('Sign Out')[0]; // Mobile version
      fireEvent.click(mobileLogoutButton);
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Dropdown positioning', () => {
    beforeEach(() => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        logout: mockLogout,
      });
    });

    it('renders dropdown with positioning classes', () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(profileButton);
      
      // Dropdown should be rendered and contain expected content
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Click outside behavior', () => {
    beforeEach(() => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        logout: mockLogout,
      });
    });

    it('closes dropdown when clicking outside', async () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      
      // Click outside the dropdown
      await act(async () => {
        fireEvent.mouseDown(document.body);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    it('dropdown contains user information and menu items', async () => {
      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(profileButton);
      
      const dropdown = document.querySelector('.absolute');
      expect(dropdown).toBeInTheDocument();
      
      // Verify dropdown content
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility attributes', () => {
      render(<Navbar />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav.tagName).toBe('NAV');
    });

    it('has proper focus management', () => {
      const { useAuth } = require('@/context/AuthContext');
      useAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        logout: mockLogout,
      });

      render(<Navbar />);
      
      const profileButton = screen.getByRole('button', { name: /john doe/i });
      expect(profileButton).toHaveAttribute('class', expect.stringContaining('focus:ring'));
      
      const mobileMenuButton = screen.getByRole('button', { name: '' });
      expect(mobileMenuButton).toHaveAttribute('class', expect.stringContaining('focus:ring'));
    });
  });
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import FavoriteButton from '../FavoriteButton';

// Mock the auth context
const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the favorites service
jest.mock('@/services/favorites.service', () => ({
  favoritesService: {
    toggleFavorite: jest.fn(),
    checkFavoriteStatus: jest.fn(),
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRecipeId = 'recipe-1';

describe('FavoriteButton', () => {
  beforeEach(() => {
    // Setup default useAuth mock
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      loading: false,
    });
    
    // Setup default service mocks
    const { favoritesService } = require('@/services/favorites.service');
    favoritesService.checkFavoriteStatus.mockClear();
    favoritesService.toggleFavorite.mockClear();
    favoritesService.checkFavoriteStatus.mockResolvedValue({ data: { isFavorite: false } });
    favoritesService.toggleFavorite.mockResolvedValue({ success: true });
  });

  it('renders favorite button when user is authenticated', async () => {
    render(<FavoriteButton recipeId={mockRecipeId} />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  it('shows unfavorited state initially', async () => {
    render(<FavoriteButton recipeId={mockRecipeId} />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Add to favorites');
    });
  });

  it('handles favorite toggle on click', async () => {
    const { favoritesService } = require('@/services/favorites.service');

    render(<FavoriteButton recipeId={mockRecipeId} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(favoritesService.toggleFavorite).toHaveBeenCalledWith('recipe-1');
    });
  });

  it('does not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(<FavoriteButton recipeId={mockRecipeId} />);
    
    // Should not render when user is not authenticated
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('shows loading state during favorite operation', async () => {
    const { favoritesService } = require('@/services/favorites.service');
    
    // Mock a delayed response
    favoritesService.toggleFavorite.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<FavoriteButton recipeId={mockRecipeId} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Button should be disabled during loading
    expect(button).toBeDisabled();

    // Wait for the operation to complete
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('shows favorited state when recipe is favorited', async () => {
    const { favoritesService } = require('@/services/favorites.service');
    favoritesService.checkFavoriteStatus.mockResolvedValue({ data: { isFavorite: true } });

    render(<FavoriteButton recipeId={mockRecipeId} />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Remove from favorites');
    });
  });

  it('renders with text when showText prop is true', async () => {
    render(<FavoriteButton recipeId={mockRecipeId} showText={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
    });
  });

  it('handles different sizes', async () => {
    render(<FavoriteButton recipeId={mockRecipeId} size="lg" />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
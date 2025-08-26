'use client';

import { useState, useEffect } from 'react';
import { Heart, HeartIcon } from 'lucide-react';
import { favoritesService } from '@/services/favorites.service';
import { useAuth } from '@/context/AuthContext';

interface FavoriteButtonProps {
  recipeId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function FavoriteButton({
  recipeId,
  size = 'md',
  showText = false,
  className = ''
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  useEffect(() => {
    if (!user || !recipeId) return;

    const checkFavoriteStatus = async () => {
      try {
        const response = await favoritesService.checkFavoriteStatus(recipeId);
        setIsFavorite(response.data.isFavorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [user, recipeId]);

  const handleToggleFavorite = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      await favoritesService.toggleFavorite(recipeId);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show favorite button for non-authenticated users
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 rounded-lg border transition-all
        ${isFavorite 
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-red-500'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
        ${buttonSizeClasses[size]}
        ${className}
      `}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? (
        <HeartIcon className={`${sizeClasses[size]} fill-current`} />
      ) : (
        <Heart className={sizeClasses[size]} />
      )}
      {showText && (
        <span className="text-sm font-medium">
          {isFavorite ? 'Favorited' : 'Add to Favorites'}
        </span>
      )}
    </button>
  );
}
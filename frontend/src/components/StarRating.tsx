'use client';

import React, { useState, useCallback } from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showValue?: boolean;
  className?: string;
  onRatingChange?: (rating: number) => void;
  disabled?: boolean;
  precision?: number; // 0.5 for half stars, 1 for whole stars
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  maxRating = 5,
  size = 'md',
  interactive = false,
  showValue = false,
  className = '',
  onRatingChange,
  disabled = false,
  precision = 1,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isHovering, setIsHovering] = useState(false);

  // Size configurations
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const handleMouseEnter = useCallback((starValue: number) => {
    if (!interactive || disabled) return;
    setHoverRating(starValue);
    setIsHovering(true);
  }, [interactive, disabled]);

  const handleMouseLeave = useCallback(() => {
    if (!interactive || disabled) return;
    setHoverRating(0);
    setIsHovering(false);
  }, [interactive, disabled]);

  const handleClick = useCallback((starValue: number) => {
    if (!interactive || disabled) return;
    onRatingChange?.(starValue);
  }, [interactive, disabled, onRatingChange]);

  const getStarFillPercentage = (starIndex: number): number => {
    const currentRating = isHovering && interactive ? hoverRating : rating;
    const starValue = starIndex + 1;
    
    if (currentRating >= starValue) {
      return 100;
    } else if (currentRating > starIndex) {
      return (currentRating - starIndex) * 100;
    }
    return 0;
  };

  const generateStarValues = (): number[] => {
    const values: number[] = [];
    for (let i = 0; i < maxRating; i++) {
      if (precision === 0.5) {
        values.push(i + 0.5, i + 1);
      } else {
        values.push(i + 1);
      }
    }
    return values.slice(0, maxRating * (1 / precision));
  };

  const starValues = precision === 1 ? 
    Array.from({ length: maxRating }, (_, i) => i + 1) : 
    generateStarValues();

  const displayRating = isHovering && interactive ? hoverRating : (typeof rating === 'number' ? rating : parseFloat(rating) || 0);

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, index) => {
          const fillPercentage = getStarFillPercentage(index);
          const starValue = index + 1;
          
          return (
            <div
              key={index}
              className={`relative ${interactive && !disabled ? 'cursor-pointer' : ''}`}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onClick={() => handleClick(starValue)}
            >
              {/* Background star (empty) */}
              <Star
                className={`${sizeClasses[size]} text-gray-300 transition-colors duration-150`}
                fill="currentColor"
              />
              
              {/* Foreground star (filled) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star
                  className={`${sizeClasses[size]} transition-colors duration-150 ${
                    interactive && !disabled
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-yellow-400'
                  }`}
                  fill="currentColor"
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {showValue && (
        <span className={`${textSizeClasses[size]} font-medium text-gray-700 ml-2`}>
          {displayRating.toFixed(precision === 0.5 ? 1 : 0)}
          {maxRating !== 5 && <span className="text-gray-500">/{maxRating}</span>}
        </span>
      )}

      {interactive && !disabled && (
        <span className={`${textSizeClasses[size]} text-gray-500 ml-1`}>
          {isHovering ? `Rate ${hoverRating} star${hoverRating !== 1 ? 's' : ''}` : 'Click to rate'}
        </span>
      )}
    </div>
  );
};

// Preset components for common use cases
export const ReadOnlyStarRating: React.FC<Omit<StarRatingProps, 'interactive'>> = (props) => (
  <StarRating {...props} interactive={false} />
);

export const InteractiveStarRating: React.FC<Omit<StarRatingProps, 'interactive'>> = (props) => (
  <StarRating {...props} interactive={true} />
);

// Rating display with count
interface RatingDisplayProps {
  rating: number;
  count: number;
  size?: StarRatingProps['size'];
  showCount?: boolean;
  className?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  count,
  size = 'md',
  showCount = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ReadOnlyStarRating rating={rating} size={size} showValue />
      {showCount && count > 0 && (
        <span className={`${
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        } text-gray-600`}>
          ({count.toLocaleString()} review{count !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};

export default StarRating;
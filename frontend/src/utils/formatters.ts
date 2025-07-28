import { DifficultyLevel } from '@/types/api.types';

export class FormatUtils {
  // Time formatting
  public static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  }

  public static formatDetailedDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} minutes`;
  }

  // Difficulty formatting
  public static formatDifficulty(difficulty: DifficultyLevel): string {
    const difficultyMap: Record<DifficultyLevel, string> = {
      [DifficultyLevel.EASY]: 'Easy',
      [DifficultyLevel.MEDIUM]: 'Medium',
      [DifficultyLevel.HARD]: 'Hard'
    };
    
    return difficultyMap[difficulty] || difficulty;
  }

  public static getDifficultyColor(difficulty: DifficultyLevel): string {
    const colorMap: Record<DifficultyLevel, string> = {
      [DifficultyLevel.EASY]: 'text-green-600 bg-green-50',
      [DifficultyLevel.MEDIUM]: 'text-yellow-600 bg-yellow-50',
      [DifficultyLevel.HARD]: 'text-red-600 bg-red-50'
    };
    
    return colorMap[difficulty] || 'text-gray-600 bg-gray-50';
  }

  // Rating formatting
  public static formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  public static generateStarRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  // Number formatting
  public static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  public static formatServings(servings: number): string {
    return `${servings} ${servings === 1 ? 'serving' : 'servings'}`;
  }

  // Date formatting
  public static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  public static formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  public static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  }

  // Text formatting
  public static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  public static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  public static formatUserName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`;
  }

  // Ingredient formatting
  public static formatIngredientQuantity(quantity: number, unit: string): string {
    // Handle fractional quantities
    if (quantity < 1 && quantity > 0) {
      const fractions: Record<string, string> = {
        '0.25': '¼',
        '0.33': '⅓',
        '0.5': '½',
        '0.67': '⅔',
        '0.75': '¾'
      };
      
      const quantityStr = quantity.toString();
      if (fractions[quantityStr]) {
        return `${fractions[quantityStr]} ${unit}`;
      }
    }
    
    // Handle mixed numbers
    if (quantity >= 1) {
      const wholeNumber = Math.floor(quantity);
      const fractionalPart = quantity - wholeNumber;
      
      if (fractionalPart > 0) {
        const fractionStr = fractionalPart.toString();
        const fractions: Record<string, string> = {
          '0.25': '¼',
          '0.33': '⅓',
          '0.5': '½',
          '0.67': '⅔',
          '0.75': '¾'
        };
        
        if (fractions[fractionStr]) {
          return `${wholeNumber} ${fractions[fractionStr]} ${unit}`;
        }
      }
    }
    
    // Default formatting
    return `${quantity} ${unit}`;
  }

  // URL formatting
  public static getImageUrl(url?: string, fallback?: string): string {
    return url || fallback || '/images/placeholder-recipe.jpg';
  }

  public static getAvatarUrl(url?: string, name?: string): string {
    if (url) return url;
    
    // Generate a simple avatar URL based on name initials
    if (name) {
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      return `https://ui-avatars.com/api/?name=${initials}&background=6366f1&color=fff&size=128`;
    }
    
    return '/images/default-avatar.jpg';
  }
} 
import { FormatUtils } from '../formatters';
import { DifficultyLevel } from '@/types/api.types';

describe('FormatUtils', () => {
  describe('formatDuration', () => {
    it('should format minutes less than 60', () => {
      expect(FormatUtils.formatDuration(30)).toBe('30min');
      expect(FormatUtils.formatDuration(1)).toBe('1min');
      expect(FormatUtils.formatDuration(59)).toBe('59min');
    });

    it('should format exactly 1 hour', () => {
      expect(FormatUtils.formatDuration(60)).toBe('1h');
    });

    it('should format multiple hours without minutes', () => {
      expect(FormatUtils.formatDuration(120)).toBe('2h');
      expect(FormatUtils.formatDuration(180)).toBe('3h');
    });

    it('should format hours with minutes', () => {
      expect(FormatUtils.formatDuration(90)).toBe('1h 30min');
      expect(FormatUtils.formatDuration(125)).toBe('2h 5min');
      expect(FormatUtils.formatDuration(195)).toBe('3h 15min');
    });
  });

  describe('formatDetailedDuration', () => {
    it('should format minutes less than 60', () => {
      expect(FormatUtils.formatDetailedDuration(30)).toBe('30 minutes');
      expect(FormatUtils.formatDetailedDuration(1)).toBe('1 minutes');
      expect(FormatUtils.formatDetailedDuration(45)).toBe('45 minutes');
    });

    it('should format exactly 1 hour', () => {
      expect(FormatUtils.formatDetailedDuration(60)).toBe('1 hour');
    });

    it('should format multiple hours without minutes', () => {
      expect(FormatUtils.formatDetailedDuration(120)).toBe('2 hours');
      expect(FormatUtils.formatDetailedDuration(180)).toBe('3 hours');
    });

    it('should format hours with minutes', () => {
      expect(FormatUtils.formatDetailedDuration(90)).toBe('1 hour 30 minutes');
      expect(FormatUtils.formatDetailedDuration(125)).toBe('2 hours 5 minutes');
      expect(FormatUtils.formatDetailedDuration(195)).toBe('3 hours 15 minutes');
    });
  });

  describe('formatDifficulty', () => {
    it('should format difficulty levels correctly', () => {
      expect(FormatUtils.formatDifficulty(DifficultyLevel.EASY)).toBe('Easy');
      expect(FormatUtils.formatDifficulty(DifficultyLevel.MEDIUM)).toBe('Medium');
      expect(FormatUtils.formatDifficulty(DifficultyLevel.HARD)).toBe('Hard');
      expect(FormatUtils.formatDifficulty(DifficultyLevel.EXPERT)).toBe('Expert');
    });

    it('should return original value for unknown difficulty', () => {
      const unknownDifficulty = 'UNKNOWN' as DifficultyLevel;
      expect(FormatUtils.formatDifficulty(unknownDifficulty)).toBe('UNKNOWN');
    });
  });

  describe('getDifficultyColor', () => {
    it('should return correct colors for difficulty levels', () => {
      expect(FormatUtils.getDifficultyColor(DifficultyLevel.EASY)).toBe('text-green-600 bg-green-50');
      expect(FormatUtils.getDifficultyColor(DifficultyLevel.MEDIUM)).toBe('text-yellow-600 bg-yellow-50');
      expect(FormatUtils.getDifficultyColor(DifficultyLevel.HARD)).toBe('text-red-600 bg-red-50');
      expect(FormatUtils.getDifficultyColor(DifficultyLevel.EXPERT)).toBe('text-purple-600 bg-purple-50');
    });

    it('should return default color for unknown difficulty', () => {
      const unknownDifficulty = 'UNKNOWN' as DifficultyLevel;
      expect(FormatUtils.getDifficultyColor(unknownDifficulty)).toBe('text-gray-600 bg-gray-50');
    });
  });

  describe('formatRating', () => {
    it('should format rating to one decimal place', () => {
      expect(FormatUtils.formatRating(4.5)).toBe('4.5');
      expect(FormatUtils.formatRating(3.0)).toBe('3.0');
      expect(FormatUtils.formatRating(4.87)).toBe('4.9');
      expect(FormatUtils.formatRating(2.23)).toBe('2.2');
    });
  });

  describe('generateStarRating', () => {
    it('should generate star rating for whole numbers', () => {
      expect(FormatUtils.generateStarRating(5)).toBe('★★★★★');
      expect(FormatUtils.generateStarRating(4)).toBe('★★★★☆');
      expect(FormatUtils.generateStarRating(3)).toBe('★★★☆☆');
      expect(FormatUtils.generateStarRating(1)).toBe('★☆☆☆☆');
      expect(FormatUtils.generateStarRating(0)).toBe('☆☆☆☆☆');
    });

    it('should generate star rating with half stars', () => {
      expect(FormatUtils.generateStarRating(4.5)).toBe('★★★★☆');
      expect(FormatUtils.generateStarRating(3.7)).toBe('★★★☆☆');
      expect(FormatUtils.generateStarRating(2.5)).toBe('★★☆☆☆');
      expect(FormatUtils.generateStarRating(1.8)).toBe('★☆☆☆☆');
    });

    it('should handle edge cases', () => {
      expect(FormatUtils.generateStarRating(0.4)).toBe('☆☆☆☆☆');
      expect(FormatUtils.generateStarRating(0.5)).toBe('☆☆☆☆☆');
      expect(FormatUtils.generateStarRating(4.9)).toBe('★★★★☆');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers less than 1000', () => {
      expect(FormatUtils.formatNumber(999)).toBe('999');
      expect(FormatUtils.formatNumber(100)).toBe('100');
      expect(FormatUtils.formatNumber(5)).toBe('5');
      expect(FormatUtils.formatNumber(0)).toBe('0');
    });

    it('should format thousands', () => {
      expect(FormatUtils.formatNumber(1000)).toBe('1.0K');
      expect(FormatUtils.formatNumber(1500)).toBe('1.5K');
      expect(FormatUtils.formatNumber(10000)).toBe('10.0K');
      expect(FormatUtils.formatNumber(999999)).toBe('1000.0K');
    });

    it('should format millions', () => {
      expect(FormatUtils.formatNumber(1000000)).toBe('1.0M');
      expect(FormatUtils.formatNumber(1500000)).toBe('1.5M');
      expect(FormatUtils.formatNumber(10000000)).toBe('10.0M');
    });
  });

  describe('formatServings', () => {
    it('should format single serving', () => {
      expect(FormatUtils.formatServings(1)).toBe('1 serving');
    });

    it('should format multiple servings', () => {
      expect(FormatUtils.formatServings(4)).toBe('4 servings');
      expect(FormatUtils.formatServings(6)).toBe('6 servings');
      expect(FormatUtils.formatServings(0)).toBe('0 servings');
    });
  });

  describe('formatDate', () => {
    it('should format date strings correctly', () => {
      const dateString = '2024-01-15T10:30:00.000Z';
      const result = FormatUtils.formatDate(dateString);
      expect(result).toMatch(/January 15, 2024/);
    });

    it('should handle different date formats', () => {
      const dateString = '2023-12-25T00:00:00.000Z';
      const result = FormatUtils.formatDate(dateString);
      expect(result).toMatch(/December 25, 2023/);
    });
  });

  describe('formatDateShort', () => {
    it('should format date strings in short format', () => {
      const dateString = '2024-01-15T10:30:00.000Z';
      const result = FormatUtils.formatDateShort(dateString);
      expect(result).toMatch(/Jan 15, 2024/);
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date();
    
    it('should return "Today" for today', () => {
      const today = now.toISOString();
      expect(FormatUtils.formatRelativeTime(today)).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      expect(FormatUtils.formatRelativeTime(yesterday.toISOString())).toBe('Yesterday');
    });

    it('should return days ago for recent dates', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(FormatUtils.formatRelativeTime(threeDaysAgo.toISOString())).toBe('3 days ago');
    });

    it('should return weeks ago', () => {
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      expect(FormatUtils.formatRelativeTime(twoWeeksAgo.toISOString())).toBe('2 weeks ago');
      
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(FormatUtils.formatRelativeTime(oneWeekAgo.toISOString())).toBe('1 week ago');
    });

    it('should return months ago', () => {
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      expect(FormatUtils.formatRelativeTime(twoMonthsAgo.toISOString())).toBe('2 months ago');
      
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      expect(FormatUtils.formatRelativeTime(oneMonthAgo.toISOString())).toBe('1 month ago');
    });

    it('should return years ago', () => {
      const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      expect(FormatUtils.formatRelativeTime(twoYearsAgo.toISOString())).toBe('2 years ago');
      
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      expect(FormatUtils.formatRelativeTime(oneYearAgo.toISOString())).toBe('1 year ago');
    });
  });

  describe('truncateText', () => {
    it('should return text as-is if within limit', () => {
      const text = 'Short text';
      expect(FormatUtils.truncateText(text, 20)).toBe('Short text');
    });

    it('should truncate text with ellipsis when exceeding limit', () => {
      const text = 'This is a very long text that exceeds the maximum length';
      expect(FormatUtils.truncateText(text, 20)).toBe('This is a very long ...');
    });

    it('should handle edge cases', () => {
      expect(FormatUtils.truncateText('', 10)).toBe('');
      expect(FormatUtils.truncateText('Exact', 5)).toBe('Exact');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter', () => {
      expect(FormatUtils.capitalizeFirstLetter('hello')).toBe('Hello');
      expect(FormatUtils.capitalizeFirstLetter('world')).toBe('World');
    });

    it('should handle single character strings', () => {
      expect(FormatUtils.capitalizeFirstLetter('a')).toBe('A');
    });

    it('should handle empty strings', () => {
      expect(FormatUtils.capitalizeFirstLetter('')).toBe('');
    });

    it('should preserve other characters', () => {
      expect(FormatUtils.capitalizeFirstLetter('hELLO wORLD')).toBe('HELLO wORLD');
    });
  });

  describe('formatUserName', () => {
    it('should format full name correctly', () => {
      expect(FormatUtils.formatUserName('John', 'Doe')).toBe('John Doe');
      expect(FormatUtils.formatUserName('Alice', 'Smith')).toBe('Alice Smith');
    });

    it('should handle empty strings', () => {
      expect(FormatUtils.formatUserName('', '')).toBe(' ');
      expect(FormatUtils.formatUserName('John', '')).toBe('John ');
      expect(FormatUtils.formatUserName('', 'Doe')).toBe(' Doe');
    });
  });

  describe('formatIngredientQuantity', () => {
    it('should format fractional quantities', () => {
      expect(FormatUtils.formatIngredientQuantity(0.25, 'cup')).toBe('¼ cup');
      expect(FormatUtils.formatIngredientQuantity(0.33, 'tsp')).toBe('⅓ tsp');
      expect(FormatUtils.formatIngredientQuantity(0.5, 'tbsp')).toBe('½ tbsp');
      expect(FormatUtils.formatIngredientQuantity(0.67, 'cup')).toBe('⅔ cup');
      expect(FormatUtils.formatIngredientQuantity(0.75, 'oz')).toBe('¾ oz');
    });

    it('should format mixed numbers', () => {
      expect(FormatUtils.formatIngredientQuantity(1.25, 'cup')).toBe('1 ¼ cup');
      expect(FormatUtils.formatIngredientQuantity(2.5, 'lbs')).toBe('2 ½ lbs');
      expect(FormatUtils.formatIngredientQuantity(3.75, 'cups')).toBe('3 ¾ cups');
    });

    it('should format whole numbers', () => {
      expect(FormatUtils.formatIngredientQuantity(1, 'cup')).toBe('1 cup');
      expect(FormatUtils.formatIngredientQuantity(5, 'pieces')).toBe('5 pieces');
    });

    it('should format unknown fractions as decimals', () => {
      expect(FormatUtils.formatIngredientQuantity(0.3, 'cup')).toBe('0.3 cup');
      expect(FormatUtils.formatIngredientQuantity(1.7, 'tsp')).toBe('1.7 tsp');
    });

    it('should handle zero quantity', () => {
      expect(FormatUtils.formatIngredientQuantity(0, 'cup')).toBe('0 cup');
    });
  });

  describe('getImageUrl', () => {
    it('should return provided URL when available', () => {
      const url = '/images/recipe-1.jpg';
      expect(FormatUtils.getImageUrl(url)).toBe(url);
    });

    it('should return fallback when URL is not provided', () => {
      const fallback = '/images/custom-placeholder.jpg';
      expect(FormatUtils.getImageUrl(undefined, fallback)).toBe(fallback);
    });

    it('should return default placeholder when neither URL nor fallback provided', () => {
      expect(FormatUtils.getImageUrl()).toBe('/images/placeholder-recipe.jpg');
    });

    it('should prioritize URL over fallback', () => {
      const url = '/images/recipe-1.jpg';
      const fallback = '/images/custom-placeholder.jpg';
      expect(FormatUtils.getImageUrl(url, fallback)).toBe(url);
    });
  });

  describe('getAvatarUrl', () => {
    it('should return provided URL when available', () => {
      const url = '/avatars/user-1.jpg';
      expect(FormatUtils.getAvatarUrl(url)).toBe(url);
    });

    it('should generate UI avatars URL when name is provided', () => {
      const result = FormatUtils.getAvatarUrl(undefined, 'John Doe');
      expect(result).toContain('ui-avatars.com/api');
      expect(result).toContain('name=JD');
      expect(result).toContain('background=');
      expect(result).toContain('color=ffffff');
      expect(result).toContain('size=256');
    });

    it('should generate consistent colors for same name', () => {
      const result1 = FormatUtils.getAvatarUrl(undefined, 'John Doe');
      const result2 = FormatUtils.getAvatarUrl(undefined, 'John Doe');
      expect(result1).toBe(result2);
    });

    it('should generate different colors for different names', () => {
      const result1 = FormatUtils.getAvatarUrl(undefined, 'John Doe');
      const result2 = FormatUtils.getAvatarUrl(undefined, 'Jane Smith');
      
      // Extract background colors
      const color1 = result1.match(/background=([^&]+)/)?.[1];
      const color2 = result2.match(/background=([^&]+)/)?.[1];
      
      expect(color1).not.toBe(color2);
    });

    it('should handle single name', () => {
      const result = FormatUtils.getAvatarUrl(undefined, 'John');
      expect(result).toContain('name=J');
    });

    it('should handle multiple names and take first two initials', () => {
      const result = FormatUtils.getAvatarUrl(undefined, 'John Michael Smith Doe');
      expect(result).toContain('name=JM');
    });

    it('should return default avatar when neither URL nor name provided', () => {
      expect(FormatUtils.getAvatarUrl()).toBe('/images/default-avatar.jpg');
    });

    it('should prioritize URL over name', () => {
      const url = '/avatars/user-1.jpg';
      const result = FormatUtils.getAvatarUrl(url, 'John Doe');
      expect(result).toBe(url);
    });
  });
});
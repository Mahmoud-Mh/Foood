import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

import { ImageOptimizerService, ImageOptimizationOptions, OptimizedImageResult } from './image-optimizer.service';

jest.mock('sharp');
jest.mock('fs/promises');

describe('ImageOptimizerService', () => {
  let service: ImageOptimizerService;
  
  const createMockSharpInstance = () => ({
    metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080, format: 'jpeg' }),
    resize: jest.fn(),
    jpeg: jest.fn(),
    png: jest.fn(),
    webp: jest.fn(),
    toFile: jest.fn().mockResolvedValue({ format: 'jpeg', width: 300, height: 300, size: 1024 }),
  });

  let mockSharpInstance: ReturnType<typeof createMockSharpInstance>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create fresh mock instance
    mockSharpInstance = createMockSharpInstance();

    // Setup chainable methods
    mockSharpInstance.resize.mockReturnValue(mockSharpInstance as any);
    mockSharpInstance.jpeg.mockReturnValue(mockSharpInstance as any);
    mockSharpInstance.png.mockReturnValue(mockSharpInstance as any);
    mockSharpInstance.webp.mockReturnValue(mockSharpInstance as any);

    // Mock sharp constructor to always return our mock instance
    (sharp as jest.MockedFunction<typeof sharp>).mockImplementation(() => mockSharpInstance as any);

    // Default fs mocking (can be overridden in specific tests)
    (fs.stat as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('/temp/') || path.includes('/input/')) {
        // Original file size
        return Promise.resolve({ size: 3072 });
      } else {
        // Optimized file size (smaller)
        return Promise.resolve({ size: 1024 });
      }
    });
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageOptimizerService],
    }).compile();

    module.useLogger(false); // Suppress logs during testing

    service = module.get<ImageOptimizerService>(ImageOptimizerService);
  });

  describe('optimizeRecipeImage', () => {
    beforeEach(() => {
      // Mock fs.stat to return different sizes for different files
      (fs.stat as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('/temp/')) {
          // Original file size
          return Promise.resolve({ size: 2048 });
        } else {
          // Optimized file size (smaller)
          return Promise.resolve({ size: 1024 });
        }
      });
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    });

    it('should optimize recipe image with thumbnail', async () => {
      const result = await service.optimizeRecipeImage(
        '/temp/recipe.jpg',
        '/uploads/recipes',
        'dish'
      );

      expect(result).toEqual({
        originalPath: '/temp/recipe.jpg',
        optimizedPath: expect.stringContaining('dish.jpg'),
        thumbnailPath: expect.stringContaining('dish_thumb.jpg'),
        originalSize: 2048,
        optimizedSize: 1024,
        compressionRatio: 50,
        dimensions: { width: 1920, height: 1080 }, // From our mock metadata
      });

      expect(fs.mkdir).toHaveBeenCalledWith('/uploads/recipes', { recursive: true });
      expect(mockSharpInstance.resize).toHaveBeenCalledWith({
        fit: 'inside',
        withoutEnlargement: true,
        width: 1200,
        height: 800,
      });
      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({
        quality: 85,
        progressive: true,
      });
    });

    it('should handle optimization errors gracefully', async () => {
      (fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(service.optimizeRecipeImage(
        '/temp/nonexistent.jpg',
        '/uploads/recipes',
        'missing'
      )).rejects.toThrow('Image optimization failed: File not found');
    });
  });

  describe('optimizeAvatarImage', () => {
    beforeEach(() => {
      // Mock fs.stat to return different sizes for different files
      (fs.stat as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('/temp/')) {
          // Original file size
          return Promise.resolve({ size: 1536 });
        } else {
          // Optimized file size (smaller)
          return Promise.resolve({ size: 1024 });
        }
      });
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    });

    it('should optimize avatar image without thumbnail', async () => {
      const result = await service.optimizeAvatarImage(
        '/temp/avatar.png',
        '/uploads/avatars',
        'profile'
      );

      expect(result).toEqual({
        originalPath: '/temp/avatar.png',
        optimizedPath: expect.stringContaining('profile.jpg'),
        thumbnailPath: undefined,
        originalSize: 1536,
        optimizedSize: 1024,
        compressionRatio: expect.any(Number),
        dimensions: { width: 1920, height: 1080 }, // From our mock metadata
      });

      expect(mockSharpInstance.resize).toHaveBeenCalledWith({
        fit: 'cover', // Avatar uses cover (square crop)
        withoutEnlargement: true,
        width: 300,
        height: 300,
      });
      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({
        quality: 90,
        progressive: true,
      });
    });

    it('should calculate compression ratio correctly', async () => {
      const result = await service.optimizeAvatarImage(
        '/temp/large-avatar.jpg',
        '/uploads/avatars',
        'user'
      );

      const expectedRatio = ((1536 - 1024) / 1536) * 100;
      expect(result.compressionRatio).toBeCloseTo(expectedRatio, 1);
    });
  });

  describe('optimizeImage', () => {
    beforeEach(() => {
      (fs.stat as jest.Mock)
        .mockResolvedValueOnce({ size: 3072 }) // Original file
        .mockResolvedValueOnce({ size: 1024 }); // Optimized file
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    });

    it('should optimize image with custom options', async () => {
      const customOptions: ImageOptimizationOptions = {
        width: 800,
        height: 600,
        quality: 75,
        format: 'webp',
        maintainAspectRatio: true,
      };

      const result = await service.optimizeImage(
        '/input/test.jpg',
        '/output',
        'custom',
        customOptions,
        false
      );

      expect(result.optimizedPath).toContain('custom.webp');
      expect(result.thumbnailPath).toBeUndefined();
      expect(mockSharpInstance.resize).toHaveBeenCalledWith({
        fit: 'inside',
        withoutEnlargement: true,
        width: 800,
        height: 600,
      });
      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 75 });
    });

    it('should handle PNG format optimization', async () => {
      const pngOptions: ImageOptimizationOptions = {
        format: 'png',
        quality: 90,
      };

      await service.optimizeImage(
        '/input/test.png',
        '/output',
        'png-image',
        pngOptions,
        false
      );

      expect(mockSharpInstance.png).toHaveBeenCalledWith({
        compressionLevel: 9,
        progressive: true,
      });
    });

    it('should handle JPEG format optimization', async () => {
      const jpegOptions: ImageOptimizationOptions = {
        format: 'jpeg',
        quality: 80,
      };

      await service.optimizeImage(
        '/input/test.jpg',
        '/output',
        'jpeg-image',
        jpegOptions,
        false
      );

      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({
        quality: 80,
        progressive: true,
      });
    });

    it('should generate thumbnail when requested', async () => {
      const thumbnailMock = {
        resize: jest.fn().mockReturnValue({
          jpeg: jest.fn().mockReturnValue({
            toFile: jest.fn().mockResolvedValue({ size: 256 }),
          }),
        }),
      };

      (sharp as jest.MockedFunction<typeof sharp>).mockImplementation((input) => {
        if (typeof input === 'string' && input.includes('/input/')) {
          return mockSharpInstance as any;
        }
        return thumbnailMock as any;
      });

      const result = await service.optimizeImage(
        '/input/with-thumb.jpg',
        '/output',
        'thumbnail-test',
        { format: 'jpeg' },
        true
      );

      expect(result.thumbnailPath).toContain('thumbnail-test_thumb.jpg');
      expect(thumbnailMock.resize).toHaveBeenCalledWith(400, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    it('should handle resize options correctly without dimensions', async () => {
      const optionsWithoutDimensions: ImageOptimizationOptions = {
        quality: 85,
        format: 'jpeg',
      };

      await service.optimizeImage(
        '/input/no-resize.jpg',
        '/output',
        'no-resize',
        optionsWithoutDimensions,
        false
      );

      expect(mockSharpInstance.resize).not.toHaveBeenCalled();
      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({
        quality: 85,
        progressive: true,
      });
    });

    it('should handle only width specified', async () => {
      const widthOnlyOptions: ImageOptimizationOptions = {
        width: 500,
        maintainAspectRatio: false,
      };

      await service.optimizeImage(
        '/input/width-only.jpg',
        '/output',
        'width-only',
        widthOnlyOptions,
        false
      );

      expect(mockSharpInstance.resize).toHaveBeenCalledWith({
        fit: 'cover',
        withoutEnlargement: true,
        width: 500,
      });
    });

    it('should handle only height specified', async () => {
      const heightOnlyOptions: ImageOptimizationOptions = {
        height: 400,
        maintainAspectRatio: true,
      };

      await service.optimizeImage(
        '/input/height-only.jpg',
        '/output',
        'height-only',
        heightOnlyOptions,
        false
      );

      expect(mockSharpInstance.resize).toHaveBeenCalledWith({
        fit: 'inside',
        withoutEnlargement: true,
        height: 400,
      });
    });

    it('should use default quality when not specified', async () => {
      const defaultQualityOptions: ImageOptimizationOptions = {
        format: 'jpeg',
      };

      await service.optimizeImage(
        '/input/default-quality.jpg',
        '/output',
        'default-quality',
        defaultQualityOptions,
        false
      );

      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({
        quality: 85, // Default quality
        progressive: true,
      });
    });

    it('should handle sharp metadata errors gracefully', async () => {
      mockSharpInstance.metadata.mockRejectedValue(new Error('Metadata error'));

      await expect(service.optimizeImage(
        '/input/bad-metadata.jpg',
        '/output',
        'bad-metadata',
        { format: 'jpeg' },
        false
      )).rejects.toThrow('Image optimization failed: Metadata error');
    });

    it('should handle toFile errors gracefully', async () => {
      mockSharpInstance.toFile.mockRejectedValue(new Error('Write error'));

      await expect(service.optimizeImage(
        '/input/write-error.jpg',
        '/output',
        'write-error',
        { format: 'jpeg' },
        false
      )).rejects.toThrow('Image optimization failed: Write error');
    });

    it('should handle thumbnail generation errors', async () => {
      const badThumbnailMock = {
        resize: jest.fn().mockReturnValue({
          jpeg: jest.fn().mockReturnValue({
            toFile: jest.fn().mockRejectedValue(new Error('Thumbnail error')),
          }),
        }),
      };

      (sharp as jest.MockedFunction<typeof sharp>).mockImplementation((input) => {
        if (typeof input === 'string' && input.includes('/input/')) {
          return mockSharpInstance as any;
        }
        return badThumbnailMock as any;
      });

      await expect(service.optimizeImage(
        '/input/bad-thumb.jpg',
        '/output',
        'bad-thumb',
        { format: 'jpeg' },
        true
      )).rejects.toThrow('Image optimization failed: Thumbnail error');
    });

    it('should handle metadata retrieval for final dimensions', async () => {
      const finalMetadata = { width: 800, height: 600 };
      (sharp as jest.MockedFunction<typeof sharp>).mockImplementation((input) => {
        if (typeof input === 'string' && input.includes('/output/')) {
          return { metadata: jest.fn().mockResolvedValue(finalMetadata) } as any;
        }
        return mockSharpInstance as any;
      });

      const result = await service.optimizeImage(
        '/input/dimensions.jpg',
        '/output',
        'dimensions',
        { format: 'jpeg' },
        false
      );

      expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
    });

    it('should handle missing final dimensions gracefully', async () => {
      (sharp as jest.MockedFunction<typeof sharp>).mockImplementation((input) => {
        if (typeof input === 'string' && input.includes('/output/')) {
          return { metadata: jest.fn().mockResolvedValue({}) } as any;
        }
        return mockSharpInstance as any;
      });

      const result = await service.optimizeImage(
        '/input/no-dimensions.jpg',
        '/output',
        'no-dimensions',
        { format: 'jpeg' },
        false
      );

      expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('cleanupTempFile', () => {
    it('should successfully delete temporary file', async () => {
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await service.cleanupTempFile('/temp/temp_file.jpg');

      expect(fs.unlink).toHaveBeenCalledWith('/temp/temp_file.jpg');
    });

    it('should handle deletion errors gracefully', async () => {
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

      await expect(service.cleanupTempFile('/temp/protected.jpg')).resolves.not.toThrow();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to cleanup temporary file /temp/protected.jpg:',
        expect.any(Error)
      );
    });
  });

  describe('isValidImageFormat', () => {
    it('should return true for valid image formats', () => {
      const validFormats = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'IMAGE/JPEG', // Case insensitive
        'Image/PNG',
      ];

      validFormats.forEach(format => {
        expect(service.isValidImageFormat(format)).toBe(true);
      });
    });

    it('should return false for invalid image formats', () => {
      const invalidFormats = [
        'application/pdf',
        'text/plain',
        'video/mp4',
        'audio/mp3',
        'image/bmp',
        'image/svg+xml',
      ];

      invalidFormats.forEach(format => {
        expect(service.isValidImageFormat(format)).toBe(false);
      });
    });
  });

  describe('getOptimizedFilename', () => {
    it('should return optimized filename with JPEG extension by default', () => {
      const result = service.getOptimizedFilename('profile.png');
      expect(result).toBe('profile.jpg');
    });

    it('should handle different output formats', () => {
      expect(service.getOptimizedFilename('image.jpg', 'webp')).toBe('image.webp');
      expect(service.getOptimizedFilename('photo.gif', 'png')).toBe('photo.png');
      expect(service.getOptimizedFilename('pic.bmp', 'jpeg')).toBe('pic.jpg');
    });

    it('should handle filenames without extensions', () => {
      const result = service.getOptimizedFilename('image', 'webp');
      expect(result).toBe('image.webp');
    });

    it('should handle complex filenames', () => {
      const result = service.getOptimizedFilename('my-photo.test.png', 'jpeg');
      expect(result).toBe('my-photo.test.jpg');
    });
  });

  describe('getThumbnailFilename', () => {
    it('should return thumbnail filename with _thumb suffix', () => {
      const result = service.getThumbnailFilename('recipe.jpg');
      expect(result).toBe('recipe_thumb.jpg');
    });

    it('should handle different formats for thumbnails', () => {
      expect(service.getThumbnailFilename('dish.png', 'webp')).toBe('dish_thumb.webp');
      expect(service.getThumbnailFilename('food.gif', 'png')).toBe('food_thumb.png');
    });

    it('should handle complex filenames for thumbnails', () => {
      const result = service.getThumbnailFilename('my-recipe.v2.jpg', 'jpeg');
      expect(result).toBe('my-recipe.v2_thumb.jpg');
    });

    it('should use JPEG extension for jpeg format', () => {
      const result = service.getThumbnailFilename('image.png', 'jpeg');
      expect(result).toBe('image_thumb.jpg');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle unknown errors gracefully', async () => {
      (fs.stat as jest.Mock).mockRejectedValue('String error instead of Error object');

      await expect(service.optimizeImage(
        '/input/unknown-error.jpg',
        '/output',
        'unknown-error',
        { format: 'jpeg' },
        false
      )).rejects.toThrow('Image optimization failed: Unknown error');
    });

    it('should handle directory creation failures', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ size: 1024 });
      (fs.mkdir as jest.Mock).mockRejectedValue(new Error('Cannot create directory'));

      await expect(service.optimizeImage(
        '/input/mkdir-fail.jpg',
        '/invalid/output',
        'mkdir-fail',
        { format: 'jpeg' },
        false
      )).rejects.toThrow('Image optimization failed: Cannot create directory');
    });

    it('should handle final stats retrieval failures', async () => {
      (fs.stat as jest.Mock)
        .mockResolvedValueOnce({ size: 2048 }) // Original file
        .mockRejectedValueOnce(new Error('Cannot stat optimized file')); // Optimized file
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await expect(service.optimizeImage(
        '/input/stat-fail.jpg',
        '/output',
        'stat-fail',
        { format: 'jpeg' },
        false
      )).rejects.toThrow('Image optimization failed: Cannot stat optimized file');
    });

    it('should log optimization success', async () => {
      (fs.stat as jest.Mock)
        .mockResolvedValueOnce({ size: 2048 })
        .mockResolvedValueOnce({ size: 1024 });
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      await service.optimizeImage(
        '/input/logged.jpg',
        '/output',
        'logged',
        { format: 'jpeg' },
        false
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Image optimized: logged')
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('50.0% reduction')
      );
    });

    it('should log optimization errors', async () => {
      (fs.stat as jest.Mock).mockRejectedValue(new Error('File system error'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.optimizeImage(
        '/input/error.jpg',
        '/output',
        'error',
        { format: 'jpeg' },
        false
      )).rejects.toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to optimize image error:',
        expect.any(Error)
      );
    });
  });
});
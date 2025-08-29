import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { UploadsService } from './uploads.service';
import { ConfigService } from '../../config/config.service';
import { ImageOptimizerService, OptimizedImageResult } from './image-optimizer.service';

jest.mock('fs');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('UploadsService', () => {
  let service: UploadsService;
  let configService: ConfigService;
  let imageOptimizerService: ImageOptimizerService;

  const mockConfigService = {
    isDevelopment: false,
    app: {
      port: 3001,
      productionDomain: 'https://example.com',
    },
  };

  const mockImageOptimizerService = {
    optimizeAvatarImage: jest.fn(),
    optimizeRecipeImage: jest.fn(),
    cleanupTempFile: jest.fn(),
    getThumbnailFilename: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ImageOptimizerService,
          useValue: mockImageOptimizerService,
        },
      ],
    }).compile();

    module.useLogger(false); // Suppress logs during testing

    service = module.get<UploadsService>(UploadsService);
    configService = module.get<ConfigService>(ConfigService);
    imageOptimizerService = module.get<ImageOptimizerService>(ImageOptimizerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFileUrl', () => {
    it('should generate correct URL in production mode', () => {
      const result = service.getFileUrl('test.jpg', 'avatar');
      
      expect(result).toBe('https://example.com/api/v1/uploads/avatar/test.jpg');
    });

    it('should generate correct URL in development mode', () => {
      mockConfigService.isDevelopment = true;
      
      const result = service.getFileUrl('recipe.png', 'recipe');
      
      expect(result).toBe('http://localhost:3001/api/v1/uploads/recipe/recipe.png');
    });

    it('should default to avatar type when not specified', () => {
      // Override the configService for this test to use production domain
      const productionService = new UploadsService(
        { ...mockConfigService, isDevelopment: false } as any,
        mockImageOptimizerService as any
      );
      
      const result = productionService.getFileUrl('profile.jpg');
      
      expect(result).toBe('https://example.com/api/v1/uploads/avatar/profile.jpg');
    });

  });

  describe('validateFile', () => {
    const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 100, // 100KB
      buffer: Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG magic number
      fieldname: 'image',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
      ...overrides,
    });

    it('should validate a valid JPEG file', () => {
      const mockFile = createMockFile();

      expect(() => service.validateFile(mockFile)).not.toThrow();
    });

    it('should validate a valid PNG file', () => {
      const mockFile = createMockFile({
        originalname: 'test.png',
        mimetype: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG magic number
      });

      expect(() => service.validateFile(mockFile)).not.toThrow();
    });

    it('should validate a valid GIF file', () => {
      const mockFile = createMockFile({
        originalname: 'test.gif',
        mimetype: 'image/gif',
        buffer: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a magic number
      });

      expect(() => service.validateFile(mockFile)).not.toThrow();
    });

    it('should validate a valid WebP file', () => {
      const webpBuffer = Buffer.alloc(20);
      webpBuffer.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
      webpBuffer.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
      
      const mockFile = createMockFile({
        originalname: 'test.webp',
        mimetype: 'image/webp',
        buffer: webpBuffer,
      });

      expect(() => service.validateFile(mockFile)).not.toThrow();
    });

    it('should throw error when no file is provided', () => {
      expect(() => service.validateFile(null as any)).toThrow(BadRequestException);
      expect(() => service.validateFile(null as any)).toThrow('No file uploaded');
    });

    it('should throw error for invalid MIME type', () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
      });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('Only JPEG, PNG, GIF, and WebP images are allowed');
    });

    it('should throw error for file too large', () => {
      const mockFile = createMockFile({
        size: 6 * 1024 * 1024, // 6MB
      });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File size cannot exceed 5MB');
    });

    it('should throw error for file too small', () => {
      const mockFile = createMockFile({
        size: 500, // 500 bytes
      });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File is too small or corrupted');
    });

    it('should throw error when file content does not match MIME type', () => {
      const mockFile = createMockFile({
        mimetype: 'image/png',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG magic number but PNG MIME type
      });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File content does not match its declared type');
    });

    it('should throw error for dangerous filename patterns', () => {
      const dangerousFilenames = [
        '../../../etc/passwd.jpg',  // Directory traversal
        'test<script>.jpg',         // Invalid characters
        'CON',                      // Windows reserved name
        '.htaccess.jpg',           // Hidden file
        'malware.exe',             // Executable extension
      ];

      dangerousFilenames.forEach(filename => {
        const mockFile = createMockFile({ originalname: filename });
        expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      });
    });

    it('should throw error for filename too long', () => {
      const longFilename = 'a'.repeat(256) + '.jpg';
      const mockFile = createMockFile({ originalname: longFilename });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('Filename is too long');
    });

    it('should throw error for invalid file extension', () => {
      const mockFile = createMockFile({
        originalname: 'test.bmp',
      });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File extension not allowed');
    });

    it('should detect malicious script content', () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const mockFile = createMockFile({
        buffer: Buffer.concat([
          Buffer.from([0xFF, 0xD8, 0xFF]), // Valid JPEG header
          Buffer.from(maliciousContent),
        ]),
      });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File contains potentially malicious content');
    });

    it('should detect suspicious binary patterns', () => {
      const mockFile = createMockFile({
        buffer: Buffer.concat([
          Buffer.from([0xFF, 0xD8, 0xFF]), // Valid JPEG header
          Buffer.from('#!/bin/sh'),
        ]),
      });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File contains suspicious binary patterns');
    });

    it('should handle missing buffer gracefully', () => {
      const mockFile = createMockFile({
        buffer: null as any,
      });

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File buffer not available for validation');
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file successfully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      service.deleteFile('/path/to/file.jpg');

      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/file.jpg');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/path/to/file.jpg');
    });

    it('should handle non-existent file gracefully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      service.deleteFile('/path/to/nonexistent.jpg');

      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/nonexistent.jpg');
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should handle file deletion errors gracefully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => service.deleteFile('/path/to/file.jpg')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting file:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getFilenameFromUrl', () => {
    it('should extract filename from valid URL', () => {
      const url = 'https://example.com/api/v1/uploads/avatar/profile.jpg';
      const result = service.getFilenameFromUrl(url);
      
      expect(result).toBe('profile.jpg');
    });

    it('should handle URL with query parameters', () => {
      const url = 'https://example.com/uploads/recipe/dish.png?v=123';
      const result = service.getFilenameFromUrl(url);
      
      expect(result).toBe('dish.png');
    });

    it('should return null for invalid URL', () => {
      const result = service.getFilenameFromUrl('not-a-url');
      
      expect(result).toBeNull();
    });

    it('should handle empty URL', () => {
      const result = service.getFilenameFromUrl('');
      
      expect(result).toBeNull();
    });
  });

  describe('getFilePath', () => {
    it('should return correct path for avatar', () => {
      const result = service.getFilePath('profile.jpg', 'avatar');
      
      expect(result).toBe(path.join('./uploads', 'avatars', 'profile.jpg'));
    });

    it('should return correct path for recipe', () => {
      const result = service.getFilePath('dish.png', 'recipe');
      
      expect(result).toBe(path.join('./uploads', 'recipes', 'dish.png'));
    });

    it('should default to avatar when type not specified', () => {
      const result = service.getFilePath('default.jpg');
      
      expect(result).toBe(path.join('./uploads', 'avatars', 'default.jpg'));
    });
  });

  describe('processUploadedImage', () => {
    const mockOptimizationResult: OptimizedImageResult = {
      originalPath: '/temp/temp_file',
      optimizedPath: '/uploads/avatars/optimized.jpg',
      thumbnailPath: '/uploads/avatars/thumb.jpg',
      originalSize: 1024,
      optimizedSize: 512,
      compressionRatio: 50,
      dimensions: { width: 300, height: 300 },
    };

    beforeEach(() => {
      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      mockImageOptimizerService.optimizeAvatarImage.mockResolvedValue(mockOptimizationResult);
      mockImageOptimizerService.optimizeRecipeImage.mockResolvedValue(mockOptimizationResult);
      mockImageOptimizerService.cleanupTempFile.mockResolvedValue(undefined);
    });

    it('should process avatar image successfully', async () => {
      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
      } as Express.Multer.File;

      const result = await service.processUploadedImage(mockFile, 'avatar');

      expect(result).toEqual({
        optimizedUrl: expect.stringContaining('/api/v1/uploads/avatar/optimized.jpg'),
        thumbnailUrl: expect.stringContaining('/api/v1/uploads/avatar/thumb.jpg'),
        optimizationResult: mockOptimizationResult,
      });

      expect(fs.promises.mkdir).toHaveBeenCalledWith('./uploads/temp', { recursive: true });
      expect(fs.promises.mkdir).toHaveBeenCalledWith(expect.stringMatching(/uploads[\\/]avatars$/), { recursive: true });
      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(mockImageOptimizerService.optimizeAvatarImage).toHaveBeenCalled();
      expect(mockImageOptimizerService.cleanupTempFile).toHaveBeenCalled();
    });

    it('should process recipe image successfully', async () => {
      const mockFile = {
        originalname: 'recipe.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
      } as Express.Multer.File;

      const result = await service.processUploadedImage(mockFile, 'recipe');

      expect(result).toEqual({
        optimizedUrl: expect.stringContaining('/api/v1/uploads/recipe/optimized.jpg'),
        thumbnailUrl: expect.stringContaining('/api/v1/uploads/recipe/thumb.jpg'),
        optimizationResult: mockOptimizationResult,
      });

      expect(mockImageOptimizerService.optimizeRecipeImage).toHaveBeenCalled();
    });

    it('should use custom filename when provided', async () => {
      const mockFile = {
        originalname: 'original.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
      } as Express.Multer.File;

      await service.processUploadedImage(mockFile, 'avatar', 'custom_name');

      const tempPath = expect.stringContaining('custom_name_temp');
      expect(fs.promises.writeFile).toHaveBeenCalledWith(tempPath, mockFile.buffer);
    });

    it('should handle optimization errors and cleanup temp file', async () => {
      const mockFile = {
        originalname: 'error.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
      } as Express.Multer.File;

      mockImageOptimizerService.optimizeAvatarImage.mockRejectedValue(new Error('Optimization failed'));

      await expect(service.processUploadedImage(mockFile, 'avatar')).rejects.toThrow('Optimization failed');
      expect(mockImageOptimizerService.cleanupTempFile).toHaveBeenCalled();
    });

    it('should handle result without thumbnail path', async () => {
      const mockFile = {
        originalname: 'no-thumb.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
      } as Express.Multer.File;

      const resultWithoutThumb = { ...mockOptimizationResult, thumbnailPath: undefined };
      mockImageOptimizerService.optimizeAvatarImage.mockResolvedValue(resultWithoutThumb);

      const result = await service.processUploadedImage(mockFile, 'avatar');

      expect(result.thumbnailUrl).toBeUndefined();
    });

    it('should validate file before processing', async () => {
      const invalidFile = {
        originalname: 'invalid.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('not an image'),
      } as Express.Multer.File;

      await expect(service.processUploadedImage(invalidFile, 'avatar')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getThumbnailUrl', () => {
    it('should return thumbnail URL for valid original URL', () => {
      // Reset config to development mode since previous tests modified it
      mockConfigService.isDevelopment = true;
      const originalUrl = 'http://localhost:3001/api/v1/uploads/recipe/dish.jpg';
      mockImageOptimizerService.getThumbnailFilename.mockReturnValue('dish_thumb.jpg');

      const result = service.getThumbnailUrl(originalUrl);

      expect(result).toBe('http://localhost:3001/api/v1/uploads/recipe/dish_thumb.jpg');
      expect(mockImageOptimizerService.getThumbnailFilename).toHaveBeenCalledWith('dish.jpg');
    });

    it('should return null for invalid URL', () => {
      const result = service.getThumbnailUrl('invalid-url');

      expect(result).toBeNull();
    });

    it('should handle getThumbnailFilename errors', () => {
      const originalUrl = 'https://example.com/api/v1/uploads/recipe/dish.jpg';
      mockImageOptimizerService.getThumbnailFilename.mockImplementation(() => {
        throw new Error('Thumbnail error');
      });

      const result = service.getThumbnailUrl(originalUrl);

      expect(result).toBeNull();
    });
  });

  describe('deleteOptimizedImages', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
      mockImageOptimizerService.getThumbnailFilename.mockReturnValue('dish_thumb.jpg');
    });

    it('should delete main image for avatar type', () => {
      const url = 'https://example.com/api/v1/uploads/avatar/profile.jpg';

      service.deleteOptimizedImages(url, 'avatar');

      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join('./uploads', 'avatars', 'profile.jpg'));
      expect(mockImageOptimizerService.getThumbnailFilename).not.toHaveBeenCalled();
    });

    it('should delete main image and thumbnail for recipe type', () => {
      const url = 'https://example.com/api/v1/uploads/recipe/dish.jpg';

      service.deleteOptimizedImages(url, 'recipe');

      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join('./uploads', 'recipes', 'dish.jpg'));
      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join('./uploads', 'recipes', 'dish_thumb.jpg'));
      expect(mockImageOptimizerService.getThumbnailFilename).toHaveBeenCalledWith('dish.jpg');
    });

    it('should handle invalid URL gracefully', () => {
      service.deleteOptimizedImages('invalid-url', 'recipe');

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('ensureUploadDirectories', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    });

    it('should create all required upload directories', () => {
      service.ensureUploadDirectories();

      const expectedDirectories = [
        './uploads',
        './uploads/temp',
        './uploads/avatars',
        './uploads/recipes',
      ];

      expectedDirectories.forEach(dir => {
        expect(fs.existsSync).toHaveBeenCalledWith(dir);
        expect(fs.mkdirSync).toHaveBeenCalledWith(dir, { recursive: true });
      });
    });

    it('should not create directories that already exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      service.ensureUploadDirectories();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should create only missing directories', () => {
      (fs.existsSync as jest.Mock).mockImplementation((dir: string) => {
        return dir === './uploads' || dir === './uploads/temp';
      });

      service.ensureUploadDirectories();

      expect(fs.mkdirSync).toHaveBeenCalledWith('./uploads/avatars', { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith('./uploads/recipes', { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle WebP files with insufficient buffer length', () => {
      const shortWebPBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]); // Only RIFF header
      const mockFile = {
        originalname: 'test.webp',
        mimetype: 'image/webp',
        buffer: shortWebPBuffer,
        size: 1024,
        fieldname: 'image',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
    });

    it('should handle files with no filename', () => {
      const mockFile = {
        originalname: '',
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
        size: 1024,
        fieldname: 'image',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('Filename is required');
    });

    it('should detect multiple malicious patterns', () => {
      const maliciousPatterns = [
        '<?php echo "malicious"; ?>',
        '<% eval(request.params.cmd) %>',
        'javascript:alert("xss")',
        'vbscript:msgbox("xss")',
        'onload=alert("xss")',
        'onerror=alert("xss")',
        'eval(malicious_code)',
        'document.write(evil)',
      ];

      maliciousPatterns.forEach(pattern => {
        const mockFile = {
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.concat([
            Buffer.from([0xFF, 0xD8, 0xFF]), // Valid JPEG header
            Buffer.from(pattern),
          ]),
          size: 1024,
          fieldname: 'image',
          encoding: '7bit',
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        };

        expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
        expect(() => service.validateFile(mockFile)).toThrow('File contains potentially malicious content');
      });
    });

    it('should handle large files with malicious content beyond 8KB limit', () => {
      const largeBuffer = Buffer.alloc(10000);
      largeBuffer.set([0xFF, 0xD8, 0xFF], 0); // Valid JPEG header
      // Malicious content beyond 8KB should not be detected
      largeBuffer.write('<script>alert("xss")</script>', 9000, 'utf8');
      
      const mockFile = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        buffer: largeBuffer,
        size: 10000,
        fieldname: 'image',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      // Should not throw because malicious content is beyond the 8KB scan limit
      expect(() => service.validateFile(mockFile)).not.toThrow();
    });

    it('should detect binary patterns like MZ header', () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.concat([
          Buffer.from([0xFF, 0xD8, 0xFF]), // Valid JPEG header
          Buffer.from('MZ'), // PE header
        ]),
        size: 1024,
        fieldname: 'image',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File contains suspicious binary patterns');
    });

    it('should detect ZIP file patterns', () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.concat([
          Buffer.from([0xFF, 0xD8, 0xFF]), // Valid JPEG header
          Buffer.from('PK'), // ZIP header
        ]),
        size: 1024,
        fieldname: 'image',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File contains suspicious binary patterns');
    });

    it('should validate all image format combinations', () => {
      const validCombinations = [
        {
          mimetype: 'image/jpeg',
          buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
          extension: '.jpg'
        },
        {
          mimetype: 'image/jpeg',
          buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
          extension: '.jpeg'
        },
        {
          mimetype: 'image/gif',
          buffer: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF89a
          extension: '.gif'
        }
      ];

      validCombinations.forEach(combo => {
        const mockFile = {
          originalname: `test${combo.extension}`,
          mimetype: combo.mimetype,
          buffer: combo.buffer,
          size: 1024,
          fieldname: 'image',
          encoding: '7bit',
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        };

        expect(() => service.validateFile(mockFile)).not.toThrow();
      });
    });

    it('should handle processUploadedImage temp directory creation failure', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
      } as Express.Multer.File;

      (fs.promises.mkdir as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(service.processUploadedImage(mockFile, 'avatar')).rejects.toThrow('Permission denied');
    });

    it('should handle processUploadedImage temp file write failure', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
      } as Express.Multer.File;

      (fs.promises.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

      await expect(service.processUploadedImage(mockFile, 'avatar')).rejects.toThrow('Disk full');
    });

    it('should handle cleanup temp file failure gracefully', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
      } as Express.Multer.File;

      const mockOptimizationResult: OptimizedImageResult = {
        originalPath: '/temp/temp_file',
        optimizedPath: '/uploads/avatars/optimized.jpg',
        thumbnailPath: '/uploads/avatars/thumb.jpg',
        originalSize: 1024,
        optimizedSize: 512,
        compressionRatio: 50,
        dimensions: { width: 300, height: 300 },
      };

      mockImageOptimizerService.optimizeAvatarImage.mockResolvedValue(mockOptimizationResult);
      mockImageOptimizerService.cleanupTempFile.mockRejectedValue(new Error('Cleanup failed'));

      // Should still complete successfully even if cleanup fails
      const result = await service.processUploadedImage(mockFile, 'avatar');
      expect(result.optimizedUrl).toContain('/api/v1/uploads/avatar/');
    });

    it('should handle checkMagicNumber with buffer smaller than magic bytes', () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0xFF]), // Only 1 byte, but JPEG needs 3
        size: 1024,
        fieldname: 'image',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
      expect(() => service.validateFile(mockFile)).toThrow('File content does not match its declared type');
    });
  });
});
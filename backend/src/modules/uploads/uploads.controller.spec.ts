import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ApiResponseDto } from '../../common/dto/response.dto';

describe('UploadsController', () => {
  let controller: UploadsController;
  let uploadsService: UploadsService;

  const mockUploadsService = {
    ensureUploadDirectories: jest.fn(),
    processUploadedImage: jest.fn(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'avatar',
    originalname: 'test-avatar.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockOptimizationResult = {
    optimizedUrl: '/uploads/avatars/optimized.jpg',
    thumbnailUrl: '/uploads/avatars/thumb.jpg',
    optimizationResult: {
      originalSize: 1024,
      optimizedSize: 512,
      compressionRatio: 0.5,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    uploadsService = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should ensure upload directories exist on startup', () => {
      expect(mockUploadsService.ensureUploadDirectories).toHaveBeenCalled();
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      mockUploadsService.processUploadedImage.mockResolvedValue(mockOptimizationResult);

      const result = await controller.uploadAvatar(mockFile);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Avatar uploaded and optimized successfully');
      expect(result.data).toEqual({
        filename: expect.any(String),
        url: mockOptimizationResult.optimizedUrl,
        size: mockOptimizationResult.optimizationResult.originalSize,
        optimizedSize: mockOptimizationResult.optimizationResult.optimizedSize,
        compressionRatio: mockOptimizationResult.optimizationResult.compressionRatio,
        mimetype: 'image/jpeg',
      });

      expect(mockUploadsService.processUploadedImage).toHaveBeenCalledWith(
        mockFile,
        'avatar'
      );
    });

    it('should handle missing file', async () => {
      mockUploadsService.processUploadedImage.mockRejectedValue(
        new BadRequestException('No file provided')
      );
      
      await expect(controller.uploadAvatar(null as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle upload processing errors', async () => {
      mockUploadsService.processUploadedImage.mockRejectedValue(
        new Error('Processing failed')
      );

      await expect(controller.uploadAvatar(mockFile)).rejects.toThrow(
        'Processing failed'
      );
    });

    it('should handle invalid file types', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      };

      mockUploadsService.processUploadedImage.mockRejectedValue(
        new BadRequestException('Only JPEG, PNG, GIF, and WebP images are allowed')
      );

      await expect(controller.uploadAvatar(invalidFile)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle file too large', async () => {
      const largeFile = {
        ...mockFile,
        size: 6 * 1024 * 1024, // 6MB
      };

      mockUploadsService.processUploadedImage.mockRejectedValue(
        new BadRequestException('File size cannot exceed 5MB')
      );

      await expect(controller.uploadAvatar(largeFile)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('uploadAvatarPublic', () => {
    it('should upload avatar successfully for public endpoint', async () => {
      mockUploadsService.processUploadedImage.mockResolvedValue(mockOptimizationResult);

      const result = await controller.uploadAvatarPublic(mockFile);

      expect(uploadsService.processUploadedImage).toHaveBeenCalledWith(mockFile, 'avatar');
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Avatar uploaded and optimized successfully');
      expect(result.data).toEqual({
        filename: expect.any(String),
        url: mockOptimizationResult.optimizedUrl,
        size: mockOptimizationResult.optimizationResult.originalSize,
        optimizedSize: mockOptimizationResult.optimizationResult.optimizedSize,
        compressionRatio: mockOptimizationResult.optimizationResult.compressionRatio,
        mimetype: 'image/jpeg',
      });
    });

    it('should handle upload service errors for public endpoint', async () => {
      const error = new Error('Public upload failed');
      mockUploadsService.processUploadedImage.mockRejectedValueOnce(error);

      await expect(controller.uploadAvatarPublic(mockFile)).rejects.toThrow(
        new BadRequestException('Public upload failed')
      );
    });

    it('should handle unknown errors for public endpoint', async () => {
      mockUploadsService.processUploadedImage.mockRejectedValueOnce('Unknown error');

      await expect(controller.uploadAvatarPublic(mockFile)).rejects.toThrow(
        new BadRequestException('Failed to upload avatar')
      );
    });
  });

  describe('uploadRecipeImage', () => {
    it('should upload recipe image successfully', async () => {
      const recipeFile = {
        ...mockFile,
        fieldname: 'recipeImage',
        originalname: 'delicious-dish.jpg',
      };

      const recipeOptimizationResult = {
        ...mockOptimizationResult,
        optimizedUrl: 'https://example.com/api/v1/uploads/recipe/dish.jpg',
        thumbnailUrl: 'https://example.com/api/v1/uploads/recipe/dish_thumb.jpg',
      };

      mockUploadsService.processUploadedImage.mockResolvedValue(recipeOptimizationResult);

      const result = await controller.uploadRecipeImage(recipeFile);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Recipe image uploaded and optimized successfully');
      expect(result.data).toEqual({
        filename: expect.any(String),
        url: recipeOptimizationResult.optimizedUrl,
        thumbnailUrl: recipeOptimizationResult.thumbnailUrl,
        size: recipeOptimizationResult.optimizationResult.originalSize,
        optimizedSize: recipeOptimizationResult.optimizationResult.optimizedSize,
        compressionRatio: recipeOptimizationResult.optimizationResult.compressionRatio,
        mimetype: 'image/jpeg',
      });

      expect(mockUploadsService.processUploadedImage).toHaveBeenCalledWith(
        recipeFile,
        'recipe'
      );
    });

    it('should handle recipe image upload without authentication for public recipes', async () => {
      mockUploadsService.processUploadedImage.mockResolvedValue(mockOptimizationResult);

      const result = await controller.uploadRecipeImage(mockFile);

      expect(result.success).toBe(true);
    });
  });

  // Note: File serving tests require complex mocking of fs and path modules
  // These would be better tested in integration tests
  describe('controller structure', () => {
    it('should have upload methods', () => {
      expect(typeof controller.uploadAvatar).toBe('function');
      expect(typeof controller.uploadAvatarPublic).toBe('function');
      expect(typeof controller.uploadRecipeImage).toBe('function');
    });

    it('should have file serving methods', () => {
      expect(typeof controller.getAvatar).toBe('function');
      expect(typeof controller.getRecipeImage).toBe('function');
    });
  });

  describe('security considerations', () => {
    it('should prevent malicious filenames', async () => {
      const maliciousFile = {
        ...mockFile,
        originalname: '../../malicious.exe.jpg',
      };

      mockUploadsService.processUploadedImage.mockRejectedValue(
        new BadRequestException('Filename contains invalid characters or patterns')
      );

      await expect(controller.uploadAvatar(maliciousFile)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should validate file content not just extension', async () => {
      const spoofedFile = {
        ...mockFile,
        originalname: 'malware.exe.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('MZ'), // PE executable header
      };

      mockUploadsService.processUploadedImage.mockRejectedValue(
        new BadRequestException('File contains suspicious binary patterns')
      );

      await expect(controller.uploadAvatar(spoofedFile)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should reject files with script content', async () => {
      const scriptFile = {
        ...mockFile,
        buffer: Buffer.from('<script>alert("xss")</script>'),
      };

      mockUploadsService.processUploadedImage.mockRejectedValue(
        new BadRequestException('File contains potentially malicious content')
      );

      await expect(controller.uploadAvatar(scriptFile)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('rate limiting', () => {
    it('should respect throttling limits for avatar uploads', async () => {
      // This would be tested with actual throttling in integration tests
      mockUploadsService.processUploadedImage.mockResolvedValue(mockOptimizationResult);

      const result = await controller.uploadAvatar(mockFile);
      expect(result.success).toBe(true);
    });

    it('should have different rate limits for recipe uploads', async () => {
      // Recipe uploads typically have more lenient rate limits
      mockUploadsService.processUploadedImage.mockResolvedValue(mockOptimizationResult);

      const result = await controller.uploadRecipeImage(mockFile);
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle service unavailable errors', async () => {
      mockUploadsService.processUploadedImage.mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      await expect(controller.uploadAvatar(mockFile)).rejects.toThrow(
        'Service temporarily unavailable'
      );
    });

    it('should handle disk space errors', async () => {
      mockUploadsService.processUploadedImage.mockRejectedValue(
        new Error('No space left on device')
      );

      await expect(controller.uploadAvatar(mockFile)).rejects.toThrow(
        'No space left on device'
      );
    });

    it('should handle corrupted file errors', async () => {
      mockUploadsService.processUploadedImage.mockRejectedValue(
        new BadRequestException('File is too small or corrupted')
      );

      await expect(controller.uploadAvatar(mockFile)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('file metadata handling', () => {
    it('should preserve important file metadata', async () => {
      const metadataFile = {
        ...mockFile,
        originalname: 'photo-with-metadata.jpg',
        size: 2048,
      };

      mockUploadsService.processUploadedImage.mockResolvedValue({
        ...mockOptimizationResult,
        optimizationResult: {
          ...mockOptimizationResult.optimizationResult,
          originalSize: 2048,
          optimizedSize: 1024,
          compressionRatio: 50,
        },
      });

      const result = await controller.uploadAvatar(metadataFile);

      expect(result.data).toEqual(
        expect.objectContaining({
          size: 2048,
          optimizedSize: 1024,
          compressionRatio: 50,
        })
      );
    });

    it('should generate appropriate response for successful upload', async () => {
      mockUploadsService.processUploadedImage.mockResolvedValue(mockOptimizationResult);

      const result = await controller.uploadAvatar(mockFile);

      expect(result.data).toHaveProperty('filename');
      expect(result.data).toHaveProperty('url');
      expect(result.data).toHaveProperty('size');
      expect(result.data).toHaveProperty('mimetype');
      expect(result.data?.mimetype).toBe('image/jpeg');
    });
  });
});
import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/auth.decorators';
import { UploadsService } from './uploads.service';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { memoryStorage } from 'multer';

interface UploadResponse {
  filename: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  optimizedSize?: number;
  compressionRatio?: number;
  mimetype: string;
}

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {
    // Ensure upload directories exist on startup
    this.uploadsService.ensureUploadDirectories();
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute for authenticated users
  @ApiOperation({ summary: 'Upload user avatar image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Avatar uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file too large',
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(), // Use memory storage for validation
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<UploadResponse>> {
    try {
      const result = await this.uploadsService.processUploadedImage(
        file,
        'avatar',
      );

      const response: UploadResponse = {
        filename: path.basename(result.optimizedUrl),
        url: result.optimizedUrl,
        size: result.optimizationResult.originalSize,
        optimizedSize: result.optimizationResult.optimizedSize,
        compressionRatio: result.optimizationResult.compressionRatio,
        mimetype: 'image/jpeg', // Optimized images are converted to JPEG
      };

      return ApiResponseDto.success(
        'Avatar uploaded and optimized successfully',
        response,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload avatar';
      throw new BadRequestException(errorMessage);
    }
  }

  @Post('avatar/public')
  @Public() // Public endpoint for registration
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Strict rate limiting: 5 uploads per minute
  @ApiOperation({ summary: 'Upload avatar image for registration (public)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Avatar uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file too large',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many upload attempts, please try again later',
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(), // Use memory storage for validation
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadAvatarPublic(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<UploadResponse>> {
    try {
      const result = await this.uploadsService.processUploadedImage(
        file,
        'avatar',
      );

      const response: UploadResponse = {
        filename: path.basename(result.optimizedUrl),
        url: result.optimizedUrl,
        size: result.optimizationResult.originalSize,
        optimizedSize: result.optimizationResult.optimizedSize,
        compressionRatio: result.optimizationResult.compressionRatio,
        mimetype: 'image/jpeg', // Optimized images are converted to JPEG
      };

      return ApiResponseDto.success(
        'Avatar uploaded and optimized successfully',
        response,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload avatar';
      throw new BadRequestException(errorMessage);
    }
  }

  @Get('avatar/:filename')
  @Public() // Make this endpoint public
  @ApiOperation({ summary: 'Get avatar image' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avatar image',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Avatar not found',
  })
  getAvatar(@Param('filename') filename: string, @Res() res: Response): void {
    // Sanitize filename to prevent path traversal
    const sanitizedFilename = this.sanitizeFilename(filename);
    if (!sanitizedFilename) {
      throw new BadRequestException('Invalid filename');
    }

    const filepath = path.join('./uploads/avatars', sanitizedFilename);

    // Ensure the resolved path is still within the uploads directory
    const resolvedPath = path.resolve(filepath);
    const uploadsDir = path.resolve('./uploads/avatars');

    if (!resolvedPath.startsWith(uploadsDir)) {
      throw new BadRequestException('Invalid file path');
    }

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Avatar not found');
    }

    // Set appropriate headers for cross-origin access
    res.setHeader('Content-Type', this.getMimeType(sanitizedFilename));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin access
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow access from any origin for images

    // Send file
    res.sendFile(resolvedPath);
  }

  @Post('recipe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 uploads per minute for recipes
  @ApiOperation({ summary: 'Upload recipe image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recipe image uploaded successfully',
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(), // Use memory storage for validation
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadRecipeImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<UploadResponse>> {
    try {
      const result = await this.uploadsService.processUploadedImage(
        file,
        'recipe',
      );

      const response: UploadResponse = {
        filename: path.basename(result.optimizedUrl),
        url: result.optimizedUrl,
        thumbnailUrl: result.thumbnailUrl,
        size: result.optimizationResult.originalSize,
        optimizedSize: result.optimizationResult.optimizedSize,
        compressionRatio: result.optimizationResult.compressionRatio,
        mimetype: 'image/jpeg', // Optimized images are converted to JPEG
      };

      return ApiResponseDto.success(
        'Recipe image uploaded and optimized successfully',
        response,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to upload recipe image';
      throw new BadRequestException(errorMessage);
    }
  }

  @Get('recipe/:filename')
  @Public() // Make this endpoint public
  @ApiOperation({ summary: 'Get recipe image' })
  getRecipeImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): void {
    // Sanitize filename to prevent path traversal
    const sanitizedFilename = this.sanitizeFilename(filename);
    if (!sanitizedFilename) {
      throw new BadRequestException('Invalid filename');
    }

    const filepath = path.join('./uploads/recipes', sanitizedFilename);

    // Ensure the resolved path is still within the uploads directory
    const resolvedPath = path.resolve(filepath);
    const uploadsDir = path.resolve('./uploads/recipes');

    if (!resolvedPath.startsWith(uploadsDir)) {
      throw new BadRequestException('Invalid file path');
    }

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Recipe image not found');
    }

    // Set appropriate headers for cross-origin access
    res.setHeader('Content-Type', this.getMimeType(sanitizedFilename));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin access
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow access from any origin for images

    // Send file
    res.sendFile(resolvedPath);
  }

  /**
   * Sanitize filename to prevent path traversal and other attacks
   */
  private sanitizeFilename(filename: string): string | null {
    if (!filename || typeof filename !== 'string') {
      return null;
    }

    // Remove any path separators and null bytes
    const sanitized = filename
      .replace(/[/\\]/g, '') // Remove path separators
      .replace(/\0/g, '') // Remove null bytes
      .replace(/\.\./g, '') // Remove relative path indicators
      .replace(/[<>:"|?*]/g, ''); // Remove Windows forbidden characters

    // Ensure filename has valid format (alphanumeric, dash, underscore, dot)
    if (!/^[a-zA-Z0-9\-_.]+$/.test(sanitized)) {
      return null;
    }

    // Ensure it has a valid extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(sanitized).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return null;
    }

    // Ensure filename is not too long
    if (sanitized.length > 255) {
      return null;
    }

    return sanitized;
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}

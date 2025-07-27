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
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUserId, Public } from '../../common/decorators/auth.decorators';
import { UploadsService } from './uploads.service';
import { ApiResponseDto } from '../../common/dto/response.dto';

interface UploadResponse {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
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
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() userId: string,
  ): Promise<ApiResponseDto<UploadResponse>> {
    try {
      // Validate file
      this.uploadsService.validateFile(file);

      // Ensure upload directories exist
      this.uploadsService.ensureUploadDirectories();

      const response: UploadResponse = {
        filename: file.filename,
        url: this.uploadsService.getFileUrl(file.filename, 'avatar'),
        size: file.size,
        mimetype: file.mimetype,
      };

      return ApiResponseDto.success('Avatar uploaded successfully', response);
    } catch (error) {
      // Clean up uploaded file if validation fails
      if (file && file.filename) {
        const filepath = this.uploadsService.getFilePath(file.filename, 'avatar');
        this.uploadsService.deleteFile(filepath);
      }
      
      throw error;
    }
  }

  @Post('avatar/public')
  @Public() // Public endpoint for registration
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
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatarPublic(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<UploadResponse>> {
    try {
      // Validate file
      this.uploadsService.validateFile(file);

      // Ensure upload directories exist
      this.uploadsService.ensureUploadDirectories();

      const response: UploadResponse = {
        filename: file.filename,
        url: this.uploadsService.getFileUrl(file.filename, 'avatar'),
        size: file.size,
        mimetype: file.mimetype,
      };

      return ApiResponseDto.success('Avatar uploaded successfully', response);
    } catch (error) {
      // Clean up uploaded file if validation fails
      if (file && file.filename) {
        const filepath = this.uploadsService.getFilePath(file.filename, 'avatar');
        this.uploadsService.deleteFile(filepath);
      }
      
      throw error;
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
  async getAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const filepath = path.join('./uploads/avatars', filename);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Avatar not found');
    }

    // Set appropriate headers for cross-origin access
    res.setHeader('Content-Type', this.getMimeType(filename));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin access
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow access from any origin for images

    // Send file
    res.sendFile(path.resolve(filepath));
  }

  @Post('recipe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload recipe image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recipe image uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('image'))
  async uploadRecipeImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() userId: string,
  ): Promise<ApiResponseDto<UploadResponse>> {
    try {
      // Validate file
      this.uploadsService.validateFile(file);

      // Ensure upload directories exist
      this.uploadsService.ensureUploadDirectories();

      const response: UploadResponse = {
        filename: file.filename,
        url: this.uploadsService.getFileUrl(file.filename, 'recipe'),
        size: file.size,
        mimetype: file.mimetype,
      };

      return ApiResponseDto.success('Recipe image uploaded successfully', response);
    } catch (error) {
      // Clean up uploaded file if validation fails
      if (file && file.filename) {
        const filepath = this.uploadsService.getFilePath(file.filename, 'recipe');
        this.uploadsService.deleteFile(filepath);
      }
      
      throw error;
    }
  }

  @Get('recipe/:filename')
  @Public() // Make this endpoint public
  @ApiOperation({ summary: 'Get recipe image' })
  async getRecipeImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const filepath = path.join('./uploads/recipes', filename);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Recipe image not found');
    }

    // Set appropriate headers for cross-origin access
    res.setHeader('Content-Type', this.getMimeType(filename));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin access
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow access from any origin for images

    // Send file
    res.sendFile(path.resolve(filepath));
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
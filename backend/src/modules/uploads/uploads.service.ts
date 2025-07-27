import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {}

  /**
   * Generate public URL for uploaded file
   */
  getFileUrl(filename: string, type: 'avatar' | 'recipe' = 'avatar'): string {
    const baseUrl = this.configService.isDevelopment 
      ? `http://localhost:${this.configService.app.port}`
      : 'https://your-production-domain.com'; // Configure for production
    
    return `${baseUrl}/api/v1/uploads/${type}/${filename}`;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, GIF, and WebP images are allowed');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size cannot exceed 5MB');
    }
  }

  /**
   * Delete old file when updating
   */
  deleteFile(filepath: string): void {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error, as this is cleanup operation
    }
  }

  /**
   * Extract filename from URL
   */
  getFilenameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = path.basename(pathname);
      return filename;
    } catch {
      return null;
    }
  }

  /**
   * Get file path for deletion
   */
  getFilePath(filename: string, type: 'avatar' | 'recipe' = 'avatar'): string {
    return path.join('./uploads', type === 'avatar' ? 'avatars' : 'recipes', filename);
  }

  /**
   * Ensure upload directories exist
   */
  ensureUploadDirectories(): void {
    const directories = ['./uploads', './uploads/avatars', './uploads/recipes'];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
} 
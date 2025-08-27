import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import {
  ImageOptimizerService,
  OptimizedImageResult,
} from './image-optimizer.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private configService: ConfigService,
    private imageOptimizer: ImageOptimizerService,
  ) {}

  /**
   * Generate public URL for uploaded file
   */
  getFileUrl(filename: string, type: 'avatar' | 'recipe' = 'avatar'): string {
    const baseUrl = this.configService.isDevelopment
      ? `http://localhost:${this.configService.app.port}`
      : this.configService.app.productionDomain ||
        `https://localhost:${this.configService.app.port}`;

    return `${baseUrl}/api/v1/uploads/${type}/${filename}`;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate filename - sanitize dangerous characters
    this.validateFilename(file.originalname);

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, GIF, and WebP images are allowed',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size cannot exceed 5MB');
    }

    // Validate minimum file size (avoid empty/corrupted files)
    const minSize = 1024; // 1KB minimum
    if (file.size < minSize) {
      throw new BadRequestException('File is too small or corrupted');
    }

    // Validate file content using magic numbers (file signatures)
    this.validateFileSignature(file);

    // Additional malware/script detection
    this.scanForMaliciousContent(file);
  }

  /**
   * Validate file signature (magic numbers) to prevent MIME type spoofing
   */
  private validateFileSignature(file: Express.Multer.File): void {
    if (!file.buffer) {
      throw new BadRequestException('File buffer not available for validation');
    }

    const buffer = file.buffer;
    const magicNumbers = {
      jpeg: [0xff, 0xd8, 0xff],
      png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      gif87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
      gif89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF header, followed by WEBP
    };

    let isValidFileType = false;

    // Check JPEG
    if (this.checkMagicNumber(buffer, magicNumbers.jpeg)) {
      isValidFileType = file.mimetype === 'image/jpeg';
    }
    // Check PNG
    else if (this.checkMagicNumber(buffer, magicNumbers.png)) {
      isValidFileType = file.mimetype === 'image/png';
    }
    // Check GIF 87a
    else if (this.checkMagicNumber(buffer, magicNumbers.gif87a)) {
      isValidFileType = file.mimetype === 'image/gif';
    }
    // Check GIF 89a
    else if (this.checkMagicNumber(buffer, magicNumbers.gif89a)) {
      isValidFileType = file.mimetype === 'image/gif';
    }
    // Check WebP (more complex check)
    else if (
      this.checkMagicNumber(buffer, magicNumbers.webp) &&
      buffer.length > 12
    ) {
      const webpSignature = Array.from(buffer.subarray(8, 12));
      const expectedWebP = [0x57, 0x45, 0x42, 0x50]; // 'WEBP'
      isValidFileType =
        this.checkMagicNumber(Buffer.from(webpSignature), expectedWebP) &&
        file.mimetype === 'image/webp';
    }

    if (!isValidFileType) {
      throw new BadRequestException(
        'File content does not match its declared type',
      );
    }
  }

  /**
   * Check if buffer starts with the expected magic numbers
   */
  private checkMagicNumber(buffer: Buffer, magicBytes: number[]): boolean {
    if (buffer.length < magicBytes.length) {
      return false;
    }

    for (let i = 0; i < magicBytes.length; i++) {
      if (buffer[i] !== magicBytes[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate filename for security
   */
  private validateFilename(originalName: string): void {
    if (!originalName) {
      throw new BadRequestException('Filename is required');
    }

    // Check for dangerous characters and patterns
    const dangerousPatterns = [
      /\.\./, // Directory traversal
      /[<>:"|?*]/, // Invalid filename characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /^\./, // Hidden files starting with dot
      /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|sh|php|pl|py|rb)$/i, // Executable extensions
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(originalName)) {
        throw new BadRequestException(
          'Filename contains invalid characters or patterns',
        );
      }
    }

    // Check filename length
    if (originalName.length > 255) {
      throw new BadRequestException('Filename is too long');
    }

    // Ensure filename has valid extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = path.extname(originalName).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException('File extension not allowed');
    }
  }

  /**
   * Scan file content for malicious patterns
   */
  private scanForMaliciousContent(file: Express.Multer.File): void {
    const buffer = file.buffer;
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 8192)); // Check first 8KB

    // Look for script tags, PHP tags, and other potentially dangerous content
    const maliciousPatterns = [
      /<script[\s\S]*?>/i,
      /<\?php/i,
      /<%[\s\S]*?%>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /eval\s*\(/i,
      /document\.write/i,
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        this.logger.warn(
          `Malicious content detected in file: ${file.originalname}`,
        );
        throw new BadRequestException(
          'File contains potentially malicious content',
        );
      }
    }

    // Check for suspicious binary patterns that might indicate embedded scripts
    const suspiciousBinaryPatterns = [
      Buffer.from('#!/bin/sh'),
      Buffer.from('#!/bin/bash'),
      Buffer.from('MZ'), // PE header
      Buffer.from('PK'), // ZIP header (could contain malware)
    ];

    for (const pattern of suspiciousBinaryPatterns) {
      if (buffer.indexOf(pattern) !== -1) {
        this.logger.warn(
          `Suspicious binary pattern detected in file: ${file.originalname}`,
        );
        throw new BadRequestException(
          'File contains suspicious binary patterns',
        );
      }
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
    return path.join(
      './uploads',
      type === 'avatar' ? 'avatars' : 'recipes',
      filename,
    );
  }

  /**
   * Process and optimize uploaded image
   */
  async processUploadedImage(
    file: Express.Multer.File,
    type: 'avatar' | 'recipe',
    customFilename?: string,
  ): Promise<{
    optimizedUrl: string;
    thumbnailUrl?: string;
    optimizationResult: OptimizedImageResult;
  }> {
    // Validate the uploaded file
    this.validateFile(file);

    // Generate unique filename if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = customFilename || `${timestamp}_${randomString}`;

    // Create temporary file from buffer
    const tempPath = path.join('./uploads/temp', `${filename}_temp`);
    await fs.promises.mkdir('./uploads/temp', { recursive: true });
    await fs.promises.writeFile(tempPath, file.buffer);

    try {
      // Define output directory
      const outputDir = path.join(
        './uploads',
        type === 'avatar' ? 'avatars' : 'recipes',
      );
      await fs.promises.mkdir(outputDir, { recursive: true });

      let optimizationResult: OptimizedImageResult;

      // Optimize based on type
      if (type === 'avatar') {
        optimizationResult = await this.imageOptimizer.optimizeAvatarImage(
          tempPath,
          outputDir,
          filename,
        );
      } else {
        optimizationResult = await this.imageOptimizer.optimizeRecipeImage(
          tempPath,
          outputDir,
          filename,
        );
      }

      // Generate URLs
      const optimizedFilename = path.basename(optimizationResult.optimizedPath);
      const optimizedUrl = this.getFileUrl(optimizedFilename, type);

      let thumbnailUrl: string | undefined;
      if (optimizationResult.thumbnailPath) {
        const thumbnailFilename = path.basename(
          optimizationResult.thumbnailPath,
        );
        thumbnailUrl = this.getFileUrl(thumbnailFilename, type);
      }

      // Clean up temporary file
      await this.imageOptimizer.cleanupTempFile(tempPath);

      this.logger.log(
        `Image processed successfully: ${type} | ${optimizationResult.compressionRatio.toFixed(1)}% compression`,
      );

      return {
        optimizedUrl,
        thumbnailUrl,
        optimizationResult,
      };
    } catch (error) {
      // Clean up temporary file on error
      await this.imageOptimizer.cleanupTempFile(tempPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Get thumbnail URL for a recipe image
   */
  getThumbnailUrl(originalUrl: string): string | null {
    try {
      const filename = this.getFilenameFromUrl(originalUrl);
      if (!filename) return null;

      const thumbnailFilename =
        this.imageOptimizer.getThumbnailFilename(filename);
      return this.getFileUrl(thumbnailFilename, 'recipe');
    } catch {
      return null;
    }
  }

  /**
   * Delete optimized images and thumbnails
   */
  deleteOptimizedImages(url: string, type: 'avatar' | 'recipe'): void {
    const filename = this.getFilenameFromUrl(url);
    if (!filename) return;

    // Delete main optimized image
    const mainPath = this.getFilePath(filename, type);
    this.deleteFile(mainPath);

    // Delete thumbnail if it exists (for recipes)
    if (type === 'recipe') {
      const thumbnailFilename =
        this.imageOptimizer.getThumbnailFilename(filename);
      const thumbnailPath = this.getFilePath(thumbnailFilename, type);
      this.deleteFile(thumbnailPath);
    }
  }

  /**
   * Ensure upload directories exist
   */
  ensureUploadDirectories(): void {
    const directories = [
      './uploads',
      './uploads/temp',
      './uploads/avatars',
      './uploads/recipes',
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
}

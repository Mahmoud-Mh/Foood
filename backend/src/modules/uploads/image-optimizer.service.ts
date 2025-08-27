import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface OptimizedImageResult {
  originalPath: string;
  optimizedPath: string;
  thumbnailPath?: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
}

@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);

  // Default optimization settings for recipes
  private readonly recipeImageOptions: ImageOptimizationOptions = {
    width: 1200,
    height: 800,
    quality: 85,
    format: 'jpeg',
    maintainAspectRatio: true,
  };

  private readonly thumbnailOptions: ImageOptimizationOptions = {
    width: 400,
    height: 300,
    quality: 80,
    format: 'jpeg',
    maintainAspectRatio: true,
  };

  private readonly avatarOptions: ImageOptimizationOptions = {
    width: 300,
    height: 300,
    quality: 90,
    format: 'jpeg',
    maintainAspectRatio: false, // Square crop for avatars
  };

  async optimizeRecipeImage(
    inputPath: string,
    outputDir: string,
    filename: string,
  ): Promise<OptimizedImageResult> {
    return this.optimizeImage(
      inputPath,
      outputDir,
      filename,
      this.recipeImageOptions,
      true, // Generate thumbnail
    );
  }

  async optimizeAvatarImage(
    inputPath: string,
    outputDir: string,
    filename: string,
  ): Promise<OptimizedImageResult> {
    return this.optimizeImage(
      inputPath,
      outputDir,
      filename,
      this.avatarOptions,
      false, // No thumbnail for avatars
    );
  }

  async optimizeImage(
    inputPath: string,
    outputDir: string,
    filename: string,
    options: ImageOptimizationOptions,
    generateThumbnail: boolean = false,
  ): Promise<OptimizedImageResult> {
    try {
      // Get original file stats
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // Parse filename and extension
      const parsedPath = path.parse(filename);
      const baseName = parsedPath.name;
      const outputFormat = options.format || 'jpeg';
      const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;

      // Define output paths
      const optimizedFilename = `${baseName}.${extension}`;
      const thumbnailFilename = `${baseName}_thumb.${extension}`;
      const optimizedPath = path.join(outputDir, optimizedFilename);
      const thumbnailPath = generateThumbnail
        ? path.join(outputDir, thumbnailFilename)
        : undefined;

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Create Sharp instance
      let sharpInstance = sharp(inputPath);

      // Get original image metadata (for future use)
      await sharpInstance.metadata();

      // Apply transformations for main image
      if (options.width || options.height) {
        const resizeOptions: sharp.ResizeOptions = {
          fit: options.maintainAspectRatio ? 'inside' : 'cover',
          withoutEnlargement: true,
        };

        if (options.width) resizeOptions.width = options.width;
        if (options.height) resizeOptions.height = options.height;

        sharpInstance = sharpInstance.resize(resizeOptions);
      }

      // Apply format and quality
      switch (outputFormat) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality: options.quality || 85,
            progressive: true,
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            compressionLevel: 9,
            progressive: true,
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: options.quality || 85,
          });
          break;
      }

      // Save optimized image
      await sharpInstance.toFile(optimizedPath);

      // Generate thumbnail if requested
      if (generateThumbnail && thumbnailPath) {
        await sharp(inputPath)
          .resize(this.thumbnailOptions.width, this.thumbnailOptions.height, {
            fit: this.thumbnailOptions.maintainAspectRatio ? 'inside' : 'cover',
            withoutEnlargement: true,
          })
          .jpeg({ quality: this.thumbnailOptions.quality || 80 })
          .toFile(thumbnailPath);
      }

      // Get optimized file stats
      const optimizedStats = await fs.stat(optimizedPath);
      const optimizedSize = optimizedStats.size;
      const compressionRatio =
        ((originalSize - optimizedSize) / originalSize) * 100;

      // Get final dimensions
      const finalMetadata = await sharp(optimizedPath).metadata();
      const finalDimensions = {
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
      };

      const result: OptimizedImageResult = {
        originalPath: inputPath,
        optimizedPath,
        thumbnailPath,
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions: finalDimensions,
      };

      this.logger.log(
        `Image optimized: ${filename} | ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB | ${compressionRatio.toFixed(1)}% reduction`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to optimize image ${filename}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Image optimization failed: ${errorMessage}`);
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`Cleaned up temporary file: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to cleanup temporary file ${filePath}:`, error);
    }
  }

  /**
   * Validate image file type
   */
  isValidImageFormat(mimetype: string): boolean {
    const validMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    return validMimeTypes.includes(mimetype.toLowerCase());
  }

  /**
   * Get optimized filename with extension
   */
  getOptimizedFilename(
    originalFilename: string,
    format: string = 'jpeg',
  ): string {
    const parsedPath = path.parse(originalFilename);
    const extension = format === 'jpeg' ? 'jpg' : format;
    return `${parsedPath.name}.${extension}`;
  }

  /**
   * Get thumbnail filename
   */
  getThumbnailFilename(
    originalFilename: string,
    format: string = 'jpeg',
  ): string {
    const parsedPath = path.parse(originalFilename);
    const extension = format === 'jpeg' ? 'jpg' : format;
    return `${parsedPath.name}_thumb.${extension}`;
  }
}

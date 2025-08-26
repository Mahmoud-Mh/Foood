import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Category name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Category description' })
  @Expose()
  description: string;

  @ApiPropertyOptional({ description: 'Category icon/emoji' })
  @Expose()
  icon?: string;

  @ApiPropertyOptional({ description: 'Category cover image URL' })
  @Expose()
  imageUrl?: string;

  @ApiProperty({ description: 'Category slug for URLs' })
  @Expose()
  slug: string;

  @ApiProperty({ description: 'Is category active/visible' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  @Expose()
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Number of recipes in this category' })
  @Expose()
  recipeCount?: number;

  @ApiProperty({ description: 'Category creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Category last update date' })
  @Expose()
  updatedAt: Date;
}

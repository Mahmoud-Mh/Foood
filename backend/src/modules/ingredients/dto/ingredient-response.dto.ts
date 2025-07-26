import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IngredientCategory } from '../entities/ingredient.entity';

export class IngredientResponseDto {
  @ApiProperty({ description: 'Ingredient unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Ingredient name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Ingredient description' })
  @Expose()
  description: string;

  @ApiProperty({ 
    description: 'Ingredient category',
    enum: IngredientCategory
  })
  @Expose()
  category: IngredientCategory;

  @ApiPropertyOptional({ description: 'Ingredient image URL' })
  @Expose()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Nutritional info (calories per 100g)' })
  @Expose()
  caloriesPerUnit?: number;

  @ApiProperty({ description: 'Default unit of measurement' })
  @Expose()
  defaultUnit: string;

  @ApiProperty({ description: 'Is ingredient available/active' })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Allergen information' })
  @Expose()
  allergenInfo?: string;

  @ApiPropertyOptional({ description: 'Number of recipes using this ingredient' })
  @Expose()
  usageCount?: number;

  @ApiProperty({ description: 'Ingredient creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Ingredient last update date' })
  @Expose()
  updatedAt: Date;
} 
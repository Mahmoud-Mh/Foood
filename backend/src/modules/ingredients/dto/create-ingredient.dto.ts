import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  IsEnum,
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';
import { IngredientCategory } from '../entities/ingredient.entity';

export class CreateIngredientDto {
  @ApiProperty({
    description: 'Ingredient name',
    example: 'Fresh Tomato',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Ingredient description',
    example: 'Fresh red tomato, perfect for salads and cooking',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({
    description: 'Ingredient category',
    enum: IngredientCategory,
    example: IngredientCategory.VEGETABLE,
  })
  @IsOptional()
  @IsEnum(IngredientCategory)
  category?: IngredientCategory;

  @ApiPropertyOptional({
    description: 'Ingredient image URL',
    example: 'https://example.com/tomato.jpg',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Nutritional info (calories per 100g)',
    example: 18,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caloriesPerUnit?: number;

  @ApiPropertyOptional({
    description: 'Default unit of measurement',
    example: 'grams',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  defaultUnit?: string;

  @ApiPropertyOptional({
    description: 'Allergen information',
    example: 'May contain traces of nuts',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  allergenInfo?: string;
}

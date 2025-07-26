import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  MaxLength, 
  MinLength,
  IsNumber,
  Min
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ 
    description: 'Category name',
    example: 'Italian Cuisine',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    description: 'Category description',
    example: 'Traditional Italian dishes and recipes',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ 
    description: 'Category icon/emoji',
    example: '🍝',
    maxLength: 10
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiPropertyOptional({ 
    description: 'Category cover image URL',
    example: 'https://example.com/italian-cuisine.jpg'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order for display (higher numbers appear first)',
    example: 1,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
} 
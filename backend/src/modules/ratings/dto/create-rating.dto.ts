import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  IsUUID,
  Min,
  Max,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ 
    description: 'Recipe ID to rate', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID()
  @IsNotEmpty()
  recipeId: string;

  @ApiProperty({ 
    description: 'Rating score from 1 to 5', 
    minimum: 1, 
    maximum: 5,
    example: 4 
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating: number;

  @ApiProperty({ 
    description: 'Optional review comment', 
    maxLength: 1000,
    required: false,
    example: 'This recipe was delicious and easy to follow!'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Comment must be less than 1000 characters' })
  comment?: string;
}
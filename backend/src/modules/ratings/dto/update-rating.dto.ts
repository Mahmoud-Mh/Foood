import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateRatingDto {
  @ApiProperty({ 
    description: 'Updated rating score from 1 to 5', 
    minimum: 1, 
    maximum: 5,
    example: 5,
    required: false
  })
  @IsOptional()
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating?: number;

  @ApiProperty({ 
    description: 'Updated review comment', 
    maxLength: 1000,
    required: false,
    example: 'Updated: This recipe was absolutely amazing!'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Comment must be less than 1000 characters' })
  comment?: string;
}
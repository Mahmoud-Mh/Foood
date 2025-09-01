import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum RatingSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  HIGHEST = 'highest',
  LOWEST = 'lowest',
  MOST_HELPFUL = 'most_helpful',
}

export class GetRatingsDto extends PaginationDto {
  @ApiProperty({ 
    description: 'Recipe ID to get ratings for', 
    required: false 
  })
  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @ApiProperty({ 
    description: 'User ID to get ratings by', 
    required: false 
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ 
    description: 'Minimum rating to filter by', 
    minimum: 1, 
    maximum: 5,
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @ApiProperty({ 
    description: 'Maximum rating to filter by', 
    minimum: 1, 
    maximum: 5,
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  maxRating?: number;

  @ApiProperty({ 
    description: 'Sort ratings by', 
    enum: RatingSortBy,
    required: false,
    default: RatingSortBy.NEWEST 
  })
  @IsOptional()
  @IsEnum(RatingSortBy)
  sortBy?: RatingSortBy = RatingSortBy.NEWEST;

  @ApiProperty({ 
    description: 'Only ratings with comments', 
    required: false 
  })
  @IsOptional()
  @Type(() => Boolean)
  withComments?: boolean;

  @ApiProperty({ 
    description: 'Only verified ratings', 
    required: false 
  })
  @IsOptional()
  @Type(() => Boolean)
  verifiedOnly?: boolean;

  @ApiProperty({ 
    description: 'Search in rating comments', 
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;
}
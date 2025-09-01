import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, IsString, IsBoolean, IsDate, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RatingResponseDto {
  @ApiProperty({ description: 'Rating unique identifier' })
  @IsUUID()
  id: string;

  @ApiProperty({ 
    description: 'Rating score from 1 to 5', 
    minimum: 1, 
    maximum: 5 
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ 
    description: 'Review comment', 
    required: false 
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'Is the review verified' })
  @IsBoolean()
  isVerified: boolean;

  @ApiProperty({ description: 'Number of helpful votes' })
  @IsInt()
  helpfulCount: number;

  @ApiProperty({ description: 'User ID who created the rating' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'User full name' })
  @IsString()
  userFullName: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @IsOptional()
  @IsString()
  userAvatar?: string;

  @ApiProperty({ description: 'Recipe ID being rated' })
  @IsUUID()
  recipeId: string;

  @ApiProperty({ description: 'Recipe title' })
  @IsString()
  recipeTitle: string;

  @ApiProperty({ description: 'Rating creation date' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Rating last update date' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class RecipeRatingSummaryDto {
  @ApiProperty({ description: 'Recipe ID' })
  @IsUUID()
  recipeId: string;

  @ApiProperty({ description: 'Recipe title' })
  @IsString()
  recipeTitle: string;

  @ApiProperty({ description: 'Average rating (1-5)', example: 4.2 })
  @IsInt()
  averageRating: number;

  @ApiProperty({ description: 'Total number of ratings' })
  @IsInt()
  ratingsCount: number;

  @ApiProperty({ description: 'Rating distribution by stars' })
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  @ApiProperty({ description: 'Recent ratings', type: [RatingResponseDto] })
  recentRatings: RatingResponseDto[];
}

export class UserRatingsDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Total ratings given' })
  @IsInt()
  totalRatings: number;

  @ApiProperty({ description: 'Average rating given' })
  @IsInt()
  averageRatingGiven: number;

  @ApiProperty({ description: 'User ratings list', type: [RatingResponseDto] })
  ratings: RatingResponseDto[];
}
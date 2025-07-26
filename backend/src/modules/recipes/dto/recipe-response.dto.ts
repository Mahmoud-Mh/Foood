import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DifficultyLevel, RecipeStatus } from '../entities/recipe.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { IngredientResponseDto } from '../../ingredients/dto/ingredient-response.dto';

export class RecipeIngredientResponseDto {
  @ApiProperty({ description: 'Recipe ingredient unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Quantity of ingredient needed' })
  @Expose()
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @Expose()
  unit: string;

  @ApiPropertyOptional({ description: 'Ingredient preparation notes' })
  @Expose()
  preparation?: string;

  @ApiProperty({ description: 'Is this ingredient optional' })
  @Expose()
  isOptional: boolean;

  @ApiProperty({ description: 'Display order in recipe' })
  @Expose()
  order: number;

  @ApiProperty({ description: 'Ingredient details', type: IngredientResponseDto })
  @Expose()
  @Type(() => IngredientResponseDto)
  ingredient: IngredientResponseDto;

  @ApiProperty({ description: 'Formatted quantity display' })
  @Expose()
  displayText: string;

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  createdAt: Date;
}

export class RecipeStepResponseDto {
  @ApiProperty({ description: 'Recipe step unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Step order number' })
  @Expose()
  stepNumber: number;

  @ApiProperty({ description: 'Step title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Step detailed instructions' })
  @Expose()
  instructions: string;

  @ApiPropertyOptional({ description: 'Time required for this step in minutes' })
  @Expose()
  timeMinutes?: number;

  @ApiPropertyOptional({ description: 'Step image URL' })
  @Expose()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Important tips or notes for this step' })
  @Expose()
  tips?: string;

  @ApiPropertyOptional({ description: 'Temperature if applicable' })
  @Expose()
  temperature?: string;

  @ApiPropertyOptional({ description: 'Equipment needed for this step', type: [String] })
  @Expose()
  equipment?: string[];

  @ApiProperty({ description: 'Is this step active/visible' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Formatted step display' })
  @Expose()
  displayTitle: string;

  @ApiProperty({ description: 'Time display with unit' })
  @Expose()
  timeDisplay: string;

  @ApiProperty({ description: 'Step creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Step last update date' })
  @Expose()
  updatedAt: Date;
}

export class RecipeResponseDto {
  @ApiProperty({ description: 'Recipe unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Recipe title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Recipe description' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Recipe instructions' })
  @Expose()
  instructions: string;

  @ApiProperty({ description: 'Preparation time in minutes' })
  @Expose()
  prepTimeMinutes: number;

  @ApiProperty({ description: 'Cooking time in minutes' })
  @Expose()
  cookTimeMinutes: number;

  @ApiProperty({ description: 'Total cooking time (prep + cook)' })
  @Expose()
  totalTimeMinutes: number;

  @ApiProperty({ description: 'Number of servings' })
  @Expose()
  servings: number;

  @ApiProperty({ 
    description: 'Recipe difficulty level',
    enum: DifficultyLevel
  })
  @Expose()
  difficulty: DifficultyLevel;

  @ApiProperty({ 
    description: 'Recipe status',
    enum: RecipeStatus
  })
  @Expose()
  status: RecipeStatus;

  @ApiPropertyOptional({ description: 'Recipe main image URL' })
  @Expose()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Additional recipe images', type: [String] })
  @Expose()
  additionalImages?: string[];

  @ApiPropertyOptional({ description: 'Recipe tags for search', type: [String] })
  @Expose()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Nutritional information per serving' })
  @Expose()
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };

  @ApiPropertyOptional({ description: 'Recipe notes or tips' })
  @Expose()
  notes?: string;

  @ApiProperty({ description: 'Recipe views count' })
  @Expose()
  viewsCount: number;

  @ApiProperty({ description: 'Recipe likes count' })
  @Expose()
  likesCount: number;

  @ApiProperty({ description: 'Is recipe featured' })
  @Expose()
  isFeatured: boolean;

  @ApiProperty({ description: 'Is recipe active/visible' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Recipe author ID' })
  @Expose()
  authorId: string;

  @ApiProperty({ description: 'Recipe category ID' })
  @Expose()
  categoryId: string;

  @ApiProperty({ description: 'Recipe author details', type: UserResponseDto })
  @Expose()
  @Type(() => UserResponseDto)
  author?: UserResponseDto;

  @ApiProperty({ description: 'Recipe category details', type: CategoryResponseDto })
  @Expose()
  @Type(() => CategoryResponseDto)
  category?: CategoryResponseDto;

  @ApiProperty({ 
    description: 'Recipe ingredients', 
    type: [RecipeIngredientResponseDto] 
  })
  @Expose()
  @Type(() => RecipeIngredientResponseDto)
  recipeIngredients?: RecipeIngredientResponseDto[];

  @ApiProperty({ 
    description: 'Recipe steps', 
    type: [RecipeStepResponseDto] 
  })
  @Expose()
  @Type(() => RecipeStepResponseDto)
  steps?: RecipeStepResponseDto[];

  @ApiPropertyOptional({ description: 'Average rating' })
  @Expose()
  averageRating?: number;

  @ApiPropertyOptional({ description: 'Number of ratings' })
  @Expose()
  ratingsCount?: number;

  @ApiPropertyOptional({ description: 'Number of comments' })
  @Expose()
  commentsCount?: number;

  @ApiPropertyOptional({ description: 'Number of ingredients' })
  @Expose()
  ingredientsCount?: number;

  @ApiPropertyOptional({ description: 'Number of steps' })
  @Expose()
  stepsCount?: number;

  @ApiProperty({ description: 'Recipe creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Recipe last update date' })
  @Expose()
  updatedAt: Date;
}

// Simplified version for lists
export class RecipeListResponseDto {
  @ApiProperty({ description: 'Recipe unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Recipe title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Recipe description' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Preparation time in minutes' })
  @Expose()
  prepTimeMinutes: number;

  @ApiProperty({ description: 'Cooking time in minutes' })
  @Expose()
  cookTimeMinutes: number;

  @ApiProperty({ description: 'Total cooking time (prep + cook)' })
  @Expose()
  totalTimeMinutes: number;

  @ApiProperty({ description: 'Number of servings' })
  @Expose()
  servings: number;

  @ApiProperty({ 
    description: 'Recipe difficulty level',
    enum: DifficultyLevel
  })
  @Expose()
  difficulty: DifficultyLevel;

  @ApiProperty({ description: 'Recipe main image URL' })
  @Expose()
  imageUrl?: string;

  @ApiProperty({ description: 'Recipe views count' })
  @Expose()
  viewsCount: number;

  @ApiProperty({ description: 'Recipe likes count' })
  @Expose()
  likesCount: number;

  @ApiProperty({ description: 'Is recipe featured' })
  @Expose()
  isFeatured: boolean;

  @ApiProperty({ description: 'Recipe author details', type: UserResponseDto })
  @Expose()
  @Type(() => UserResponseDto)
  author?: UserResponseDto;

  @ApiProperty({ description: 'Recipe category details', type: CategoryResponseDto })
  @Expose()
  @Type(() => CategoryResponseDto)
  category?: CategoryResponseDto;

  @ApiPropertyOptional({ description: 'Average rating' })
  @Expose()
  averageRating?: number;

  @ApiPropertyOptional({ description: 'Number of ratings' })
  @Expose()
  ratingsCount?: number;

  @ApiPropertyOptional({ description: 'Number of ingredients' })
  @Expose()
  ingredientsCount?: number;

  @ApiPropertyOptional({ description: 'Number of steps' })
  @Expose()
  stepsCount?: number;

  @ApiProperty({ description: 'Recipe creation date' })
  @Expose()
  createdAt: Date;
} 
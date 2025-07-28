import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  MaxLength, 
  MinLength,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsUrl,
  IsBoolean
} from 'class-validator';
import { DifficultyLevel, RecipeStatus } from '../entities/recipe.entity';

export class CreateRecipeIngredientDto {
  @ApiProperty({ description: 'Ingredient ID (UUID) or ingredient name (string)' })
  @IsNotEmpty()
  @IsString()
  ingredientId: string;

  @ApiProperty({ description: 'Quantity needed', example: 250 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement', example: 'grams' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit: string;

  @ApiPropertyOptional({ description: 'Preparation notes', example: 'finely chopped' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  preparation?: string;

  @ApiPropertyOptional({ description: 'Is optional ingredient', default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;
}

export class CreateRecipeStepDto {
  @ApiProperty({ description: 'Step number', example: 1 })
  @IsNumber()
  @Min(1)
  stepNumber: number;

  @ApiProperty({ description: 'Step title', example: 'Prepare the pasta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Step instructions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  instructions: string;

  @ApiPropertyOptional({ description: 'Time for this step (minutes)', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(480) // Max 8 hours per step
  timeMinutes?: number;

  @ApiPropertyOptional({ description: 'Step image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Tips for this step' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tips?: string;

  @ApiPropertyOptional({ description: 'Temperature if applicable', example: '180°C' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  temperature?: string;

  @ApiPropertyOptional({ description: 'Equipment needed', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  equipment?: string[];
}

export class CreateRecipeDto {
  @ApiProperty({ 
    description: 'Recipe title',
    example: 'Spaghetti Carbonara',
    minLength: 3,
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ 
    description: 'Recipe description',
    example: 'A classic Italian pasta dish with eggs, cheese, and pancetta',
    maxLength: 1000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ 
    description: 'Recipe instructions',
    example: 'Follow the steps below to prepare this delicious dish',
    maxLength: 5000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  instructions: string;

  @ApiProperty({ 
    description: 'Preparation time in minutes',
    example: 15,
    minimum: 1,
    maximum: 480
  })
  @IsNumber()
  @Min(1)
  @Max(480) // Max 8 hours
  prepTimeMinutes: number;

  @ApiProperty({ 
    description: 'Cooking time in minutes',
    example: 20,
    minimum: 1,
    maximum: 960
  })
  @IsNumber()
  @Min(1)
  @Max(960) // Max 16 hours
  cookTimeMinutes: number;

  @ApiProperty({ 
    description: 'Number of servings',
    example: 4,
    minimum: 1,
    maximum: 50
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  servings: number;

  @ApiProperty({ description: 'Recipe category ID' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ 
    description: 'Recipe difficulty level',
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({ 
    description: 'Recipe status',
    enum: RecipeStatus,
    example: RecipeStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(RecipeStatus)
  status?: RecipeStatus;

  @ApiPropertyOptional({ description: 'Recipe main image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Additional recipe images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalImages?: string[];

  @ApiPropertyOptional({ description: 'Recipe tags for search', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Nutritional information per serving',
    example: { calories: 450, protein: 20, carbs: 60, fat: 15, fiber: 3 }
  })
  @IsOptional()
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };

  @ApiPropertyOptional({ description: 'Recipe notes or tips' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ description: 'Recipe ingredients', type: [CreateRecipeIngredientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients: CreateRecipeIngredientDto[];

  @ApiProperty({ description: 'Recipe steps', type: [CreateRecipeStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeStepDto)
  steps: CreateRecipeStepDto[];
} 
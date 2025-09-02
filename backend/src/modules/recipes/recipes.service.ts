import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { plainToClass } from 'class-transformer';
import {
  Recipe,
  RecipeStatus,
  DifficultyLevel,
} from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {
  RecipeResponseDto,
  RecipeListResponseDto,
} from './dto/recipe-response.dto';
import {
  PaginationDto,
  PaginatedResultDto,
} from '../../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';
import { IngredientsService } from '../ingredients/ingredients.service';
import { IngredientCategory } from '../ingredients/entities/ingredient.entity';
import {
  CreateRecipeIngredientDto,
  CreateRecipeStepDto,
} from './dto/create-recipe.dto';

export interface RecipeFilters {
  categoryId?: string;
  difficulty?: DifficultyLevel;
  status?: RecipeStatus;
  authorId?: string;
  minPrepTime?: number;
  maxPrepTime?: number;
  minCookTime?: number;
  maxCookTime?: number;
  minServings?: number;
  maxServings?: number;
  tags?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface RecipeSortOptions {
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'title'
    | 'viewsCount'
    | 'likesCount'
    | 'totalTimeMinutes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface RecipeSearchFilters {
  categoryId?: string;
  difficulty?: DifficultyLevel;
  maxTime?: number;
  minRating?: number;
  maxPrepTime?: number;
  maxCookTime?: number;
  maxServings?: number;
  minServings?: number;
  status?: RecipeStatus;
  authorId?: string;
  isFeatured?: boolean;
  tags?: string[];
  searchTerm?: string;
}

// Type definitions for raw query results
interface AverageTimesRawResult {
  avgPrep: string | null;
  avgCook: string | null;
}

interface CategoryStatsRawResult {
  categoryName: string | null;
  count: string;
}

interface DifficultyStatsRawResult {
  difficulty: DifficultyLevel;
  count: string;
}

interface ProcessedIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  preparation?: string;
  isOptional?: boolean;
  order: number;
  recipeId: string;
}

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,

    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepository: Repository<RecipeIngredient>,

    @InjectRepository(RecipeStep)
    private readonly recipeStepRepository: Repository<RecipeStep>,

    private readonly ingredientsService: IngredientsService,
  ) {}

  /**
   * Create a new recipe with ingredients and steps
   */
  async create(
    createRecipeDto: CreateRecipeDto,
    authorId: string,
  ): Promise<RecipeResponseDto> {
    console.log('RecipesService.create called with:', {
      authorId,
      ingredientsCount: createRecipeDto.ingredients.length,
    });

    try {
      // Validate ingredients and steps order
      this.validateCreateRecipeDto(createRecipeDto);
      console.log('Validation passed');

      // Create recipe entity
      const recipe = this.recipeRepository.create({
        ...createRecipeDto,
        authorId,
        status: createRecipeDto.status || RecipeStatus.DRAFT,
        difficulty: createRecipeDto.difficulty || DifficultyLevel.EASY,
      });
      console.log('Recipe entity created');

      // Save recipe first
      const savedRecipe = await this.recipeRepository.save(recipe);
      console.log('Recipe saved with ID:', savedRecipe.id);

      // Process ingredients - create new ingredients if needed
      const processedIngredients: ProcessedIngredient[] = [];
      for (const ingredient of createRecipeDto.ingredients) {
        console.log('Processing ingredient:', ingredient.ingredientId);
        let ingredientId = ingredient.ingredientId;

        // If ingredientId is not a UUID, create a new ingredient
        if (!this.isUUID(ingredientId)) {
          console.log('Creating new ingredient for:', ingredientId);
          try {
            const newIngredient = await this.ingredientsService.create({
              name: ingredientId,
              description: `Custom ingredient: ${ingredientId}`,
              category: IngredientCategory.OTHER,
              defaultUnit: ingredient.unit,
            });
            ingredientId = newIngredient.id;
            console.log('New ingredient created with ID:', ingredientId);
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            console.log(
              'Failed to create ingredient, searching for existing:',
              errorMessage,
            );
            // If ingredient already exists, try to find it
            const existingIngredients =
              await this.ingredientsService.searchByName(ingredientId);
            if (existingIngredients.length > 0) {
              ingredientId = existingIngredients[0].id;
              console.log('Found existing ingredient with ID:', ingredientId);
            } else {
              throw new BadRequestException(
                `Failed to create or find ingredient: ${ingredientId}`,
              );
            }
          }
        } else {
          console.log('Using existing ingredient ID:', ingredientId);
        }

        processedIngredients.push({
          ...ingredient,
          ingredientId,
          recipeId: savedRecipe.id,
          order: ingredient.order || processedIngredients.length + 1,
        });
      }
      console.log('All ingredients processed');

      // Create ingredients with order
      const ingredients = processedIngredients.map((ingredient) =>
        this.recipeIngredientRepository.create(ingredient),
      );
      await this.recipeIngredientRepository.save(ingredients);
      console.log('Ingredients saved');

      // Create steps with validation
      const steps = createRecipeDto.steps.map((step) =>
        this.recipeStepRepository.create({
          ...step,
          recipeId: savedRecipe.id,
        }),
      );
      await this.recipeStepRepository.save(steps);
      console.log('Steps saved');

      // Return complete recipe
      const result = await this.findOneForResponse(savedRecipe.id);
      console.log('Recipe creation completed successfully');
      return result;
    } catch (error: unknown) {
      console.error('Error in RecipesService.create:', error);
      throw error;
    }
  }

  /**
   * Find all recipes with advanced filtering and pagination
   */
  async findAll(
    pagination: PaginationDto,
    filters: RecipeFilters = {},
    sort: RecipeSortOptions = {},
  ): Promise<PaginatedResultDto<RecipeListResponseDto>> {
    const { page = 1, limit = 10 } = pagination;
    const { sortBy = 'createdAt', sortOrder = 'DESC' } = sort;

    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.author', 'author')
      .leftJoinAndSelect('recipe.category', 'category')
      .leftJoin('recipe.recipeIngredients', 'ingredients')
      .leftJoin('recipe.steps', 'steps')
      .leftJoin('recipe.ratings', 'ratings', 'ratings.isActive = true')
      .addSelect([
        'COUNT(DISTINCT ingredients.id) as ingredientsCount',
        'COUNT(DISTINCT steps.id) as stepsCount',
        'ROUND(AVG(ratings.rating), 1) as averageRating',
        'COUNT(DISTINCT ratings.id) as ratingsCount',
      ])
      .groupBy('recipe.id, author.id, category.id');

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    // Apply sorting
    if (sortBy === 'totalTimeMinutes') {
      queryBuilder
        .addSelect(
          '(recipe.prepTimeMinutes + recipe.cookTimeMinutes)',
          'totalTime',
        )
        .orderBy('totalTime', sortOrder);
    } else {
      queryBuilder.orderBy(`recipe.${sortBy}`, sortOrder);
    }

    // Execute with pagination
    const [recipes, total] = await queryBuilder
      .skip((page - 1) * limit)
      .limit(limit)
      .getManyAndCount();

    // Transform to response DTOs
    const transformedRecipes = recipes.map((recipe) =>
      this.transformToListResponseDto(recipe),
    );

    return {
      data: transformedRecipes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * Find one recipe by ID with full details
   */
  async findOne(id: string): Promise<Recipe | null> {
    return this.recipeRepository.findOne({
      where: { id },
      relations: [
        'author',
        'category',
        'recipeIngredients',
        'recipeIngredients.ingredient',
        'steps',
      ],
      order: {
        recipeIngredients: { order: 'ASC' },
        steps: { stepNumber: 'ASC' },
      },
    });
  }

  /**
   * Find one recipe and transform to response DTO
   */
  async findOneForResponse(id: string): Promise<RecipeResponseDto> {
    const recipe = await this.findOne(id);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return this.transformToResponseDto(recipe);
  }

  /**
   * Update recipe with permission check
   */
  async update(
    id: string,
    updateRecipeDto: UpdateRecipeDto,
    userId: string,
    userRole: UserRole,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.findOne(id);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Check permissions
    if (recipe.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own recipes');
    }

    // Handle ingredients update
    if (updateRecipeDto.ingredients) {
      await this.updateRecipeIngredients(id, updateRecipeDto.ingredients);
      delete updateRecipeDto.ingredients;
    }

    // Handle steps update
    if (updateRecipeDto.steps) {
      await this.updateRecipeSteps(id, updateRecipeDto.steps);
      delete updateRecipeDto.steps;
    }

    // Update recipe entity
    await this.recipeRepository.update(id, updateRecipeDto);

    return this.findOneForResponse(id);
  }

  /**
   * Remove recipe with permission check
   */
  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const recipe = await this.findOne(id);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Check permissions
    if (recipe.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own recipes');
    }

    // Cascade delete will handle ingredients and steps
    await this.recipeRepository.delete(id);
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.recipeRepository.increment({ id }, 'viewsCount', 1);
  }

  /**
   * Toggle like count (simplified - real implementation would track users)
   */
  async toggleLike(id: string, increment: boolean): Promise<number> {
    if (increment) {
      await this.recipeRepository.increment({ id }, 'likesCount', 1);
    } else {
      await this.recipeRepository.decrement({ id }, 'likesCount', 1);
    }

    const recipe = await this.recipeRepository.findOne({
      where: { id },
      select: ['likesCount'],
    });
    return recipe?.likesCount || 0;
  }

  /**
   * Find recipes by author
   */
  async findByAuthor(
    authorId: string,
    pagination: PaginationDto,
    includePrivate: boolean = false,
  ): Promise<PaginatedResultDto<RecipeListResponseDto>> {
    const filters: RecipeFilters = {
      authorId,
      ...(includePrivate ? {} : { status: RecipeStatus.PUBLISHED }),
    };

    return this.findAll(pagination, filters);
  }

  /**
   * Find featured recipes
   */
  async findFeatured(
    pagination: PaginationDto,
  ): Promise<PaginatedResultDto<RecipeListResponseDto>> {
    const filters: RecipeFilters = {
      isFeatured: true,
      status: RecipeStatus.PUBLISHED,
      isActive: true,
    };

    return this.findAll(pagination, filters, {
      sortBy: 'likesCount',
      sortOrder: 'DESC',
    });
  }

  /**
   * Search recipes by text
   */
  async search(
    query: string,
    pagination: PaginationDto,
    filters: RecipeSearchFilters = {},
  ): Promise<PaginatedResultDto<RecipeListResponseDto>> {
    const searchFilters: RecipeFilters = {
      ...filters,
      search: query,
      status: RecipeStatus.PUBLISHED,
      isActive: true,
    };

    return this.findAll(pagination, searchFilters);
  }

  /**
   * Find published recipes for public access
   */
  async findPublished(
    paginationDto: PaginationDto,
    filters: Omit<RecipeSearchFilters, 'status'> = {},
  ): Promise<PaginatedResultDto<RecipeListResponseDto>> {
    return this.findAll(paginationDto, {
      ...filters,
      status: RecipeStatus.PUBLISHED,
    });
  }

  /**
   * Get recipe statistics
   */
  async getRecipeStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    featured: number;
    averagePreparationTime: number;
    averageCookingTime: number;
    mostPopularCategory: string;
    recipesPerDifficulty: { [key in DifficultyLevel]: number };
  }> {
    const results = await Promise.all([
      this.recipeRepository.count(),
      this.recipeRepository.count({
        where: { status: RecipeStatus.PUBLISHED },
      }),
      this.recipeRepository.count({ where: { status: RecipeStatus.DRAFT } }),
      this.recipeRepository.count({ where: { isFeatured: true } }),
      this.recipeRepository
        .createQueryBuilder('recipe')
        .select('AVG(recipe.prepTimeMinutes)', 'avgPrep')
        .addSelect('AVG(recipe.cookTimeMinutes)', 'avgCook')
        .getRawOne(),
      this.recipeRepository
        .createQueryBuilder('recipe')
        .leftJoin('recipe.category', 'category')
        .select('category.name', 'categoryName')
        .addSelect('COUNT(*)', 'count')
        .groupBy('category.name')
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne(),
      this.recipeRepository
        .createQueryBuilder('recipe')
        .select('recipe.difficulty', 'difficulty')
        .addSelect('COUNT(*)', 'count')
        .groupBy('recipe.difficulty')
        .getRawMany(),
    ]);

    const totalRecipes = results[0];
    const publishedRecipes = results[1];
    const draftRecipes = results[2];
    const featuredRecipes = results[3];
    const typedAvgTimes = results[4] as AverageTimesRawResult;
    const typedMostPopular = results[5] as CategoryStatsRawResult | undefined;
    const typedDifficultyStats = results[6] as DifficultyStatsRawResult[];

    const recipesPerDifficulty = typedDifficultyStats.reduce(
      (
        acc: { [key in DifficultyLevel]: number },
        stat: DifficultyStatsRawResult,
      ) => {
        acc[stat.difficulty] = parseInt(stat.count, 10);
        return acc;
      },
      {} as { [key in DifficultyLevel]: number },
    );

    return {
      total: totalRecipes,
      published: publishedRecipes,
      draft: draftRecipes,
      featured: featuredRecipes,
      averagePreparationTime: Math.round(
        typedAvgTimes?.avgPrep ? parseFloat(typedAvgTimes.avgPrep) : 0,
      ),
      averageCookingTime: Math.round(
        typedAvgTimes?.avgCook ? parseFloat(typedAvgTimes.avgCook) : 0,
      ),
      mostPopularCategory: typedMostPopular?.categoryName || 'N/A',
      recipesPerDifficulty,
    };
  }

  /**
   * Toggle recipe featured status (admin only)
   */
  async toggleFeatured(id: string): Promise<RecipeResponseDto> {
    const recipe = await this.findOne(id);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    await this.recipeRepository.update(id, { isFeatured: !recipe.isFeatured });
    return this.findOneForResponse(id);
  }

  /**
   * Change recipe status
   */
  async changeStatus(
    id: string,
    status: RecipeStatus,
    userId: string,
    userRole: UserRole,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.findOne(id);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Check permissions
    if (recipe.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You can only change status of your own recipes',
      );
    }

    await this.recipeRepository.update(id, { status });
    return this.findOneForResponse(id);
  }

  // Private helper methods
  private validateCreateRecipeDto(dto: CreateRecipeDto): void {
    // Validate ingredients exist
    if (dto.ingredients.length === 0) {
      throw new BadRequestException('Recipe must have at least one ingredient');
    }

    // Validate steps order
    if (dto.steps.length === 0) {
      throw new BadRequestException('Recipe must have at least one step');
    }

    const stepNumbers = dto.steps
      .map((s) => s.stepNumber)
      .sort((a, b) => a - b);
    for (let i = 0; i < stepNumbers.length; i++) {
      if (stepNumbers[i] !== i + 1) {
        throw new BadRequestException(
          'Step numbers must be consecutive starting from 1',
        );
      }
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Recipe>,
    filters: RecipeFilters,
  ): void {
    if (filters.search) {
      queryBuilder.andWhere(
        '(LOWER(recipe.title) LIKE LOWER(:search) OR LOWER(recipe.description) LIKE LOWER(:search) OR recipe.tags::text ILIKE :searchTags)',
        {
          search: `%${filters.search}%`,
          searchTags: `%${filters.search}%`,
        },
      );
    }

    if (filters.categoryId) {
      queryBuilder.andWhere('recipe.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.difficulty) {
      queryBuilder.andWhere('recipe.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('recipe.status = :status', {
        status: filters.status,
      });
    }

    if (filters.authorId) {
      queryBuilder.andWhere('recipe.authorId = :authorId', {
        authorId: filters.authorId,
      });
    }

    if (filters.minPrepTime) {
      queryBuilder.andWhere('recipe.prepTimeMinutes >= :minPrepTime', {
        minPrepTime: filters.minPrepTime,
      });
    }

    if (filters.maxPrepTime) {
      queryBuilder.andWhere('recipe.prepTimeMinutes <= :maxPrepTime', {
        maxPrepTime: filters.maxPrepTime,
      });
    }

    if (filters.minCookTime) {
      queryBuilder.andWhere('recipe.cookTimeMinutes >= :minCookTime', {
        minCookTime: filters.minCookTime,
      });
    }

    if (filters.maxCookTime) {
      queryBuilder.andWhere('recipe.cookTimeMinutes <= :maxCookTime', {
        maxCookTime: filters.maxCookTime,
      });
    }

    if (filters.minServings) {
      queryBuilder.andWhere('recipe.servings >= :minServings', {
        minServings: filters.minServings,
      });
    }

    if (filters.maxServings) {
      queryBuilder.andWhere('recipe.servings <= :maxServings', {
        maxServings: filters.maxServings,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('recipe.tags && :tags', { tags: filters.tags });
    }

    if (filters.isFeatured !== undefined) {
      queryBuilder.andWhere('recipe.isFeatured = :isFeatured', {
        isFeatured: filters.isFeatured,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('recipe.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }
  }

  private async updateRecipeIngredients(
    recipeId: string,
    ingredients: CreateRecipeIngredientDto[],
  ): Promise<void> {
    // Delete existing ingredients
    await this.recipeIngredientRepository.delete({ recipeId });

    // Create new ingredients
    const newIngredients = ingredients.map((ingredient, index) => ({
      ...ingredient,
      recipeId,
      order: ingredient.order || index + 1,
    }));
    await this.recipeIngredientRepository.save(newIngredients);
  }

  private async updateRecipeSteps(
    recipeId: string,
    steps: CreateRecipeStepDto[],
  ): Promise<void> {
    // Delete existing steps
    await this.recipeStepRepository.delete({ recipeId });

    // Create new steps
    const newSteps = steps.map((step) => ({
      ...step,
      recipeId,
    }));
    await this.recipeStepRepository.save(newSteps);
  }

  private transformToResponseDto(recipe: Recipe): RecipeResponseDto {
    const transformed = plainToClass(RecipeResponseDto, recipe, {
      excludeExtraneousValues: true,
    });

    // Add computed fields
    transformed.ingredientsCount = recipe.recipeIngredients?.length || 0;
    transformed.stepsCount = recipe.steps?.length || 0;

    // Add ingredients alias for backward compatibility
    transformed.ingredients = transformed.recipeIngredients;

    return transformed;
  }

  private transformToListResponseDto(recipe: any): RecipeListResponseDto {
    const transformed = plainToClass(RecipeListResponseDto, recipe, {
      excludeExtraneousValues: true,
    });

    // Add computed fields
    transformed.ingredientsCount = parseInt(recipe.ingredientsCount) || 0;
    transformed.stepsCount = parseInt(recipe.stepsCount) || 0;
    
    // Add rating fields from query aggregation
    transformed.averageRating = recipe.averageRating !== null && recipe.averageRating !== undefined ? 
      parseFloat(recipe.averageRating) : 0;
    transformed.ratingsCount = parseInt(recipe.ratingsCount) || 0;

    return transformed;
  }

  private isUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

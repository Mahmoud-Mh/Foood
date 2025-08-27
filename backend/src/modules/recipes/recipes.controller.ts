import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  UseGuards,
  ParseEnumPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { RecipesService, RecipeSearchFilters } from './recipes.service';
import {
  RecipeSearchService,
  RecipeSearchFilters as SearchServiceFilters,
  RecipeSearchOptions,
} from './services/recipe-search.service';
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
import { ApiResponseDto } from '../../common/dto/response.dto';

import { DifficultyLevel, RecipeStatus } from './entities/recipe.entity';
import { UserRole } from '../users/entities/user.entity';

// Interface for current user from JWT token
interface CurrentUserPayload {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

// Interface for recipe statistics
interface RecipeStatsResult {
  total: number;
  published: number;
  draft: number;
  featured: number;
  averagePreparationTime: number;
  averageCookingTime: number;
  mostPopularCategory: string;
  recipesPerDifficulty: { [key in DifficultyLevel]: number };
}

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  Public,
  AdminOnly,
  UserOrAdmin,
  CurrentUser,
  CurrentUserId,
} from '../../common/decorators/auth.decorators';

@ApiTags('Recipes')
@Controller('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly recipeSearchService: RecipeSearchService,
  ) {}

  // === PUBLIC ENDPOINTS (No authentication required) ===

  @Get('published')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get all published recipes (public)',
    description:
      'Retrieve paginated list of published recipes with optional filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    enum: DifficultyLevel,
    description: 'Filter by difficulty',
  })
  @ApiQuery({
    name: 'maxPrepTime',
    required: false,
    type: Number,
    description: 'Maximum prep time in minutes',
  })
  @ApiQuery({
    name: 'maxCookTime',
    required: false,
    type: Number,
    description: 'Maximum cook time in minutes',
  })
  @ApiQuery({
    name: 'minServings',
    required: false,
    type: Number,
    description: 'Minimum servings',
  })
  @ApiQuery({
    name: 'maxServings',
    required: false,
    type: Number,
    description: 'Maximum servings',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: [String],
    description: 'Filter by tags',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Published recipes retrieved successfully',
    type: PaginatedResultDto<RecipeListResponseDto>,
  })
  async findPublished(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('categoryId') categoryId?: string,
    @Query('difficulty') difficulty?: DifficultyLevel,
    @Query('maxPrepTime') maxPrepTime?: number,
    @Query('maxCookTime') maxCookTime?: number,
    @Query('minServings') minServings?: number,
    @Query('maxServings') maxServings?: number,
    @Query('tags') tags?: string[],
  ): Promise<ApiResponseDto<PaginatedResultDto<RecipeListResponseDto>>> {
    const paginationDto: PaginationDto = { page, limit };
    const filters: RecipeSearchFilters = {
      categoryId,
      difficulty,
      maxPrepTime,
      maxCookTime,
      minServings,
      maxServings,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : undefined,
      status: RecipeStatus.PUBLISHED,
    };

    const result = await this.recipesService.findAll(paginationDto, filters);
    return ApiResponseDto.success(
      'Published recipes retrieved successfully',
      result,
    );
  }

  @Get('featured')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get featured recipes (public)',
    description: 'Retrieve list of featured recipes',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Featured recipes retrieved successfully',
    type: PaginatedResultDto<RecipeListResponseDto>,
  })
  async findFeatured(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiResponseDto<PaginatedResultDto<RecipeListResponseDto>>> {
    const paginationDto: PaginationDto = { page, limit };
    const result = await this.recipesService.findFeatured(paginationDto);
    return ApiResponseDto.success(
      'Featured recipes retrieved successfully',
      result,
    );
  }

  @Get('search')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Search published recipes (public)',
    description: 'Search recipes by title, description, or tags',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    enum: DifficultyLevel,
    description: 'Filter by difficulty',
  })
  @ApiQuery({
    name: 'maxTime',
    required: false,
    type: Number,
    description: 'Maximum total time in minutes (prep + cook)',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum average rating (1-5)',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Filter by tags (comma-separated)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'title', 'totalTime', 'viewsCount', 'likesCount'],
    description: 'Sort by field (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: PaginatedResultDto<RecipeListResponseDto>,
  })
  async search(
    @Query('q') searchTerm: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('categoryId') categoryId?: string,
    @Query('difficulty') difficulty?: DifficultyLevel,
    @Query('maxTime') maxTime?: number,
    @Query('minRating') minRating?: number,
    @Query('tags') tagsString?: string,
    @Query('sortBy', new DefaultValuePipe('createdAt'))
    sortBy:
      | 'createdAt'
      | 'title'
      | 'totalTime'
      | 'viewsCount'
      | 'likesCount' = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('DESC'))
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<ApiResponseDto<PaginatedResultDto<RecipeListResponseDto>>> {
    // Parse tags from comma-separated string
    const tags = tagsString
      ? tagsString
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : undefined;

    const filters: SearchServiceFilters = {
      categoryId,
      difficulty,
      maxTime: maxTime || undefined,
      minRating: minRating || undefined,
      tags,
      status: RecipeStatus.PUBLISHED,
    };

    const options: RecipeSearchOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await this.recipeSearchService.searchRecipes(
      searchTerm,
      filters,
      options,
    );
    return ApiResponseDto.success(
      'Search results retrieved successfully',
      result,
    );
  }

  @Get('category/:categoryId')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get recipes by category (public)',
    description: 'Retrieve published recipes from a specific category',
  })
  @ApiParam({ name: 'categoryId', description: 'Category UUID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category recipes retrieved successfully',
    type: PaginatedResultDto<RecipeListResponseDto>,
  })
  async findByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiResponseDto<PaginatedResultDto<RecipeListResponseDto>>> {
    const paginationDto: PaginationDto = { page, limit };
    const filters: RecipeSearchFilters = {
      categoryId,
      status: RecipeStatus.PUBLISHED,
    };
    const result = await this.recipesService.findAll(paginationDto, filters);
    return ApiResponseDto.success(
      'Category recipes retrieved successfully',
      result,
    );
  }

  @Get('difficulty/:difficulty')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get recipes by difficulty (public)',
    description: 'Retrieve published recipes by difficulty level',
  })
  @ApiParam({
    name: 'difficulty',
    enum: DifficultyLevel,
    description: 'Recipe difficulty level',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Difficulty recipes retrieved successfully',
    type: PaginatedResultDto<RecipeListResponseDto>,
  })
  async findByDifficulty(
    @Param('difficulty', new ParseEnumPipe(DifficultyLevel))
    difficulty: DifficultyLevel,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiResponseDto<PaginatedResultDto<RecipeListResponseDto>>> {
    const paginationDto: PaginationDto = { page, limit };
    const filters: RecipeSearchFilters = {
      difficulty,
      status: RecipeStatus.PUBLISHED,
    };
    const result = await this.recipesService.findAll(paginationDto, filters);
    return ApiResponseDto.success(
      'Difficulty recipes retrieved successfully',
      result,
    );
  }

  @Get(':id')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get recipe by ID (public)',
    description:
      'Retrieve a single recipe with full details and increment view count',
  })
  @ApiParam({ name: 'id', description: 'Recipe UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe retrieved successfully',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<RecipeResponseDto>> {
    // Increment view count (simplified)
    await this.recipesService.incrementViewCount(id);

    const recipe = await this.recipesService.findOneForResponse(id);
    return ApiResponseDto.success('Recipe retrieved successfully', recipe);
  }

  // === AUTHENTICATED ENDPOINTS ===

  @Get()
  @UserOrAdmin()
  @ApiOperation({
    summary: 'Get all recipes (authenticated)',
    description:
      'Retrieve paginated list of recipes with admin access to all statuses',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RecipeStatus,
    description: 'Filter by status (admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipes retrieved successfully',
    type: PaginatedResultDto<RecipeListResponseDto>,
  })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: RecipeStatus,
  ): Promise<ApiResponseDto<PaginatedResultDto<RecipeListResponseDto>>> {
    const paginationDto: PaginationDto = { page, limit };
    const filters: RecipeSearchFilters = {};

    // Admins can see all statuses by default, or filter by specific status
    if (user.role === UserRole.ADMIN) {
      if (status) {
        filters.status = status;
      }
      // No status filter for admin = show all statuses
    } else {
      // Non-admins only see published recipes
      filters.status = RecipeStatus.PUBLISHED;
    }

    const result = await this.recipesService.findAll(paginationDto, filters);
    return ApiResponseDto.success('Recipes retrieved successfully', result);
  }

  @Post()
  @UserOrAdmin()
  @ApiOperation({
    summary: 'Create new recipe',
    description: 'Create a new recipe with ingredients and steps',
  })
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recipe created successfully',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid recipe data',
  })
  async create(
    @Body() createRecipeDto: CreateRecipeDto,
    @CurrentUserId() userId: string,
  ): Promise<ApiResponseDto<RecipeResponseDto>> {
    try {
      console.log(
        'Creating recipe with data:',
        JSON.stringify(createRecipeDto, null, 2),
      );
      const recipe = await this.recipesService.create(createRecipeDto, userId);
      return ApiResponseDto.success('Recipe created successfully', recipe);
    } catch (error: unknown) {
      console.error('Error creating recipe:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          statusCode:
            'statusCode' in error
              ? (error as { statusCode: number }).statusCode
              : undefined,
          response:
            'response' in error
              ? (error as { response: unknown }).response
              : undefined,
        });
      }
      throw error;
    }
  }

  @Get('my/recipes')
  @UserOrAdmin()
  @ApiOperation({
    summary: 'Get current user recipes',
    description:
      'Retrieve recipes created by the current user (including drafts)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User recipes retrieved successfully',
    type: PaginatedResultDto<RecipeListResponseDto>,
  })
  async findMyRecipes(
    @CurrentUserId() userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiResponseDto<PaginatedResultDto<RecipeListResponseDto>>> {
    const paginationDto: PaginationDto = { page, limit };
    const result = await this.recipesService.findByAuthor(
      userId,
      paginationDto,
      true,
    );
    return ApiResponseDto.success(
      'User recipes retrieved successfully',
      result,
    );
  }

  @Get('author/:authorId')
  @UserOrAdmin()
  @ApiOperation({
    summary: 'Get recipes by author',
    description: 'Retrieve published recipes by a specific author',
  })
  @ApiParam({ name: 'authorId', description: 'Author UUID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author recipes retrieved successfully',
    type: PaginatedResultDto<RecipeListResponseDto>,
  })
  async findByAuthor(
    @Param('authorId', ParseUUIDPipe) authorId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiResponseDto<PaginatedResultDto<RecipeListResponseDto>>> {
    const paginationDto: PaginationDto = { page, limit };
    const result = await this.recipesService.findByAuthor(
      authorId,
      paginationDto,
      false,
    );
    return ApiResponseDto.success(
      'Author recipes retrieved successfully',
      result,
    );
  }

  @Patch(':id')
  @UserOrAdmin()
  @ApiOperation({
    summary: 'Update recipe',
    description: 'Update recipe (only by author or admin)',
  })
  @ApiParam({ name: 'id', description: 'Recipe UUID' })
  @ApiBody({ type: UpdateRecipeDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe updated successfully',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to update this recipe',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @CurrentUserId() userId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponseDto<RecipeResponseDto>> {
    const recipe = await this.recipesService.update(
      id,
      updateRecipeDto,
      userId,
      user.role,
    );
    return ApiResponseDto.success('Recipe updated successfully', recipe);
  }

  @Delete(':id')
  @UserOrAdmin()
  @ApiOperation({
    summary: 'Delete recipe',
    description: 'Delete recipe (only by author or admin)',
  })
  @ApiParam({ name: 'id', description: 'Recipe UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to delete this recipe',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserId() userId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponseDto<null>> {
    await this.recipesService.remove(id, userId, user.role);
    return ApiResponseDto.success('Recipe deleted successfully', null);
  }

  // === ADMIN ONLY ENDPOINTS ===

  @Patch(':id/toggle-featured')
  @AdminOnly()
  @ApiOperation({
    summary: 'Toggle recipe featured status (Admin only)',
    description: 'Toggle whether a recipe is featured or not',
  })
  @ApiParam({ name: 'id', description: 'Recipe UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe featured status toggled successfully',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found',
  })
  async toggleFeatured(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<RecipeResponseDto>> {
    const recipe = await this.recipesService.toggleFeatured(id);
    return ApiResponseDto.success(
      'Recipe featured status toggled successfully',
      recipe,
    );
  }

  @Get('admin/stats')
  @AdminOnly()
  @ApiOperation({
    summary: 'Get recipe statistics (Admin only)',
    description: 'Retrieve comprehensive recipe statistics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe statistics retrieved successfully',
  })
  async getRecipeStats(): Promise<ApiResponseDto<RecipeStatsResult>> {
    const stats = await this.recipesService.getRecipeStats();
    return ApiResponseDto.success(
      'Recipe statistics retrieved successfully',
      stats,
    );
  }
}

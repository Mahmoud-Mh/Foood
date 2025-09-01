import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth.decorators';
import { UserRole } from '../users/entities/user.entity';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { GetRatingsDto } from './dto/get-ratings.dto';
import { 
  RatingResponseDto, 
  RecipeRatingSummaryDto, 
  UserRatingsDto 
} from './dto/rating-response.dto';
import { ResponseDto, PaginatedResponseDto } from '../../common/dto/response.dto';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create a new rating for a recipe',
    description: 'Users can rate recipes from 1-5 stars with optional review comment. Cannot rate own recipes.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rating created successfully',
    type: ResponseDto<RatingResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid rating data or user trying to rate own recipe',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already rated this recipe',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found',
  })
  async create(
    @Body() createRatingDto: CreateRatingDto,
    @Req() req: any,
  ): Promise<ResponseDto<RatingResponseDto>> {
    const userId = req.user.id;
    const rating = await this.ratingsService.create(createRatingDto, userId);
    
    return {
      success: true,
      message: 'Rating created successfully',
      data: rating,
    };
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get ratings with filtering and pagination',
    description: 'Retrieve ratings with various filtering options like by recipe, user, rating range, etc.'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'recipeId', required: false, description: 'Filter by recipe ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating (1-5)' })
  @ApiQuery({ name: 'maxRating', required: false, description: 'Maximum rating (1-5)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by: newest, oldest, highest, lowest, most_helpful' })
  @ApiQuery({ name: 'withComments', required: false, description: 'Only ratings with comments' })
  @ApiQuery({ name: 'verifiedOnly', required: false, description: 'Only verified ratings' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in rating comments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ratings retrieved successfully',
    type: PaginatedResponseDto<RatingResponseDto>,
  })
  async findAll(
    @Query() getRatingsDto: GetRatingsDto,
  ): Promise<PaginatedResponseDto<RatingResponseDto>> {
    return this.ratingsService.findAll(getRatingsDto);
  }

  @Get('recipe/:recipeId/my-rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user\'s rating for a specific recipe',
    description: 'Get the authenticated user\'s rating for a specific recipe'
  })
  @ApiParam({ name: 'recipeId', description: 'Recipe UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User rating retrieved successfully',
    type: ResponseDto<RatingResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rating not found - user has not rated this recipe',
  })
  async getMyRecipeRating(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @Req() req: any,
  ): Promise<ResponseDto<RatingResponseDto>> {
    const userId = req.user.id;
    const getRatingsDto = {
      recipeId,
      userId,
      limit: 1,
    };
    
    const result = await this.ratingsService.findAll(getRatingsDto);
    
    if (result.data.items.length === 0) {
      throw new NotFoundException('You have not rated this recipe');
    }
    
    return {
      success: true,
      message: 'Your rating retrieved successfully',
      data: result.data.items[0],
    };
  }

  @Get('recipe/:recipeId/summary')
  @ApiOperation({ 
    summary: 'Get rating summary for a recipe',
    description: 'Get average rating, total count, rating distribution, and recent ratings for a recipe'
  })
  @ApiParam({ name: 'recipeId', description: 'Recipe UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe rating summary retrieved successfully',
    type: ResponseDto<RecipeRatingSummaryDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found',
  })
  async getRecipeRatingSummary(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<ResponseDto<RecipeRatingSummaryDto>> {
    const summary = await this.ratingsService.getRecipeRatingSummary(recipeId);
    
    return {
      success: true,
      message: 'Recipe rating summary retrieved successfully',
      data: summary,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ 
    summary: 'Get user ratings',
    description: 'Get ratings created by a specific user with statistics'
  })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of ratings to return (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User ratings retrieved successfully',
    type: ResponseDto<UserRatingsDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserRatings(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
  ): Promise<ResponseDto<UserRatingsDto>> {
    const userRatings = await this.ratingsService.getUserRatings(userId, limit);
    
    return {
      success: true,
      message: 'User ratings retrieved successfully',
      data: userRatings,
    };
  }

  @Get('my-ratings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user\'s ratings',
    description: 'Get ratings created by the authenticated user'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of ratings to return (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User ratings retrieved successfully',
    type: ResponseDto<UserRatingsDto>,
  })
  async getMyRatings(
    @Req() req: any,
    @Query('limit') limit?: number,
  ): Promise<ResponseDto<UserRatingsDto>> {
    const userId = req.user.id;
    const userRatings = await this.ratingsService.getUserRatings(userId, limit);
    
    return {
      success: true,
      message: 'Your ratings retrieved successfully',
      data: userRatings,
    };
  }

  @Get('recipe/:recipeId')
  @ApiOperation({ 
    summary: 'Get ratings for a specific recipe',
    description: 'Get paginated list of ratings for a recipe with filtering options'
  })
  @ApiParam({ name: 'recipeId', description: 'Recipe UUID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by: newest, oldest, highest, lowest, most_helpful' })
  @ApiQuery({ name: 'withComments', required: false, description: 'Only ratings with comments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe ratings retrieved successfully',
    type: PaginatedResponseDto<RatingResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found',
  })
  async getRecipeRatings(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @Query() query: any,
  ): Promise<PaginatedResponseDto<RatingResponseDto>> {
    const getRatingsDto = {
      recipeId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      withComments: query.withComments,
    };
    
    return this.ratingsService.findAll(getRatingsDto);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get a specific rating by ID',
    description: 'Retrieve detailed information about a specific rating'
  })
  @ApiParam({ name: 'id', description: 'Rating UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating retrieved successfully',
    type: ResponseDto<RatingResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rating not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDto<RatingResponseDto>> {
    const rating = await this.ratingsService.findOne(id);
    
    return {
      success: true,
      message: 'Rating retrieved successfully',
      data: rating,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update a rating',
    description: 'Update rating score and/or comment. Only the rating creator or admin can update.'
  })
  @ApiParam({ name: 'id', description: 'Rating UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating updated successfully',
    type: ResponseDto<RatingResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rating not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update rating - not owner or admin',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid rating data',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Req() req: any,
  ): Promise<ResponseDto<RatingResponseDto>> {
    const userId = req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;
    
    const rating = await this.ratingsService.update(id, updateRatingDto, userId, isAdmin);
    
    return {
      success: true,
      message: 'Rating updated successfully',
      data: rating,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Delete a rating',
    description: 'Soft delete a rating. Only the rating creator or admin can delete.'
  })
  @ApiParam({ name: 'id', description: 'Rating UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rating not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete rating - not owner or admin',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<ResponseDto<null>> {
    const userId = req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;
    
    await this.ratingsService.remove(id, userId, isAdmin);
    
    return {
      success: true,
      message: 'Rating deleted successfully',
      data: null,
    };
  }

  // Admin-only endpoints
  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Verify a rating (Admin only)',
    description: 'Mark a rating as verified. Admin only functionality.'
  })
  @ApiParam({ name: 'id', description: 'Rating UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating verified successfully',
    type: ResponseDto<RatingResponseDto>,
  })
  async verifyRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<ResponseDto<RatingResponseDto>> {
    const userId = req.user.id;
    const rating = await this.ratingsService.update(
      id, 
      { rating: undefined }, // Don't change rating score
      userId, 
      true // isAdmin
    );

    // Manually set isVerified since it's not in UpdateRatingDto
    await this.ratingsService['ratingsRepository'].update(id, { isVerified: true });
    
    return {
      success: true,
      message: 'Rating verified successfully',
      data: { ...rating, isVerified: true },
    };
  }
}
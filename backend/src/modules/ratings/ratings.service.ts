import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { User } from '../users/entities/user.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { GetRatingsDto, RatingSortBy } from './dto/get-ratings.dto';
import { 
  RatingResponseDto, 
  RecipeRatingSummaryDto, 
  UserRatingsDto 
} from './dto/rating-response.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
    @InjectRepository(Recipe)
    private recipesRepository: Repository<Recipe>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createRatingDto: CreateRatingDto, userId: string): Promise<RatingResponseDto> {
    const { recipeId, rating, comment } = createRatingDto;

    // Validate rating value
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new BadRequestException('Rating must be an integer between 1 and 5');
    }

    // Check if recipe exists
    const recipe = await this.recipesRepository.findOne({ 
      where: { id: recipeId, isActive: true },
      relations: ['author'] 
    });
    
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Prevent users from rating their own recipes
    if (recipe.author.id === userId) {
      throw new BadRequestException('You cannot rate your own recipe');
    }

    // Check if user already rated this recipe
    const existingRating = await this.ratingsRepository.findOne({
      where: { userId, recipeId },
    });

    if (existingRating) {
      throw new ConflictException('You have already rated this recipe. Use update instead.');
    }

    // Create the rating
    const newRating = this.ratingsRepository.create({
      userId,
      recipeId,
      rating,
      comment: comment?.trim() || undefined,
    });

    const savedRating = await this.ratingsRepository.save(newRating);

    // Load the rating with relations for the response
    const ratingWithRelations = await this.ratingsRepository.findOne({
      where: { id: savedRating.id },
      relations: ['user', 'recipe'],
    });

    // Update recipe average rating (await to ensure consistency)
    try {
      await this.updateRecipeRatingStats(recipeId);
    } catch (error) {
      console.error('Failed to update recipe rating stats:', error);
    }

    return this.mapToResponseDto(ratingWithRelations!);
  }

  async findAll(getRatingsDto: GetRatingsDto): Promise<PaginatedResponseDto<RatingResponseDto>> {
    const {
      page = 1,
      limit = 10,
      recipeId,
      userId,
      minRating,
      maxRating,
      sortBy = RatingSortBy.NEWEST,
      withComments,
      verifiedOnly,
      search,
    } = getRatingsDto;

    const queryBuilder = this.buildRatingsQuery();

    // Apply filters
    queryBuilder.where('rating.isActive = :isActive', { isActive: true });

    if (recipeId) {
      queryBuilder.andWhere('rating.recipeId = :recipeId', { recipeId });
    }

    if (userId) {
      queryBuilder.andWhere('rating.userId = :userId', { userId });
    }

    if (minRating) {
      queryBuilder.andWhere('rating.rating >= :minRating', { minRating });
    }

    if (maxRating) {
      queryBuilder.andWhere('rating.rating <= :maxRating', { maxRating });
    }

    if (withComments) {
      queryBuilder.andWhere('rating.comment IS NOT NULL');
      queryBuilder.andWhere("rating.comment != ''");
    }

    if (verifiedOnly) {
      queryBuilder.andWhere('rating.isVerified = :isVerified', { isVerified: true });
    }

    if (search && search.trim()) {
      queryBuilder.andWhere('rating.comment ILIKE :search', { 
        search: `%${search.trim()}%` 
      });
    }

    // Apply sorting
    this.applySorting(queryBuilder, sortBy);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [ratings, total] = await queryBuilder.getManyAndCount();

    const responseData = ratings.map(rating => this.mapToResponseDto(rating));

    return PaginatedResponseDto.success(
      'Ratings retrieved successfully',
      responseData,
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<RatingResponseDto> {
    const rating = await this.ratingsRepository.findOne({
      where: { id, isActive: true },
      relations: ['user', 'recipe'],
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return this.mapToResponseDto(rating);
  }

  async update(
    id: string, 
    updateRatingDto: UpdateRatingDto, 
    userId: string,
    isAdmin: boolean = false
  ): Promise<RatingResponseDto> {
    const rating = await this.ratingsRepository.findOne({
      where: { id, isActive: true },
      relations: ['user', 'recipe'],
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    // Check permissions
    if (!rating.canEdit(userId, isAdmin)) {
      throw new ForbiddenException('You can only edit your own ratings');
    }

    // Validate new rating if provided
    if (updateRatingDto.rating !== undefined) {
      if (updateRatingDto.rating < 1 || updateRatingDto.rating > 5 || !Number.isInteger(updateRatingDto.rating)) {
        throw new BadRequestException('Rating must be an integer between 1 and 5');
      }
      rating.rating = updateRatingDto.rating;
    }

    if (updateRatingDto.comment !== undefined) {
      rating.comment = updateRatingDto.comment?.trim() || undefined;
    }

    const updatedRating = await this.ratingsRepository.save(rating);

    // Update recipe rating stats if rating score changed
    if (updateRatingDto.rating !== undefined) {
      this.updateRecipeRatingStats(rating.recipeId).catch(error => 
        console.error('Failed to update recipe rating stats:', error)
      );
    }

    return this.mapToResponseDto(updatedRating);
  }

  async remove(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const rating = await this.ratingsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    // Check permissions
    if (!rating.canEdit(userId, isAdmin)) {
      throw new ForbiddenException('You can only delete your own ratings');
    }

    // Soft delete
    rating.isActive = false;
    await this.ratingsRepository.save(rating);

    // Update recipe rating stats
    this.updateRecipeRatingStats(rating.recipeId).catch(error => 
      console.error('Failed to update recipe rating stats:', error)
    );
  }

  async getRecipeRatingSummary(recipeId: string): Promise<RecipeRatingSummaryDto> {
    const recipe = await this.recipesRepository.findOne({ 
      where: { id: recipeId, isActive: true } 
    });
    
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Get rating statistics
    const stats = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select([
        'AVG(rating.rating)::numeric(3,2) as averageRating',
        'COUNT(rating.id) as ratingsCount'
      ])
      .where('rating.recipeId = :recipeId', { recipeId })
      .andWhere('rating.isActive = :isActive', { isActive: true })
      .getRawOne();

    // Get rating distribution
    const distribution = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select([
        'rating.rating as rating_value',
        'COUNT(rating.id) as count'
      ])
      .where('rating.recipeId = :recipeId', { recipeId })
      .andWhere('rating.isActive = :isActive', { isActive: true })
      .groupBy('rating.rating')
      .orderBy('rating.rating', 'ASC')
      .getRawMany();

    // Format distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(item => {
      ratingDistribution[item.rating_value] = parseInt(item.count);
    });

    // Get recent ratings
    const recentRatings = await this.ratingsRepository.find({
      where: { recipeId, isActive: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      recipeId,
      recipeTitle: recipe.title,
      averageRating: parseFloat(stats.averagerating) || 0,
      ratingsCount: parseInt(stats.ratingscount) || 0,
      ratingDistribution,
      recentRatings: recentRatings.map(rating => this.mapToResponseDto(rating)),
    };
  }

  async getUserRatings(userId: string, limit: number = 10): Promise<UserRatingsDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ratings = await this.ratingsRepository.find({
      where: { userId, isActive: true },
      relations: ['recipe'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const stats = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select([
        'COUNT(rating.id) as totalRatings',
        'AVG(rating.rating)::numeric(3,2) as averageRating'
      ])
      .where('rating.userId = :userId', { userId })
      .andWhere('rating.isActive = :isActive', { isActive: true })
      .getRawOne();

    return {
      userId,
      totalRatings: parseInt(stats.totalRatings) || 0,
      averageRatingGiven: parseFloat(stats.averageRating) || 0,
      ratings: ratings.map(rating => this.mapToResponseDto(rating)),
    };
  }

  private buildRatingsQuery(): SelectQueryBuilder<Rating> {
    return this.ratingsRepository
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.user', 'user')
      .leftJoinAndSelect('rating.recipe', 'recipe');
  }

  private applySorting(queryBuilder: SelectQueryBuilder<Rating>, sortBy: RatingSortBy): void {
    switch (sortBy) {
      case RatingSortBy.NEWEST:
        queryBuilder.orderBy('rating.createdAt', 'DESC');
        break;
      case RatingSortBy.OLDEST:
        queryBuilder.orderBy('rating.createdAt', 'ASC');
        break;
      case RatingSortBy.HIGHEST:
        queryBuilder.orderBy('rating.rating', 'DESC');
        break;
      case RatingSortBy.LOWEST:
        queryBuilder.orderBy('rating.rating', 'ASC');
        break;
      case RatingSortBy.MOST_HELPFUL:
        queryBuilder.orderBy('rating.helpfulCount', 'DESC');
        break;
      default:
        queryBuilder.orderBy('rating.createdAt', 'DESC');
    }
  }

  private async updateRecipeRatingStats(recipeId: string): Promise<void> {
    const stats = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select([
        'AVG(rating.rating)::numeric(3,2) as averageRating',
        'COUNT(rating.id) as ratingsCount'
      ])
      .where('rating.recipeId = :recipeId', { recipeId })
      .andWhere('rating.isActive = :isActive', { isActive: true })
      .getRawOne();

    console.log('Rating stats for recipe', recipeId, ':', stats);
    
    const averageRating = parseFloat(stats.averagerating) || 0;
    const ratingsCount = parseInt(stats.ratingscount) || 0;
    
    console.log('Parsed values:', { averageRating, ratingsCount });

    // Update recipe entity with rating stats
    await this.recipesRepository.update(recipeId, {
      averageRating,
      ratingsCount,
    });
  }

  private mapToResponseDto(rating: Rating): RatingResponseDto {
    return {
      id: rating.id,
      rating: rating.rating,
      comment: rating.comment,
      isVerified: rating.isVerified,
      helpfulCount: rating.helpfulCount,
      userId: rating.userId,
      userFullName: rating.user?.fullName || 'Anonymous',
      userAvatar: rating.user?.avatar,
      recipeId: rating.recipeId,
      recipeTitle: rating.recipe?.title || 'Unknown Recipe',
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    };
  }
}
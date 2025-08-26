import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Recipe,
  RecipeStatus,
  DifficultyLevel,
} from '../entities/recipe.entity';
import { PaginatedResultDto } from '../../../common/dto/pagination.dto';

export interface RecipeSearchFilters {
  categoryId?: string;
  difficulty?: DifficultyLevel;
  maxTime?: number;
  minRating?: number;
  tags?: string[];
  status?: RecipeStatus;
  authorId?: string;
  isFeatured?: boolean;
}

export interface RecipeSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'totalTime' | 'viewsCount' | 'likesCount';
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class RecipeSearchService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
  ) {}

  async searchRecipes(
    query?: string,
    filters: RecipeSearchFilters = {},
    options: RecipeSearchOptions = {},
  ): Promise<PaginatedResultDto<Recipe>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const skip = (page - 1) * limit;

    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.author', 'author')
      .leftJoinAndSelect('recipe.category', 'category')
      .leftJoinAndSelect('recipe.recipeIngredients', 'recipeIngredients')
      .leftJoinAndSelect('recipeIngredients.ingredient', 'ingredient');

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    // Apply search query
    if (query && query.trim()) {
      this.applyTextSearch(queryBuilder, query.trim());
    }

    // Apply sorting
    this.applySorting(queryBuilder, sortBy, sortOrder);

    // Get total count for pagination
    const totalQuery = queryBuilder.clone();
    const total = await totalQuery.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const recipes = await queryBuilder.getMany();

    return new PaginatedResultDto(recipes, total, page, limit);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Recipe>,
    filters: RecipeSearchFilters,
  ): void {
    const {
      categoryId,
      difficulty,
      maxTime,
      minRating,
      tags,
      status = RecipeStatus.PUBLISHED,
      authorId,
      isFeatured,
    } = filters;

    // Always filter by active recipes
    queryBuilder.andWhere('recipe.isActive = :isActive', { isActive: true });

    // Status filter
    if (status) {
      queryBuilder.andWhere('recipe.status = :status', { status });
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere('recipe.categoryId = :categoryId', { categoryId });
    }

    // Difficulty filter
    if (difficulty) {
      queryBuilder.andWhere('recipe.difficulty = :difficulty', { difficulty });
    }

    // Total time filter (prep + cook time)
    if (maxTime) {
      queryBuilder.andWhere(
        'recipe.prepTimeMinutes + recipe.cookTimeMinutes <= :maxTime',
        { maxTime },
      );
    }

    // Minimum rating filter (when rating system is implemented)
    if (minRating) {
      queryBuilder.andWhere('recipe.averageRating >= :minRating', {
        minRating,
      });
    }

    // Author filter
    if (authorId) {
      queryBuilder.andWhere('recipe.authorId = :authorId', { authorId });
    }

    // Featured filter
    if (isFeatured !== undefined) {
      queryBuilder.andWhere('recipe.isFeatured = :isFeatured', { isFeatured });
    }

    // Tags filter
    if (tags && tags.length > 0) {
      // PostgreSQL array overlap operator
      queryBuilder.andWhere('recipe.tags && :tags', { tags });
    }
  }

  private applyTextSearch(
    queryBuilder: SelectQueryBuilder<Recipe>,
    query: string,
  ): void {
    const searchTerms = query
      .toLowerCase()
      .split(' ')
      .filter((term) => term.length > 0);

    if (searchTerms.length === 0) return;

    // Create search conditions for each term
    const searchConditions = searchTerms.map((term, index) => {
      const paramName = `searchTerm${index}`;

      return `(
        LOWER(recipe.title) LIKE :${paramName} OR
        LOWER(recipe.description) LIKE :${paramName} OR
        LOWER(recipe.instructions) LIKE :${paramName} OR
        LOWER(recipe.notes) LIKE :${paramName} OR
        EXISTS(
          SELECT 1 FROM unnest(recipe.tags) AS tag
          WHERE LOWER(tag) LIKE :${paramName}
        ) OR
        EXISTS(
          SELECT 1 FROM recipe_ingredients ri
          JOIN ingredients i ON ri."ingredientId" = i.id
          WHERE ri."recipeId" = recipe.id 
          AND LOWER(i.name) LIKE :${paramName}
        )
      )`;
    });

    // All terms must match (AND logic)
    const whereClause = searchConditions.join(' AND ');
    queryBuilder.andWhere(`(${whereClause})`);

    // Set parameters
    const parameters: Record<string, string> = {};
    searchTerms.forEach((term, index) => {
      parameters[`searchTerm${index}`] = `%${term}%`;
    });
    queryBuilder.setParameters(parameters);
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Recipe>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    switch (sortBy) {
      case 'title':
        queryBuilder.orderBy('recipe.title', sortOrder);
        break;
      case 'totalTime':
        queryBuilder.orderBy('recipe.prepTimeMinutes', sortOrder);
        queryBuilder.addOrderBy('recipe.cookTimeMinutes', sortOrder);
        break;
      case 'viewsCount':
        queryBuilder.orderBy('recipe.viewsCount', sortOrder);
        break;
      case 'likesCount':
        queryBuilder.orderBy('recipe.likesCount', sortOrder);
        break;
      case 'createdAt':
      default:
        queryBuilder.orderBy('recipe.createdAt', sortOrder);
        break;
    }

    // Add secondary sort by ID for consistency
    queryBuilder.addOrderBy('recipe.id', 'ASC');
  }

  async getPopularRecipes(limit = 10): Promise<Recipe[]> {
    return this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.author', 'author')
      .leftJoinAndSelect('recipe.category', 'category')
      .where('recipe.status = :status', { status: RecipeStatus.PUBLISHED })
      .andWhere('recipe.isActive = :isActive', { isActive: true })
      .orderBy('recipe.viewsCount', 'DESC')
      .addOrderBy('recipe.likesCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getFeaturedRecipes(limit = 6): Promise<Recipe[]> {
    return this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.author', 'author')
      .leftJoinAndSelect('recipe.category', 'category')
      .where('recipe.status = :status', { status: RecipeStatus.PUBLISHED })
      .andWhere('recipe.isActive = :isActive', { isActive: true })
      .andWhere('recipe.isFeatured = :isFeatured', { isFeatured: true })
      .orderBy('recipe.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getRecentRecipes(limit = 12): Promise<Recipe[]> {
    return this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.author', 'author')
      .leftJoinAndSelect('recipe.category', 'category')
      .where('recipe.status = :status', { status: RecipeStatus.PUBLISHED })
      .andWhere('recipe.isActive = :isActive', { isActive: true })
      .orderBy('recipe.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getSimilarRecipes(recipeId: string, limit = 6): Promise<Recipe[]> {
    // Get the current recipe to find similar ones
    const currentRecipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
      relations: ['category'],
    });

    if (!currentRecipe) {
      return [];
    }

    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.author', 'author')
      .leftJoinAndSelect('recipe.category', 'category')
      .where('recipe.id != :currentId', { currentId: recipeId })
      .andWhere('recipe.status = :status', { status: RecipeStatus.PUBLISHED })
      .andWhere('recipe.isActive = :isActive', { isActive: true });

    // Prioritize same category
    queryBuilder.andWhere('recipe.categoryId = :categoryId', {
      categoryId: currentRecipe.categoryId,
    });

    // Add tag-based similarity if tags exist
    if (currentRecipe.tags && currentRecipe.tags.length > 0) {
      queryBuilder.andWhere('recipe.tags && :tags', {
        tags: currentRecipe.tags,
      });
    }

    return queryBuilder
      .orderBy('recipe.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { RecipeSearchService, RecipeSearchFilters, RecipeSearchOptions } from './recipe-search.service';
import { Recipe, RecipeStatus, DifficultyLevel } from '../entities/recipe.entity';
import { PaginatedResultDto } from '../../../common/dto/pagination.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

describe('RecipeSearchService', () => {
  let service: RecipeSearchService;
  let repository: Repository<Recipe>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashed',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    avatar: undefined,
    bio: undefined,
    location: undefined,
    website: undefined,
    socialLinks: undefined,
    isActive: true,
    isEmailVerified: true,
    emailVerificationToken: undefined,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
    lastLoginAt: undefined,
    recipes: [],
    favoriteRecipes: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    get fullName() { return 'John Doe'; },
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
    get isAdmin() { return false; },
    updateLastLogin: jest.fn()
  } as unknown as User;

  const mockCategory: Category = {
    id: '1',
    name: 'Italian',
    description: 'Italian cuisine',
    slug: 'italian',
    icon: '🍝',
    imageUrl: undefined,
    isActive: true,
    sortOrder: 1,
    recipes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRecipe: Recipe = {
    id: '1',
    title: 'Pasta Marinara',
    description: 'Classic Italian pasta with marinara sauce',
    instructions: 'Cook pasta, add sauce',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: DifficultyLevel.EASY,
    status: RecipeStatus.PUBLISHED,
    imageUrl: 'recipe1.jpg',
    additionalImages: [],
    tags: ['pasta', 'italian', 'easy'],
    nutritionalInfo: {},
    notes: 'Great for beginners',
    viewsCount: 100,
    likesCount: 50,
    isFeatured: false,
    isActive: true,
    authorId: '1',
    categoryId: '1',
    author: mockUser,
    category: mockCategory,
    recipeIngredients: [],
    steps: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    get totalTimeMinutes() { return this.prepTimeMinutes + this.cookTimeMinutes; }
  };

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    limit: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
    clone: jest.fn(),
    setParameters: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks and set up chainable returns
    Object.values(mockQueryBuilder).forEach(mock => mock.mockClear());
    Object.keys(mockQueryBuilder).forEach(key => {
      if (key !== 'getMany' && key !== 'getCount' && key !== 'clone' && key !== 'findOne') {
        (mockQueryBuilder as any)[key].mockReturnThis();
      }
    });

    mockQueryBuilder.clone.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.getMany.mockResolvedValue([mockRecipe]);
    mockQueryBuilder.getCount.mockResolvedValue(1);

    const mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeSearchService,
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RecipeSearchService>(RecipeSearchService);
    repository = module.get<Repository<Recipe>>(getRepositoryToken(Recipe));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchRecipes', () => {
    it('should search recipes with default options', async () => {
      const result = await service.searchRecipes();

      expect(result).toBeInstanceOf(PaginatedResultDto);
      expect(result.data).toEqual([mockRecipe]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('recipe.author', 'author');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('recipe.category', 'category');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('recipe.recipeIngredients', 'recipeIngredients');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('recipeIngredients.ingredient', 'ingredient');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.createdAt', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply pagination correctly', async () => {
      const options: RecipeSearchOptions = { page: 3, limit: 5 };
      
      await service.searchRecipes(undefined, {}, options);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (3-1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should apply text search with single term', async () => {
      await service.searchRecipes('pasta');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(recipe.title) LIKE :searchTerm0')
      );
      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith({
        searchTerm0: '%pasta%'
      });
    });

    it('should apply text search with multiple terms', async () => {
      await service.searchRecipes('pasta marinara sauce');

      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith({
        searchTerm0: '%pasta%',
        searchTerm1: '%marinara%',
        searchTerm2: '%sauce%'
      });
    });

    it('should ignore empty search query', async () => {
      await service.searchRecipes('   ');

      expect(mockQueryBuilder.setParameters).not.toHaveBeenCalled();
    });

    it('should apply category filter', async () => {
      const filters: RecipeSearchFilters = { categoryId: 'italian-id' };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.categoryId = :categoryId',
        { categoryId: 'italian-id' }
      );
    });

    it('should apply difficulty filter', async () => {
      const filters: RecipeSearchFilters = { difficulty: DifficultyLevel.MEDIUM };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.difficulty = :difficulty',
        { difficulty: DifficultyLevel.MEDIUM }
      );
    });

    it('should apply max time filter', async () => {
      const filters: RecipeSearchFilters = { maxTime: 60 };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.prepTimeMinutes + recipe.cookTimeMinutes <= :maxTime',
        { maxTime: 60 }
      );
    });

    it('should apply min rating filter', async () => {
      const filters: RecipeSearchFilters = { minRating: 4.0 };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.averageRating >= :minRating',
        { minRating: 4.0 }
      );
    });

    it('should apply author filter', async () => {
      const filters: RecipeSearchFilters = { authorId: 'author-id' };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.authorId = :authorId',
        { authorId: 'author-id' }
      );
    });

    it('should apply featured filter when true', async () => {
      const filters: RecipeSearchFilters = { isFeatured: true };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.isFeatured = :isFeatured',
        { isFeatured: true }
      );
    });

    it('should apply featured filter when false', async () => {
      const filters: RecipeSearchFilters = { isFeatured: false };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.isFeatured = :isFeatured',
        { isFeatured: false }
      );
    });

    it('should apply tags filter', async () => {
      const filters: RecipeSearchFilters = { tags: ['pasta', 'italian'] };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.tags && :tags',
        { tags: ['pasta', 'italian'] }
      );
    });

    it('should ignore empty tags array', async () => {
      const filters: RecipeSearchFilters = { tags: [] };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('recipe.tags'),
        expect.anything()
      );
    });

    it('should apply custom status filter', async () => {
      const filters: RecipeSearchFilters = { status: RecipeStatus.DRAFT };
      
      await service.searchRecipes(undefined, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.status = :status',
        { status: RecipeStatus.DRAFT }
      );
    });

    it('should always filter by active recipes', async () => {
      await service.searchRecipes();

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.isActive = :isActive',
        { isActive: true }
      );
    });

    it('should apply default published status when no status provided', async () => {
      await service.searchRecipes();

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.status = :status',
        { status: RecipeStatus.PUBLISHED }
      );
    });

    describe('sorting', () => {
      it('should sort by title', async () => {
        const options: RecipeSearchOptions = { sortBy: 'title', sortOrder: 'ASC' };
        
        await service.searchRecipes(undefined, {}, options);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.title', 'ASC');
        expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('recipe.id', 'ASC');
      });

      it('should sort by total time', async () => {
        const options: RecipeSearchOptions = { sortBy: 'totalTime', sortOrder: 'ASC' };
        
        await service.searchRecipes(undefined, {}, options);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.prepTimeMinutes', 'ASC');
        expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('recipe.cookTimeMinutes', 'ASC');
        expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('recipe.id', 'ASC');
      });

      it('should sort by views count', async () => {
        const options: RecipeSearchOptions = { sortBy: 'viewsCount', sortOrder: 'DESC' };
        
        await service.searchRecipes(undefined, {}, options);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.viewsCount', 'DESC');
        expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('recipe.id', 'ASC');
      });

      it('should sort by likes count', async () => {
        const options: RecipeSearchOptions = { sortBy: 'likesCount', sortOrder: 'DESC' };
        
        await service.searchRecipes(undefined, {}, options);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.likesCount', 'DESC');
      });

      it('should default to sort by created date', async () => {
        const options: RecipeSearchOptions = { sortBy: 'unknown' as any };
        
        await service.searchRecipes(undefined, {}, options);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.createdAt', 'DESC');
      });
    });

    it('should handle multiple filters simultaneously', async () => {
      const filters: RecipeSearchFilters = {
        categoryId: 'italian-id',
        difficulty: DifficultyLevel.EASY,
        maxTime: 30,
        tags: ['quick', 'easy'],
        isFeatured: true
      };
      
      await service.searchRecipes('pasta', filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.status = :status', { status: RecipeStatus.PUBLISHED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.categoryId = :categoryId', { categoryId: 'italian-id' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.difficulty = :difficulty', { difficulty: DifficultyLevel.EASY });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.prepTimeMinutes + recipe.cookTimeMinutes <= :maxTime', { maxTime: 30 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.tags && :tags', { tags: ['quick', 'easy'] });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.isFeatured = :isFeatured', { isFeatured: true });
    });

    it('should clone query builder for count', async () => {
      await service.searchRecipes();

      expect(mockQueryBuilder.clone).toHaveBeenCalled();
      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
    });
  });

  describe('getPopularRecipes', () => {
    it('should return popular recipes with default limit', async () => {
      const result = await service.getPopularRecipes();

      expect(result).toEqual([mockRecipe]);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('recipe.author', 'author');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('recipe.category', 'category');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('recipe.status = :status', { status: RecipeStatus.PUBLISHED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.viewsCount', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('recipe.likesCount', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should return popular recipes with custom limit', async () => {
      await service.getPopularRecipes(5);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('getFeaturedRecipes', () => {
    it('should return featured recipes with default limit', async () => {
      const result = await service.getFeaturedRecipes();

      expect(result).toEqual([mockRecipe]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('recipe.status = :status', { status: RecipeStatus.PUBLISHED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.isFeatured = :isFeatured', { isFeatured: true });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.createdAt', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(6);
    });

    it('should return featured recipes with custom limit', async () => {
      await service.getFeaturedRecipes(3);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3);
    });
  });

  describe('getRecentRecipes', () => {
    it('should return recent recipes with default limit', async () => {
      const result = await service.getRecentRecipes();

      expect(result).toEqual([mockRecipe]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('recipe.status = :status', { status: RecipeStatus.PUBLISHED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.createdAt', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(12);
    });

    it('should return recent recipes with custom limit', async () => {
      await service.getRecentRecipes(8);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(8);
    });
  });

  describe('getSimilarRecipes', () => {
    const mockCurrentRecipe = {
      ...mockRecipe,
      id: 'current-recipe-id',
      categoryId: 'italian-category',
      tags: ['pasta', 'italian']
    };

    beforeEach(() => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockCurrentRecipe);
    });

    it('should return similar recipes based on category and tags', async () => {
      const result = await service.getSimilarRecipes('current-recipe-id');

      expect(result).toEqual([mockRecipe]);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'current-recipe-id' },
        relations: ['category']
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('recipe.id != :currentId', { currentId: 'current-recipe-id' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.status = :status', { status: RecipeStatus.PUBLISHED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.categoryId = :categoryId', { categoryId: 'italian-category' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.tags && :tags', { tags: ['pasta', 'italian'] });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(6);
    });

    it('should return similar recipes with custom limit', async () => {
      await service.getSimilarRecipes('current-recipe-id', 4);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(4);
    });

    it('should return similar recipes without tag matching when no tags exist', async () => {
      const recipeWithoutTags = { ...mockCurrentRecipe, tags: null };
      (repository.findOne as jest.Mock).mockResolvedValue(recipeWithoutTags);

      await service.getSimilarRecipes('current-recipe-id');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('recipe.categoryId = :categoryId', { categoryId: 'italian-category' });
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith('recipe.tags && :tags', expect.anything());
    });

    it('should return similar recipes without tag matching when tags array is empty', async () => {
      const recipeWithEmptyTags = { ...mockCurrentRecipe, tags: [] };
      (repository.findOne as jest.Mock).mockResolvedValue(recipeWithEmptyTags);

      await service.getSimilarRecipes('current-recipe-id');

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith('recipe.tags && :tags', expect.anything());
    });

    it('should return empty array when current recipe not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getSimilarRecipes('nonexistent-id');

      expect(result).toEqual([]);
      expect(mockQueryBuilder.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should order similar recipes by creation date', async () => {
      await service.getSimilarRecipes('current-recipe-id');

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('recipe.createdAt', 'DESC');
    });
  });

  describe('text search functionality', () => {
    it('should search in recipe title', async () => {
      await service.searchRecipes('marinara');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(recipe.title) LIKE :searchTerm0')
      );
    });

    it('should search in recipe description', async () => {
      await service.searchRecipes('classic');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(recipe.description) LIKE :searchTerm0')
      );
    });

    it('should search in recipe instructions', async () => {
      await service.searchRecipes('cook');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(recipe.instructions) LIKE :searchTerm0')
      );
    });

    it('should search in recipe notes', async () => {
      await service.searchRecipes('beginners');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(recipe.notes) LIKE :searchTerm0')
      );
    });

    it('should search in recipe tags', async () => {
      await service.searchRecipes('italian');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('unnest(recipe.tags)')
      );
    });

    it('should search in ingredient names', async () => {
      await service.searchRecipes('tomato');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('recipe_ingredients ri')
      );
    });

    it('should handle search terms with extra whitespace', async () => {
      await service.searchRecipes('  pasta   marinara  ');

      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith({
        searchTerm0: '%pasta%',
        searchTerm1: '%marinara%'
      });
    });

    it('should filter out empty search terms', async () => {
      await service.searchRecipes('pasta  sauce');

      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith({
        searchTerm0: '%pasta%',
        searchTerm1: '%sauce%'
      });
    });

    it('should use AND logic for multiple search terms', async () => {
      await service.searchRecipes('pasta sauce tomato');

      const expectedWhereClause = expect.stringContaining(') AND (');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expectedWhereClause);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty search results', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await service.searchRecipes('nonexistent');

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle repository errors gracefully', async () => {
      mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

      await expect(service.searchRecipes()).rejects.toThrow('Database error');
    });

    it('should handle count query errors gracefully', async () => {
      mockQueryBuilder.getCount.mockRejectedValue(new Error('Count error'));

      await expect(service.searchRecipes()).rejects.toThrow('Count error');
    });

    it('should handle findOne errors in getSimilarRecipes', async () => {
      (repository.findOne as jest.Mock).mockRejectedValue(new Error('Find error'));

      await expect(service.getSimilarRecipes('recipe-id')).rejects.toThrow('Find error');
    });

    it('should handle zero pagination limit', async () => {
      const options: RecipeSearchOptions = { page: 1, limit: 0 };
      
      await service.searchRecipes(undefined, {}, options);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(0);
    });

    it('should handle large pagination values', async () => {
      const options: RecipeSearchOptions = { page: 1000, limit: 100 };
      
      await service.searchRecipes(undefined, {}, options);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(99900);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { 
  BadRequestException, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { Recipe, RecipeStatus, DifficultyLevel } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { IngredientsService } from '../ingredients/ingredients.service';
import { UserRole } from '../users/entities/user.entity';
import { IngredientCategory } from '../ingredients/entities/ingredient.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

describe('RecipesService', () => {
  let service: RecipesService;
  let recipeRepository: Repository<Recipe>;
  let recipeIngredientRepository: Repository<RecipeIngredient>;
  let recipeStepRepository: Repository<RecipeStep>;
  let ingredientsService: IngredientsService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  const mockRecipe = {
    id: '1',
    title: 'Test Recipe',
    description: 'Test Description',
    authorId: '1',
    categoryId: '1',
    status: RecipeStatus.PUBLISHED,
    difficulty: DifficultyLevel.EASY,
    prepTimeMinutes: 30,
    cookTimeMinutes: 45,
    servings: 4,
    likesCount: 0,
    viewsCount: 0,
    isFeatured: false,
    isActive: true,
    tags: ['test'],
    imageUrl: null,
    thumbnailUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    },
    category: {
      id: '1',
      name: 'Test Category',
      description: 'Test Category Description',
    },
    recipeIngredients: [
      {
        id: '1',
        ingredientId: '1',
        recipeId: '1',
        quantity: 1,
        unit: 'cup',
        preparation: null,
        isOptional: false,
        order: 1,
        ingredient: {
          id: '1',
          name: 'Test Ingredient',
          description: 'Test Ingredient Description',
          category: IngredientCategory.VEGETABLE,
        },
      },
    ],
    steps: [
      {
        id: '1',
        recipeId: '1',
        stepNumber: 1,
        instruction: 'Test instruction',
        timeMinutes: null,
        temperature: null,
      },
    ],
  };

  const mockIngredient = {
    id: '1',
    name: 'Test Ingredient',
    description: 'Test Ingredient Description',
    category: IngredientCategory.VEGETABLE,
    defaultUnit: 'cup',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRecipeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRecipeIngredientRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockRecipeStepRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockIngredientsService = {
    create: jest.fn().mockResolvedValue(mockIngredient),
    searchByName: jest.fn().mockResolvedValue([]),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    select: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRecipeRepository,
        },
        {
          provide: getRepositoryToken(RecipeIngredient),
          useValue: mockRecipeIngredientRepository,
        },
        {
          provide: getRepositoryToken(RecipeStep),
          useValue: mockRecipeStepRepository,
        },
        {
          provide: IngredientsService,
          useValue: mockIngredientsService,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    recipeRepository = module.get<Repository<Recipe>>(getRepositoryToken(Recipe));
    recipeIngredientRepository = module.get<Repository<RecipeIngredient>>(
      getRepositoryToken(RecipeIngredient)
    );
    recipeStepRepository = module.get<Repository<RecipeStep>>(
      getRepositoryToken(RecipeStep)
    );
    ingredientsService = module.get<IngredientsService>(IngredientsService);

    // Setup query builder mock
    mockRecipeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRecipeDto: CreateRecipeDto = {
      title: 'Test Recipe',
      description: 'Test Description',
      instructions: 'Test instructions',
      categoryId: '1',
      difficulty: DifficultyLevel.EASY,
      prepTimeMinutes: 30,
      cookTimeMinutes: 45,
      servings: 4,
      tags: ['test'],
      ingredients: [
        {
          ingredientId: '1',
          quantity: 1,
          unit: 'cup',
          order: 1,
        },
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1',
          instructions: 'Test instruction',
        },
      ],
    };

    it('should create a recipe successfully', async () => {
      const authorId = '1';
      mockRecipeRepository.create.mockReturnValue(mockRecipe);
      mockRecipeRepository.save.mockResolvedValue(mockRecipe);
      mockRecipeIngredientRepository.create.mockReturnValue({ ...mockRecipe.recipeIngredients[0] });
      mockRecipeIngredientRepository.save.mockResolvedValue([mockRecipe.recipeIngredients[0]]);
      mockRecipeStepRepository.create.mockReturnValue({ ...mockRecipe.steps[0] });
      mockRecipeStepRepository.save.mockResolvedValue([mockRecipe.steps[0]]);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      const result = await service.create(createRecipeDto, authorId);

      expect(mockRecipeRepository.create).toHaveBeenCalledWith({
        ...createRecipeDto,
        authorId,
        status: RecipeStatus.DRAFT,
        difficulty: DifficultyLevel.EASY,
      });
      expect(mockRecipeRepository.save).toHaveBeenCalledWith(mockRecipe);
      expect(result).toBeDefined();
      expect(result.title).toBe(mockRecipe.title);
    });

    it('should create ingredient if ingredientId is not UUID', async () => {
      const dtoWithNewIngredient = {
        ...createRecipeDto,
        ingredients: [
          {
            ingredientId: 'New Ingredient',
            quantity: 1,
            unit: 'cup',
            order: 1,
          },
        ],
      };

      mockRecipeRepository.create.mockReturnValue(mockRecipe);
      mockRecipeRepository.save.mockResolvedValue(mockRecipe);
      mockIngredientsService.create.mockResolvedValue(mockIngredient);
      mockRecipeIngredientRepository.create.mockReturnValue({ ...mockRecipe.recipeIngredients[0] });
      mockRecipeIngredientRepository.save.mockResolvedValue([mockRecipe.recipeIngredients[0]]);
      mockRecipeStepRepository.create.mockReturnValue({ ...mockRecipe.steps[0] });
      mockRecipeStepRepository.save.mockResolvedValue([mockRecipe.steps[0]]);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      const result = await service.create(dtoWithNewIngredient, '1');

      expect(mockIngredientsService.create).toHaveBeenCalledWith({
        name: 'New Ingredient',
        description: 'Custom ingredient: New Ingredient',
        category: IngredientCategory.OTHER,
        defaultUnit: 'cup',
      });
      expect(result).toBeDefined();
    });

    it('should find existing ingredient if creation fails', async () => {
      const dtoWithNewIngredient = {
        ...createRecipeDto,
        ingredients: [
          {
            ingredientId: 'Existing Ingredient',
            quantity: 1,
            unit: 'cup',
            order: 1,
          },
        ],
      };

      mockRecipeRepository.create.mockReturnValue(mockRecipe);
      mockRecipeRepository.save.mockResolvedValue(mockRecipe);
      mockIngredientsService.create.mockRejectedValue(new Error('Ingredient exists'));
      mockIngredientsService.searchByName.mockResolvedValue([mockIngredient]);
      mockRecipeIngredientRepository.create.mockReturnValue({ ...mockRecipe.recipeIngredients[0] });
      mockRecipeIngredientRepository.save.mockResolvedValue([mockRecipe.recipeIngredients[0]]);
      mockRecipeStepRepository.create.mockReturnValue({ ...mockRecipe.steps[0] });
      mockRecipeStepRepository.save.mockResolvedValue([mockRecipe.steps[0]]);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      const result = await service.create(dtoWithNewIngredient, '1');

      expect(mockIngredientsService.searchByName).toHaveBeenCalledWith('Existing Ingredient');
      expect(result).toBeDefined();
    });

    it('should throw error if ingredient cannot be created or found', async () => {
      const dtoWithNewIngredient = {
        ...createRecipeDto,
        ingredients: [
          {
            ingredientId: 'Unknown Ingredient',
            quantity: 1,
            unit: 'cup',
            order: 1,
          },
        ],
      };

      mockRecipeRepository.create.mockReturnValue(mockRecipe);
      mockRecipeRepository.save.mockResolvedValue(mockRecipe);
      mockIngredientsService.create.mockRejectedValue(new Error('Creation failed'));
      mockIngredientsService.searchByName.mockResolvedValue([]);

      await expect(service.create(dtoWithNewIngredient, '1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should validate recipe has at least one ingredient', async () => {
      const invalidDto = {
        ...createRecipeDto,
        ingredients: [],
      };

      await expect(service.create(invalidDto, '1')).rejects.toThrow(
        'Recipe must have at least one ingredient'
      );
    });

    it('should validate recipe has at least one step', async () => {
      const invalidDto = {
        ...createRecipeDto,
        steps: [],
      };

      await expect(service.create(invalidDto, '1')).rejects.toThrow(
        'Recipe must have at least one step'
      );
    });

    it('should validate step numbers are consecutive', async () => {
      const invalidDto = {
        ...createRecipeDto,
        steps: [
          { stepNumber: 1, title: 'Step 1', instructions: 'Step 1 instructions', isActive: true },
          { stepNumber: 3, title: 'Step 3', instructions: 'Step 3 instructions', isActive: true }, // Missing step 2
        ],
      };

      await expect(service.create(invalidDto, '1')).rejects.toThrow(
        'Step numbers must be consecutive starting from 1'
      );
    });
  });

  describe('findAll', () => {
    const paginationDto: PaginationDto = { page: 1, limit: 10 };

    it('should find all recipes with pagination', async () => {
      const recipes = [mockRecipe];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([recipes, 1]);

      const result = await service.findAll(paginationDto);

      expect(mockRecipeRepository.createQueryBuilder).toHaveBeenCalledWith('recipe');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(result.data).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        categoryId: '1',
        difficulty: DifficultyLevel.EASY,
        status: RecipeStatus.PUBLISHED,
        search: 'test',
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(paginationDto, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.categoryId = :categoryId',
        { categoryId: '1' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.difficulty = :difficulty',
        { difficulty: DifficultyLevel.EASY }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recipe.status = :status',
        { status: RecipeStatus.PUBLISHED }
      );
    });

    it('should apply sorting by total time', async () => {
      const sort = { sortBy: 'totalTimeMinutes' as const, sortOrder: 'ASC' as const };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(paginationDto, {}, sort);

      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        '(recipe.prepTimeMinutes + recipe.cookTimeMinutes)',
        'totalTime'
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('totalTime', 'ASC');
    });
  });

  describe('findOne', () => {
    it('should find one recipe by id', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      const result = await service.findOne('1');

      expect(mockRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
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
      expect(result).toEqual(mockRecipe);
    });

    it('should return null if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('findOneForResponse', () => {
    it('should find one recipe and transform to response DTO', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      const result = await service.findOneForResponse('1');

      expect(result).toBeDefined();
      expect(result.title).toBe(mockRecipe.title);
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneForResponse('999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateRecipeDto = {
      title: 'Updated Recipe',
      description: 'Updated Description',
    };

    it('should update recipe successfully', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 });
      
      // Mock the second call for findOneForResponse
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);
      mockRecipeRepository.findOne.mockResolvedValueOnce({
        ...mockRecipe,
        title: 'Updated Recipe',
      });

      const result = await service.update('1', updateDto, '1', UserRole.USER);

      expect(mockRecipeRepository.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('999', updateDto, '1', UserRole.USER)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author or admin', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      await expect(
        service.update('1', updateDto, '2', UserRole.USER)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any recipe', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 });
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);

      await service.update('1', updateDto, '2', UserRole.ADMIN);

      expect(mockRecipeRepository.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should update ingredients if provided', async () => {
      const updateDtoWithIngredients = {
        ...updateDto,
        ingredients: [
          {
            ingredientId: '1',
            quantity: 2,
            unit: 'cups',
            order: 1,
          },
        ],
      };

      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeIngredientRepository.delete.mockResolvedValue({ affected: 1 });
      mockRecipeIngredientRepository.save.mockResolvedValue([]);
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 });
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);

      await service.update('1', updateDtoWithIngredients, '1', UserRole.USER);

      expect(mockRecipeIngredientRepository.delete).toHaveBeenCalledWith({ recipeId: '1' });
      expect(mockRecipeIngredientRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove recipe successfully', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1', '1', UserRole.USER);

      expect(mockRecipeRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', '1', UserRole.USER)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if user is not author or admin', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      await expect(service.remove('1', '2', UserRole.USER)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow admin to remove any recipe', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1', '2', UserRole.ADMIN);

      expect(mockRecipeRepository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      await service.incrementViewCount('1');

      expect(mockRecipeRepository.increment).toHaveBeenCalledWith(
        { id: '1' },
        'viewsCount',
        1
      );
    });
  });

  describe('toggleLike', () => {
    it('should increment like count', async () => {
      mockRecipeRepository.findOne.mockResolvedValue({ likesCount: 1 });

      const result = await service.toggleLike('1', true);

      expect(mockRecipeRepository.increment).toHaveBeenCalledWith(
        { id: '1' },
        'likesCount',
        1
      );
      expect(result).toBe(1);
    });

    it('should decrement like count', async () => {
      mockRecipeRepository.findOne.mockResolvedValue({ likesCount: 0 });

      const result = await service.toggleLike('1', false);

      expect(mockRecipeRepository.decrement).toHaveBeenCalledWith(
        { id: '1' },
        'likesCount',
        1
      );
      expect(result).toBe(0);
    });

    it('should return 0 if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      const result = await service.toggleLike('999', true);

      expect(result).toBe(0);
    });
  });

  describe('findByAuthor', () => {
    it('should find recipes by author with published filter', async () => {
      const spy = jest.spyOn(service, 'findAll');
      spy.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });

      await service.findByAuthor('1', { page: 1, limit: 10 }, false);

      expect(spy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {
          authorId: '1',
          status: RecipeStatus.PUBLISHED,
        }
      );

      spy.mockRestore();
    });

    it('should find recipes by author including private', async () => {
      const spy = jest.spyOn(service, 'findAll');
      spy.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });

      await service.findByAuthor('1', { page: 1, limit: 10 }, true);

      expect(spy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        { authorId: '1' }
      );

      spy.mockRestore();
    });
  });

  describe('findFeatured', () => {
    it('should find featured recipes', async () => {
      const spy = jest.spyOn(service, 'findAll');
      spy.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });

      await service.findFeatured({ page: 1, limit: 10 });

      expect(spy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {
          isFeatured: true,
          status: RecipeStatus.PUBLISHED,
          isActive: true,
        },
        {
          sortBy: 'likesCount',
          sortOrder: 'DESC',
        }
      );

      spy.mockRestore();
    });
  });

  describe('search', () => {
    it('should search recipes with query', async () => {
      const spy = jest.spyOn(service, 'findAll');
      spy.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });

      await service.search('test', { page: 1, limit: 10 }, { categoryId: '1' });

      expect(spy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {
          categoryId: '1',
          search: 'test',
          status: RecipeStatus.PUBLISHED,
          isActive: true,
        }
      );

      spy.mockRestore();
    });
  });

  describe('findPublished', () => {
    it('should find published recipes', async () => {
      const spy = jest.spyOn(service, 'findAll');
      spy.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });

      await service.findPublished({ page: 1, limit: 10 }, { categoryId: '1' });

      expect(spy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {
          categoryId: '1',
          status: RecipeStatus.PUBLISHED,
        }
      );

      spy.mockRestore();
    });
  });

  describe('getRecipeStats', () => {
    it('should get recipe statistics', async () => {
      mockRecipeRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // published
        .mockResolvedValueOnce(15)  // draft
        .mockResolvedValueOnce(10); // featured

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ avgPrep: '30.5', avgCook: '45.2' })
        .mockResolvedValueOnce({ categoryName: 'Main Course', count: '25' });

      mockQueryBuilder.getRawMany.mockResolvedValue([
        { difficulty: DifficultyLevel.EASY, count: '40' },
        { difficulty: DifficultyLevel.MEDIUM, count: '35' },
        { difficulty: DifficultyLevel.HARD, count: '25' },
      ]);

      const result = await service.getRecipeStats();

      expect(result).toEqual({
        total: 100,
        published: 80,
        draft: 15,
        featured: 10,
        averagePreparationTime: 31,
        averageCookingTime: 45,
        mostPopularCategory: 'Main Course',
        recipesPerDifficulty: {
          [DifficultyLevel.EASY]: 40,
          [DifficultyLevel.MEDIUM]: 35,
          [DifficultyLevel.HARD]: 25,
        },
      });
    });
  });

  describe('toggleFeatured', () => {
    it('should toggle featured status', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 });
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);

      const result = await service.toggleFeatured('1');

      expect(mockRecipeRepository.update).toHaveBeenCalledWith('1', {
        isFeatured: !mockRecipe.isFeatured,
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(service.toggleFeatured('999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('changeStatus', () => {
    it('should change recipe status', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 });
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);

      const result = await service.changeStatus('1', RecipeStatus.PUBLISHED, '1', UserRole.USER);

      expect(mockRecipeRepository.update).toHaveBeenCalledWith('1', {
        status: RecipeStatus.PUBLISHED,
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changeStatus('999', RecipeStatus.PUBLISHED, '1', UserRole.USER)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author or admin', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      await expect(
        service.changeStatus('1', RecipeStatus.PUBLISHED, '2', UserRole.USER)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to change status of any recipe', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 });
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);

      await service.changeStatus('1', RecipeStatus.PUBLISHED, '2', UserRole.ADMIN);

      expect(mockRecipeRepository.update).toHaveBeenCalledWith('1', {
        status: RecipeStatus.PUBLISHED,
      });
    });
  });

  describe('private helper methods', () => {
    describe('isUUID', () => {
      it('should return true for valid UUID', () => {
        const result = (service as any).isUUID('550e8400-e29b-41d4-a716-446655440000');
        expect(result).toBe(true);
      });

      it('should return false for invalid UUID', () => {
        const result = (service as any).isUUID('not-a-uuid');
        expect(result).toBe(false);
      });
    });

    describe('transformToResponseDto', () => {
      it('should transform recipe to response DTO', () => {
        const result = (service as any).transformToResponseDto(mockRecipe);

        expect(result.ingredientsCount).toBe(1);
        expect(result.stepsCount).toBe(1);
        expect(result.ingredients).toBe(result.recipeIngredients);
      });
    });

    describe('transformToListResponseDto', () => {
      it('should transform recipe to list response DTO', () => {
        const result = (service as any).transformToListResponseDto(mockRecipe);

        expect(result.ingredientsCount).toBe(1);
        expect(result.stepsCount).toBe(1);
      });
    });
  });

  describe('error handling', () => {
    it('should handle database errors during creation', async () => {
      const createRecipeDto: CreateRecipeDto = {
        title: 'Test Recipe',
        description: 'Test Description',
        instructions: 'Test instructions',
        categoryId: '1',
        difficulty: DifficultyLevel.EASY,
        prepTimeMinutes: 30,
        cookTimeMinutes: 45,
        servings: 4,
        tags: ['test'],
        ingredients: [
          {
            ingredientId: '1',
            quantity: 1,
            unit: 'cup',
            order: 1,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: 'Step 1',
            instructions: 'Test instruction',
            },
        ],
      };

      mockRecipeRepository.create.mockReturnValue(mockRecipe);
      mockRecipeRepository.save.mockRejectedValue(new Error('Database connection error'));

      await expect(service.create(createRecipeDto, '1')).rejects.toThrow(
        'Database connection error'
      );
    });

    it('should handle repository errors in findAll', async () => {
      mockQueryBuilder.getManyAndCount.mockRejectedValue(new Error('Query failed'));

      await expect(service.findAll({ page: 1, limit: 10 })).rejects.toThrow(
        'Query failed'
      );
    });

    it('should handle concurrent modification errors', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockRecipeRepository.update.mockResolvedValue({ affected: 0 }); // No rows affected

      // This would indicate the recipe was deleted or modified concurrently
      const updateDto: UpdateRecipeDto = { title: 'Updated Title' };
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockRecipe);
      mockRecipeRepository.findOne.mockResolvedValueOnce(null); // Recipe gone

      await expect(
        service.update('1', updateDto, '1', UserRole.USER)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('security considerations', () => {
    it('should not expose sensitive information in validation errors', async () => {
      const createRecipeDto: CreateRecipeDto = {
        title: '', // Invalid empty title
        description: 'Test Description',
        instructions: 'Test instructions',
        categoryId: '1',
        difficulty: DifficultyLevel.EASY,
        prepTimeMinutes: 30,
        cookTimeMinutes: 45,
        servings: 4,
        tags: ['test'],
        ingredients: [], // Invalid empty ingredients
        steps: [
          {
            stepNumber: 1,
            title: 'Step 1',
            instructions: 'Test instruction',
            },
        ],
      };

      try {
        await service.create(createRecipeDto, '1');
      } catch (error) {
        expect(error.message).toBe('Recipe must have at least one ingredient');
        expect(error.message).not.toContain('authorId');
        expect(error.message).not.toContain('database');
      }
    });

    it('should validate permission boundaries properly', async () => {
      const mockAdminRecipe = {
        ...mockRecipe,
        authorId: '999', // Different author
      };

      mockRecipeRepository.findOne.mockResolvedValue(mockAdminRecipe);

      // Regular user should not be able to modify admin recipe
      await expect(
        service.update('1', { title: 'Hacked' }, '1', UserRole.USER)
      ).rejects.toThrow(ForbiddenException);

      // But admin should be able to modify any recipe
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 });
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockAdminRecipe);
      mockRecipeRepository.findOne.mockResolvedValueOnce(mockAdminRecipe);

      await expect(
        service.update('1', { title: 'Admin Update' }, '1', UserRole.ADMIN)
      ).resolves.toBeDefined();
    });
  });

  describe('performance considerations', () => {
    it('should handle large result sets efficiently', async () => {
      const largeRecipeSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockRecipe,
        id: `recipe-${i}`,
        title: `Recipe ${i}`,
      }));

      mockQueryBuilder.getManyAndCount.mockResolvedValue([largeRecipeSet, 1000]);

      const result = await service.findAll({ page: 1, limit: 1000 });

      expect(result.data.length).toBe(1000);
      expect(result.total).toBe(1000);
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1000);
    });

    it('should optimize queries for complex filtering', async () => {
      const complexFilters = {
        categoryId: '1',
        difficulty: DifficultyLevel.MEDIUM,
        status: RecipeStatus.PUBLISHED,
        authorId: '1',
        minPrepTime: 10,
        maxPrepTime: 60,
        minCookTime: 15,
        maxCookTime: 120,
        minServings: 2,
        maxServings: 8,
        tags: ['vegetarian', 'healthy'],
        isFeatured: true,
        isActive: true,
        search: 'pasta',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10 }, complexFilters);

      // Verify that filters were applied (search, difficulty, category, etc.)
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere.mock.calls.length).toBeGreaterThanOrEqual(10);
    });
  });
});
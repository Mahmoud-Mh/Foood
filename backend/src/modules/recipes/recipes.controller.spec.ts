import { Test, TestingModule } from '@nestjs/testing';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipeSearchService } from './services/recipe-search.service';

describe('RecipesController', () => {
  let controller: RecipesController;
  let recipesService: RecipesService;
  let recipeSearchService: RecipeSearchService;

  const mockRecipesService = {
    findPublished: jest.fn(),
    findFeatured: jest.fn(),
    findByCategory: jest.fn(),
    findByDifficulty: jest.fn(),
    findOne: jest.fn().mockResolvedValue({}),
    findOneForResponse: jest.fn().mockResolvedValue({}),
    incrementViewCount: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn(),
    create: jest.fn(),
    findByAuthor: jest.fn(),
    findMyRecipes: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleFeatured: jest.fn().mockResolvedValue({}),
    getRecipeStats: jest.fn().mockResolvedValue({
      total: 0,
      published: 0,
      draft: 0,
      featured: 0,
      averagePreparationTime: 0,
      averageCookingTime: 0,
      mostPopularCategory: 'None',
      recipesPerDifficulty: {}
    }),
  };

  const mockRecipeSearchService = {
    search: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        {
          provide: RecipesService,
          useValue: mockRecipesService,
        },
        {
          provide: RecipeSearchService,
          useValue: mockRecipeSearchService,
        },
      ],
    }).compile();

    controller = module.get<RecipesController>(RecipesController);
    recipesService = module.get<RecipesService>(RecipesService);
    recipeSearchService = module.get<RecipeSearchService>(RecipeSearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have recipesService injected', () => {
    expect(recipesService).toBeDefined();
  });

  it('should have recipeSearchService injected', () => {
    expect(recipeSearchService).toBeDefined();
  });

  describe('basic service integration', () => {
    it('should call findOneForResponse service method', async () => {
      await controller.findOne('recipe-1');
      expect(mockRecipesService.findOneForResponse).toHaveBeenCalledWith('recipe-1');
      expect(mockRecipesService.incrementViewCount).toHaveBeenCalledWith('recipe-1');
    });

    it('should call toggleFeatured service method', async () => {
      await controller.toggleFeatured('recipe-1');
      expect(mockRecipesService.toggleFeatured).toHaveBeenCalledWith('recipe-1');
    });

    it('should call getRecipeStats service method', async () => {
      await controller.getRecipeStats();
      expect(mockRecipesService.getRecipeStats).toHaveBeenCalled();
    });
  });

  describe('controller structure', () => {
    it('should have expected methods', () => {
      expect(typeof controller.findPublished).toBe('function');
      expect(typeof controller.findFeatured).toBe('function');
      expect(typeof controller.search).toBe('function');
      expect(typeof controller.findByCategory).toBe('function');
      expect(typeof controller.findByDifficulty).toBe('function');
      expect(typeof controller.findOne).toBe('function');
      expect(typeof controller.findAll).toBe('function');
      expect(typeof controller.create).toBe('function');
      expect(typeof controller.findMyRecipes).toBe('function');
      expect(typeof controller.findByAuthor).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.remove).toBe('function');
      expect(typeof controller.toggleFeatured).toBe('function');
      expect(typeof controller.getRecipeStats).toBe('function');
    });
  });

  describe('dependency injection', () => {
    it('should inject RecipesService', () => {
      expect(recipesService).toBe(mockRecipesService);
    });

    it('should inject RecipeSearchService', () => {
      expect(recipeSearchService).toBe(mockRecipeSearchService);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { User } from './modules/users/entities/user.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Ingredient } from './modules/ingredients/entities/ingredient.entity';
import { Recipe } from './modules/recipes/entities/recipe.entity';
import { RecipeIngredient } from './modules/recipes/entities/recipe-ingredient.entity';
import { RecipeStep } from './modules/recipes/entities/recipe-step.entity';

describe('AppService', () => {
  let service: AppService;

  const mockRepository = {
    count: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RecipeIngredient),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RecipeStep),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(service.getHello()).toBe('Hello World!');
    });
  });

  describe('clearDatabase', () => {
    it('should clear database successfully', async () => {
      // Mock repository counts
      mockRepository.count.mockResolvedValue(10);

      // Mock transaction manager
      const mockManager = {
        query: jest.fn().mockResolvedValue(undefined),
      };
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockManager);
      });

      const result = await service.clearDatabase();

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Database cleared successfully',
          totalRecordsDeleted: expect.any(Number),
        }),
      );
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should handle database clearing errors', async () => {
      mockDataSource.transaction.mockRejectedValue(new Error('Database error'));

      const result = await service.clearDatabase();

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Database cleanup failed',
          error: 'Database error',
        }),
      );
    });
  });
});
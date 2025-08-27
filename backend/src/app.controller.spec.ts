import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Ingredient } from './modules/ingredients/entities/ingredient.entity';
import { Recipe } from './modules/recipes/entities/recipe.entity';
import { RecipeIngredient } from './modules/recipes/entities/recipe-ingredient.entity';
import { RecipeStep } from './modules/recipes/entities/recipe-step.entity';
import { ConfigService } from './config/config.service';

describe('AppController', () => {
  let appController: AppController;

  // Mock repository factory
  const mockRepository = () => ({
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockReturnValue({}),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  });

  // Mock DataSource
  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation((callback: (manager: unknown) => unknown) =>
        callback({
          query: jest.fn().mockResolvedValue(undefined),
        }),
      ),
    query: jest.fn().mockResolvedValue(undefined),
  };

  // Mock ConfigService
  const mockConfigService = {
    isDevelopment: true,
    isProduction: false,
    app: { port: 3001 },
    database: {},
    jwt: {},
    email: {},
    throttle: {},
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Ingredient),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Recipe),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(RecipeIngredient),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(RecipeStep),
          useFactory: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('clearDatabase', () => {
    it('should clear database successfully', async () => {
      const result = await appController.clearDatabase();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });
  });
});

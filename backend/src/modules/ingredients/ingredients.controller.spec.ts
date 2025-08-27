import { Test, TestingModule } from '@nestjs/testing';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientResponseDto } from './dto/ingredient-response.dto';
import { IngredientCategory } from './entities/ingredient.entity';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';

describe('IngredientsController', () => {
  let controller: IngredientsController;
  let service: IngredientsService;

  const mockIngredientResponse: IngredientResponseDto = {
    id: '1',
    name: 'Tomato',
    description: 'Fresh red tomato',
    category: IngredientCategory.VEGETABLE,
    imageUrl: undefined,
    caloriesPerUnit: 18,
    defaultUnit: 'grams',
    isActive: true,
    allergenInfo: undefined,
    usageCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockIngredientsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findActive: jest.fn(),
    searchByName: jest.fn(),
    findByCategory: jest.fn(),
    getIngredientStats: jest.fn(),
    getMostUsedIngredients: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    toggleActive: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientsController],
      providers: [
        {
          provide: IngredientsService,
          useValue: mockIngredientsService,
        },
      ],
    }).compile();

    controller = module.get<IngredientsController>(IngredientsController);
    service = module.get<IngredientsService>(IngredientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new ingredient', async () => {
      const createIngredientDto: CreateIngredientDto = {
        name: 'Carrot',
        description: 'Fresh orange carrot',
        category: IngredientCategory.VEGETABLE,
      };

      mockIngredientsService.create.mockResolvedValue(mockIngredientResponse);

      const result = await controller.create(createIngredientDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredient created successfully');
      expect(result.data).toEqual(mockIngredientResponse);
      expect(service.create).toHaveBeenCalledWith(createIngredientDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated ingredients', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const paginatedResult = new PaginatedResultDto([mockIngredientResponse], 1, 1, 10);

      mockIngredientsService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(paginationDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredients retrieved successfully');
      expect(result.data).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe('findActive', () => {
    it('should return active ingredients', async () => {
      const activeIngredients = [mockIngredientResponse];
      mockIngredientsService.findActive.mockResolvedValue(activeIngredients);

      const result = await controller.findActive();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Active ingredients retrieved successfully');
      expect(result.data).toEqual(activeIngredients);
      expect(service.findActive).toHaveBeenCalled();
    });
  });

  describe('searchByName', () => {
    it('should search ingredients by name', async () => {
      const searchName = 'tomato';
      const searchResults = [mockIngredientResponse];
      mockIngredientsService.searchByName.mockResolvedValue(searchResults);

      const result = await controller.searchByName(searchName);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredients search completed');
      expect(result.data).toEqual(searchResults);
      expect(service.searchByName).toHaveBeenCalledWith(searchName);
    });
  });

  describe('findByCategory', () => {
    it('should return ingredients by category', async () => {
      const category = IngredientCategory.VEGETABLE;
      const categoryIngredients = [mockIngredientResponse];
      mockIngredientsService.findByCategory.mockResolvedValue(categoryIngredients);

      const result = await controller.findByCategory(category);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredients by category retrieved successfully');
      expect(result.data).toEqual(categoryIngredients);
      expect(service.findByCategory).toHaveBeenCalledWith(category);
    });
  });

  describe('getIngredientStats', () => {
    it('should return ingredient statistics', async () => {
      const stats = {
        total: 100,
        active: 85,
        inactive: 15,
        byCategory: {
          vegetable: 30,
          protein: 25,
          spice: 20,
        },
      };
      mockIngredientsService.getIngredientStats.mockResolvedValue(stats);

      const result = await controller.getIngredientStats();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredient statistics retrieved successfully');
      expect(result.data).toEqual(stats);
      expect(service.getIngredientStats).toHaveBeenCalled();
    });
  });

  describe('getMostUsedIngredients', () => {
    it('should return most used ingredients with default limit', async () => {
      const mostUsedIngredients = [mockIngredientResponse];
      mockIngredientsService.getMostUsedIngredients.mockResolvedValue(mostUsedIngredients);

      const result = await controller.getMostUsedIngredients();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Most used ingredients retrieved successfully');
      expect(result.data).toEqual(mostUsedIngredients);
      expect(service.getMostUsedIngredients).toHaveBeenCalledWith(10);
    });

    it('should return most used ingredients with custom limit', async () => {
      const limit = 5;
      const mostUsedIngredients = [mockIngredientResponse];
      mockIngredientsService.getMostUsedIngredients.mockResolvedValue(mostUsedIngredients);

      const result = await controller.getMostUsedIngredients(limit);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Most used ingredients retrieved successfully');
      expect(result.data).toEqual(mostUsedIngredients);
      expect(service.getMostUsedIngredients).toHaveBeenCalledWith(limit);
    });
  });

  describe('findOne', () => {
    it('should return ingredient by ID', async () => {
      const id = '1';
      mockIngredientsService.findOne.mockResolvedValue(mockIngredientResponse);

      const result = await controller.findOne(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredient retrieved successfully');
      expect(result.data).toEqual(mockIngredientResponse);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update ingredient', async () => {
      const id = '1';
      const updateIngredientDto: UpdateIngredientDto = {
        name: 'Updated Tomato',
        description: 'Updated description',
      };
      const updatedIngredient = { ...mockIngredientResponse, ...updateIngredientDto };

      mockIngredientsService.update.mockResolvedValue(updatedIngredient);

      const result = await controller.update(id, updateIngredientDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredient updated successfully');
      expect(result.data).toEqual(updatedIngredient);
      expect(service.update).toHaveBeenCalledWith(id, updateIngredientDto);
    });
  });

  describe('toggleActive', () => {
    it('should toggle ingredient active status', async () => {
      const id = '1';
      const toggledIngredient = { ...mockIngredientResponse, isActive: false };

      mockIngredientsService.toggleActive.mockResolvedValue(toggledIngredient);

      const result = await controller.toggleActive(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredient status toggled successfully');
      expect(result.data).toEqual(toggledIngredient);
      expect(service.toggleActive).toHaveBeenCalledWith(id);
    });
  });

  describe('remove', () => {
    it('should delete ingredient', async () => {
      const id = '1';
      mockIngredientsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ingredient deleted successfully');
      expect(result.data).toBeNull();
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
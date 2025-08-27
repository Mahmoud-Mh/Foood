import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoryResponse: CategoryResponseDto = {
    id: '1',
    name: 'Italian',
    description: 'Italian cuisine',
    slug: 'italian',
    icon: '🍝',
    imageUrl: undefined,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findActive: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    update: jest.fn(),
    toggleActive: jest.fn(),
    remove: jest.fn(),
    getCategoryStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Mediterranean',
        description: 'Mediterranean cuisine',
      };

      mockCategoriesService.create.mockResolvedValue(mockCategoryResponse);

      const result = await controller.create(createCategoryDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Category created successfully');
      expect(result.data).toEqual(mockCategoryResponse);
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const paginatedResult = new PaginatedResultDto([mockCategoryResponse], 1, 1, 10);

      mockCategoriesService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(paginationDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Categories retrieved successfully');
      expect(result.data).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe('findActive', () => {
    it('should return active categories', async () => {
      const activeCategories = [mockCategoryResponse];
      mockCategoriesService.findActive.mockResolvedValue(activeCategories);

      const result = await controller.findActive();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Active categories retrieved successfully');
      expect(result.data).toEqual(activeCategories);
      expect(service.findActive).toHaveBeenCalled();
    });
  });

  describe('getCategoryStats', () => {
    it('should return category statistics', async () => {
      const stats = {
        totalCategories: 10,
        activeCategories: 8,
        recipesByCategory: { italian: 5, french: 3 },
      };
      mockCategoriesService.getCategoryStats.mockResolvedValue(stats);

      const result = await controller.getCategoryStats();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Category statistics retrieved successfully');
      expect(result.data).toEqual(stats);
      expect(service.getCategoryStats).toHaveBeenCalled();
    });
  });

  describe('findBySlug', () => {
    it('should return category by slug', async () => {
      const slug = 'italian';
      mockCategoriesService.findBySlug.mockResolvedValue(mockCategoryResponse);

      const result = await controller.findBySlug(slug);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Category retrieved successfully');
      expect(result.data).toEqual(mockCategoryResponse);
      expect(service.findBySlug).toHaveBeenCalledWith(slug);
    });
  });

  describe('findOne', () => {
    it('should return category by ID', async () => {
      const id = '1';
      mockCategoriesService.findOne.mockResolvedValue(mockCategoryResponse);

      const result = await controller.findOne(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Category retrieved successfully');
      expect(result.data).toEqual(mockCategoryResponse);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const id = '1';
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Italian',
        description: 'Updated description',
      };
      const updatedCategory = { ...mockCategoryResponse, ...updateCategoryDto };

      mockCategoriesService.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(id, updateCategoryDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Category updated successfully');
      expect(result.data).toEqual(updatedCategory);
      expect(service.update).toHaveBeenCalledWith(id, updateCategoryDto);
    });
  });

  describe('toggleActive', () => {
    it('should toggle category active status', async () => {
      const id = '1';
      const toggledCategory = { ...mockCategoryResponse, isActive: false };

      mockCategoriesService.toggleActive.mockResolvedValue(toggledCategory);

      const result = await controller.toggleActive(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Category status toggled successfully');
      expect(result.data).toEqual(toggledCategory);
      expect(service.toggleActive).toHaveBeenCalledWith(id);
    });
  });

  describe('remove', () => {
    it('should delete category', async () => {
      const id = '1';
      mockCategoriesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Category deleted successfully');
      expect(result.data).toBeNull();
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
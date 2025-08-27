import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  const mockCategory: Category = {
    id: '1',
    name: 'Italian',
    description: 'Italian cuisine',
    slug: 'italian',
    icon: '🍝',
    imageUrl: undefined,
    isActive: true,
    sortOrder: 0,
    recipes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Mediterranean',
      description: 'Mediterranean cuisine',
    };

    it('should successfully create a new category', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...mockCategory, ...createCategoryDto });
      mockRepository.save.mockResolvedValue({ ...mockCategory, ...createCategoryDto });

      const result = await service.create(createCategoryDto);

      expect(result).toEqual(expect.objectContaining({
        name: createCategoryDto.name,
        description: createCategoryDto.description,
      }));
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when category name already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create(createCategoryDto)).rejects.toThrow(ConflictException);
    });

    it('should check for slug uniqueness', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null) // name check
        .mockResolvedValueOnce(null); // slug check
      mockRepository.create.mockReturnValue({ ...mockCategory, ...createCategoryDto });
      mockRepository.save.mockResolvedValue({ ...mockCategory, ...createCategoryDto });

      await service.create(createCategoryDto);

      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should generate slug from name', async () => {
      const categoryWithSpecialChars = {
        ...createCategoryDto,
        name: 'Asian & Oriental Cuisine',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({
        ...mockCategory,
        ...categoryWithSpecialChars,
        slug: 'asian-oriental-cuisine',
      });
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        ...categoryWithSpecialChars,
        slug: 'asian-oriental-cuisine',
      });

      const result = await service.create(categoryWithSpecialChars);

      expect(result.slug).toBe('asian-oriental-cuisine');
    });
  });

  describe('findAll', () => {
    const paginationDto = { page: 1, limit: 10 };

    it('should return paginated categories', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockCategory], 1]);

      const result = await service.findAll(paginationDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        order: { sortOrder: 'DESC', name: 'ASC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findActive', () => {
    it('should return all active categories', async () => {
      mockRepository.find.mockResolvedValue([mockCategory]);

      const result = await service.findActive();

      expect(result).toEqual([expect.any(Object)]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'DESC', name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return category by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('1');

      expect(result).toEqual(expect.any(Object));
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return category by slug', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findBySlug('italian');

      expect(result).toEqual(expect.any(Object));
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'italian' },
      });
    });

    it('should throw NotFoundException when category not found by slug', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateCategoryDto: UpdateCategoryDto = {
      name: 'Updated Italian',
      description: 'Updated description',
    };

    it('should successfully update category', async () => {
      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      mockRepository.findOne
        .mockResolvedValueOnce(mockCategory) // category exists
        .mockResolvedValueOnce(null); // name is unique (no conflict)
      mockRepository.save.mockResolvedValue(updatedCategory);

      const result = await service.update('1', updateCategoryDto);

      expect(result).toEqual(expect.objectContaining(updateCategoryDto));
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateCategoryDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update slug when name changes', async () => {
      const updateWithNewName = { ...updateCategoryDto, name: 'French Cuisine' };
      mockRepository.findOne
        .mockResolvedValueOnce(mockCategory) // category exists
        .mockResolvedValueOnce(null) // name is unique
        .mockResolvedValueOnce(null); // slug is unique
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        ...updateWithNewName,
        slug: 'french-cuisine',
      });

      const result = await service.update('1', updateWithNewName);

      expect(result.slug).toBe('french-cuisine');
    });

    it('should handle name and slug update', async () => {
      const updateWithNewName = { ...updateCategoryDto, name: 'French Cuisine' };
      mockRepository.findOne
        .mockResolvedValueOnce(mockCategory) // category exists
        .mockResolvedValueOnce(null) // name is unique
        .mockResolvedValueOnce(null); // slug is unique
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        ...updateWithNewName,
        slug: 'french-cuisine',
      });

      const result = await service.update('1', updateWithNewName);

      expect(result.name).toBe('French Cuisine');
      expect(result.slug).toBe('french-cuisine');
    });
  });

  describe('remove', () => {
    it('should successfully remove category', async () => {
      // Reset mock to clear any previous calls
      mockRepository.findOne.mockReset();
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });


  describe('getCategoryStats', () => {
    it('should return category statistics', async () => {
      mockRepository.count
        .mockResolvedValueOnce(10) // total categories
        .mockResolvedValueOnce(8); // active categories

      const result = await service.getCategoryStats();

      expect(result).toEqual({
        totalCategories: 10,
        activeCategories: 8,
        recipesByCategory: {},
      });
      expect(mockRepository.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('toggleActive', () => {
    it('should toggle category active status', async () => {
      const inactiveCategory = { ...mockCategory, isActive: false };
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue(inactiveCategory);

      const result = await service.toggleActive('1');

      expect(result).toEqual(expect.objectContaining({ isActive: false }));
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.toggleActive('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from category name', () => {
      const slug = service['generateSlug']('Italian & Mediterranean Cuisine');
      expect(slug).toBe('italian-mediterranean-cuisine');
    });

    it('should handle special characters and spaces', () => {
      const slug = service['generateSlug']('Asian/Oriental Food & Spices!!!');
      expect(slug).toBe('asianoriental-food-spices');
    });

    it('should handle empty names', () => {
      expect(service['generateSlug']('')).toBe('');
    });
  });

});
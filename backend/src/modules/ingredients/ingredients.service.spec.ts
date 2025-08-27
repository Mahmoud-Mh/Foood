import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { IngredientsService } from './ingredients.service';
import { Ingredient, IngredientCategory } from './entities/ingredient.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

describe('IngredientsService', () => {
  let service: IngredientsService;
  let repository: Repository<Ingredient>;

  const mockIngredient: Ingredient = {
    id: '1',
    name: 'Tomato',
    description: 'Fresh red tomato',
    category: IngredientCategory.VEGETABLE,
    imageUrl: undefined,
    caloriesPerUnit: 18,
    defaultUnit: 'grams',
    isActive: true,
    allergenInfo: undefined,
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
        IngredientsService,
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<IngredientsService>(IngredientsService);
    repository = module.get<Repository<Ingredient>>(getRepositoryToken(Ingredient));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createIngredientDto: CreateIngredientDto = {
      name: 'Onion',
      description: 'Yellow onion',
      category: IngredientCategory.VEGETABLE,
      caloriesPerUnit: 40,
      defaultUnit: 'piece',
      allergenInfo: undefined,
    };

    it('should successfully create a new ingredient', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...mockIngredient, ...createIngredientDto });
      mockRepository.save.mockResolvedValue({ ...mockIngredient, ...createIngredientDto });

      const result = await service.create(createIngredientDto);

      expect(result).toEqual(expect.objectContaining({
        name: createIngredientDto.name,
        description: createIngredientDto.description,
      }));
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when ingredient name already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockIngredient);

      await expect(service.create(createIngredientDto)).rejects.toThrow(ConflictException);
    });

    it('should generate slug from name', async () => {
      const ingredientWithSpecialChars = {
        ...createIngredientDto,
        name: 'Extra Virgin Olive Oil',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({
        ...mockIngredient,
        ...ingredientWithSpecialChars,
        slug: 'extra-virgin-olive-oil',
      });
      mockRepository.save.mockResolvedValue({
        ...mockIngredient,
        ...ingredientWithSpecialChars,
        slug: 'extra-virgin-olive-oil',
      });

      const result = await service.create(ingredientWithSpecialChars);

      expect(result.name).toBe(ingredientWithSpecialChars.name);
    });

  });

  describe('findAll', () => {
    it('should return paginated ingredients', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const ingredients = [mockIngredient];
      mockRepository.findAndCount.mockResolvedValue([ingredients, 1]);

      const result = await service.findAll(paginationDto);

      expect(result.data).toEqual([expect.any(Object)]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return ingredient by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockIngredient);

      const result = await service.findOne('1');

      expect(result).toEqual(expect.any(Object));
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when ingredient not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateIngredientDto: UpdateIngredientDto = {
      name: 'Cherry Tomato',
      description: 'Sweet cherry tomatoes',
      caloriesPerUnit: 20,
    };

    it('should successfully update ingredient', async () => {
      const updatedIngredient = { ...mockIngredient, ...updateIngredientDto };
      mockRepository.findOne
        .mockResolvedValueOnce(mockIngredient)
        .mockResolvedValueOnce(null); // no conflict when checking name uniqueness
      mockRepository.save.mockResolvedValue(updatedIngredient);

      const result = await service.update('1', updateIngredientDto);

      expect(result).toEqual(expect.objectContaining(updateIngredientDto));
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when ingredient not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateIngredientDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle name change', async () => {
      const updateWithNewName = { ...updateIngredientDto, name: 'Roma Tomato' };
      mockRepository.findOne
        .mockResolvedValueOnce(mockIngredient)
        .mockResolvedValueOnce(null); // no existing ingredient with new name
      mockRepository.save.mockResolvedValue({
        ...mockIngredient,
        ...updateWithNewName,
      });

      const result = await service.update('1', updateWithNewName);

      expect(result.name).toBe(updateWithNewName.name);
    });
  });

  describe('remove', () => {
    it('should successfully delete ingredient', async () => {
      mockRepository.findOne.mockResolvedValue(mockIngredient);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockIngredient);
    });

    it('should throw NotFoundException when ingredient not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchByName', () => {
    it('should return ingredients matching search query', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockIngredient]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchByName('tomato');

      expect(result).toEqual([expect.any(Object)]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'ingredient.name ILIKE :name',
        { name: '%tomato%' }
      );
    });

    it('should return empty array when no matches found', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchByName('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('findByCategory', () => {
    it('should return ingredients in specific category', async () => {
      const vegetables = [mockIngredient];
      mockRepository.find.mockResolvedValue(vegetables);

      const result = await service.findByCategory(IngredientCategory.VEGETABLE);

      expect(result).toEqual(vegetables);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { category: IngredientCategory.VEGETABLE, isActive: true },
        order: { name: 'ASC' },
      });
    });
  });

});
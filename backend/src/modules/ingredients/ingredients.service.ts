import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Ingredient, IngredientCategory } from './entities/ingredient.entity';

// Type definitions for statistics
interface CategoryStatsRaw {
  category: string;
  count: string;
}

interface IngredientStatsResult {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
}
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientResponseDto } from './dto/ingredient-response.dto';
import {
  PaginationDto,
  PaginatedResultDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientsRepository: Repository<Ingredient>,
  ) {}

  async create(
    createIngredientDto: CreateIngredientDto,
  ): Promise<IngredientResponseDto> {
    // Check if ingredient name already exists
    const existingIngredient = await this.ingredientsRepository.findOne({
      where: { name: createIngredientDto.name },
    });

    if (existingIngredient) {
      throw new ConflictException('Ingredient with this name already exists');
    }

    // Create new ingredient
    const ingredient = this.ingredientsRepository.create({
      ...createIngredientDto,
      category: createIngredientDto.category ?? IngredientCategory.OTHER,
      defaultUnit: createIngredientDto.defaultUnit ?? 'grams',
    });

    const savedIngredient = await this.ingredientsRepository.save(ingredient);
    return this.transformToResponseDto(savedIngredient);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<IngredientResponseDto>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [ingredients, total] = await this.ingredientsRepository.findAndCount({
      order: {
        name: 'ASC',
      },
      skip,
      take: limit,
    });

    const transformedIngredients = ingredients.map((ingredient) =>
      this.transformToResponseDto(ingredient),
    );

    return new PaginatedResultDto(transformedIngredients, total, page, limit);
  }

  async findActive(): Promise<IngredientResponseDto[]> {
    const ingredients = await this.ingredientsRepository.find({
      where: { isActive: true },
      order: {
        name: 'ASC',
      },
    });

    return ingredients.map((ingredient) =>
      this.transformToResponseDto(ingredient),
    );
  }

  async findByCategory(
    category: IngredientCategory,
  ): Promise<IngredientResponseDto[]> {
    const ingredients = await this.ingredientsRepository.find({
      where: {
        category,
        isActive: true,
      },
      order: {
        name: 'ASC',
      },
    });

    return ingredients.map((ingredient) =>
      this.transformToResponseDto(ingredient),
    );
  }

  async searchByName(name: string): Promise<IngredientResponseDto[]> {
    const ingredients = await this.ingredientsRepository
      .createQueryBuilder('ingredient')
      .where('ingredient.name ILIKE :name', { name: `%${name}%` })
      .andWhere('ingredient.isActive = :isActive', { isActive: true })
      .orderBy('ingredient.name', 'ASC')
      .limit(20) // Limit search results
      .getMany();

    return ingredients.map((ingredient) =>
      this.transformToResponseDto(ingredient),
    );
  }

  async findOne(id: string): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientsRepository.findOne({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID "${id}" not found`);
    }

    return this.transformToResponseDto(ingredient);
  }

  async update(
    id: string,
    updateIngredientDto: UpdateIngredientDto,
  ): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientsRepository.findOne({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID "${id}" not found`);
    }

    // Check name uniqueness if name is being updated
    if (
      updateIngredientDto.name &&
      updateIngredientDto.name !== ingredient.name
    ) {
      const existingIngredient = await this.ingredientsRepository.findOne({
        where: { name: updateIngredientDto.name },
      });

      if (existingIngredient) {
        throw new ConflictException('Ingredient with this name already exists');
      }
    }

    // Update ingredient properties
    Object.assign(ingredient, updateIngredientDto);
    const updatedIngredient = await this.ingredientsRepository.save(ingredient);

    return this.transformToResponseDto(updatedIngredient);
  }

  async remove(id: string): Promise<void> {
    const ingredient = await this.ingredientsRepository.findOne({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID "${id}" not found`);
    }

    // TODO: Check if ingredient is used in recipes before deletion
    // const usageCount = await this.getUsageCount(id);
    // if (usageCount > 0) {
    //   throw new BadRequestException('Cannot delete ingredient used in recipes');
    // }

    await this.ingredientsRepository.remove(ingredient);
  }

  async toggleActive(id: string): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientsRepository.findOne({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID "${id}" not found`);
    }

    ingredient.isActive = !ingredient.isActive;
    const updatedIngredient = await this.ingredientsRepository.save(ingredient);

    return this.transformToResponseDto(updatedIngredient);
  }

  async getIngredientStats(): Promise<IngredientStatsResult> {
    const total = await this.ingredientsRepository.count();
    const active = await this.ingredientsRepository.count({
      where: { isActive: true },
    });
    const inactive = total - active;

    // Count by categories
    const categoryStats = await this.ingredientsRepository
      .createQueryBuilder('ingredient')
      .select('ingredient.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('ingredient.isActive = :isActive', { isActive: true })
      .groupBy('ingredient.category')
      .getRawMany();

    return {
      total,
      active,
      inactive,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      byCategory: categoryStats.reduce(
        (acc: Record<string, number>, stat: CategoryStatsRaw) => {
          acc[stat.category] = parseInt(stat.count, 10);
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async getMostUsedIngredients(
    limit: number = 10,
  ): Promise<IngredientResponseDto[]> {
    // TODO: Implement after Recipe relations are created
    // For now, return most recent ingredients
    const ingredients = await this.ingredientsRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return ingredients.map((ingredient) =>
      this.transformToResponseDto(ingredient),
    );
  }

  private transformToResponseDto(
    ingredient: Ingredient,
  ): IngredientResponseDto {
    return plainToClass(IngredientResponseDto, ingredient, {
      excludeExtraneousValues: true,
    });
  }
}

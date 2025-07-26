import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Check if category name already exists
    const existingCategory = await this.categoriesRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Generate slug from name
    const slug = this.generateSlug(createCategoryDto.name);
    
    // Check if slug already exists
    const existingSlug = await this.categoriesRepository.findOne({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('Category slug already exists, please use a different name');
    }

    // Create new category
    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug,
      sortOrder: createCategoryDto.sortOrder ?? 0,
    });

    const savedCategory = await this.categoriesRepository.save(category);
    return this.transformToResponseDto(savedCategory);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResultDto<CategoryResponseDto>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.categoriesRepository.findAndCount({
      order: { 
        sortOrder: 'DESC', 
        name: 'ASC' 
      },
      skip,
      take: limit,
    });

    const transformedCategories = categories.map(category => 
      this.transformToResponseDto(category)
    );

    return new PaginatedResultDto(transformedCategories, total, page, limit);
  }

  async findActive(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.find({
      where: { isActive: true },
      order: { 
        sortOrder: 'DESC', 
        name: 'ASC' 
      },
    });

    return categories.map(category => this.transformToResponseDto(category));
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return this.transformToResponseDto(category);
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return this.transformToResponseDto(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Check name uniqueness if name is being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }

      // Regenerate slug if name changed
      updateCategoryDto.name = updateCategoryDto.name;
      const newSlug = this.generateSlug(updateCategoryDto.name);
      
      const existingSlug = await this.categoriesRepository.findOne({
        where: { slug: newSlug },
      });

      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException('Category slug already exists, please use a different name');
      }

      category.slug = newSlug;
    }

    // Update category properties
    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoriesRepository.save(category);

    return this.transformToResponseDto(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // TODO: Check if category has recipes before deletion
    // const recipeCount = await this.getRecipeCount(id);
    // if (recipeCount > 0) {
    //   throw new BadRequestException('Cannot delete category with existing recipes');
    // }

    await this.categoriesRepository.remove(category);
  }

  async toggleActive(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    category.isActive = !category.isActive;
    const updatedCategory = await this.categoriesRepository.save(category);

    return this.transformToResponseDto(updatedCategory);
  }

  async getCategoryStats(): Promise<any> {
    const total = await this.categoriesRepository.count();
    const active = await this.categoriesRepository.count({
      where: { isActive: true },
    });
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
    };
  }

  private transformToResponseDto(category: Category): CategoryResponseDto {
    return plainToClass(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
} 
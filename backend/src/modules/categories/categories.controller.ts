import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public, AdminOnly, UserOrAdmin } from '../../common/decorators/auth.decorators';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category name or slug already exists',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.create(createCategoryDto);
    return ApiResponseDto.success('Category created successfully', category);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
    type: PaginatedResultDto<CategoryResponseDto>,
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<ApiResponseDto<PaginatedResultDto<CategoryResponseDto>>> {
    const categories = await this.categoriesService.findAll(paginationDto);
    return ApiResponseDto.success('Categories retrieved successfully', categories);
  }

  @Get('active')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  async findActive(): Promise<ApiResponseDto<CategoryResponseDto[]>> {
    const categories = await this.categoriesService.findActive();
    return ApiResponseDto.success('Active categories retrieved successfully', categories);
  }

  @Get('stats')
  @AdminOnly()
  @ApiOperation({ summary: 'Get category statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category statistics retrieved successfully',
  })
  async getCategoryStats(): Promise<ApiResponseDto<any>> {
    const stats = await this.categoriesService.getCategoryStats();
    return ApiResponseDto.success('Category statistics retrieved successfully', stats);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.findBySlug(slug);
    return ApiResponseDto.success('Category retrieved successfully', category);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID (public)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.findOne(id);
    return ApiResponseDto.success('Category retrieved successfully', category);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category name or slug already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return ApiResponseDto.success('Category updated successfully', category);
  }

  @Patch(':id/toggle-active')
  @AdminOnly()
  @ApiOperation({ summary: 'Toggle category active status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category status toggled successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.toggleActive(id);
    return ApiResponseDto.success('Category status toggled successfully', category);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete category with existing recipes',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.categoriesService.remove(id);
    return ApiResponseDto.success('Category deleted successfully', null);
  }
} 
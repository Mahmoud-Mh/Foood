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
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientResponseDto } from './dto/ingredient-response.dto';
import { IngredientCategory } from './entities/ingredient.entity';
import {
  PaginationDto,
  PaginatedResultDto,
} from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public, AdminOnly } from '../../common/decorators/auth.decorators';

@ApiTags('Ingredients')
@Controller('ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new ingredient (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ingredient created successfully',
    type: IngredientResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ingredient name already exists',
  })
  async create(
    @Body() createIngredientDto: CreateIngredientDto,
  ): Promise<ApiResponseDto<IngredientResponseDto>> {
    const ingredient =
      await this.ingredientsService.create(createIngredientDto);
    return ApiResponseDto.success(
      'Ingredient created successfully',
      ingredient,
    );
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all ingredients with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredients retrieved successfully',
    type: PaginatedResultDto<IngredientResponseDto>,
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<ApiResponseDto<PaginatedResultDto<IngredientResponseDto>>> {
    const ingredients = await this.ingredientsService.findAll(paginationDto);
    return ApiResponseDto.success(
      'Ingredients retrieved successfully',
      ingredients,
    );
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get all active ingredients' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active ingredients retrieved successfully',
    type: [IngredientResponseDto],
  })
  async findActive(): Promise<ApiResponseDto<IngredientResponseDto[]>> {
    const ingredients = await this.ingredientsService.findActive();
    return ApiResponseDto.success(
      'Active ingredients retrieved successfully',
      ingredients,
    );
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search ingredients by name' })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
    description: 'Ingredient name to search',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredients search completed',
    type: [IngredientResponseDto],
  })
  async searchByName(
    @Query('name') name: string,
  ): Promise<ApiResponseDto<IngredientResponseDto[]>> {
    const ingredients = await this.ingredientsService.searchByName(name);
    return ApiResponseDto.success('Ingredients search completed', ingredients);
  }

  @Get('category/:category')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get ingredients by category' })
  @ApiParam({
    name: 'category',
    enum: IngredientCategory,
    description: 'Ingredient category',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredients by category retrieved successfully',
    type: [IngredientResponseDto],
  })
  async findByCategory(
    @Param('category') category: IngredientCategory,
  ): Promise<ApiResponseDto<IngredientResponseDto[]>> {
    const ingredients = await this.ingredientsService.findByCategory(category);
    return ApiResponseDto.success(
      'Ingredients by category retrieved successfully',
      ingredients,
    );
  }

  @Get('stats')
  @AdminOnly()
  @ApiOperation({ summary: 'Get ingredient statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient statistics retrieved successfully',
  })
  async getIngredientStats(): Promise<
    ApiResponseDto<{
      total: number;
      active: number;
      inactive: number;
      byCategory: Record<string, number>;
    }>
  > {
    const stats = await this.ingredientsService.getIngredientStats();
    return ApiResponseDto.success(
      'Ingredient statistics retrieved successfully',
      stats,
    );
  }

  @Get('most-used')
  @Public()
  @ApiOperation({ summary: 'Get most used ingredients (public)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of ingredients to return',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Most used ingredients retrieved successfully',
    type: [IngredientResponseDto],
  })
  async getMostUsedIngredients(
    @Query('limit') limit?: number,
  ): Promise<ApiResponseDto<IngredientResponseDto[]>> {
    const ingredients = await this.ingredientsService.getMostUsedIngredients(
      limit || 10,
    );
    return ApiResponseDto.success(
      'Most used ingredients retrieved successfully',
      ingredients,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get ingredient by ID (public)' })
  @ApiParam({ name: 'id', description: 'Ingredient UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient retrieved successfully',
    type: IngredientResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<IngredientResponseDto>> {
    const ingredient = await this.ingredientsService.findOne(id);
    return ApiResponseDto.success(
      'Ingredient retrieved successfully',
      ingredient,
    );
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update ingredient (Admin only)' })
  @ApiParam({ name: 'id', description: 'Ingredient UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient updated successfully',
    type: IngredientResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ingredient name already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ): Promise<ApiResponseDto<IngredientResponseDto>> {
    const ingredient = await this.ingredientsService.update(
      id,
      updateIngredientDto,
    );
    return ApiResponseDto.success(
      'Ingredient updated successfully',
      ingredient,
    );
  }

  @Patch(':id/toggle-active')
  @AdminOnly()
  @ApiOperation({ summary: 'Toggle ingredient active status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Ingredient UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient status toggled successfully',
    type: IngredientResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient not found',
  })
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<IngredientResponseDto>> {
    const ingredient = await this.ingredientsService.toggleActive(id);
    return ApiResponseDto.success(
      'Ingredient status toggled successfully',
      ingredient,
    );
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Delete ingredient (Admin only)' })
  @ApiParam({ name: 'id', description: 'Ingredient UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete ingredient used in recipes',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.ingredientsService.remove(id);
    return ApiResponseDto.success('Ingredient deleted successfully', null);
  }
}

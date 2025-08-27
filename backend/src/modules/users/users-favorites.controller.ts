import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserFavoriteDto,
  UserFavoriteResponseDto,
} from './dto/user-favorite.dto';
import {
  PaginationDto,
  PaginatedResultDto,
} from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('User Favorites')
@Controller('users/favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UsersFavoritesController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Add recipe to user favorites' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recipe added to favorites successfully',
    type: UserFavoriteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Recipe is already in favorites',
  })
  async addToFavorites(
    @Request() req: AuthenticatedRequest,
    @Body() createFavoriteDto: CreateUserFavoriteDto,
  ): Promise<ApiResponseDto<UserFavoriteResponseDto>> {
    const favorite = await this.usersService.addToFavorites(
      req.user.id,
      createFavoriteDto,
    );
    return ApiResponseDto.success(
      'Recipe added to favorites successfully',
      favorite,
    );
  }

  @Delete(':recipeId')
  @ApiOperation({ summary: 'Remove recipe from user favorites' })
  @ApiParam({ name: 'recipeId', description: 'Recipe UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe removed from favorites successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Favorite not found',
  })
  async removeFromFavorites(
    @Request() req: AuthenticatedRequest,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.usersService.removeFromFavorites(req.user.id, recipeId);
    return ApiResponseDto.success(
      'Recipe removed from favorites successfully',
      null,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites with pagination' })
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
    description: 'User favorites retrieved successfully',
    type: PaginatedResultDto<UserFavoriteResponseDto>,
  })
  async getUserFavorites(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto,
  ): Promise<ApiResponseDto<PaginatedResultDto<UserFavoriteResponseDto>>> {
    const favorites = await this.usersService.getUserFavorites(
      req.user.id,
      paginationDto,
    );
    return ApiResponseDto.success(
      'User favorites retrieved successfully',
      favorites,
    );
  }

  @Get(':recipeId/check')
  @ApiOperation({ summary: 'Check if recipe is in user favorites' })
  @ApiParam({ name: 'recipeId', description: 'Recipe UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Favorite status retrieved successfully',
  })
  async checkFavoriteStatus(
    @Request() req: AuthenticatedRequest,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<ApiResponseDto<{ isFavorite: boolean }>> {
    const isFavorite = await this.usersService.isFavorite(
      req.user.id,
      recipeId,
    );
    return ApiResponseDto.success('Favorite status retrieved successfully', {
      isFavorite,
    });
  }

  @Get('recipe-ids')
  @ApiOperation({ summary: 'Get user favorite recipe IDs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User favorite recipe IDs retrieved successfully',
  })
  async getUserFavoriteRecipeIds(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponseDto<{ recipeIds: string[] }>> {
    const recipeIds = await this.usersService.getUserFavoriteRecipeIds(
      req.user.id,
    );
    return ApiResponseDto.success(
      'User favorite recipe IDs retrieved successfully',
      { recipeIds },
    );
  }
}

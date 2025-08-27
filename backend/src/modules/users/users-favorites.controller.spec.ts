import { Test, TestingModule } from '@nestjs/testing';
import { UsersFavoritesController } from './users-favorites.controller';
import { UsersService } from './users.service';
import { CreateUserFavoriteDto, UserFavoriteResponseDto } from './dto/user-favorite.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from './entities/user.entity';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

describe('UsersFavoritesController', () => {
  let controller: UsersFavoritesController;
  let usersService: UsersService;

  const mockUser: UserResponseDto = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    role: UserRole.USER,
    avatar: undefined,
    bio: undefined,
    isActive: true,
    isEmailVerified: false,
    lastLoginAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'excluded',
  };

  const mockUserFavorite: UserFavoriteResponseDto = {
    id: 'fav-1',
    userId: '1',
    recipeId: 'recipe-1',
    createdAt: new Date(),
  };

  const mockRequest: AuthenticatedRequest = {
    user: mockUser,
  } as AuthenticatedRequest;

  const mockUsersService = {
    addToFavorites: jest.fn(),
    removeFromFavorites: jest.fn(),
    getUserFavorites: jest.fn(),
    isFavorite: jest.fn(),
    getUserFavoriteRecipeIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersFavoritesController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersFavoritesController>(UsersFavoritesController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addToFavorites', () => {
    it('should add recipe to user favorites', async () => {
      const createFavoriteDto: CreateUserFavoriteDto = {
        recipeId: 'recipe-1',
      };

      mockUsersService.addToFavorites.mockResolvedValue(mockUserFavorite);

      const result = await controller.addToFavorites(mockRequest, createFavoriteDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Recipe added to favorites successfully');
      expect(result.data).toEqual(mockUserFavorite);
      expect(usersService.addToFavorites).toHaveBeenCalledWith(
        mockUser.id,
        createFavoriteDto,
      );
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove recipe from user favorites', async () => {
      const recipeId = 'recipe-1';
      mockUsersService.removeFromFavorites.mockResolvedValue(undefined);

      const result = await controller.removeFromFavorites(mockRequest, recipeId);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Recipe removed from favorites successfully');
      expect(result.data).toBeNull();
      expect(usersService.removeFromFavorites).toHaveBeenCalledWith(
        mockUser.id,
        recipeId,
      );
    });
  });

  describe('getUserFavorites', () => {
    it('should return paginated user favorites', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const paginatedResult = new PaginatedResultDto(
        [mockUserFavorite],
        1,
        1,
        10,
      );

      mockUsersService.getUserFavorites.mockResolvedValue(paginatedResult);

      const result = await controller.getUserFavorites(mockRequest, paginationDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User favorites retrieved successfully');
      expect(result.data).toEqual(paginatedResult);
      expect(usersService.getUserFavorites).toHaveBeenCalledWith(
        mockUser.id,
        paginationDto,
      );
    });
  });

  describe('checkFavoriteStatus', () => {
    it('should return favorite status for a recipe', async () => {
      const recipeId = 'recipe-1';
      const isFavorite = true;
      mockUsersService.isFavorite.mockResolvedValue(isFavorite);

      const result = await controller.checkFavoriteStatus(mockRequest, recipeId);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Favorite status retrieved successfully');
      expect(result.data).toEqual({ isFavorite });
      expect(usersService.isFavorite).toHaveBeenCalledWith(mockUser.id, recipeId);
    });

    it('should return false when recipe is not a favorite', async () => {
      const recipeId = 'recipe-2';
      const isFavorite = false;
      mockUsersService.isFavorite.mockResolvedValue(isFavorite);

      const result = await controller.checkFavoriteStatus(mockRequest, recipeId);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Favorite status retrieved successfully');
      expect(result.data).toEqual({ isFavorite });
      expect(usersService.isFavorite).toHaveBeenCalledWith(mockUser.id, recipeId);
    });
  });

  describe('getUserFavoriteRecipeIds', () => {
    it('should return user favorite recipe IDs', async () => {
      const recipeIds = ['recipe-1', 'recipe-2', 'recipe-3'];
      mockUsersService.getUserFavoriteRecipeIds.mockResolvedValue(recipeIds);

      const result = await controller.getUserFavoriteRecipeIds(mockRequest);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User favorite recipe IDs retrieved successfully');
      expect(result.data).toEqual({ recipeIds });
      expect(usersService.getUserFavoriteRecipeIds).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should return empty array when user has no favorites', async () => {
      const recipeIds: string[] = [];
      mockUsersService.getUserFavoriteRecipeIds.mockResolvedValue(recipeIds);

      const result = await controller.getUserFavoriteRecipeIds(mockRequest);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User favorite recipe IDs retrieved successfully');
      expect(result.data).toEqual({ recipeIds });
      expect(usersService.getUserFavoriteRecipeIds).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });
});
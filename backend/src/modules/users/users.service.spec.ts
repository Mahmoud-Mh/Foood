import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { UserFavorite } from './entities/user-favorite.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';
import { UploadsService } from '../uploads/uploads.service';
import { Recipe } from '../recipes/entities/recipe.entity';
import { CreateUserFavoriteDto } from './dto/user-favorite.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let userFavoriteRepository: Repository<UserFavorite>;
  let recipeRepository: Repository<Recipe>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    avatar: undefined,
    bio: undefined,
    isActive: true,
    isEmailVerified: false,
    lastLoginAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifications: [],
    passwordResets: [],
    get fullName() { return `${this.firstName} ${this.lastName}`; },
    hashPassword: async () => {},
    validatePassword: async () => true,
    isAdmin: () => false,
    updateLastLogin: () => {}
  } as User;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockUserFavoriteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRecipeRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };

  const mockUploadsService = {
    deleteOptimizedImages: jest.fn(),
    deleteFile: jest.fn(),
    getFilenameFromUrl: jest.fn(),
    getFilePath: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRecipeRepository,
        },
        {
          provide: getRepositoryToken(UserFavorite),
          useValue: mockUserFavoriteRepository,
        },
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userFavoriteRepository = module.get<Repository<UserFavorite>>(
      getRepositoryToken(UserFavorite),
    );
    recipeRepository = module.get<Repository<Recipe>>(getRepositoryToken(Recipe));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.USER,
    };

    it('should successfully create a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ ...mockUser, ...createUserDto });
      mockUserRepository.save.mockResolvedValue({ ...mockUser, ...createUserDto });

      const result = await service.create(createUserDto);

      expect(result).toEqual(expect.objectContaining({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      }));
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('should create user with provided data', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.create(createUserDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    const paginationDto: PaginationDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated users', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll(paginationDto);

      expect(result).toBeInstanceOf(PaginatedResultDto);
      expect(result.data).toEqual([expect.any(Object)]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle search query properly', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll(paginationDto, 'john');

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        where: [
          { email: expect.anything() },
          { firstName: expect.anything() },
          { lastName: expect.anything() },
        ],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle role filter', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll(paginationDto, undefined, 'admin');

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        where: { role: 'admin' },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(expect.any(Object));
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return user with password field selected', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmailWithPassword('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.arrayContaining(['password', 'email', 'id']),
      });
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'Updated bio',
    };

    it('should successfully update user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(result).toEqual(expect.any(Object));
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle avatar update', async () => {
      const updateWithAvatar = { ...updateUserDto, avatar: 'new-avatar.jpg' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, ...updateWithAvatar });

      const result = await service.update('1', updateWithAvatar);

      expect(result.avatar).toBe('new-avatar.jpg');
    });

    it('should check email uniqueness when updating email', async () => {
      const updateWithEmail = { email: 'newemail@example.com' };
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call for finding user to update
        .mockResolvedValueOnce({ id: '2', email: 'newemail@example.com' }); // Second call for checking email uniqueness

      await expect(service.update('1', updateWithEmail)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const profileUpdate = { bio: 'New bio' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, bio: 'New bio' };
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', profileUpdate);

      expect(result.bio).toBe('New bio');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('1', { bio: 'test' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should successfully remove user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.count.mockResolvedValue(0);
      mockUserRepository.remove.mockResolvedValue(undefined);

      await service.remove('1');

      expect(mockRecipeRepository.count).toHaveBeenCalledWith({
        where: { authorId: '1' },
      });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should prevent deletion when user has recipes', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.count.mockResolvedValue(5);

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
    });

    it('should delete user avatar when removing user with avatar', async () => {
      const userWithAvatar = { ...mockUser, avatar: 'http://example.com/api/v1/uploads/avatar/test.jpg' };
      mockUserRepository.findOne.mockResolvedValue(userWithAvatar);
      mockRecipeRepository.count.mockResolvedValue(0);
      mockUserRepository.remove.mockResolvedValue(undefined);
      mockUploadsService.getFilenameFromUrl.mockReturnValue('test.jpg');
      mockUploadsService.getFilePath.mockReturnValue('/path/to/test.jpg');

      await service.remove('1');

      expect(mockUploadsService.deleteFile).toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const deactivatedUser = { ...mockUser, isActive: false };
      mockUserRepository.save.mockResolvedValue(deactivatedUser);

      const result = await service.deactivateUser('1');

      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.deactivateUser('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockUserRepository.findOne.mockResolvedValue(deactivatedUser);
      const activatedUser = { ...deactivatedUser, isActive: true };
      mockUserRepository.save.mockResolvedValue(activatedUser);

      const result = await service.activateUser('1');

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.activateUser('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email successfully', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      mockUserRepository.findOne.mockResolvedValue(unverifiedUser);
      const verifiedUser = { ...unverifiedUser, isEmailVerified: true };
      mockUserRepository.save.mockResolvedValue(verifiedUser);

      const result = await service.verifyEmail('1');

      expect(result.isEmailVerified).toBe(true);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('changeUserRole', () => {
    it('should update user role successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      mockUserRepository.save.mockResolvedValue(adminUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.changeUserRole('1', UserRole.ADMIN);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(mockUserRepository.update).toHaveBeenCalled(); // Token invalidation
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.changeUserRole('nonexistent', UserRole.ADMIN)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle role update to same role', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.changeUserRole('1', UserRole.USER);

      expect(result.role).toBe(UserRole.USER);
    });
  });

  describe('promoteToAdmin', () => {
    it('should promote user to admin', async () => {
      const promotedUser = { ...mockUser, role: UserRole.ADMIN };
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      mockUserRepository.findOne.mockResolvedValue(promotedUser);

      const result = await service.promoteToAdmin('1');

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw NotFoundException if user not found after update', async () => {
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.promoteToAdmin('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockUserRepository.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80)  // activeUsers
        .mockResolvedValueOnce(75)  // verifiedUsers  
        .mockResolvedValueOnce(5)   // adminUsers
        .mockResolvedValueOnce(10); // recentUsers

      const result = await service.getUserStats();

      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 80,
        inactiveUsers: 20,
        adminUsers: 5,
        regularUsers: 95,
        recentUsers: 10,
      });
    });
  });

  describe('getActiveUsers', () => {
    it('should return active users', async () => {
      const activeUsers = [mockUser];
      mockUserRepository.find.mockResolvedValue(activeUsers);

      const result = await service.getActiveUsers();

      expect(result).toHaveLength(1);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      const adminUsers = [{ ...mockUser, role: UserRole.ADMIN }];
      mockUserRepository.find.mockResolvedValue(adminUsers);

      const result = await service.getUsersByRole('admin');

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(UserRole.ADMIN);
    });
  });

  describe('findByRole', () => {
    it('should return paginated users by role', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[mockUser], 1]);
      
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const result = await service.findByRole('user', paginationDto);

      expect(result).toBeInstanceOf(PaginatedResultDto);
      expect(result.total).toBe(1);
    });
  });

  describe('searchUsers', () => {
    it('should search users with query', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const result = await service.searchUsers('john', paginationDto);

      expect(result).toBeInstanceOf(PaginatedResultDto);
      expect(result.total).toBe(1);
    });
  });

  describe('addToFavorites', () => {
    const mockRecipe: Recipe = {
      id: '1',
      title: 'Test Recipe',
      authorId: '2',
    } as Recipe;

    const mockFavorite: UserFavorite = {
      id: '1',
      userId: '1',
      recipeId: '1',
      createdAt: new Date(),
    } as UserFavorite;

    it('should add recipe to favorites successfully', async () => {
      const createFavoriteDto: CreateUserFavoriteDto = { recipeId: '1' };
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserFavoriteRepository.findOne.mockResolvedValue(null);
      mockUserFavoriteRepository.create.mockReturnValue(mockFavorite);
      mockUserFavoriteRepository.save.mockResolvedValue(mockFavorite);

      const result = await service.addToFavorites('1', createFavoriteDto);

      expect(result).toEqual({
        id: mockFavorite.id,
        userId: mockFavorite.userId,
        recipeId: mockFavorite.recipeId,
        createdAt: mockFavorite.createdAt,
      });
      expect(mockUserFavoriteRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when recipe not found', async () => {
      const createFavoriteDto: CreateUserFavoriteDto = { recipeId: 'nonexistent' };
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(service.addToFavorites('1', createFavoriteDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException when recipe already in favorites', async () => {
      const createFavoriteDto: CreateUserFavoriteDto = { recipeId: '1' };
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserFavoriteRepository.findOne.mockResolvedValue(mockFavorite);

      await expect(service.addToFavorites('1', createFavoriteDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove recipe from favorites successfully', async () => {
      const mockFavorite = { id: '1', userId: '1', recipeId: '1' };
      mockUserFavoriteRepository.findOne.mockResolvedValue(mockFavorite);
      mockUserFavoriteRepository.remove.mockResolvedValue(undefined);

      await service.removeFromFavorites('1', '1');

      expect(mockUserFavoriteRepository.remove).toHaveBeenCalledWith(mockFavorite);
    });

    it('should throw NotFoundException when favorite not found', async () => {
      mockUserFavoriteRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromFavorites('1', '1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUserFavorites', () => {
    const mockFavorite = {
      id: '1',
      userId: '1',
      recipeId: '1',
      createdAt: new Date(),
    };

    it('should return paginated user favorites', async () => {
      mockUserFavoriteRepository.findAndCount.mockResolvedValue([[mockFavorite], 1]);

      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const result = await service.getUserFavorites('1', paginationDto);

      expect(result).toBeInstanceOf(PaginatedResultDto);
      expect(result.data).toEqual([{
        id: mockFavorite.id,
        userId: mockFavorite.userId,
        recipeId: mockFavorite.recipeId,
        createdAt: mockFavorite.createdAt,
      }]);
      expect(result.total).toBe(1);
    });

    it('should handle empty favorites list', async () => {
      mockUserFavoriteRepository.findAndCount.mockResolvedValue([[], 0]);

      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const result = await service.getUserFavorites('1', paginationDto);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('isFavorite', () => {
    it('should return true when recipe is favorited', async () => {
      mockUserFavoriteRepository.findOne.mockResolvedValue({ id: '1' });

      const result = await service.isFavorite('1', '1');

      expect(result).toBe(true);
    });

    it('should return false when recipe is not favorited', async () => {
      mockUserFavoriteRepository.findOne.mockResolvedValue(null);

      const result = await service.isFavorite('1', '1');

      expect(result).toBe(false);
    });
  });

  describe('getUserFavoriteRecipeIds', () => {
    it('should return array of favorite recipe IDs', async () => {
      const mockFavorites = [
        { recipeId: '1' },
        { recipeId: '2' },
        { recipeId: '3' },
      ];
      mockUserFavoriteRepository.find.mockResolvedValue(mockFavorites);

      const result = await service.getUserFavoriteRecipeIds('1');

      expect(result).toEqual(['1', '2', '3']);
      expect(mockUserFavoriteRepository.find).toHaveBeenCalledWith({
        where: { userId: '1' },
        select: ['recipeId'],
      });
    });

    it('should return empty array when user has no favorites', async () => {
      mockUserFavoriteRepository.find.mockResolvedValue([]);

      const result = await service.getUserFavoriteRecipeIds('1');

      expect(result).toEqual([]);
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login time', async () => {
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateLastLogin('1');

      expect(mockUserRepository.update).toHaveBeenCalledWith('1', {
        lastLoginAt: expect.any(Date)
      });
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete user account with cleanup', async () => {
      const mockRecipes = [
        { id: '1', imageUrl: 'http://test.com/uploads/recipe/image1.jpg', additionalImages: [] }
      ];
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.find.mockResolvedValue(mockRecipes);
      mockRecipeRepository.delete.mockResolvedValue({ affected: 1 });
      mockUserRepository.remove.mockResolvedValue(undefined);
      mockUploadsService.getFilenameFromUrl.mockReturnValue('image1.jpg');
      mockUploadsService.getFilePath.mockReturnValue('/path/to/image1.jpg');

      await service.deleteUserAccount('1');

      expect(mockRecipeRepository.find).toHaveBeenCalledWith({
        where: { authorId: '1' },
        select: ['id', 'imageUrl', 'additionalImages'],
      });
      expect(mockUploadsService.deleteFile).toHaveBeenCalled();
      expect(mockRecipeRepository.delete).toHaveBeenCalledWith({ authorId: '1' });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteUserAccount('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('transformToResponseDto', () => {
    it('should transform user entity to response DTO', async () => {
      const result = service['transformToResponseDto'](mockUser);

      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('firstName', mockUser.firstName);
      expect(result).toHaveProperty('lastName', mockUser.lastName);
      expect(result).toHaveProperty('fullName', `${mockUser.firstName} ${mockUser.lastName}`);
      expect(result.password).toBe(''); // Should be empty string for exclusion
    });

    it('should exclude password from response', async () => {
      const result = service['transformToResponseDto'](mockUser);
      
      expect(result.password).toBe(''); // Should be empty for exclusion
    });

    it('should handle user with all optional fields', async () => {
      const fullUser = {
        ...mockUser,
        avatar: 'avatar.jpg',
        bio: 'User bio',
        lastLoginAt: new Date(),
        get fullName() { return `${this.firstName} ${this.lastName}`; },
        hashPassword: async () => {},
        validatePassword: async () => true,
        isAdmin: () => false,
        updateLastLogin: () => {}
      } as User;
      
      const result = service['transformToResponseDto'](fullUser);
      
      expect(result.avatar).toBe('avatar.jpg');
      expect(result.bio).toBe('User bio');
      expect(result.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database errors in create', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));

      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      };

      await expect(service.create(createUserDto)).rejects.toThrow('Database error');
    });

    it('should handle invalid pagination parameters', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      const invalidPaginationDto: PaginationDto = { page: 0, limit: -1 };
      const result = await service.findAll(invalidPaginationDto);

      expect(result).toBeInstanceOf(PaginatedResultDto);
    });

    it('should handle foreign key constraint error on user deletion', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.count.mockResolvedValue(0);
      mockUserRepository.remove.mockRejectedValue({ code: '23503' });

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
    });
  });
});
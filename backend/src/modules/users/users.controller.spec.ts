import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UserRole } from './entities/user.entity';
import { PaginatedResultDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let authService: AuthService;

  const mockUserResponse: UserResponseDto = {
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

  const mockAdminUser: UserResponseDto = {
    ...mockUserResponse,
    id: '2',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getUserStats: jest.fn(),
    getActiveUsers: jest.fn(),
    getUsersByRole: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    deleteUserAccount: jest.fn(),
    deactivateUser: jest.fn(),
    activateUser: jest.fn(),
    verifyEmail: jest.fn(),
    changeUserRole: jest.fn(),
    promoteToAdmin: jest.fn(),
  };

  const mockAuthService = {
    generateTokensForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.USER,
      };

      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await controller.create(createUserDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User created successfully');
      expect(result.data).toEqual(mockUserResponse);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const getUsersDto: GetUsersDto = { page: 1, limit: 10 };
      const paginatedResult = new PaginatedResultDto([mockUserResponse], 1, 1, 10);

      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(getUsersDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Users retrieved successfully');
      expect(result.data).toEqual(paginatedResult);
      expect(usersService.findAll).toHaveBeenCalledWith(
        getUsersDto,
        getUsersDto.search,
        getUsersDto.role,
      );
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const stats = {
        totalUsers: 100,
        activeUsers: 85,
        inactiveUsers: 15,
        adminUsers: 5,
        regularUsers: 95,
        recentUsers: 10,
      };

      mockUsersService.getUserStats.mockResolvedValue(stats);

      const result = await controller.getUserStats();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User statistics retrieved successfully');
      expect(result.data).toEqual(stats);
      expect(usersService.getUserStats).toHaveBeenCalled();
    });
  });

  describe('getActiveUsers', () => {
    it('should return active users', async () => {
      const activeUsers = [mockUserResponse];
      mockUsersService.getActiveUsers.mockResolvedValue(activeUsers);

      const result = await controller.getActiveUsers();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Active users retrieved successfully');
      expect(result.data).toEqual(activeUsers);
      expect(usersService.getActiveUsers).toHaveBeenCalled();
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      const role = UserRole.ADMIN;
      const usersByRole = [mockAdminUser];
      mockUsersService.getUsersByRole.mockResolvedValue(usersByRole);

      const result = await controller.getUsersByRole(role);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe(`Users with role ${role} retrieved successfully`);
      expect(result.data).toEqual(usersByRole);
      expect(usersService.getUsersByRole).toHaveBeenCalledWith(role);
    });
  });

  describe('getMyProfile', () => {
    it('should return current user profile', () => {
      const result = controller.getMyProfile(mockUserResponse);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User profile retrieved successfully');
      expect(result.data).toEqual(mockUserResponse);
    });
  });

  describe('findOne', () => {
    it('should return user by ID for admin user', async () => {
      const id = '1';
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne(id, mockAdminUser);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User retrieved successfully');
      expect(result.data).toEqual(mockUserResponse);
      expect(usersService.findOne).toHaveBeenCalledWith(id);
    });

    it('should return own profile for regular user accessing own profile', async () => {
      const id = '1';
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne(id, mockUserResponse);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User retrieved successfully');
      expect(result.data).toEqual(mockUserResponse);
      expect(usersService.findOne).toHaveBeenCalledWith(id);
    });

    it('should return own profile when regular user tries to access other user', async () => {
      const otherId = '2';
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne(otherId, mockUserResponse);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User retrieved successfully');
      expect(result.data).toEqual(mockUserResponse);
      expect(usersService.findOne).toHaveBeenCalledWith(mockUserResponse.id);
    });
  });

  describe('updateMyProfile', () => {
    it('should update current user profile', async () => {
      const userId = '1';
      const updateProfileDto: UpdateProfileDto = {
        avatar: 'https://example.com/new-avatar.jpg',
        bio: 'Updated bio',
      };
      const updatedUser = { ...mockUserResponse, ...updateProfileDto };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateMyProfile(userId, updateProfileDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
      expect(result.data).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith(userId, updateProfileDto);
    });
  });

  describe('update', () => {
    it('should update user by ID', async () => {
      const id = '1';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated John',
        lastName: 'Updated Doe',
      };
      const updatedUser = { ...mockUserResponse, ...updateUserDto };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(id, updateUserDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User updated successfully');
      expect(result.data).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith(id, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should delete user by ID', async () => {
      const id = '1';
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id, mockAdminUser);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User deleted successfully');
      expect(usersService.remove).toHaveBeenCalledWith(id);
    });

    it('should prevent user from deleting their own account', async () => {
      const id = '1';

      await expect(controller.remove(id, mockUserResponse)).rejects.toThrow(
        ForbiddenException,
      );
      expect(usersService.remove).not.toHaveBeenCalled();
    });
  });

  describe('deleteMyAccount', () => {
    it('should delete current user account', async () => {
      const userId = '1';
      mockUsersService.deleteUserAccount.mockResolvedValue(undefined);

      const result = await controller.deleteMyAccount(userId);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Account deleted successfully');
      expect(usersService.deleteUserAccount).toHaveBeenCalledWith(userId);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      const id = '1';
      const deactivatedUser = { ...mockUserResponse, isActive: false };
      mockUsersService.deactivateUser.mockResolvedValue(deactivatedUser);

      const result = await controller.deactivateUser(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User deactivated successfully');
      expect(result.data).toEqual(deactivatedUser);
      expect(usersService.deactivateUser).toHaveBeenCalledWith(id);
    });
  });

  describe('activateUser', () => {
    it('should activate user', async () => {
      const id = '1';
      const activatedUser = { ...mockUserResponse, isActive: true };
      mockUsersService.activateUser.mockResolvedValue(activatedUser);

      const result = await controller.activateUser(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User activated successfully');
      expect(result.data).toEqual(activatedUser);
      expect(usersService.activateUser).toHaveBeenCalledWith(id);
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const id = '1';
      const verifiedUser = { ...mockUserResponse, isEmailVerified: true };
      mockUsersService.verifyEmail.mockResolvedValue(verifiedUser);

      const result = await controller.verifyEmail(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(result.data).toEqual(verifiedUser);
      expect(usersService.verifyEmail).toHaveBeenCalledWith(id);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const id = '1';
      const body = { role: UserRole.ADMIN };
      const updatedUser = { ...mockUserResponse, role: UserRole.ADMIN };
      mockUsersService.changeUserRole.mockResolvedValue(updatedUser);

      const result = await controller.updateUserRole(id, body, mockAdminUser);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User role updated successfully');
      expect(result.data).toEqual(updatedUser);
      expect(usersService.changeUserRole).toHaveBeenCalledWith(id, body.role);
    });

    it('should prevent user from changing their own role', async () => {
      const id = '1';
      const body = { role: UserRole.ADMIN };

      await expect(
        controller.updateUserRole(id, body, mockUserResponse),
      ).rejects.toThrow(ForbiddenException);
      expect(usersService.changeUserRole).not.toHaveBeenCalled();
    });
  });

  describe('changeUserRole', () => {
    it('should change user role', async () => {
      const id = '1';
      const role = UserRole.ADMIN;
      const updatedUser = { ...mockUserResponse, role: UserRole.ADMIN };
      mockUsersService.changeUserRole.mockResolvedValue(updatedUser);

      const result = await controller.changeUserRole(id, role);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User role changed successfully');
      expect(result.data).toEqual(updatedUser);
      expect(usersService.changeUserRole).toHaveBeenCalledWith(id, role);
    });
  });

  describe('promoteToAdmin', () => {
    it('should promote user to admin', async () => {
      const email = 'user@example.com';
      const promotedUser = { ...mockUserResponse, role: UserRole.ADMIN };
      mockUsersService.findByEmail.mockResolvedValue(mockUserResponse);
      mockUsersService.promoteToAdmin.mockResolvedValue(promotedUser);

      const result = await controller.promoteToAdmin(email);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User promoted to admin successfully');
      expect(result.data).toEqual(promotedUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.promoteToAdmin).toHaveBeenCalledWith(mockUserResponse.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      const email = 'nonexistent@example.com';
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(controller.promoteToAdmin(email)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersService.promoteToAdmin).not.toHaveBeenCalled();
    });
  });

  describe('bootstrapAdmin', () => {
    it('should bootstrap admin user with tokens', async () => {
      const email = 'user@example.com';
      const promotedUser = { ...mockUserResponse, role: UserRole.ADMIN };
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUserResponse);
      mockUsersService.promoteToAdmin.mockResolvedValue(promotedUser);
      mockAuthService.generateTokensForUser.mockReturnValue(tokens);

      const result = await controller.bootstrapAdmin(email);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('First admin user created successfully');
      expect(result.data).toEqual({
        user: promotedUser,
        tokens: tokens,
        message: 'Admin privileges granted with new tokens',
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.promoteToAdmin).toHaveBeenCalledWith(mockUserResponse.id);
      expect(authService.generateTokensForUser).toHaveBeenCalledWith(promotedUser);
    });

    it('should throw NotFoundException when user not found for bootstrap', async () => {
      const email = 'nonexistent@example.com';
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(controller.bootstrapAdmin(email)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersService.promoteToAdmin).not.toHaveBeenCalled();
      expect(authService.generateTokensForUser).not.toHaveBeenCalled();
    });
  });
});
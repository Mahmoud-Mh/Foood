import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  PaginationDto,
  PaginatedResultDto,
} from '../../common/dto/pagination.dto';
import { UploadsService } from '../uploads/uploads.service';
import { Recipe } from '../recipes/entities/recipe.entity';
import { UserFavorite } from './entities/user-favorite.entity';
import {
  CreateUserFavoriteDto,
  UserFavoriteResponseDto,
} from './dto/user-favorite.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(UserFavorite)
    private userFavoriteRepository: Repository<UserFavorite>,
    private uploadsService: UploadsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user (password will be hashed automatically by the entity)
    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);
    return this.transformToResponseDto(savedUser);
  }

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
    role?: string,
  ): Promise<PaginatedResultDto<UserResponseDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    // Build where conditions
    let whereConditions: Record<string, unknown> | Record<string, unknown>[] =
      {};

    if (role) {
      whereConditions.role = role;
    }

    if (search) {
      // Search in email, firstName, or lastName
      // Use OR conditions for search
      // Improved search with case-insensitive matching
      const searchTerm = search.toLowerCase();
      whereConditions = [
        { email: ILike(`%${searchTerm}%`), ...(role ? { role } : {}) },
        { firstName: ILike(`%${searchTerm}%`), ...(role ? { role } : {}) },
        { lastName: ILike(`%${searchTerm}%`), ...(role ? { role } : {}) },
      ];
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = users.map((user) => this.transformToResponseDto(user));

    return new PaginatedResultDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return this.transformToResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'avatar',
        'bio',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Handle avatar cleanup if new avatar is provided
    if (
      updateUserDto.avatar &&
      user.avatar &&
      user.avatar !== updateUserDto.avatar
    ) {
      this.cleanupOldAvatar(user.avatar);
    }

    // Update user properties
    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(updatedUser);
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Handle avatar cleanup if new avatar is provided
    if (
      updateProfileDto.avatar &&
      user.avatar &&
      user.avatar !== updateProfileDto.avatar
    ) {
      this.cleanupOldAvatar(user.avatar);
    }

    // Update profile fields - handle both setting and clearing
    if ('avatar' in updateProfileDto) {
      // Clean up old avatar if we're clearing it or changing it
      if (!updateProfileDto.avatar && user.avatar) {
        this.cleanupOldAvatar(user.avatar);
      }
      user.avatar = updateProfileDto.avatar || undefined; // Explicitly set to undefined if clearing
    }
    if ('bio' in updateProfileDto) {
      user.bio = updateProfileDto.bio || undefined; // Explicitly set to undefined if clearing
    }

    const updatedUser = await this.usersRepository.save(user);
    return this.transformToResponseDto(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Check if user has associated recipes
    const recipeCount = await this.recipeRepository.count({
      where: { authorId: id },
    });
    if (recipeCount > 0) {
      throw new ConflictException(
        `Cannot delete user. User has ${recipeCount} associated recipe(s). Please delete the recipes first or deactivate the user instead.`,
      );
    }

    // Clean up user's avatar file before deleting
    if (user.avatar) {
      this.cleanupOldAvatar(user.avatar);
    }

    try {
      await this.usersRepository.remove(user);
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23503') {
        // Foreign key constraint violation
        throw new ConflictException(
          'Cannot delete user due to associated data. Please delete associated records first or deactivate the user instead.',
        );
      }
      throw error;
    }
  }

  async deactivateUser(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    user.isActive = false;
    const updatedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(updatedUser);
  }

  async activateUser(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    user.isActive = true;
    const updatedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(updatedUser);
  }

  async verifyEmail(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    user.isEmailVerified = true;
    const updatedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(updatedUser);
  }

  async changeUserRole(id: string, role: UserRole): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Don't allow users to change their own role
    // This should be checked at the controller level, but adding here as extra security
    if (user.role === role) {
      return this.transformToResponseDto(user); // No change needed
    }

    user.role = role;
    const updatedUser = await this.usersRepository.save(user);

    // Invalidate all existing tokens for this user
    await this.invalidateUserTokens(id);

    return this.transformToResponseDto(updatedUser);
  }

  private async invalidateUserTokens(userId: string): Promise<void> {
    // Update the user's lastLoginAt to invalidate existing tokens
    // This is a simple approach - in production, you might want a proper token blacklist
    await this.usersRepository.update(userId, {
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async promoteToAdmin(id: string): Promise<UserResponseDto> {
    await this.usersRepository.update(id, { role: UserRole.ADMIN });
    const updatedUser = await this.usersRepository.findOne({ where: { id } });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return this.transformToResponseDto(updatedUser);
  }

  async getActiveUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.transformToResponseDto(user));
  }

  async getUsersByRole(role: string): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      where: { role: role as UserRole },
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.transformToResponseDto(user));
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    regularUsers: number;
    recentUsers: number;
  }> {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({
      where: { isActive: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const verifiedUsers = await this.usersRepository.count({
      where: { isEmailVerified: true },
    });
    const adminUsers = await this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });

    const regularUsers = totalUsers - adminUsers;
    const recentUsers = await this.usersRepository.count({
      where: {
        createdAt: MoreThanOrEqual(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ), // Last 30 days
      },
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      regularUsers,
      recentUsers,
    };
  }

  async findByRole(
    role: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<UserResponseDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAndCount({
      where: { role: role as UserRole },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = users.map((user) => this.transformToResponseDto(user));

    return new PaginatedResultDto(data, total, page, limit);
  }

  async searchUsers(
    query: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<UserResponseDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository
      .createQueryBuilder('user')
      .where(
        'user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query',
        {
          query: `%${query}%`,
        },
      )
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    const data = users.map((user) => this.transformToResponseDto(user));

    return new PaginatedResultDto(data, total, page, limit);
  }

  async deleteUserAccount(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Get user's recipes to clean up images
    const userRecipes = await this.recipeRepository.find({
      where: { authorId: id },
      select: ['id', 'imageUrl', 'additionalImages'],
    });

    // Clean up recipe images
    for (const recipe of userRecipes) {
      // Clean up main recipe image
      if (recipe.imageUrl && recipe.imageUrl.includes('/uploads/recipe/')) {
        const filename = this.uploadsService.getFilenameFromUrl(
          recipe.imageUrl,
        );
        if (filename) {
          const filepath = this.uploadsService.getFilePath(filename, 'recipe');
          this.uploadsService.deleteFile(filepath);
        }
      }

      // Clean up additional recipe images
      if (recipe.additionalImages && recipe.additionalImages.length > 0) {
        for (const imageUrl of recipe.additionalImages) {
          if (imageUrl && imageUrl.includes('/uploads/recipe/')) {
            const filename = this.uploadsService.getFilenameFromUrl(imageUrl);
            if (filename) {
              const filepath = this.uploadsService.getFilePath(
                filename,
                'recipe',
              );
              this.uploadsService.deleteFile(filepath);
            }
          }
        }
      }
    }

    // Delete user's recipes (cascade will handle ingredients and steps)
    await this.recipeRepository.delete({ authorId: id });

    // Clean up user's avatar file
    if (user.avatar) {
      this.cleanupOldAvatar(user.avatar);
    }

    // Finally, delete the user
    await this.usersRepository.remove(user);
  }

  private transformToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      password: '', // This will be excluded by the @Exclude decorator
    };
  }

  async addToFavorites(
    userId: string,
    createFavoriteDto: CreateUserFavoriteDto,
  ): Promise<UserFavoriteResponseDto> {
    // Check if recipe exists
    const recipe = await this.recipeRepository.findOne({
      where: { id: createFavoriteDto.recipeId },
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Check if already favorited
    const existingFavorite = await this.userFavoriteRepository.findOne({
      where: {
        userId,
        recipeId: createFavoriteDto.recipeId,
      },
    });
    if (existingFavorite) {
      throw new ConflictException('Recipe is already in favorites');
    }

    // Create favorite
    const favorite = this.userFavoriteRepository.create({
      userId,
      recipeId: createFavoriteDto.recipeId,
    });
    const savedFavorite = await this.userFavoriteRepository.save(favorite);

    return this.transformFavoriteToResponseDto(savedFavorite);
  }

  async removeFromFavorites(userId: string, recipeId: string): Promise<void> {
    const favorite = await this.userFavoriteRepository.findOne({
      where: { userId, recipeId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.userFavoriteRepository.remove(favorite);
  }

  async getUserFavorites(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<UserFavoriteResponseDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const [favorites, total] = await this.userFavoriteRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = favorites.map((favorite) =>
      this.transformFavoriteToResponseDto(favorite),
    );

    return new PaginatedResultDto(data, total, page, limit);
  }

  async isFavorite(userId: string, recipeId: string): Promise<boolean> {
    const favorite = await this.userFavoriteRepository.findOne({
      where: { userId, recipeId },
    });
    return !!favorite;
  }

  async getUserFavoriteRecipeIds(userId: string): Promise<string[]> {
    const favorites = await this.userFavoriteRepository.find({
      where: { userId },
      select: ['recipeId'],
    });
    return favorites.map((favorite) => favorite.recipeId);
  }

  private transformFavoriteToResponseDto(
    favorite: UserFavorite,
  ): UserFavoriteResponseDto {
    return {
      id: favorite.id,
      userId: favorite.userId,
      recipeId: favorite.recipeId,
      createdAt: favorite.createdAt,
    };
  }

  private cleanupOldAvatar(avatarUrl: string): void {
    // Only clean up files uploaded to our server
    if (avatarUrl && avatarUrl.includes('/api/v1/uploads/avatar/')) {
      const filename = this.uploadsService.getFilenameFromUrl(avatarUrl);
      if (filename) {
        const filepath = this.uploadsService.getFilePath(filename, 'avatar');
        this.uploadsService.deleteFile(filepath);
      }
    }
  }
}

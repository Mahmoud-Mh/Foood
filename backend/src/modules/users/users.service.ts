import { Injectable, ConflictException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';
import { UploadsService } from '../uploads/uploads.service';
import { Recipe } from '../recipes/entities/recipe.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
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

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResultDto<UserResponseDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = users.map(user => this.transformToResponseDto(user));

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
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive', 'avatar', 'bio', 'createdAt', 'updatedAt']
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
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
    if (updateUserDto.avatar && user.avatar && user.avatar !== updateUserDto.avatar) {
      this.cleanupOldAvatar(user.avatar);
    }

    // Update user properties
    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(updatedUser);
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Handle avatar cleanup if new avatar is provided
    if (updateProfileDto.avatar && user.avatar && user.avatar !== updateProfileDto.avatar) {
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

    // Clean up user's avatar file before deleting
    if (user.avatar) {
      this.cleanupOldAvatar(user.avatar);
    }

    await this.usersRepository.remove(user);
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

  async changeUserRole(id: string, role: any): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    user.role = role;
    const updatedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(updatedUser);
  }

  async promoteToAdmin(id: string): Promise<UserResponseDto> {
    await this.usersRepository.update(id, { role: 'admin' as any });
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

    return users.map(user => this.transformToResponseDto(user));
  }

  async getUsersByRole(role: any): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      where: { role },
      order: { createdAt: 'DESC' },
    });

    return users.map(user => this.transformToResponseDto(user));
  }

  async getUserStats(): Promise<any> {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
    const verifiedUsers = await this.usersRepository.count({ where: { isEmailVerified: true } });
    const adminUsers = await this.usersRepository.count({ where: { role: 'admin' as any } });

    return {
      total: totalUsers,
      active: activeUsers,
      verified: verifiedUsers,
      admins: adminUsers,
      inactive: totalUsers - activeUsers,
      unverified: totalUsers - verifiedUsers,
    };
  }

  async findByRole(role: string, paginationDto: PaginationDto): Promise<PaginatedResultDto<UserResponseDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAndCount({
      where: { role: role as any },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = users.map(user => this.transformToResponseDto(user));

    return new PaginatedResultDto(data, total, page, limit);
  }

  async searchUsers(query: string, paginationDto: PaginationDto): Promise<PaginatedResultDto<UserResponseDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query', {
        query: `%${query}%`,
      })
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    const data = users.map(user => this.transformToResponseDto(user));

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
      select: ['id', 'imageUrl', 'additionalImages']
    });

    // Clean up recipe images
    for (const recipe of userRecipes) {
      // Clean up main recipe image
      if (recipe.imageUrl && recipe.imageUrl.includes('/uploads/recipe/')) {
        const filename = this.uploadsService.getFilenameFromUrl(recipe.imageUrl);
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
              const filepath = this.uploadsService.getFilePath(filename, 'recipe');
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
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
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
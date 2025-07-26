import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(savedUser);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResultDto<UserResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const userResponseDtos = users.map(user => this.transformToResponseDto(user));

    return new PaginatedResultDto(userResponseDtos, total, page, limit);
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
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive', 'isEmailVerified']
    });
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

    // Update user properties
    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
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

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async changeUserRole(id: string, role: UserRole): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    user.role = role;
    const updatedUser = await this.usersRepository.save(user);

    return this.transformToResponseDto(updatedUser);
  }

  async getActiveUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return users.map(user => this.transformToResponseDto(user));
  }

  async getUsersByRole(role: UserRole): Promise<UserResponseDto[]> {
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
    const adminUsers = await this.usersRepository.count({ where: { role: UserRole.ADMIN } });

    return {
      total: totalUsers,
      active: activeUsers,
      verified: verifiedUsers,
      admins: adminUsers,
      inactive: totalUsers - activeUsers,
      unverified: totalUsers - verifiedUsers,
    };
  }

  private transformToResponseDto(user: User): UserResponseDto {
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
} 
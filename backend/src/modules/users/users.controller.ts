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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto, PaginatedResultDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { 
  Public, 
  AdminOnly, 
  CurrentUser, 
  CurrentUserId,
  Roles 
} from '../../common/decorators/auth.decorators';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.create(createUserDto);
    return ApiResponseDto.success('User created successfully', user);
  }

  @Get()
  @AdminOnly()
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: PaginatedResultDto<UserResponseDto>,
  })
  async findAll(@Query() paginationDto: PaginationDto): Promise<ApiResponseDto<PaginatedResultDto<UserResponseDto>>> {
    const users = await this.usersService.findAll(paginationDto);
    return ApiResponseDto.success('Users retrieved successfully', users);
  }

  @Get('stats')
  @AdminOnly()
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User statistics retrieved successfully',
  })
  async getUserStats(): Promise<ApiResponseDto<any>> {
    const stats = await this.usersService.getUserStats();
    return ApiResponseDto.success('User statistics retrieved successfully', stats);
  }

  @Get('active')
  @AdminOnly()
  @ApiOperation({ summary: 'Get all active users (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active users retrieved successfully',
    type: [UserResponseDto],
  })
  async getActiveUsers(): Promise<ApiResponseDto<UserResponseDto[]>> {
    const users = await this.usersService.getActiveUsers();
    return ApiResponseDto.success('Active users retrieved successfully', users);
  }

  @Get('role/:role')
  @AdminOnly()
  @ApiOperation({ summary: 'Get users by role (Admin only)' })
  @ApiParam({ name: 'role', enum: UserRole, description: 'User role to filter by' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users by role retrieved successfully',
    type: [UserResponseDto],
  })
  async getUsersByRole(@Param('role') role: UserRole): Promise<ApiResponseDto<UserResponseDto[]>> {
    const users = await this.usersService.getUsersByRole(role);
    return ApiResponseDto.success(`Users with role ${role} retrieved successfully`, users);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getMyProfile(@CurrentUser() user: UserResponseDto): Promise<ApiResponseDto<UserResponseDto>> {
    return ApiResponseDto.success('User profile retrieved successfully', user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserResponseDto,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    // Users can only view their own profile unless they're admin
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      const user = await this.usersService.findOne(currentUser.id);
      return ApiResponseDto.success('User retrieved successfully', user);
    }
    
    const user = await this.usersService.findOne(id);
    return ApiResponseDto.success('User retrieved successfully', user);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  async updateMyProfile(
    @CurrentUserId() userId: string,
    @Body() updateUserDto: UpdateProfileDto,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.update(userId, updateUserDto);
    return ApiResponseDto.success('Profile updated successfully', user);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.update(id, updateUserDto);
    return ApiResponseDto.success('User updated successfully', user);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseDto<null>> {
    await this.usersService.remove(id);
    return ApiResponseDto.success('User deleted successfully');
  }

  @Patch(':id/deactivate')
  @AdminOnly()
  @ApiOperation({ summary: 'Deactivate user account (Admin only)' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deactivated successfully',
    type: UserResponseDto,
  })
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.deactivateUser(id);
    return ApiResponseDto.success('User deactivated successfully', user);
  }

  @Patch(':id/activate')
  @AdminOnly()
  @ApiOperation({ summary: 'Activate user account (Admin only)' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User activated successfully',
    type: UserResponseDto,
  })
  async activateUser(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.activateUser(id);
    return ApiResponseDto.success('User activated successfully', user);
  }

  @Patch(':id/verify-email')
  @AdminOnly()
  @ApiOperation({ summary: 'Verify user email (Admin only)' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: UserResponseDto,
  })
  async verifyEmail(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.verifyEmail(id);
    return ApiResponseDto.success('Email verified successfully', user);
  }

  @Patch(':id/change-role')
  @AdminOnly()
  @ApiOperation({ summary: 'Change user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiQuery({ name: 'role', enum: UserRole, description: 'New role for the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role changed successfully',
    type: UserResponseDto,
  })
  async changeUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('role') role: UserRole,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.changeUserRole(id, role);
    return ApiResponseDto.success('User role changed successfully', user);
  }

  @Patch('promote-to-admin/:email')
  @Public()
  @ApiOperation({ 
    summary: 'Promote user to admin by email (DEVELOPMENT ONLY)',
    description: 'Temporary endpoint for automated testing. Should be removed in production.'
  })
  @ApiParam({ name: 'email', description: 'User email to promote' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User promoted to admin successfully',
    type: UserResponseDto,
  })
  async promoteToAdmin(@Param('email') email: string): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // ONLY change role, keep password unchanged
    const promotedUser = await this.usersService.promoteToAdmin(user.id);
    return ApiResponseDto.success('User promoted to admin successfully', promotedUser);
  }
} 
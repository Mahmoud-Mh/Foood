import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { UsersService } from '../users/users.service';
import { ConfigService } from '../../config/config.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, TokenResponseDto } from './dto/auth-response.dto';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  email: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Validate password confirmation
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user (password will be hashed automatically by the entity)
    const { confirmPassword, ...createUserData } = registerDto;
    const user = await this.usersService.create({
      ...createUserData,
      role: UserRole.USER, // Default role for registration
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return new AuthResponseDto(
      user,
      tokens,
      'Registration successful'
    );
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user with password
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Transform to response DTO (exclude password)
    const userResponse = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    return new AuthResponseDto(
      userResponse,
      tokens,
      'Login successful'
    );
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.jwt.refreshSecret,
      });

      // Find user
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is still active
      const fullUser = await this.usersService.findByEmail(user.email);
      if (!fullUser || !fullUser.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Generate new tokens
      return this.generateTokens(fullUser.id, fullUser.email, fullUser.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(email: string, password: string): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByEmailWithPassword(email);
    
    if (user && user.isActive && await user.validatePassword(password)) {
      return plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });
    }
    
    return null;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is still active
    const fullUser = await this.usersService.findByEmail(user.email);
    if (!fullUser || !fullUser.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // 🔒 SECURITY FIX: Use role from database, not JWT token
    // This prevents users from accessing admin endpoints with old tokens
    return {
      ...user,
      role: fullUser.role // ← Use role from database, not JWT token!
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    // In a real application, you might want to:
    // 1. Blacklist the token
    // 2. Store logout time
    // 3. Invalidate refresh tokens
    
    // For now, we'll just return a success message
    // The client should remove the tokens from storage
    
    return { message: 'Logout successful' };
  }

  /**
   * Generate new tokens for a user (useful after role changes)
   */
  async generateTokensForUser(user: UserResponseDto): Promise<TokenResponseDto> {
    return this.generateTokens(user.id, user.email, user.role);
  }

  async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<{ message: string }> {
    // Find user with password
    const user = await this.usersService.findByEmailWithPassword(
      (await this.usersService.findOne(userId)).email
    );
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate current password
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    await this.usersService.update(userId, { password: newPassword });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(
    userId: string, 
    email: string, 
    role: UserRole
  ): Promise<TokenResponseDto> {
    const accessTokenPayload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: userId,
      email,
      tokenVersion: 1, // Can be used for token invalidation
    };

    // Generate access token
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.jwt.secret,
      expiresIn: this.configService.jwt.expirationTime,
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.jwt.refreshSecret,
      expiresIn: this.configService.jwt.refreshExpirationTime,
    });

    // Calculate expiration time in seconds
    const expiresIn = this.parseTimeToSeconds(this.configService.jwt.expirationTime);

    return new TokenResponseDto(accessToken, refreshToken, expiresIn);
  }

  private parseTimeToSeconds(timeString: string): number {
    const match = timeString.match(/^(\d+)([dhms])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }
} 
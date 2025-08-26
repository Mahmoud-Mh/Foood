import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { UsersService } from '../users/users.service';
import { ConfigService } from '../../config/config.service';
import { UserRole } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, TokenResponseDto } from './dto/auth-response.dto';
import { PasswordReset } from './entities/password-reset.entity';
import { EmailService } from '../email/email.service';

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
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Validate password confirmation
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw BusinessException.userAlreadyExists(registerDto.email);
    }

    // Create user (password will be hashed automatically by the entity)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...createUserData } = registerDto;
    const user = await this.usersService.create({
      ...createUserData,
      role: UserRole.USER, // Default role for registration
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return new AuthResponseDto(user, tokens, 'Registration successful');
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user with password
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );
    if (!user) {
      throw BusinessException.invalidCredentials();
    }

    // Check if user is active
    if (!user.isActive) {
      throw BusinessException.accountDisabled();
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(loginDto.password);
    if (!isPasswordValid) {
      throw BusinessException.invalidCredentials();
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Transform to response DTO (exclude password)
    const userResponse = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    return new AuthResponseDto(userResponse, tokens, 'Login successful');
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.jwt.refreshSecret,
        },
      );

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
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (user && user.isActive && (await user.validatePassword(password))) {
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
      role: fullUser.role, // ← Use role from database, not JWT token!
    };
  }

  logout(): { message: string } {
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
  generateTokensForUser(user: UserResponseDto): TokenResponseDto {
    return this.generateTokens(user.id, user.email, user.role);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Get user details first to ensure user exists and we have access
    const userInfo = await this.usersService.findOne(userId);
    if (!userInfo) {
      throw new UnauthorizedException('Invalid request');
    }

    // Find user with password using the verified user's email
    const user = await this.usersService.findByEmailWithPassword(
      userInfo.email,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid request');
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

  async requestPasswordReset(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string; token?: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Always return success to prevent email enumeration
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Invalidate any existing password reset tokens for this user
    await this.passwordResetRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    // Generate a new password reset token
    const token = this.generateSecureToken();
    const passwordReset = this.passwordResetRepository.create({
      userId: user.id,
      token,
      ipAddress,
      userAgent,
    });

    await this.passwordResetRepository.save(passwordReset);

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.fullName,
        token,
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw error to prevent information disclosure
    }

    // In development mode, return the token for convenience
    if (this.configService.isDevelopment) {
      return {
        message: 'Password reset token generated (development mode)',
        token,
      };
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const passwordReset = await this.passwordResetRepository.findOne({
      where: { token, isUsed: false },
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Check if token has expired
    if (new Date() > passwordReset.expiresAt) {
      throw new BadRequestException('Token has expired');
    }

    // Update the password
    await this.usersService.update(passwordReset.userId, {
      password: newPassword,
    });

    // Mark the token as used
    passwordReset.isUsed = true;
    passwordReset.usedAt = new Date();
    await this.passwordResetRepository.save(passwordReset);

    // Invalidate all other existing tokens for this user
    await this.passwordResetRepository.update(
      { userId: passwordReset.userId, isUsed: false },
      { isUsed: true },
    );

    return { message: 'Password reset successfully' };
  }

  private generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): TokenResponseDto {
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
    const expiresIn = this.parseTimeToSeconds(
      this.configService.jwt.expirationTime,
    );

    return new TokenResponseDto(accessToken, refreshToken, expiresIn);
  }

  private parseTimeToSeconds(timeString: string): number {
    const match = timeString.match(/^(\d+)([dhms])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }

  private generateSecureToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}

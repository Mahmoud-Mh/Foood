import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { RefreshTokenDto, AuthResponseDto, TokenResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UserRole } from '../users/entities/user.entity';
import { ApiResponseDto } from '../../common/dto/response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

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
    isEmailVerified: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'excluded', // This will be excluded by class-transformer
  };

  const mockTokens: TokenResponseDto = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
    tokenType: 'Bearer',
    expiresIn: 3600,
  };

  const mockAuthResponse: AuthResponseDto = {
    user: mockUser,
    tokens: mockTokens,
    message: 'Authentication successful',
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    sendEmailVerification: jest.fn(),
    verifyEmail: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should register a new user successfully', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.data).toEqual(mockAuthResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration errors', async () => {
      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Passwords do not match')
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should validate required fields', async () => {
      const invalidDto = { ...registerDto, email: '' };
      
      // This would typically be caught by validation pipes in the actual app
      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Email is required')
      );

      await expect(controller.register(invalidDto as RegisterDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.data).toEqual(mockAuthResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle deactivated account', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Account is deactivated')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'mock.refresh.token',
    };

    it('should refresh tokens successfully', async () => {
      mockAuthService.refreshTokens.mockResolvedValue(mockTokens);

      const result = await controller.refreshTokens(refreshTokenDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Token refreshed successfully');
      expect(result.data).toEqual(mockTokens);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken
      );
    });

    it('should handle invalid refresh token', async () => {
      mockAuthService.refreshTokens.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(controller.refreshTokens(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle expired refresh token', async () => {
      mockAuthService.refreshTokens.mockRejectedValue(
        new UnauthorizedException('Refresh token expired')
      );

      await expect(controller.refreshTokens(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    const mockRequest = {
      user: mockUser,
    };

    it('should change password successfully', async () => {
      mockAuthService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const result = await controller.changePassword(
        mockUser.id,
        changePasswordDto
      );

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );
    });

    it('should handle wrong current password', async () => {
      mockAuthService.changePassword.mockRejectedValue(
        new BadRequestException('Current password is incorrect')
      );

      await expect(
        controller.changePassword(mockUser.id, changePasswordDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle password confirmation mismatch', async () => {
      const invalidDto = {
        ...changePasswordDto,
        newPassword: 'differentPassword',
      };

      mockAuthService.changePassword.mockRejectedValue(
        new BadRequestException('New passwords do not match')
      );

      await expect(
        controller.changePassword(mockUser.id, invalidDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    const mockRequest = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    it('should send password reset email successfully', async () => {
      mockAuthService.requestPasswordReset.mockResolvedValue({
        message: 'Password reset instructions sent to your email',
      });

      const result = await controller.forgotPassword(
        forgotPasswordDto,
        mockRequest as any
      );

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset instructions sent to your email');
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(
        forgotPasswordDto.email,
        mockRequest.ip,
        'Mozilla/5.0'
      );
    });

    it('should handle non-existent email gracefully', async () => {
      // Should still return success for security reasons
      mockAuthService.requestPasswordReset.mockResolvedValue({
        message: 'Password reset instructions sent to your email',
      });

      const result = await controller.forgotPassword(
        { email: 'nonexistent@example.com' },
        mockRequest as any
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset instructions sent to your email');
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'reset.token.123',
      newPassword: 'newPassword123',
    };

    it('should reset password successfully', async () => {
      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
      });

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword
      );
    });

    it('should handle invalid reset token', async () => {
      mockAuthService.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired reset token')
      );

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle expired reset token', async () => {
      mockAuthService.resetPassword.mockRejectedValue(
        new BadRequestException('Reset token has expired')
      );

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('sendEmailVerification', () => {
    const mockRequest = {
      user: mockUser,
    };

    it('should send email verification successfully', async () => {
      mockAuthService.sendEmailVerification.mockResolvedValue({
        message: 'Verification email sent successfully',
      });

      const result = await controller.sendEmailVerification(mockUser.id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verification sent');
      expect(mockAuthService.sendEmailVerification).toHaveBeenCalledWith(
        mockUser.id
      );
    });

    it('should handle already verified email', async () => {
      mockAuthService.sendEmailVerification.mockRejectedValue(
        new BadRequestException('Email is already verified')
      );

      await expect(
        controller.sendEmailVerification(mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    const verificationToken = 'verification.token.123';

    it('should verify email successfully', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({
        message: 'Email verified successfully',
      });

      const result = await controller.verifyEmail(verificationToken);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(verificationToken);
    });

    it('should handle invalid verification token', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(
        new BadRequestException('Invalid or expired verification token')
      );

      await expect(
        controller.verifyEmail('invalid.token')
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle already verified email', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(
        new BadRequestException('Email is already verified')
      );

      await expect(
        controller.verifyEmail(verificationToken)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockAuthService.logout.mockReturnValue({
        message: 'Logout successful',
      });

      const result = await controller.logout();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout successful');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    const mockRequest = {
      user: mockUser,
    };

    it('should return user profile successfully', async () => {
      const result = await controller.getProfile(mockUser);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User profile retrieved successfully');
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('error handling', () => {
    it('should handle service errors properly', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockAuthService.register.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        'Database connection error'
      );
    });

    it('should handle validation errors', async () => {
      const invalidLoginDto = {
        email: 'invalid-email',
        password: '',
      } as LoginDto;

      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Validation failed')
      );

      await expect(controller.login(invalidLoginDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('security considerations', () => {
    it('should not expose sensitive information in errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      try {
        await controller.login(loginDto);
      } catch (error) {
        expect(error.message).not.toContain('password');
        expect(error.message).not.toContain('hash');
        expect(error.message).toBe('Invalid credentials');
      }
    });

    it('should handle rate limiting scenarios', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Too many login attempts. Please try again later.')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        'Too many login attempts. Please try again later.'
      );
    });
  });
});
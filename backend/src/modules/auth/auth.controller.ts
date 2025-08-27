import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  HttpCode,
  Patch,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  AuthResponseDto,
  TokenResponseDto,
  RefreshTokenDto,
} from './dto/auth-response.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  PasswordResetResponseDto,
} from './dto/password-reset.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserId,
  Public,
} from '../../common/decorators/auth.decorators';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or passwords do not match',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    const result = await this.authService.register(registerDto);
    return ApiResponseDto.success('User registered successfully', result);
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account deactivated',
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    const result = await this.authService.login(loginDto);
    return ApiResponseDto.success('Login successful', result);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<ApiResponseDto<TokenResponseDto>> {
    const result = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );
    return ApiResponseDto.success('Token refreshed successfully', result);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logout successful' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  logout(): ApiResponseDto<{ message: string }> {
    const result = this.authService.logout();
    return ApiResponseDto.success('Logout successful', result);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect or authentication required',
  })
  async changePassword(
    @CurrentUserId() userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return ApiResponseDto.success('Password changed successfully', result);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  getProfile(
    @CurrentUser() user: UserResponseDto,
  ): ApiResponseDto<UserResponseDto> {
    return ApiResponseDto.success('User profile retrieved successfully', user);
  }

  // === Password reset ===

  @Post('forgot-password')
  @Public()
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'If the email exists, a reset link has been sent',
    type: PasswordResetResponseDto,
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<PasswordResetResponseDto>> {
    const result = await this.authService.requestPasswordReset(
      dto.email,
      req.ip,
      req.get('user-agent'),
    );
    return ApiResponseDto.success(result.message, result);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authService.resetPassword(
      dto.token,
      dto.newPassword,
    );
    return ApiResponseDto.success(result.message, result);
  }

  // === Email verification ===

  @Post('send-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send email verification to current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verification sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email is already verified or failed to send',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async sendEmailVerification(
    @CurrentUserId() userId: string,
  ): Promise<ApiResponseDto<{ message: string; token?: string }>> {
    const result = await this.authService.sendEmailVerification(userId);
    return ApiResponseDto.success('Email verification sent', result);
  }

  @Get('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verify email address using token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authService.verifyEmail(token);
    return ApiResponseDto.success('Email verified successfully', result);
  }
}

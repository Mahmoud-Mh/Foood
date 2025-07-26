import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token type', default: 'Bearer' })
  tokenType: string = 'Bearer';

  @ApiProperty({ description: 'Access token expiration time in seconds' })
  expiresIn: number;

  constructor(accessToken: string, refreshToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
  }
}

export class AuthResponseDto {
  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;

  @ApiProperty({ description: 'Authentication tokens' })
  tokens: TokenResponseDto;

  @ApiProperty({ description: 'Authentication message' })
  message: string;

  constructor(user: UserResponseDto, tokens: TokenResponseDto, message: string) {
    this.user = user;
    this.tokens = tokens;
    this.message = message;
  }
}

export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
} 
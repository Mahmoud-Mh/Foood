import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address associated with the account',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description:
      'New password (minimum 8 chars, at least one letter, one number and one special character)',
    minLength: 8,
    example: 'NewSecurePass123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'New password must contain at least one letter, one number and one special character',
  })
  newPassword: string;
}

export class PasswordResetResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({
    description: 'Reset token (development mode only)',
    required: false,
  })
  token?: string;
}

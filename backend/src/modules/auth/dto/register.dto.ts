import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User first name',
    minLength: 2,
    maxLength: 50,
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    minLength: 2,
    maxLength: 50,
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  @MaxLength(254) // RFC 5321 limit
  email: string;

  @ApiProperty({
    description:
      'User password (minimum 8 characters, at least one letter, one number and one special character)',
    minLength: 8,
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one letter, one number and one special character',
  })
  password: string;

  @ApiProperty({
    description: 'Password confirmation',
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({
    description: 'User avatar URL',
    required: false,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'User bio/description',
    required: false,
    maxLength: 500,
    example: 'Passionate home cook and recipe enthusiast.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

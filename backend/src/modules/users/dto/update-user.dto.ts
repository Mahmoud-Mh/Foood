import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'role'] as const),
) {
  @ApiPropertyOptional({
    description: 'New password for the user',
    minLength: 8,
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'Email verification status',
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'User bio/description',
    maxLength: 500,
    example: 'Passionate home cook and recipe enthusiast.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

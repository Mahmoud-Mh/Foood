import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiPropertyOptional({ 
    description: 'New password for the user', 
    minLength: 8 
  })
  password?: string;
} 
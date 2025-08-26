import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'User unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User first name' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Expose()
  lastName: string;

  @ApiProperty({ description: 'User full name' })
  @Expose()
  @Transform(
    ({ obj }: { obj: { firstName: string; lastName: string } }) =>
      `${obj.firstName} ${obj.lastName}`,
  )
  fullName: string;

  @ApiProperty({ description: 'User email address' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @Expose()
  role: UserRole;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @Expose()
  avatar?: string;

  @ApiProperty({ description: 'User bio/description', required: false })
  @Expose()
  bio?: string;

  @ApiProperty({ description: 'Account verification status' })
  @Expose()
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Account active status' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp', required: false })
  @Expose()
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Account creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Account last update timestamp' })
  @Expose()
  updatedAt: Date;

  // Exclude sensitive information
  @Exclude()
  password: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

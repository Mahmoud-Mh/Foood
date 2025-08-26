import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateUserFavoriteDto {
  @ApiProperty({ description: 'Recipe ID to add to favorites' })
  @IsUUID()
  @IsNotEmpty()
  recipeId: string;
}

export class UserFavoriteResponseDto {
  @ApiProperty({ description: 'Favorite ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Recipe ID' })
  recipeId: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}
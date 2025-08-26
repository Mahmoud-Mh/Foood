import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CreateRecipeDto } from './create-recipe.dto';
import { IsOptional, IsBoolean } from 'class-validator';

// Exclude categoryId from updates (should be changed via dedicated endpoint)
export class UpdateRecipeDto extends PartialType(
  OmitType(CreateRecipeDto, ['categoryId'] as const),
) {
  @ApiPropertyOptional({
    description: 'Is recipe active/visible',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Is recipe featured',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

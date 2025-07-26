import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateIngredientDto } from './create-ingredient.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {
  @ApiPropertyOptional({ 
    description: 'Is ingredient available/active',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 
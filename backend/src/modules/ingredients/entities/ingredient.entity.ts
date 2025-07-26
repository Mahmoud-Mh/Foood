import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IngredientCategory {
  PROTEIN = 'protein',
  VEGETABLE = 'vegetable',
  FRUIT = 'fruit',
  GRAIN = 'grain',
  DAIRY = 'dairy',
  SPICE = 'spice',
  HERB = 'herb',
  CONDIMENT = 'condiment',
  BEVERAGE = 'beverage',
  OTHER = 'other',
}

@Entity('ingredients')
export class Ingredient {
  @ApiProperty({ description: 'Ingredient unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Ingredient name', example: 'Tomato' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ description: 'Ingredient description', example: 'Fresh red tomato' })
  @Column('text')
  description: string;

  @ApiProperty({ 
    description: 'Ingredient category',
    enum: IngredientCategory,
    example: IngredientCategory.VEGETABLE
  })
  @Column({
    type: 'enum',
    enum: IngredientCategory,
    default: IngredientCategory.OTHER,
  })
  category: IngredientCategory;

  @ApiPropertyOptional({ description: 'Ingredient image URL' })
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Nutritional info (calories per 100g)', example: 18 })
  @Column({ nullable: true })
  caloriesPerUnit?: number;

  @ApiPropertyOptional({ description: 'Default unit of measurement', example: 'grams' })
  @Column({ default: 'grams' })
  defaultUnit: string;

  @ApiProperty({ description: 'Is ingredient available/active', default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Allergen information', example: 'Contains gluten' })
  @Column({ nullable: true })
  allergenInfo?: string;

  @ApiProperty({ description: 'Ingredient creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Ingredient last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Add ManyToMany relation with Recipe via RecipeIngredient
  // @ManyToMany(() => Recipe, recipe => recipe.ingredients)
  // recipes: Recipe[];

  // Virtual field for usage count (will be implemented later)
  @ApiProperty({ description: 'Number of recipes using this ingredient' })
  usageCount?: number;
} 
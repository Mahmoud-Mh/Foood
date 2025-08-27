import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Recipe } from './recipe.entity';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';

@Entity('recipe_ingredients')
@Index('IDX_RECIPE_INGREDIENT_RECIPE', ['recipeId'])
@Index('IDX_RECIPE_INGREDIENT_INGREDIENT', ['ingredientId'])
@Index('IDX_RECIPE_INGREDIENT_ORDER', ['recipeId', 'order'])
export class RecipeIngredient {
  @ApiProperty({ description: 'Recipe ingredient unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Quantity of ingredient needed', example: 250.5 })
  @Column('decimal', { precision: 12, scale: 4 })
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement', example: 'grams' })
  @Column()
  unit: string;

  @ApiPropertyOptional({
    description: 'Ingredient preparation notes',
    example: 'finely chopped',
  })
  @Column('text', { nullable: true })
  preparation?: string;

  @ApiPropertyOptional({
    description: 'Is this ingredient optional',
    default: false,
  })
  @Column({ default: false })
  isOptional: boolean;

  @ApiProperty({ description: 'Display order in recipe', default: 1 })
  @Column({ default: 1 })
  order: number;

  // Relations
  @ApiProperty({ description: 'Recipe ID' })
  @Column('uuid')
  recipeId: string;

  @ManyToOne(() => Recipe, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @ApiProperty({ description: 'Ingredient ID' })
  @Column('uuid')
  ingredientId: string;

  @ManyToOne(() => Ingredient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  // Virtual field for display
  @ApiProperty({ description: 'Formatted quantity display' })
  get displayText(): string {
    const optionalText = this.isOptional ? ' (optional)' : '';
    const prepText = this.preparation ? `, ${this.preparation}` : '';
    return `${this.quantity} ${this.unit} ${this.ingredient?.name || 'Unknown'}${prepText}${optionalText}`;
  }
}

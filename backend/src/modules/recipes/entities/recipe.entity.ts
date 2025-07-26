import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeStep } from './recipe-step.entity';

export enum RecipeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

@Entity('recipes')
export class Recipe {
  @ApiProperty({ description: 'Recipe unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Recipe title', example: 'Spaghetti Carbonara' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Recipe description', example: 'A classic Italian pasta dish' })
  @Column('text')
  description: string;

  @ApiProperty({ description: 'Recipe instructions', example: 'Step by step cooking instructions' })
  @Column('text')
  instructions: string;

  @ApiProperty({ description: 'Preparation time in minutes', example: 15 })
  @Column()
  prepTimeMinutes: number;

  @ApiProperty({ description: 'Cooking time in minutes', example: 20 })
  @Column()
  cookTimeMinutes: number;

  @ApiProperty({ description: 'Number of servings', example: 4 })
  @Column()
  servings: number;

  @ApiProperty({ 
    description: 'Recipe difficulty level',
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM
  })
  @Column({
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.EASY,
  })
  difficulty: DifficultyLevel;

  @ApiProperty({ 
    description: 'Recipe status',
    enum: RecipeStatus,
    example: RecipeStatus.PUBLISHED
  })
  @Column({
    type: 'enum',
    enum: RecipeStatus,
    default: RecipeStatus.DRAFT,
  })
  status: RecipeStatus;

  @ApiPropertyOptional({ description: 'Recipe main image URL' })
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Additional recipe images', type: [String] })
  @Column('text', { 
    array: true, 
    nullable: true,
    transformer: {
      to: (value: string[]) => value,
      from: (value: string[]) => value || [],
    }
  })
  additionalImages?: string[];

  @ApiPropertyOptional({ description: 'Recipe tags for search', type: [String] })
  @Column('text', { 
    array: true, 
    nullable: true,
    transformer: {
      to: (value: string[]) => value,
      from: (value: string[]) => value || [],
    }
  })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Nutritional information per serving' })
  @Column('jsonb', { nullable: true })
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };

  @ApiPropertyOptional({ description: 'Recipe notes or tips' })
  @Column('text', { nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Recipe views count', default: 0 })
  @Column({ default: 0 })
  viewsCount: number;

  @ApiProperty({ description: 'Recipe likes count', default: 0 })
  @Column({ default: 0 })
  likesCount: number;

  @ApiProperty({ description: 'Is recipe featured', default: false })
  @Column({ default: false })
  isFeatured: boolean;

  @ApiProperty({ description: 'Is recipe active/visible', default: true })
  @Column({ default: true })
  isActive: boolean;

  // Relations
  @ApiProperty({ description: 'Recipe author ID' })
  @Column('uuid')
  authorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ApiProperty({ description: 'Recipe category ID' })
  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => Category, { eager: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  // Recipe ingredients relation
  @OneToMany(() => RecipeIngredient, recipeIngredient => recipeIngredient.recipe, { 
    cascade: true,
    eager: false 
  })
  recipeIngredients: RecipeIngredient[];

  // Recipe steps relation
  @OneToMany(() => RecipeStep, recipeStep => recipeStep.recipe, { 
    cascade: true,
    eager: false 
  })
  steps: RecipeStep[];

  // TODO: Add when Comment and Rating entities are created
  // @OneToMany(() => Comment, comment => comment.recipe)
  // comments: Comment[];

  // @OneToMany(() => Rating, rating => rating.recipe)
  // ratings: Rating[];

  @ApiProperty({ description: 'Recipe creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Recipe last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields (calculated)
  @ApiProperty({ description: 'Total cooking time (prep + cook)' })
  get totalTimeMinutes(): number {
    return this.prepTimeMinutes + this.cookTimeMinutes;
  }

  @ApiProperty({ description: 'Average rating' })
  averageRating?: number;

  @ApiProperty({ description: 'Number of ratings' })
  ratingsCount?: number;

  @ApiProperty({ description: 'Number of comments' })
  commentsCount?: number;

  @ApiProperty({ description: 'Number of ingredients' })
  ingredientsCount?: number;

  @ApiProperty({ description: 'Number of steps' })
  stepsCount?: number;
} 
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';

@Entity('ratings')
@Unique('UQ_USER_RECIPE_RATING', ['userId', 'recipeId']) // User can only rate a recipe once
@Index('IDX_RATING_RECIPE', ['recipeId'])
@Index('IDX_RATING_USER', ['userId'])
@Index('IDX_RATING_SCORE', ['rating'])
@Index('IDX_RATING_CREATED', ['createdAt'])
export class Rating {
  @ApiProperty({ description: 'Rating unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    description: 'Rating score from 1 to 5', 
    minimum: 1, 
    maximum: 5,
    example: 4 
  })
  @Column({ type: 'int' })
  rating: number;

  @ApiProperty({ 
    description: 'Optional review comment', 
    maxLength: 1000,
    required: false 
  })
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @ApiProperty({ description: 'Is the review helpful/verified' })
  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Number of users who found this review helpful' })
  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  @ApiProperty({ description: 'Is the rating active/visible' })
  @Column({ type: 'boolean', default: true })
  @Index('IDX_RATING_ACTIVE')
  isActive: boolean;

  // Relations
  @ApiProperty({ description: 'User who created the rating' })
  @Column('uuid')
  @Index('IDX_RATING_USER_ID')
  userId: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'Recipe being rated' })
  @Column('uuid')
  @Index('IDX_RATING_RECIPE_ID')
  recipeId: string;

  @ManyToOne(() => Recipe, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @ApiProperty({ description: 'Rating creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Rating last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields for response DTOs
  @ApiProperty({ description: 'User full name (for responses)' })
  userFullName?: string;

  @ApiProperty({ description: 'User avatar URL (for responses)' })
  userAvatar?: string;

  @ApiProperty({ description: 'Recipe title (for responses)' })
  recipeTitle?: string;

  // Helper methods
  isOwner(userId: string): boolean {
    return this.userId === userId;
  }

  canEdit(userId: string, isAdmin: boolean = false): boolean {
    return this.isOwner(userId) || isAdmin;
  }

  // Validation method
  isValidRating(): boolean {
    return this.rating >= 1 && this.rating <= 5 && Number.isInteger(this.rating);
  }
}
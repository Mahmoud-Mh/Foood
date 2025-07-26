import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('categories')
export class Category {
  @ApiProperty({ description: 'Category unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Italian Cuisine' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ description: 'Category description', example: 'Traditional Italian dishes and recipes' })
  @Column('text')
  description: string;

  @ApiPropertyOptional({ description: 'Category icon/emoji', example: '🍝' })
  @Column({ nullable: true })
  icon?: string;

  @ApiPropertyOptional({ description: 'Category cover image URL' })
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiProperty({ description: 'Category slug for URLs', example: 'italian-cuisine' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ description: 'Is category active/visible', default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  @Column({ default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Category creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Category last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Add OneToMany relation with Recipe entity
  // @OneToMany(() => Recipe, recipe => recipe.category)
  // recipes: Recipe[];

  // Virtual field for recipe count (will be implemented later)
  @ApiProperty({ description: 'Number of recipes in this category' })
  recipeCount?: number;
} 
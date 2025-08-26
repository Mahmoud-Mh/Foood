import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Recipe } from './recipe.entity';

@Entity('recipe_steps')
export class RecipeStep {
  @ApiProperty({ description: 'Recipe step unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Step order number', example: 1 })
  @Column()
  stepNumber: number;

  @ApiProperty({ description: 'Step title', example: 'Prepare the pasta' })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Step detailed instructions',
    example:
      'Bring a large pot of salted water to boil and cook pasta according to package directions',
  })
  @Column('text')
  instructions: string;

  @ApiPropertyOptional({
    description: 'Time required for this step in minutes',
    example: 10,
  })
  @Column({ nullable: true })
  timeMinutes?: number;

  @ApiPropertyOptional({ description: 'Step image URL' })
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Important tips or notes for this step',
    example: 'Make sure water is boiling vigorously before adding pasta',
  })
  @Column('text', { nullable: true })
  tips?: string;

  @ApiPropertyOptional({
    description: 'Temperature if applicable',
    example: '180°C',
  })
  @Column({ nullable: true })
  temperature?: string;

  @ApiPropertyOptional({
    description: 'Equipment needed for this step',
    type: [String],
    example: ['Large pot', 'Colander'],
  })
  @Column('text', {
    array: true,
    nullable: true,
    transformer: {
      to: (value: string[]) => value,
      from: (value: string[]) => value || [],
    },
  })
  equipment?: string[];

  @ApiProperty({ description: 'Is this step active/visible', default: true })
  @Column({ default: true })
  isActive: boolean;

  // Relations
  @ApiProperty({ description: 'Recipe ID' })
  @Column('uuid')
  recipeId: string;

  @ManyToOne(() => Recipe, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @ApiProperty({ description: 'Step creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Step last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual field for display
  @ApiProperty({ description: 'Formatted step display' })
  get displayTitle(): string {
    return `Step ${this.stepNumber}: ${this.title}`;
  }

  @ApiProperty({ description: 'Time display with unit' })
  get timeDisplay(): string {
    if (!this.timeMinutes) return '';
    if (this.timeMinutes < 60) return `${this.timeMinutes} min`;
    const hours = Math.floor(this.timeMinutes / 60);
    const minutes = this.timeMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
}

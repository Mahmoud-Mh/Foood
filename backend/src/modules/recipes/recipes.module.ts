import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recipe,
      RecipeIngredient, 
      RecipeStep,
      User,
      Category,
      Ingredient
    ])
  ],
  providers: [RecipesService],
  controllers: [RecipesController],
  exports: [RecipesService],
})
export class RecipesModule {} 
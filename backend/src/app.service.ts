import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Ingredient } from './modules/ingredients/entities/ingredient.entity';
import { Recipe } from './modules/recipes/entities/recipe.entity';
import { RecipeIngredient } from './modules/recipes/entities/recipe-ingredient.entity';
import { RecipeStep } from './modules/recipes/entities/recipe-step.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(RecipeStep)
    private readonly recipeStepRepository: Repository<RecipeStep>,
    private readonly dataSource: DataSource,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async clearDatabase(): Promise<object> {
    try {
      // Compter les enregistrements avant nettoyage
      const beforeCounts = {
        users: await this.userRepository.count(),
        categories: await this.categoryRepository.count(),
        ingredients: await this.ingredientRepository.count(),
        recipes: await this.recipeRepository.count(),
        recipeIngredients: await this.recipeIngredientRepository.count(),
        recipeSteps: await this.recipeStepRepository.count(),
      };

      console.log('🗑️ Starting database cleanup...');
      console.log('📊 Before cleanup:', beforeCounts);

      // Utiliser des requêtes SQL brutes pour contourner les contraintes
      await this.dataSource.transaction(async (manager) => {
        // Désactiver temporairement les contraintes de clés étrangères
        await manager.query('SET session_replication_role = replica;');
        console.log('🔓 Foreign key constraints disabled');

        // Vider les tables dans l'ordre des dépendances
        await manager.query('TRUNCATE TABLE recipe_steps CASCADE;');
        console.log('✅ Recipe steps cleared');

        await manager.query('TRUNCATE TABLE recipe_ingredients CASCADE;');
        console.log('✅ Recipe ingredients cleared');

        await manager.query('TRUNCATE TABLE recipes CASCADE;');
        console.log('✅ Recipes cleared');

        await manager.query('TRUNCATE TABLE ingredients CASCADE;');
        console.log('✅ Ingredients cleared');

        await manager.query('TRUNCATE TABLE categories CASCADE;');
        console.log('✅ Categories cleared');

        await manager.query('TRUNCATE TABLE users CASCADE;');
        console.log('✅ Users cleared');

        // Réactiver les contraintes de clés étrangères
        await manager.query('SET session_replication_role = DEFAULT;');
        console.log('🔒 Foreign key constraints re-enabled');
      });

      // Compter les enregistrements après nettoyage
      const afterCounts = {
        users: await this.userRepository.count(),
        categories: await this.categoryRepository.count(),
        ingredients: await this.ingredientRepository.count(),
        recipes: await this.recipeRepository.count(),
        recipeIngredients: await this.recipeIngredientRepository.count(),
        recipeSteps: await this.recipeStepRepository.count(),
      };

      console.log('📊 After cleanup:', afterCounts);
      console.log('🎉 Database cleanup completed successfully!');

      return {
        success: true,
        message: 'Database cleared successfully',
        timestamp: new Date().toISOString(),
        beforeCounts,
        afterCounts,
        totalRecordsDeleted: Object.values(beforeCounts).reduce(
          (sum, count) => sum + count,
          0,
        ),
      };
    } catch (error: unknown) {
      console.error('❌ Database cleanup failed:', error);
      return {
        success: false,
        message: 'Database cleanup failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

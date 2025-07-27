import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { createTypeOrmOptions } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Import entities for AppService database cleanup
import { User } from './modules/users/entities/user.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Ingredient } from './modules/ingredients/entities/ingredient.entity';
import { Recipe } from './modules/recipes/entities/recipe.entity';
import { RecipeIngredient } from './modules/recipes/entities/recipe-ingredient.entity';
import { RecipeStep } from './modules/recipes/entities/recipe-step.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createTypeOrmOptions,
      inject: [ConfigService],
    }),
    // Add TypeORM repositories for AppService
    TypeOrmModule.forFeature([
      User,
      Category,
      Ingredient,
      Recipe,
      RecipeIngredient,
      RecipeStep,
    ]),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => [
        {
          ttl: configService.throttle.ttl * 1000, // Convert to milliseconds
          limit: configService.throttle.limit,
        },
      ],
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    IngredientsModule,
    RecipesModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Note: JwtAuthGuard is applied at controller level to allow public routes
    // Global guards would prevent public auth routes from working
  ],
})
export class AppModule {}

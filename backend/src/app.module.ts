import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
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
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { LoggerModule } from './common/logger/logger.module';

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
      useFactory: (configService: ConfigService) => [
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
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Note: JwtAuthGuard is applied at controller level to allow public routes
    // Global guards would prevent public auth routes from working
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}

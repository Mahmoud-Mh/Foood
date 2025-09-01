import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { Rating } from './entities/rating.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, Recipe, User]),
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService], // Export service for use in other modules
})
export class RatingsModule {}
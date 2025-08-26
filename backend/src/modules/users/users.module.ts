import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersFavoritesController } from './users-favorites.controller';
import { User } from './entities/user.entity';
import { UserFavorite } from './entities/user-favorite.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserFavorite, Recipe]),
    forwardRef(() => AuthModule),
    UploadsModule,
  ],
  controllers: [UsersController, UsersFavoritesController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}

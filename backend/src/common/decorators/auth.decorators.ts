import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';
import { UserResponseDto } from '../../modules/users/dto/user-response.dto';

// Decorator to mark routes as public (no authentication required)
export const Public = () => SetMetadata('isPublic', true);

// Decorator to specify required roles
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Decorator to get current user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserResponseDto => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return request.user;
  },
);

// Decorator to get current user ID
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return request.user?.id || '';
  },
);

// Decorator to check if current user is admin
export const AdminOnly = () => Roles(UserRole.ADMIN);

// Decorator to allow both admin and user roles
export const UserOrAdmin = () => Roles(UserRole.USER, UserRole.ADMIN);

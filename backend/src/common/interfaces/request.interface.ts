import { Request } from 'express';
import { UserResponseDto } from '../../modules/users/dto/user-response.dto';

export interface AuthenticatedRequest extends Request {
  user: UserResponseDto;
}

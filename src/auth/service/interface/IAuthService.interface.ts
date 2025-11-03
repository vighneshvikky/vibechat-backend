import { Response } from 'express';
import { User } from 'src/user/schemas/user.schema';
import { UserResponse } from 'src/user/service/interface/IUser-service.interface';

export const IAUTHSERVICE = Symbol('IAUTHSERVICE');

export interface IAuthService {

  register(userData: Partial<UserResponse>): Promise<{
    message: string;
    user: User;
  }>;


  login(
    email: string,
    password: string,
    res: Response,
  ): Promise<{
    message: string;
    user: { email: string; name: string };
  }>;


  refreshTokens(
    refreshToken: string,
    res: Response,
  ): Promise<{
    message: string;
  }>;
}

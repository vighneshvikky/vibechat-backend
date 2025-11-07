import { Inject, Injectable } from '@nestjs/common';

import { User } from '../schemas/user.schema';
import {
  IUserService,
  UserResponse,
} from './interface/IUser-service.interface';
import {
  IUserRepository,
  IUSERREPOSITORY,
} from '../repository/interface/IUser-repository.interface';
import { mapToResponse } from '../mapper/user.mapper';

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(IUSERREPOSITORY) private readonly _userRepository: IUserRepository,
  ) {}

  async create(userData: Partial<User>): Promise<UserResponse> {
    const user = await this._userRepository.create(userData);
    return mapToResponse(user);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this._userRepository.findAll();
    return users.map((u) => mapToResponse(u));
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await this._userRepository.findByEmail(email);
    return user ? mapToResponse(user) : null;
  }
}

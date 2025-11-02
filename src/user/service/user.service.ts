import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';

import { User } from '../schemas/user.schema';
import {
  IUserService,
  UserResponse,
} from './interface/IUser-service.interface';
import { IUserRepository, IUSERREPOSITORY } from '../repository/interface/IUser-repository.interface';

@Injectable()
export class UserService implements IUserService {
  constructor(@Inject(IUSERREPOSITORY) private readonly _userRepository: IUserRepository) {}

  private mapToResponse(user: User): UserResponse {
    return {
      _id: user._id?.toString() || '',
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  }

  async create(userData: Partial<User>): Promise<UserResponse> {
    const user = await this._userRepository.create(userData);
    return this.mapToResponse(user);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this._userRepository.findAll();
    return users.map((u) => this.mapToResponse(u));
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await this._userRepository.findByEmail(email);
    return user ? this.mapToResponse(user) : null;
  }
}

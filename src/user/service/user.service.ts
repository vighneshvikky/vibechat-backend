import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(private readonly _userRepository: UserRepository) {}

  async create(userData: Partial<User>) {
    return this._userRepository.create(userData);
  }

  async findAll(): Promise<User[]> {
    return this._userRepository.findAll();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this._userRepository.findByEmail(email);
  }
}

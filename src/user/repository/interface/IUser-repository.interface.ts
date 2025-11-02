import { User } from '../../schemas/user.schema';

export interface IUserRepository {
  create(userData: Partial<User>): Promise<User>;
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
}

export const IUSERREPOSITORY = Symbol('IUSERREPOSITORY');

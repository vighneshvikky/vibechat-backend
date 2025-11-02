import { User } from "src/user/schemas/user.schema";

export const IUSERSERVICE = Symbol('IUSERSERVICE')
export interface IUserService {
  create(userData: Partial<User>): Promise<UserResponse>;
  findAll(): Promise<UserResponse[]>;
  findByEmail(email: string): Promise<UserResponse | null>;
}

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

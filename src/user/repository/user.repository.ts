import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { IUserRepository } from './interface/IUser-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository{
  constructor(@InjectModel(User.name) private _userModel: Model<User>) {}

  async create(userData: Partial<User>) {
    const newUser = new this._userModel(userData);
    return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this._userModel.find().exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this._userModel.findOne({ email }).exec();
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;
  
  @Prop({ default: '' })
  avatar: string;

    @Prop({ default: false })
  isAdmin: false;
}

export const UserSchema = SchemaFactory.createForClass(User);

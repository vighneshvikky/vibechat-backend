
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Chat {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  isGroup: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = Chat & Document;


export interface PopulatedChat extends Omit<Chat, 'members' | 'lastMessage'> {
  members: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar: string;
  }[];
  lastMessage?: {
    _id: Types.ObjectId;
    content: string;
    timestamp: Date;
    senderId: Types.ObjectId | { _id: Types.ObjectId };
  };
}

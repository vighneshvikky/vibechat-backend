import { Types } from 'mongoose';
import { Chat } from '../schema/chat.schema';
import { User } from 'src/user/schemas/user.schema';
import { Message } from 'src/message/schema/message.schema'; 

export interface PopulatedChat extends Omit<Chat, 'members' | 'lastMessage'> {
  members: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar: string;
  }[];
  lastMessage?: {
    _id?: Types.ObjectId;
    content: string;
    timestamp: Date;
    senderId: Types.ObjectId | {
      _id: Types.ObjectId;
      name: string;
      email: string;
      avatar: string;
    };
  } | null;
}

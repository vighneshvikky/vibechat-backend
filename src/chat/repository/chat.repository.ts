import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';


export interface ChatResponse {
  _id: string | ObjectId;
  name: string;
  type: string;
  participants: string[];
  unreadCounts: Record<string, number>;
  unreadCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
}

@Injectable()
export class ChatRepository {


  
}

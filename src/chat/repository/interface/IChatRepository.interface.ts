import { PopulatedChat } from 'src/chat/types/populated-chat.type';
import { Chat } from '../../schema/chat.schema';
import { Types } from 'mongoose';

export interface ChatMemberResponse {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface LastMessageResponse {
  content: string;
  timestamp: Date;
  type: string;
  senderId: string;
}

export interface ChatResponse {
  _id: string;
  name?: string;
  isGroup: boolean;
  members: ChatMemberResponse[];
  lastMessage?: LastMessageResponse;
}
export interface IChatRepository {
  createPrivateChat(
    userId: string,
    participantId: string,
  ): Promise<Chat | null>;
  createGroupChat(
    name: string,
    members: string[],
    createdBy: string,
  ): Promise<Chat | null>;
  addUserToGroup(chatId: string, userId: string): Promise<Chat | null>;
  removeUserFromGroup(chatId: string, userId: string): Promise<Chat | null>;
  getUserChats(userId: string, search?: string): Promise<PopulatedChat[]>;
  findOne(chatId: string): Promise<Chat>;
  joinChat(chatId: string, userId: string): Promise<Chat | null>;
  leaveChat(chatId: string, userId: string): Promise<Chat | null>;
  updateLastMessage(chatId: string, messageId: string): Promise<void>;
  delete(chatId: string): Promise<void>;
}

export const ICHATREPOSITORY = Symbol('ICHATREPOSITORY');

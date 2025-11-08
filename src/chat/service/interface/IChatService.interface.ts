import { ChatResponse } from '../../repository/interface/IChatRepository.interface';



export interface IChatService {
  createPrivateChat(userId: string, participantId: string): Promise<ChatResponse>;
  createGroupChat(name: string, members: string[], createdBy: string): Promise<ChatResponse>;
  addUserToGroup(chatId: string, userId: string): Promise<ChatResponse>;
  removeUserFromGroup(chatId: string, userId: string): Promise<ChatResponse>;
  getUserChats(userId: string, search?: string): Promise<ChatResponse[]>;
  findOne(chatId: string): Promise<ChatResponse>;
  joinChat(chatId: string, userId: string): Promise<ChatResponse>;
  leaveChat(chatId: string, userId: string): Promise<ChatResponse | null>;
  updateLastMessage(chatId: string, messageId: string): Promise<void>;
  delete(chatId: string): Promise<void>;
}


export const ICHATSERVICE = Symbol('ICHATSERVICE');

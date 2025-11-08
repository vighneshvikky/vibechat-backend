import { Inject, Injectable } from '@nestjs/common';
import { ChatRepository } from '../repository/chat.repository';
import { ChatMapper } from '../mapper/chat.mapper';
import { IChatService } from './interface/IChatService.interface';
import {
  ChatResponse,
  IChatRepository,
  ICHATREPOSITORY,
} from '../repository/interface/IChatRepository.interface';
import { PopulatedChat } from '../types/populated-chat.type';

@Injectable()
export class ChatService implements IChatService {
  constructor(
    @Inject(ICHATREPOSITORY) private readonly _chatRepository: IChatRepository,
  ) {}

  async createPrivateChat(
    userId: string,
    participantId: string,
  ): Promise<ChatResponse> {
    const chat = (await this._chatRepository.createPrivateChat(
      userId,
      participantId,
    )) as unknown as PopulatedChat;
    return ChatMapper.toResponse(chat);
  }

  async createGroupChat(
    name: string,
    members: string[],
    createdBy: string,
  ): Promise<ChatResponse> {
    const chat = (await this._chatRepository.createGroupChat(
      name,
      members,
      createdBy,
    )) as unknown as PopulatedChat;
    return ChatMapper.toResponse(chat);
  }

  async addUserToGroup(chatId: string, userId: string): Promise<ChatResponse> {
    const chat = (await this._chatRepository.addUserToGroup(
      chatId,
      userId,
    )) as unknown as PopulatedChat;
    return ChatMapper.toResponse(chat);
  }

  async removeUserFromGroup(
    chatId: string,
    userId: string,
  ): Promise<ChatResponse> {
    const chat = (await this._chatRepository.removeUserFromGroup(
      chatId,
      userId,
    )) as unknown as PopulatedChat;
    return ChatMapper.toResponse(chat);
  }
  async getUserChats(userId: string, search?: string): Promise<ChatResponse[]> {
    const chats = await this._chatRepository.getUserChats(userId, search);
    return chats.map(ChatMapper.toResponse);
  }

  async updateLastMessage(chatId: string, messageId: string) {
    return await this._chatRepository.updateLastMessage(chatId, messageId);
  }

  async findOne(chatId: string): Promise<ChatResponse> {
    const chat = (await this._chatRepository.findOne(
      chatId,
    )) as unknown as PopulatedChat;
    return ChatMapper.toResponse(chat);
  }

  async joinChat(chatId: string, userId: string): Promise<ChatResponse> {
    const chat = (await this._chatRepository.joinChat(
      chatId,
      userId,
    )) as unknown as PopulatedChat;
    return ChatMapper.toResponse(chat);
  }

  async leaveChat(
    chatId: string,
    userId: string,
  ): Promise<ChatResponse | null> {
    const chat = (await this._chatRepository.leaveChat(
      chatId,
      userId,
    )) as unknown as PopulatedChat;
    return chat ? ChatMapper.toResponse(chat) : null;
  }

  async delete(chatId: string): Promise<void> {
    await this._chatRepository.delete(chatId);
  }
}

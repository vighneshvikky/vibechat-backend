import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
  PopulatedMessage,
} from '../schema/message.schema';
import { Chat, ChatDocument } from 'src/chat/schema/chat.schema';
import {
  IMessageRepository,
  IMESSAGEREPOSITORY,
} from '../repository/interface/IMessageRepository.interface';
import { IMessageService } from './interface/IMessage-interface';
import {
  FileMetadata,
  MessageResponse,
  MessageType,
} from '../interface/message.types';

function isPopulatedChat(
  chatId: Types.ObjectId | { _id: Types.ObjectId },
): chatId is { _id: Types.ObjectId } {
  return typeof chatId === 'object' && '_id' in chatId;
}

@Injectable()
export class MessageService implements IMessageService {
  constructor(
    @Inject(IMESSAGEREPOSITORY)
    private readonly _messageRepository: IMessageRepository,
  ) {}
  async saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: MessageType = 'text',
    fileMetadata?: FileMetadata,
  ): Promise<MessageResponse> {
    const saved = await this._messageRepository.saveMessage(
      chatId,
      senderId,
      content,
      type,
      fileMetadata,
    );

    const populated = await this._messageRepository.getMessageById(
      saved._id.toString(),
    );
    return this.mapToResponse(populated);
  }

  async getMessages(chatId: string): Promise<MessageResponse[]> {
    const populated = await this._messageRepository.getMessages(chatId);
    return populated.map((msg) =>
      this.mapToResponse(msg as unknown as PopulatedMessage),
    );
  }

  async getMessageById(messageId: string): Promise<MessageResponse> {
    const message = await this._messageRepository.getMessageById(messageId);
    return this.mapToResponse(message);
  }

    async getUserById(userId: string){
    const id = new Types.ObjectId(userId);

    const message = await this._messageRepository.getUserById(id);
    return this.mapToResponse(message)
  }

  private mapToResponse(message: PopulatedMessage): MessageResponse {
    const chatIdValue: string = isPopulatedChat(message.chatId)
      ? message.chatId._id.toString()
      : (message.chatId as Types.ObjectId).toString(); 

    return {
      _id: message._id.toString(),
      chatId: chatIdValue,
      sender: {
        _id: message.senderId._id.toString(),
        name: message.senderId.name,
        email: message.senderId.email,
        avatar: message.senderId.avatar,
      },
      content: message.content,
      type: message.type as MessageType,
      fileMetadata: message.fileMetadata
        ? {
            originalName: message.fileMetadata.originalName,
            fileName: message.fileMetadata.fileName,
            fileSize: message.fileMetadata.fileSize,
            mimeType: message.fileMetadata.mimeType,
            url: message.fileMetadata.url,
          }
        : undefined,
      isFormatted: message.isFormatted,
      timestamp: message.timestamp,
    };
  }


}

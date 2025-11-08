import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Chat, ChatDocument } from 'src/chat/schema/chat.schema';
import {
  Message,
  MessageDocument,
  PopulatedMessage,
} from 'src/message/schema/message.schema';
import { IMessageRepository } from '../interface/IMessageRepository.interface';
import { FileMetadata } from 'src/message/interface/message.types';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
  ) {}

  async saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: string = 'text',
    fileMetadata?: FileMetadata,
  ): Promise<PopulatedMessage> {
    if (type === 'image' && fileMetadata?.fileName) {
      const baseUrl = process.env.BASE_URL;
      fileMetadata.url = `/uploads/${encodeURIComponent(fileMetadata.fileName)}`;
    }

    const message = new this.messageModel({
      chatId: new Types.ObjectId(chatId),
      senderId: new Types.ObjectId(senderId),
      content,
      type,
      fileMetadata,
      isFormatted: type === 'text' && this.hasFormatting(content),
    });

    const saved = await message.save();

  
    const populated = await this.messageModel
      .findById(saved._id as Types.ObjectId)
      .populate('senderId', 'name email avatar')
      .populate('chatId', 'name isGroup')
      .lean()
      .exec();

    if (!populated) {
      throw new NotFoundException(`Message not found after saving`);
    }

  
    return populated as unknown as PopulatedMessage;
  }

  async getMessages(chatId: string): Promise<PopulatedMessage[]> {
    const objectId = new Types.ObjectId(chatId);
    const messages = await this.messageModel
      .find({ chatId: objectId })
      .populate('senderId', 'name email avatar')
      .populate('chatId', 'name isGroup')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return messages as unknown as PopulatedMessage[];
  }

  async getMessageById(messageId: string): Promise<PopulatedMessage> {
    const message = await this.messageModel
      .findById(messageId)
      .populate('senderId', 'name email avatar')
      .populate('chatId', 'name isGroup')
      .lean()
      .exec();

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    return message as unknown as PopulatedMessage;
  }

async getUserById(userId: Types.ObjectId) {
  const message =  await this.messageModel
    .find({ senderId: userId })
    .populate('senderId', '_id name email avatar')
    .exec();



    return message as unknown as PopulatedMessage;
}


  private hasFormatting(content: string): boolean {
    const formatPatterns = /(\*\*|__|\*|_|~~|`)/;
    return formatPatterns.test(content);
  }
}

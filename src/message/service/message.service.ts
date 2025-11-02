import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument, PopulatedMessage } from '../schema/message.schema';
import { Chat, ChatDocument } from 'src/chat/schema/chat.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: string,
  ) {
      if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid chatId format');
  }
    const message = await this.messageModel.create({
      chatId,
      senderId,
      content,
      type,
      timestamp: new Date(),
    });

    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
    });

    return message.populate('senderId', 'name avatar');
  }

  async getMessages(chatId: string) {
    const message = await this.messageModel
      .find({ chatId })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: 1 });
console.log('message', message)
      return message
  }


async getMessageById(messageId: string): Promise<PopulatedMessage> {
  const message = await this.messageModel
    .findById(messageId)
    .populate('senderId', 'name email avatar')
    .exec();

  if (!message) {
    throw new NotFoundException(`Message with ID ${messageId} not found`);
  }

  return message as unknown as PopulatedMessage;
}


  async deleteMessage(messageId: string) {
    return this.messageModel.findByIdAndDelete(messageId);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat } from '../schema/chat.schema';
import { User } from 'src/user/schemas/user.schema';
import { IChatRepository } from './interface/IChatRepository.interface';
import { PopulatedChat } from '../types/populated-chat.type';

@Injectable()
export class ChatRepository implements IChatRepository {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createPrivateChat(
    userId: string,
    participantId: string,
  ): Promise<Chat | null> {
    if (
      !Types.ObjectId.isValid(userId) ||
      !Types.ObjectId.isValid(participantId)
    ) {
      throw new BadRequestException('Invalid user ID format');
    }

    const userObjectId = new Types.ObjectId(userId);
    const participantObjectId = new Types.ObjectId(participantId);

    const existingChat = await this.chatModel
      .findOne({
        isGroup: false,
        members: { $all: [userObjectId, participantObjectId] },
      })
      .populate('members', 'name email avatar')
      .exec();

    if (existingChat) return existingChat;

    const participant = await this.userModel.findById(participantObjectId);
    if (!participant) throw new NotFoundException('Participant not found');

    const chat = new this.chatModel({
      name: participant.name,
      members: [userObjectId, participantObjectId],
      isGroup: false,
      lastMessage: null,
    });

    const savedChat = await chat.save();
    return this.chatModel
      .findById(savedChat._id)
      .populate('members', 'name email avatar')
      .exec();
  }

  async createGroupChat(
    name: string,
    members: string[],
    createdBy: string,
  ): Promise<Chat> {
    const group = await this.chatModel.create({
      name,
      members,
      isGroup: true,
      groupAdmin: createdBy,
    });

    return group;
  }

  async addUserToGroup(chatId: string, userId: string): Promise<Chat | null> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat || !chat.isGroup) throw new NotFoundException('Group not found');

    const userObjId = new Types.ObjectId(userId);
    if (chat.members.some((id) => id.equals(userObjId))) {
      throw new BadRequestException('User already in group');
    }

    chat.members.push(userObjId);
    await chat.save();

    return this.chatModel
      .findById(chatId)
      .populate('members', 'name email avatar')
      .exec();
  }

  async removeUserFromGroup(chatId: string, userId: string): Promise<Chat | null> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat || !chat.isGroup) throw new NotFoundException('Group not found');

    chat.members = chat.members.filter(
      (id) => id.toString() !== userId.toString(),
    );
    await chat.save();

    return this.chatModel
      .findById(chatId)
      .populate('members', 'name email avatar')
      .exec();
  }

 async getUserChats(userId: string, search?: string): Promise<PopulatedChat[]> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new BadRequestException('Invalid user ID format');
  }

  const query: Record<string, unknown> = {
    members: new Types.ObjectId(userId),
  };

  if (search?.trim()) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'members.name': { $regex: search, $options: 'i' } },
    ];
  }

  const chats = await this.chatModel
    .find(query)
    .populate('members', 'name email avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .lean<PopulatedChat[]>(); // 👈 cast the populated result properly

  return chats;
}

  async findOne(chatId: string): Promise<Chat> {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat ID format');
    }

    const chat = await this.chatModel
      .findById(chatId)
      .populate('members', 'name email avatar')
      .populate('lastMessage')
      .exec();

    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async joinChat(chatId: string, userId: string): Promise<Chat | null> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.isGroup) throw new BadRequestException('Cannot join private chat');

    const userObjId = new Types.ObjectId(userId);
    if (chat.members.some((id) => id.equals(userObjId))) {
      throw new BadRequestException('User already in chat');
    }

    chat.members.push(userObjId);
    await chat.save();

    return this.chatModel
      .findById(chatId)
      .populate('members', 'name email avatar')
      .exec();
  }

  async leaveChat(chatId: string, userId: string): Promise<Chat | null> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.isGroup) throw new BadRequestException('Cannot leave private chat');

    const userObjId = new Types.ObjectId(userId);
    chat.members = chat.members.filter((id) => !id.equals(userObjId));

    if (chat.members.length === 0) {
      await this.chatModel.findByIdAndDelete(chatId);
      return null;
    }

    await chat.save();
    return this.chatModel
      .findById(chatId)
      .populate('members', 'name email avatar')
      .exec();
  }

  async updateLastMessage(chatId: string, messageId: string): Promise<void> {
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: new Types.ObjectId(messageId),
    });
  }

  async delete(chatId: string): Promise<void> {
    const result = await this.chatModel.findByIdAndDelete(chatId);
    if (!result) throw new NotFoundException('Chat not found');
  }
}

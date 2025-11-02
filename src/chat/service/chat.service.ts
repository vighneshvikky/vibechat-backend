import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat } from '../schema/chat.schema';
import { User } from 'src/user/schemas/user.schema';


@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // Create private chat (one-on-one)
  async createPrivateChat(userId: string, participantId: string): Promise<Chat | null> {
    // Validate user IDs
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(participantId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const userObjectId = new Types.ObjectId(userId);
    const participantObjectId = new Types.ObjectId(participantId);

    // Check if chat already exists
    const existingChat = await this.chatModel.findOne({
      isGroup: false,
      members: { $all: [userObjectId, participantObjectId] }
    }).populate('members', 'name email avatar');

    if (existingChat) {
      return existingChat;
    }

    // Get participant details for chat name
    const participant = await this.userModel.findById(participantObjectId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Create new private chat
    const chat = new this.chatModel({
      name: participant.name, // Use participant's name as chat name
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

  // Create group chat
 async createGroupChat(name: string, members: string[], createdBy: string) {
  const group = await this.chatModel.create({
    name,
    members,
    isGroup: true,
    groupAdmin: createdBy,
  });

  return group; // This has _id
}

  // src/chat/service/chat.service.ts
async addUserToGroup(chatId: string, userId: string) {
  const chat = await this.chatModel.findById(chatId);

  if (!chat || !chat.isGroup) {
    throw new Error('Group not found');
  }

  // Check if user is already a member
  if (chat.members.includes(userId as any)) {
    throw new Error('User is already a member');
  }

  chat.members.push(userId as any);
  await chat.save();

  return this.chatModel
    .findById(chatId)
    .populate('members', 'name email avatar')
    .exec();
}

async removeUserFromGroup(chatId: string, userId: string) {
  const chat = await this.chatModel.findById(chatId);

  if (!chat || !chat.isGroup) {
    throw new Error('Group not found');
  }

  chat.members = chat.members.filter(
    (memberId) => memberId.toString() !== userId,
  );
  await chat.save();

  return this.chatModel
    .findById(chatId)
    .populate('members', 'name email avatar')
    .exec();
}

  // Get all chats for a user
  async getUserChats(userId: string): Promise<Chat[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    return this.chatModel
      .find({ members: new Types.ObjectId(userId) })
      .populate('members', 'name email avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .exec();
  }

  // Find single chat
  async findOne(chatId: string): Promise<Chat> {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat ID format');
    }

    const chat = await this.chatModel
      .findById(chatId)
      .populate('members', 'name email avatar')
      .populate('lastMessage')
      .exec();
  console.log('chat', chat)
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  // Join group chat
  async joinChat(chatId: string, userId: string): Promise<Chat | null> {
    const chat = await this.chatModel.findById(chatId);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (!chat.isGroup) {
      throw new BadRequestException('Cannot join a private chat');
    }

    const userObjectId = new Types.ObjectId(userId);
    if (chat.members.some(id => id.equals(userObjectId))) {
      throw new BadRequestException('User already in chat');
    }

    chat.members.push(userObjectId);
    await chat.save();

    return this.chatModel
      .findById(chatId)
      .populate('members', 'name email avatar')
      .exec();
  }

  // Leave group chat
  async leaveChat(chatId: string, userId: string): Promise<Chat | null> {
    const chat = await this.chatModel.findById(chatId);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (!chat.isGroup) {
      throw new BadRequestException('Cannot leave a private chat');
    }

    const userObjectId = new Types.ObjectId(userId);
    chat.members = chat.members.filter(id => !id.equals(userObjectId));

    // Delete chat if no members left
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

  // Update last message
  async updateLastMessage(chatId: string, messageId: string): Promise<void> {
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: new Types.ObjectId(messageId),
    });
  }

  // Delete chat
  async delete(chatId: string): Promise<void> {
    const result = await this.chatModel.findByIdAndDelete(chatId);
    if (!result) {
      throw new NotFoundException('Chat not found');
    }
  }
}
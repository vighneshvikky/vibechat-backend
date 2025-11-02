import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Request,
  Query,
} from '@nestjs/common';
import { ChatsService } from '../service/chat.service';
import { MessageService } from 'src/message/service/message.service';

// DTO for creating private chat
export class CreatePrivateChatDto {
  participantId: string; // The other user's ID
  userId: string; // Current user's ID
}

// DTO for creating group chat
export class CreateGroupChatDto {
  name: string;
  members: string[];
  userId: string;
}

@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messageService: MessageService,
  ) {}

  // Create private chat
  @Post('private')
  async createPrivateChat(@Body() dto: CreatePrivateChatDto) {
    return this.chatsService.createPrivateChat(dto.userId, dto.participantId);
  }

  // Create group chat
  @Post('group')
  async createGroupChat(@Body() dto: CreateGroupChatDto) {
    console.log('dto for creating group', dto);
    return this.chatsService.createGroupChat(dto.name, dto.members, dto.userId);
  }

  // Get all chats for a user
  @Get()
  async getUserChats(@Query('userId') userId: string) {
    return this.chatsService.getUserChats(userId);
  }

  // Get single chat by ID
  @Get(':id')
  async getChat(@Param('id') id: string) {
    return this.chatsService.findOne(id);
  }

  @Get('getChatMessages/:id')
  async getChatMessages(@Param('id') id: string) {
    console.log('loading chats');
    console.log('id', id);
    return await this.messageService.getMessages(id);
  }

  // Join group chat
  @Post(':id/join')
  async joinChat(@Param('id') chatId: string, @Body('userId') userId: string) {
    return this.chatsService.joinChat(chatId, userId);
  }

  // Leave group chat
  @Post(':id/leave')
  async leaveChat(@Param('id') chatId: string, @Body('userId') userId: string) {
    return this.chatsService.leaveChat(chatId, userId);
  }

  // Delete chat
  @Delete(':id')
  async deleteChat(@Param('id') id: string) {
    await this.chatsService.delete(id);
    return { message: 'Chat deleted successfully' };
  }
}

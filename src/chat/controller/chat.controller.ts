import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ChatService } from '../service/chat.service';
import { MessageService } from 'src/message/service/message.service';
import { FileUploadService } from 'src/message/service/file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageType } from 'src/message/interface/message.types';
import {
  IMessageService,
  IMESSAGESERVICE,
} from 'src/message/service/interface/IMessage-interface';
import { IChatService, ICHATSERVICE } from '../service/interface/IChatService.interface';

export class CreatePrivateChatDto {
  participantId: string;
  userId: string;
}

export class CreateGroupChatDto {
  name: string;
  members: string[];
  userId: string;
}

@Controller('chats')
export class ChatsController {
  constructor(
    @Inject(ICHATSERVICE) private readonly chatsService: IChatService,
    @Inject(IMESSAGESERVICE) private readonly messageService: IMessageService,
    private readonly fileUploadService: FileUploadService,
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
  async getUserChats(
    @Query('userId') userId: string,
    @Query('search') search?: string,
  ) {
    return this.chatsService.getUserChats(userId, search);
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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('chatId') chatId: string,
    @Body('senderId') senderId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Determine message type based on MIME type
    let messageType = 'file';
    if (file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      messageType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      messageType = 'audio';
    }

    // Upload file and get metadata
    const fileMetadata = await this.fileUploadService.uploadFile(file);

    // Save message with file metadata
    const message = await this.messageService.saveMessage(
      chatId,
      senderId,
      file.originalname, // Use filename as content
      messageType as MessageType,
      fileMetadata,
    );

    // Populate sender info
    const populatedMessage = await this.messageService.getMessageById(
      message._id!.toString(),
    );

    return {
      success: true,
      message: populatedMessage,
    };
  }
}

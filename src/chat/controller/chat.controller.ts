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
import { FileUploadService } from 'src/utils/file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageType } from 'src/message/interface/message.types';
import {
  IMessageService,
  IMESSAGESERVICE,
} from 'src/message/service/interface/IMessage-interface';
import {
  IChatService,
  ICHATSERVICE,
} from '../service/interface/IChatService.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { IChatGateway, ICHATGATEWAY } from '../interface/IChatgateway.interface';

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
    @Inject(ICHATSERVICE) private readonly _chatsService: IChatService,
    @Inject(IMESSAGESERVICE) private readonly _messageService: IMessageService,
    private readonly fileUploadService: FileUploadService,
    @Inject(ICHATGATEWAY)
    private readonly _chatGateWay: IChatGateway,
  ) {}

  @Post('private')
  async createPrivateChat(@Body() dto: CreatePrivateChatDto) {
    return this._chatsService.createPrivateChat(dto.userId, dto.participantId);
  }

  @Post('group')
  async createGroupChat(@Body() dto: CreateGroupChatDto) {
    console.log('dto for creating group', dto);
    return this._chatsService.createGroupChat(
      dto.name,
      dto.members,
      dto.userId,
    );
  }

  @Get()
  async getUserChats(
    @Query('userId') userId: string,
    @Query('search') search?: string,
  ) {
    return this._chatsService.getUserChats(userId, search);
  }

  @Get(':id')
  async getChat(@Param('id') id: string) {
    return this._chatsService.findOne(id);
  }

  @Get('getChatMessages/:id')
  async getChatMessages(@Param('id') id: string) {
    console.log('loading chats');
    console.log('id', id);
    return await this._messageService.getMessages(id);
  }

  @Post(':id/join')
  async joinChat(@Param('id') chatId: string, @Body('userId') userId: string) {
    return this._chatsService.joinChat(chatId, userId);
  }

  @Post(':id/leave')
  async leaveChat(@Param('id') chatId: string, @Body('userId') userId: string) {
    return this._chatsService.leaveChat(chatId, userId);
  }

  @Delete(':id')
  async deleteChat(@Param('id') id: string) {
    await this._chatsService.delete(id);
    return { message: 'Chat deleted successfully' };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('chatId') chatId: string,
    @Body('senderId') senderId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let messageType: MessageType = 'file';
    if (file.mimetype.startsWith('image/')) messageType = 'image';
    else if (file.mimetype.startsWith('video/')) messageType = 'video';
    else if (file.mimetype.startsWith('audio/')) messageType = 'audio';

    const fileMetadata = await this.fileUploadService.uploadFile(file);

    const message = await this._messageService.saveMessage(
      chatId,
      senderId,
      file.originalname,
      messageType,
      fileMetadata,
    );

    const populatedMessage = await this._messageService.getMessageById(
      message._id!.toString(),
    );

    this._chatGateWay.server.to(chatId).emit('newMessage', populatedMessage);
    this._chatsService.updateLastMessage(chatId, message._id);

    console.log('✅ Socket event emitted to room:', chatId);

    return {
      success: true,
      message: populatedMessage,
    };
  }
}

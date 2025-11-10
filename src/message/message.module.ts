import { Module } from '@nestjs/common';
import { MessageService } from './service/message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schema/message.schema';
import { Chat, ChatSchema } from 'src/chat/schema/chat.schema';
import { FileUploadService } from '../utils/file-upload.service';
import { IMESSAGESERVICE } from './service/interface/IMessage-interface';
import { IMESSAGEREPOSITORY } from './repository/interface/IMessageRepository.interface';
import { MessageRepository } from './repository/implementation/messageRespository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
  ],
  providers: [
    {
      provide: IMESSAGESERVICE,
      useClass: MessageService,
    },
    {
      provide: IMESSAGEREPOSITORY,
      useClass: MessageRepository,
    },
    FileUploadService,
  ],
  exports: [
    {
      provide: IMESSAGESERVICE,
      useClass: MessageService,
    },
    MongooseModule,
    FileUploadService,
  ],
})
export class MessageModule {}

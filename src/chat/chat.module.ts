import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { ChatRepository } from './repository/chat.repository';
import { ChatsController } from './controller/chat.controller';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schema/chat.schema';
import { ChatGateway } from './chatgateway';
import { MessageModule } from 'src/message/message.module';
import { ICHATSERVICE } from './service/interface/IChatService.interface';
import { ICHATREPOSITORY } from './repository/interface/IChatRepository.interface';
import { ChatService } from './service/chat.service';
import { ICHATGATEWAY } from './interface/IChatgateway.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),

    UserModule,
    MessageModule,
  ],
  providers: [
    {
      provide: ICHATSERVICE,
      useClass: ChatService,
    },
    {
      provide: ICHATREPOSITORY,
      useClass: ChatRepository,
    },
    {
      provide: ICHATGATEWAY,
      useClass: ChatGateway,
    },
  ],
  controllers: [ChatsController],
  exports: [],
})
export class ChatModule {}

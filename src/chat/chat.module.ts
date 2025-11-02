import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { ChatsService } from './service/chat.service';
import { ChatRepository } from './repository/chat.repository';
import { ChatsController } from './controller/chat.controller';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schema/chat.schema';
import { ChatGateway } from './chatgateway';
import { MessageModule } from 'src/message/message.module';

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
  providers: [ChatsService, ChatRepository, ChatGateway],
  controllers: [ChatsController],
  exports: [],
})
export class ChatModule {}

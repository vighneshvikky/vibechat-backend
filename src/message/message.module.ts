import { Module } from '@nestjs/common';
import { MessageService } from './service/message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schema/message.schema';
import { ChatModule } from 'src/chat/chat.module';
import { Chat, ChatSchema } from 'src/chat/schema/chat.schema';

@Module({
    imports: [MongooseModule.forFeature([{name: Message.name, schema: MessageSchema},  { name: Chat.name, schema: ChatSchema }, ])],
    providers: [MessageService],
    exports: [MessageService, MongooseModule]
})
export class MessageModule {
    
}

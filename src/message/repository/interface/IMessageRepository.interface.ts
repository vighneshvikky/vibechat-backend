import { Types } from "mongoose";
import { FileMetadata, MessageType } from "src/message/interface/message.types";
import { MessageDocument, PopulatedMessage } from "src/message/schema/message.schema";

export const IMESSAGEREPOSITORY = Symbol('IMESSAGEREPOSITORY');

export interface IMessageRepository {
  saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type?: MessageType,
    fileMetadata?: FileMetadata
  ): Promise<PopulatedMessage>;

  getMessages(chatId: string): Promise<PopulatedMessage[]>;

  getMessageById(messageId: string): Promise<PopulatedMessage>;
 getUserById(userId: Types.ObjectId): Promise<PopulatedMessage>;
  
}
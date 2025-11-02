// src/message/schema/message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ 
    default: 'text',
    enum: ['text', 'image', 'file', 'video', 'audio']
  })
  type: string;


    @Prop({ type: Object })
  fileMetadata?: {
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
  };

  @Prop({ type: Boolean, default: false })
  isFormatted: boolean;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

export interface PopulatedMessage extends Omit<MessageDocument, 'senderId'> {
  senderId: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar?: string;
  };
}

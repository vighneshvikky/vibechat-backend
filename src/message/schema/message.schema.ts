
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  _id: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({
    default: 'text',
    enum: ['text', 'image', 'file', 'video', 'audio', 'system'],
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


export type MessageDocument = Message &
  Document & {
    _id: Types.ObjectId;
  };

export const MessageSchema = SchemaFactory.createForClass(Message);

export interface PopulatedMessage {
  _id: Types.ObjectId;
  chatId: Types.ObjectId | { _id: Types.ObjectId };
  senderId: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  type: string;
  fileMetadata?: {
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
  };
  isFormatted: boolean;
  timestamp: Date;
}

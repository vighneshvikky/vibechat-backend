// src/message/schema/message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  _id: Types.ObjectId; // ✅ Explicitly define this

  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({
    default: 'text',
    enum: ['text', 'image', 'file', 'video', 'audio'],
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

// ✅ This ensures proper inference in service/repository
export type MessageDocument = Message & Document & {
  _id: Types.ObjectId;
};

// ✅ Create schema
export const MessageSchema = SchemaFactory.createForClass(Message);

export interface PopulatedMessage {
  _id: Types.ObjectId;
  chatId: Types.ObjectId | { _id: Types.ObjectId }; // ✅ must include both
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


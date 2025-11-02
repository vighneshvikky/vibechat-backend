import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })

export class Chat {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  members: Types.ObjectId[];

  @Prop({ default: false })
  isGroup: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastMessage: Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

import { PopulatedChat } from '../types/populated-chat.type';
import { ChatResponse } from '../repository/interface/IChatRepository.interface';
import { Types } from 'mongoose';

export class ChatMapper {
  static toResponse(chat: PopulatedChat): ChatResponse {
    return {
      _id: chat._id.toString(),
      name: chat.name,
      isGroup: chat.isGroup,
      members: chat.members.map((m) => ({
        _id: m._id.toString(),
        name: m.name,
        email: m.email,
        avatar: m.avatar,
      })),
lastMessage: chat.lastMessage
  ? {
      content: chat.lastMessage.content,
      timestamp: chat.lastMessage.timestamp,
      type: chat.lastMessage.type,
      senderId: (() => {
        const sender = chat.lastMessage!.senderId;
        if (sender instanceof Types.ObjectId) {
          return sender.toString();
        }
        if (typeof sender === 'object' && sender?._id) {
          return sender._id.toString();
        }
        return '';
      })(),
    }
  : undefined,

    };
  }
}

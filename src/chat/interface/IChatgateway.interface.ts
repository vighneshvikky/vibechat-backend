import { Server, Socket } from 'socket.io';
import { FileMetadata, MessageType } from 'src/message/interface/message.types';

export interface IChatGateway {
  server: Server;

  handleConnection(client: Socket): void;

  handleDisconnect(client: Socket): void;

  handleJoinRoom(
    data: { chatId: string; userId: string },
    client: Socket,
  ): Promise<void>;

  handleLeaveRoom(
    data: { chatId: string; userId: string },
    client: Socket,
  ): void;

  handleSendMessage(
    data: {
      chatId: string;
      senderId: string;
      content: string;
      type?: string;
      fileMetadata?: FileMetadata;
    },
    client: Socket,
  ): Promise<void>;

  handleCreatePrivateChat(
    data: { userId1: string; userId2: string },
    client: Socket,
  );

  handleCreateGroup(
    data: {
      name: string;
      participants: string[];
      createdBy: string;
    },
    client: Socket,
  );

  handleAddUserToGroup(
    data: {
      chatId: string;
      userId: string;
      addedBy: string;
    },
    client: Socket,
  ): Promise<{ success: boolean } | undefined>;

  handleRemoveUserFromGroup(
    data: {
      chatId: string;
      userId: string;
      removedBy: string;
    },
    client: Socket,
  ): Promise<{ success: boolean } | undefined>;

  handleTyping(
    data: {
      chatId: string;
      userId: string;
      username: string;
      isTyping: boolean;
    },
    client: Socket,
  ): void;
}

export const ICHATGATEWAY = Symbol('ICHATGATEWAY');

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './service/chat.service';
import { MessageService } from 'src/message/service/message.service';
import { FileMetadata, MessageType } from 'src/message/interface/message.types';
import { Inject } from '@nestjs/common';
import {
  IMessageService,
  IMESSAGESERVICE,
} from 'src/message/service/interface/IMessage-interface';
import {
  IChatService,
  ICHATSERVICE,
} from './service/interface/IChatService.interface';
import { IChatGateway } from './interface/IChatgateway.interface';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, IChatGateway {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(
    @Inject(ICHATSERVICE) private readonly chatService: IChatService,
    @Inject(IMESSAGESERVICE) private readonly messageService: IMessageService,
  ) {}

  handleConnection(client: Socket) {
    

    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      console.log(`👤 User ${userId} mapped to socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
   

    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        console.log(`👋 User ${userId} removed from mapping`);
        break;
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, userId } = data;

    console.log(`📥 Join room request:`, data);

    if (!chatId || !chatId.match(/^[0-9a-fA-F]{24}$/)) {
   
      client.emit('error', { message: 'Invalid chat ID' });
      return;
    }

    client.join(chatId);
  

    client.emit('roomJoined', { chatId, userId });

    client.to(chatId).emit('userJoined', {
      chatId,
      userId,
      message: 'A user joined the chat',
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, userId } = data;

    client.leave(chatId);
    console.log(`🚪 ${client.id} (User: ${userId}) left room ${chatId}`);

    client.to(chatId).emit('userLeft', {
      chatId,
      userId,
      message: 'A user left the chat',
    });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      chatId: string;
      senderId: string;
      content: string;
      type?: string;
      fileMetadata?: FileMetadata;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('📥 RECEIVED sendMessage event');
    console.log('📍 Data:', JSON.stringify(data, null, 2));

    try {
      if (!data.chatId || !data.chatId.match(/^[0-9a-fA-F]{24}$/)) {
        console.error('❌ Invalid chat ID:', data.chatId);
        client.emit('messageError', { message: 'Invalid chat ID' });
        return;
      }

      if (!client.rooms.has(data.chatId)) {
        console.error('❌ Client not in room:', data.chatId);
        client.emit('messageError', { message: 'Not in chat room' });
        return;
      }

      const message = await this.messageService.saveMessage(
        data.chatId,
        data.senderId,
        data.content,
        (data.type as MessageType) ?? 'text',
        data.fileMetadata,
      );

      console.log('✅ Message saved with ID:', message._id);

      const populatedMessage = await this.messageService.getMessageById(
        message._id!.toString(),
      );

      console.log('📡 Broadcasting to room:', data.chatId);

      this.server.to(data.chatId).emit('newMessage', populatedMessage);

      console.log('✅ Message broadcast complete');

      await this.chatService.updateLastMessage(
        data.chatId,
        message._id!.toString(),
      );

      client.emit('messageSent', {
        messageId: message._id,
        chatId: data.chatId,
      });
    } catch (error) {
      console.error('❌ ERROR in handleSendMessage:', error);
      client.emit('messageError', {
        message: 'Failed to send message',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('createPrivateChat')
  async handleCreatePrivateChat(
    @MessageBody() data: { userId1: string; userId2: string },
    @ConnectedSocket() client: Socket,
  ) {
    

    try {
      const chat = await this.chatService.createPrivateChat(
        data.userId1,
        data.userId2,
      );

      client.emit('privateChatCreated', { chat });

      const otherUserId = data.userId2;
      const socketId = this.userSockets.get(otherUserId);
      if (socketId) {
        this.server.to(socketId).emit('privateChatCreated', { chat });
        console.log(`📤 Sent privateChatCreated to user ${otherUserId}`);
      }

      return { success: true, chat };
    } catch (error) {
      console.error('❌ Error creating private chat:', error);
      client.emit('error', {
        message: 'Failed to create private chat',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('createGroup')
  async handleCreateGroup(
    @MessageBody()
    data: {
      name: string;
      participants: string[];
      createdBy: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('👥 CREATE GROUP event received:', data);

    try {
      const allParticipants = Array.from(
        new Set([data.createdBy, ...data.participants]),
      );
      console.log('📋 All participants:', allParticipants);

      const group = await this.chatService.createGroupChat(
        data.name,
        allParticipants,
        data.createdBy,
      );

      if (group) console.log('✅ Group created:', group._id);

      for (const participantId of allParticipants) {
        if (participantId !== data.createdBy) {
          const socketId = this.userSockets.get(participantId);
          if (socketId) {
            this.server.to(socketId).emit('newGroup', group);
            console.log(`📤 Sent newGroup to user ${participantId}`);
          }
        }
      }

      client.emit('groupCreated', { group });
      console.log('📤 Sent groupCreated to creator');

      return { success: true, group };
    } catch (error) {
      console.error('❌ Error creating group:', error);
      client.emit('groupError', {
        message: 'Failed to create group',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('addUserToGroup')
  async handleAddUserToGroup(
    @MessageBody()
    data: {
      chatId: string;
      userId: string;
      addedBy: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('➕ ADD USER TO GROUP:', data);

    try {
      const updatedGroup = await this.chatService.addUserToGroup(
        data.chatId,
        data.userId,
      );

      const addedUser = updatedGroup.members.find(
        (member) => member._id.toString() === data.userId,
      );
      const addedByUser = updatedGroup.members.find(
        (member) => member._id.toString() === data.addedBy,
      );

      const addedUserName = addedUser?.name || 'User';
      const addedByUserName = addedByUser?.name || 'Admin';

      const systemMessageContent = `${addedUserName} was added by ${addedByUserName}`;

      const systemMessage = await this.messageService.saveMessage(
        data.chatId,
        data.addedBy,
        systemMessageContent,
        'system' as MessageType,
        undefined,
      );

      const populatedSystemMessage = await this.messageService.getMessageById(
        systemMessage._id!.toString(),
      );

      // Broadcast system message to room
      this.server.to(data.chatId).emit('newMessage', populatedSystemMessage);

      // Broadcast user added event
      this.server.to(data.chatId).emit('userAddedToGroup', {
        chatId: data.chatId,
        userId: data.userId,
        addedBy: data.addedBy,
        group: updatedGroup,
        userName: addedUserName,
      });

      // Notify the added user
      const socketId = this.userSockets.get(data.userId);
      if (socketId) {
        this.server.to(socketId).emit('addedToGroup', updatedGroup);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error adding user to group:', error);
      client.emit('error', { message: 'Failed to add user to group' });
    }
  }

  @SubscribeMessage('removeUserFromGroup')
  async handleRemoveUserFromGroup(
    @MessageBody()
    data: {
      chatId: string;
      userId: string;
      removedBy: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('➖ REMOVE USER FROM GROUP:', data);

    try {
      const groupBefore = await this.chatService.findOne(data.chatId);
      const removedUser = groupBefore.members.find(
        (member) => member._id.toString() === data.userId,
      );
      const removedByUser = groupBefore.members.find(
        (member) => member._id.toString() === data.removedBy,
      );

      const removedUserName = removedUser?.name || 'User';
      const removedByUserName = removedByUser?.name || 'Admin';

      const updatedGroup = await this.chatService.removeUserFromGroup(
        data.chatId,
        data.userId,
      );

      const isUserLeavingThemselves = data.userId === data.removedBy;
      const systemMessageContent = isUserLeavingThemselves
        ? `${removedUserName} left the group`
        : `${removedUserName} was removed by ${removedByUserName}`;

      const systemMessage = await this.messageService.saveMessage(
        data.chatId,
        data.removedBy,
        systemMessageContent,
        'system' as MessageType,
        undefined,
      );

      const populatedSystemMessage = await this.messageService.getMessageById(
        systemMessage._id!.toString(),
      );

      // Broadcast system message to all users in the room
      this.server.to(data.chatId).emit('newMessage', populatedSystemMessage);

      // Broadcast user removed event
      this.server.to(data.chatId).emit('userRemovedFromGroup', {
        chatId: data.chatId,
        userId: data.userId,
        removedBy: data.removedBy,
        group: updatedGroup,
        userName: removedUserName,
      });

      // Notify the removed user specifically
      const socketId = this.userSockets.get(data.userId);
      if (socketId) {
        this.server.to(socketId).emit('removedFromGroup', {
          chatId: data.chatId,
          groupName: updatedGroup?.name || groupBefore?.name,
          removedBy: data.removedBy,
          isKicked: !isUserLeavingThemselves,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error removing user from group:', error);
      client.emit('error', { message: 'Failed to remove user from group' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody()
    data: {
      chatId: string;
      userId: string;
      username: string;
      isTyping: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`⌨️ Typing event:`, data);

    client.to(data.chatId).emit('userTyping', data);
  }
}

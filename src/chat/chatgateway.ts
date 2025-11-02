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
import { ChatsService } from './service/chat.service';
import { MessageService } from 'src/message/service/message.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store user-socket mapping
  private userSockets = new Map<string, string>();

  constructor(
    private readonly chatService: ChatsService,
    private readonly messageService: MessageService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`🔥 Client connected: ${client.id}`);

    // Get userId from query params if provided
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      console.log(`👤 User ${userId} mapped to socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);

    // Remove user from mapping
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        console.log(`👋 User ${userId} removed from mapping`);
        break;
      }
    }
  }

  // ✅ Join a chat room - Accept both chatId and userId
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, userId } = data;

    console.log(`📥 Join room request:`, data);

    // Validate chatId format
    if (!chatId || !chatId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('❌ Invalid chat ID:', chatId);
      client.emit('error', { message: 'Invalid chat ID' });
      return;
    }

    // Join the room
    client.join(chatId);
    console.log(`✅ ${client.id} (User: ${userId}) joined room ${chatId}`);

    // Emit confirmation to the client
    client.emit('roomJoined', { chatId, userId });

    // Notify others in the room
    client.to(chatId).emit('userJoined', {
      chatId,
      userId,
      message: 'A user joined the chat',
    });
  }

  // ✅ Leave a chat room
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, userId } = data;

    client.leave(chatId);
    console.log(`🚪 ${client.id} (User: ${userId}) left room ${chatId}`);

    // Notify others
    client.to(chatId).emit('userLeft', {
      chatId,
      userId,
      message: 'A user left the chat',
    });
  }

  // ✅ Send message
  // chatgateway.ts
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      chatId: string;
      senderId: string;
      content: string;
      type?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 RECEIVED sendMessage event');
    console.log('📍 Client ID:', client.id);
    console.log('📍 Data:', JSON.stringify(data, null, 2));
    console.log('📍 Client rooms:', Array.from(client.rooms));

    try {
      // Validate chatId
      if (!data.chatId || !data.chatId.match(/^[0-9a-fA-F]{24}$/)) {
        console.error('❌ Invalid chat ID:', data.chatId);
        client.emit('messageError', { message: 'Invalid chat ID' });
        return;
      }

      console.log('✅ ChatId validated');

      // Check if client is in the room
      if (!client.rooms.has(data.chatId)) {
        console.error('❌ Client not in room:', data.chatId);
        client.emit('messageError', { message: 'Not in chat room' });
        return;
      }

      console.log('✅ Client is in room');
      console.log('💾 Saving message to database...');

      // Save message to database
      const message = await this.messageService.saveMessage(
        data.chatId,
        data.senderId,
        data.content,
        data.type || 'text',
      );

      console.log('✅ Message saved with ID:', message._id);
      console.log('📤 Populating sender info...');

      // Populate sender info before emitting
      const populatedMessage = await this.messageService.getMessageById(
        message._id!.toString(),
      );

      console.log('✅ Message populated:', {
        id: populatedMessage._id,
        sender: populatedMessage.senderId?.name,
        content: populatedMessage.content,
      });

      console.log('📡 Broadcasting to room:', data.chatId);
      console.log(
        '📡 Room members:',
        this.server.sockets.adapter.rooms.get(data.chatId),
      );

      // Emit to ALL clients in the room (including sender)
      this.server.to(data.chatId).emit('newMessage', populatedMessage);

      console.log('✅ Message broadcast complete');

      // Also emit confirmation to sender
      client.emit('messageSent', {
        messageId: message._id,
        chatId: data.chatId,
      });

      console.log('✅ Confirmation sent to sender');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERROR in handleSendMessage:');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      client.emit('messageError', {
        message: 'Failed to send message',
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
      // Include creator in participants
      const allParticipants = Array.from(
        new Set([data.createdBy, ...data.participants]),
      );
      console.log('📋 All participants:', allParticipants);

      // Create group via service
      const group = await this.chatService.createGroupChat(
        data.name,
        allParticipants,
        data.createdBy,
      );

      if (group) console.log('✅ Group created:', group._id);

      // Notify all participants including creator
      for (const participantId of allParticipants) {
        if (participantId !== data.createdBy) {
          const socketId = this.userSockets.get(participantId);
          if (socketId) {
            this.server.to(socketId).emit('newGroup', group);
            console.log(`📤 Sent newGroup to user ${participantId}`);
          }
        }
      }

      // Send confirmation to creator
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

  // Add user to group
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
      // Update group in database
      const updatedGroup = await this.chatService.addUserToGroup(
        data.chatId,
        data.userId,
      );

      // Notify all group members
      this.server.to(data.chatId).emit('userAddedToGroup', {
        chatId: data.chatId,
        userId: data.userId,
        addedBy: data.addedBy,
        group: updatedGroup,
      });

      // Notify the added user specifically
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

  // Remove user from group
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
      const updatedGroup = await this.chatService.removeUserFromGroup(
        data.chatId,
        data.userId,
      );

      // Notify all group members
      this.server.to(data.chatId).emit('userRemovedFromGroup', {
        chatId: data.chatId,
        userId: data.userId,
        removedBy: data.removedBy,
        group: updatedGroup,
      });

      // Notify the removed user
      const socketId = this.userSockets.get(data.userId);
      if (socketId) {
        this.server.to(socketId).emit('removedFromGroup', {
          chatId: data.chatId,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error removing user from group:', error);
      client.emit('error', { message: 'Failed to remove user from group' });
    }
  }

  // ✅ Typing indicators
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

    // Emit to everyone in the room except the sender
    client.to(data.chatId).emit('userTyping', data);
  }
}

const logger = require('../config/logger');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.activeRooms = new Map(); // batchId -> Set of userIds
  }

  init(io) {
    this.io = io;

    io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });

      // Handle joining batch room
      socket.on('join-batch', (batchId) => {
        this.handleJoinBatch(socket, batchId);
      });

      // Handle leaving batch room
      socket.on('leave-batch', (batchId) => {
        this.handleLeaveBatch(socket, batchId);
      });

      // Handle live class events
      socket.on('start-class', (data) => {
        this.handleStartClass(socket, data);
      });

      socket.on('end-class', (data) => {
        this.handleEndClass(socket, data);
      });

      // Handle chat messages
      socket.on('send-message', (data) => {
        this.handleChatMessage(socket, data);
      });

      // Handle typing events
      socket.on('user-typing', (data) => {
        this.handleTyping(socket, data);
      });

      socket.on('user-stopped-typing', (data) => {
        this.handleStoppedTyping(socket, data);
      });

      // Handle message deletion
      socket.on('delete-message', (data) => {
        this.handleDeleteMessage(socket, data);
      });

      // Handle whiteboard events
      socket.on('whiteboard-draw', (data) => {
        this.handleWhiteboardEvent(socket, data);
      });

      // Handle reactions
      socket.on('send-reaction', (data) => {
        this.handleReaction(socket, data);
      });

      // Handle hand raise
      socket.on('raise-hand', (data) => {
        this.handleHandRaise(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });

    logger.info('Socket.IO initialized');
  }

  handleAuthentication(socket, data) {
    const { userId, token } = data;

    // Basic token verification (simplified)
    if (token && userId) {
      this.connectedUsers.set(userId, socket.id);

      socket.userId = userId;
      socket.emit('authenticated', { success: true });

      logger.info(`User authenticated: ${userId}`);
    } else {
      socket.emit('authenticated', { success: false, message: 'Invalid credentials' });
    }
  }

  handleJoinBatch(socket, batchId) {
    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Join socket room
    socket.join(`batch-${batchId}`);

    // Add to active rooms
    if (!this.activeRooms.has(batchId)) {
      this.activeRooms.set(batchId, new Set());
    }
    this.activeRooms.get(batchId).add(socket.userId);

    // Notify others in the room
    socket.to(`batch-${batchId}`).emit('user-joined', {
      userId: socket.userId,
      timestamp: new Date()
    });

    // Send current room state
    const roomUsers = Array.from(this.activeRooms.get(batchId) || []);
    socket.emit('room-state', {
      batchId,
      activeUsers: roomUsers.length,
      userList: roomUsers
    });

    logger.info(`User ${socket.userId} joined batch ${batchId}`);
  }

  handleLeaveBatch(socket, batchId) {
    if (!socket.userId) return;

    socket.leave(`batch-${batchId}`);

    if (this.activeRooms.has(batchId)) {
      this.activeRooms.get(batchId).delete(socket.userId);

      if (this.activeRooms.get(batchId).size === 0) {
        this.activeRooms.delete(batchId);
      }
    }

    socket.to(`batch-${batchId}`).emit('user-left', {
      userId: socket.userId,
      timestamp: new Date()
    });

    logger.info(`User ${socket.userId} left batch ${batchId}`);
  }

  handleStartClass(socket, data) {
    const { batchId, sessionId } = data;

    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Broadcast to all users in the batch
    this.io.to(`batch-${batchId}`).emit('class-started', {
      batchId,
      sessionId,
      startedBy: socket.userId,
      startTime: new Date(),
      message: 'Live class has started!'
    });

    logger.info(`Class started in batch ${batchId} by ${socket.userId}`);
  }

  handleEndClass(socket, data) {
    const { batchId, sessionId } = data;

    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    this.io.to(`batch-${batchId}`).emit('class-ended', {
      batchId,
      sessionId,
      endedBy: socket.userId,
      endTime: new Date(),
      message: 'Live class has ended. Thank you for joining!'
    });

    logger.info(`Class ended in batch ${batchId} by ${socket.userId}`);
  }

  handleChatMessage(socket, data) {
    const { batchId, message, type = 'public', userName, isGif } = data;

    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const chatData = {
      userId: socket.userId,
      userName,
      message: message.substring(0, 500),
      timestamp: new Date(),
      type,
      isGif
    };

    if (type === 'teacher-only') {
      this.io.to(`batch-${batchId}`).emit('chat-message', chatData);
    } else {
      this.io.to(`batch-${batchId}`).emit('chat-message', chatData);
    }
  }

  handleTyping(socket, data) {
    const { batchId, userId, userName } = data;
    socket.to(`batch-${batchId}`).emit('user-typing', { userId, userName });
  }

  handleStoppedTyping(socket, data) {
    const { batchId, userId, userName } = data;
    socket.to(`batch-${batchId}`).emit('user-stopped-typing', { userId, userName });
  }

  handleDeleteMessage(socket, data) {
    const { batchId, messageId } = data;
    this.io.to(`batch-${batchId}`).emit('message-deleted', { messageId });
  }

  handleWhiteboardEvent(socket, data) {
    const { batchId, eventType, eventData } = data;

    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Broadcast whiteboard event to all users in the batch
    socket.to(`batch-${batchId}`).emit('whiteboard-event', {
      userId: socket.userId,
      eventType,
      eventData,
      timestamp: new Date()
    });
  }

  handleReaction(socket, data) {
    const { batchId, reactionType } = data;

    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Broadcast reaction to all users in the batch
    this.io.to(`batch-${batchId}`).emit('user-reaction', {
      userId: socket.userId,
      reactionType,
      timestamp: new Date()
    });
  }

  handleHandRaise(socket, data) {
    const { batchId, raised } = data;

    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Broadcast hand raise status to all users in the batch
    this.io.to(`batch-${batchId}`).emit('hand-raise', {
      userId: socket.userId,
      raised,
      timestamp: new Date()
    });
  }

  handleDisconnect(socket) {
    if (socket.userId) {
      this.connectedUsers.delete(socket.userId);

      // Leave all rooms
      this.activeRooms.forEach((users, batchId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(`batch-${batchId}`).emit('user-left', {
            userId: socket.userId,
            timestamp: new Date()
          });

          if (users.size === 0) {
            this.activeRooms.delete(batchId);
          }
        }
      });

      logger.info(`User disconnected: ${socket.userId}`);
    }
  }

  // Handle payout updates
  handlePayoutUpdate(socket, data) {
    // This is handled via emit from webhook
  }

  // Send payout update to teacher
  sendPayoutUpdateToTeacher(teacherId, updateData) {
    const socketId = this.connectedUsers.get(teacherId);
    if (socketId) {
      this.io.to(socketId).emit('payout-update', updateData);
    }
  }

  // Utility methods
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  getActiveRooms() {
    return Array.from(this.activeRooms.entries()).map(([batchId, users]) => ({
      batchId,
      userCount: users.size,
      users: Array.from(users)
    }));
  }

  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  sendNotificationToBatch(batchId, notification) {
    this.io.to(`batch-${batchId}`).emit('batch-notification', notification);
  }
}

module.exports = new SocketManager();

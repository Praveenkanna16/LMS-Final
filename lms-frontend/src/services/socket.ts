import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  connect(userId: string, token: string) {
    if (this.socket && this.connected) {
      return this.socket;
    }

    this.socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connected = true;

      // Authenticate
      this.socket?.emit('authenticate', { userId, token });
    });

    this.socket.on('authenticated', (data: { success: boolean; message?: string }) => {
      if (data.success) {
        console.log('Socket authenticated successfully');
      } else {
        console.error('Socket authentication failed:', data.message);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error: unknown) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinBatch(batchId: string) {
    if (this.socket && this.connected) {
      this.socket.emit('join-batch', batchId);
      console.log('Joined batch:', batchId);
    }
  }

  leaveBatch(batchId: string) {
    if (this.socket && this.connected) {
      this.socket.emit('leave-batch', batchId);
      console.log('Left batch:', batchId);
    }
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: unknown) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected() {
    return this.connected;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();

import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/appStore';
import toast from 'react-hot-toast';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnect();
    });

    // Order events
    this.socket.on('order:status-updated', (data) => {
      const { orderId, status, updatedAt } = data;
      const { updateOrder } = useAppStore.getState();

      updateOrder(orderId, { status });

      toast.success(`Order ${orderId} status updated to ${status}`);
    });

    this.socket.on('order:subscribed', (data) => {
      console.log('Subscribed to order:', data.orderId);
    });

    this.socket.on('order:error', (data) => {
      toast.error(data.message);
    });

    // Store events
    this.socket.on('store:status-updated', (data) => {
      const { storeId, isOpen, updatedAt } = data;
      toast.info(`Store ${storeId} is now ${isOpen ? 'open' : 'closed'}`);
    });

    this.socket.on('store:subscribed', (data) => {
      console.log('Subscribed to store:', data.storeId);
    });

    this.socket.on('store:error', (data) => {
      toast.error(data.message);
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      const { message, sender, timestamp } = data;
      toast.success(`New message from ${sender}: ${message}`);
    });

    // Notification events
    this.socket.on('notification:received', (data) => {
      const { message, type, timestamp } = data;

      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast(message, { icon: '⚠️' });
          break;
        default:
          toast(message);
      }
    });

    this.socket.on('notification:subscribed', () => {
      console.log('Subscribed to notifications');
    });

    this.socket.on('notification:error', (data) => {
      toast.error(data.message);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      toast.error('Connection lost. Please refresh the page.');
    }
  }

  // Order methods
  subscribeToOrder(orderId: string) {
    if (this.socket?.connected) {
      this.socket.emit('order:subscribe', orderId);
    }
  }

  updateOrderStatus(orderId: string, status: string) {
    if (this.socket?.connected) {
      this.socket.emit('order:update-status', { orderId, status });
    }
  }

  // Store methods
  subscribeToStore(storeId: string) {
    if (this.socket?.connected) {
      this.socket.emit('store:subscribe', storeId);
    }
  }

  updateStoreStatus(storeId: string, isOpen: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('store:update-status', { storeId, isOpen });
    }
  }

  // Chat methods
  sendMessage(message: string, recipientId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('chat:message', { message, recipientId });
    }
  }

  // Notification methods
  subscribeToNotifications() {
    if (this.socket?.connected) {
      this.socket.emit('notification:subscribe');
    }
  }

  sendNotification(userId: string, message: string, type: string = 'info') {
    if (this.socket?.connected) {
      this.socket.emit('notification:send', { userId, message, type });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { Order } from '@/models/Order';
import { logger } from '@/config/logger';

interface AuthenticatedSocket extends Socket {
  user?: any;
}

export const initializeSocketIO = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.status !== 'active') {
        return next(new Error('Authentication error: Account inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.user?.email} (${socket.id})`);

    // Join user to their personal room
    socket.join(`user:${socket.user?._id}`);

    // Join admin users to admin room
    if (socket.user?.role === 'admin' || socket.user?.role === 'staff') {
      socket.join('admin');
    }

    // Handle order status updates
    socket.on('order:subscribe', async (orderId: string) => {
      try {
        const order = await Order.findById(orderId);
        if (!order) {
          socket.emit('order:error', { message: 'Order not found' });
          return;
        }

        // Check if user has permission to view this order
        if (order.user.toString() !== socket.user?._id.toString() &&
          socket.user?.role !== 'admin' &&
          socket.user?.role !== 'staff') {
          socket.emit('order:error', { message: 'Unauthorized' });
          return;
        }

        socket.join(`order:${orderId}`);
        socket.emit('order:subscribed', { orderId, status: order.status });
      } catch (error) {
        logger.error('Order subscription error:', error);
        socket.emit('order:error', { message: 'Subscription failed' });
      }
    });

    // Handle order status updates (admin only)
    socket.on('order:update-status', async (data: { orderId: string; status: string }) => {
      try {
        if (socket.user?.role !== 'admin' && socket.user?.role !== 'staff') {
          socket.emit('order:error', { message: 'Unauthorized' });
          return;
        }

        const order = await Order.findById(data.orderId);
        if (!order) {
          socket.emit('order:error', { message: 'Order not found' });
          return;
        }

        order.status = data.status;
        await order.save();

        // Notify all subscribers of this order
        io.to(`order:${data.orderId}`).emit('order:status-updated', {
          orderId: data.orderId,
          status: data.status,
          updatedAt: new Date(),
        });

        // Notify admin room
        io.to('admin').emit('order:status-changed', {
          orderId: data.orderId,
          status: data.status,
          updatedBy: socket.user?.email,
        });

        logger.info(`Order status updated: ${data.orderId} to ${data.status} by ${socket.user?.email}`);
      } catch (error) {
        logger.error('Order status update error:', error);
        socket.emit('order:error', { message: 'Status update failed' });
      }
    });

    // Handle store location updates
    socket.on('store:subscribe', (storeId: string) => {
      socket.join(`store:${storeId}`);
      socket.emit('store:subscribed', { storeId });
    });

    // Handle store status updates (admin only)
    socket.on('store:update-status', (data: { storeId: string; isOpen: boolean }) => {
      if (socket.user?.role !== 'admin' && socket.user?.role !== 'staff') {
        socket.emit('store:error', { message: 'Unauthorized' });
        return;
      }

      // Notify all subscribers of this store
      io.to(`store:${data.storeId}`).emit('store:status-updated', {
        storeId: data.storeId,
        isOpen: data.isOpen,
        updatedAt: new Date(),
      });

      logger.info(`Store status updated: ${data.storeId} to ${data.isOpen} by ${socket.user?.email}`);
    });

    // Handle chat messages (admin support)
    socket.on('chat:message', (data: { message: string; recipientId?: string }) => {
      if (socket.user?.role === 'admin' || socket.user?.role === 'staff') {
        // Admin sending message
        if (data.recipientId) {
          io.to(`user:${data.recipientId}`).emit('chat:message', {
            message: data.message,
            sender: socket.user?.email,
            timestamp: new Date(),
          });
        } else {
          // Broadcast to all users
          io.emit('chat:message', {
            message: data.message,
            sender: socket.user?.email,
            timestamp: new Date(),
          });
        }
      } else {
        // User sending message to admin
        io.to('admin').emit('chat:message', {
          message: data.message,
          sender: socket.user?.email,
          senderId: socket.user?._id,
          timestamp: new Date(),
        });
      }
    });

    // Handle notifications
    socket.on('notification:subscribe', () => {
      socket.join(`notifications:${socket.user?._id}`);
      socket.emit('notification:subscribed');
    });

    // Send notification to user
    socket.on('notification:send', (data: { userId: string; message: string; type: string }) => {
      if (socket.user?.role !== 'admin' && socket.user?.role !== 'staff') {
        socket.emit('notification:error', { message: 'Unauthorized' });
        return;
      }

      io.to(`notifications:${data.userId}`).emit('notification:received', {
        message: data.message,
        type: data.type,
        timestamp: new Date(),
      });

      logger.info(`Notification sent to user ${data.userId} by ${socket.user?.email}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user?.email} (${socket.id})`);
    });
  });

  return io;
};

// Helper function to emit order updates
export const emitOrderUpdate = (io: SocketIOServer, orderId: string, status: string) => {
  io.to(`order:${orderId}`).emit('order:status-updated', {
    orderId,
    status,
    updatedAt: new Date(),
  });
};

// Helper function to emit store updates
export const emitStoreUpdate = (io: SocketIOServer, storeId: string, isOpen: boolean) => {
  io.to(`store:${storeId}`).emit('store:status-updated', {
    storeId,
    isOpen,
    updatedAt: new Date(),
  });
};

// Helper function to emit notifications
export const emitNotification = (io: SocketIOServer, userId: string, message: string, type: string = 'info') => {
  io.to(`notifications:${userId}`).emit('notification:received', {
    message,
    type,
    timestamp: new Date(),
  });
};

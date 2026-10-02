import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

let io: SocketServer;

export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      try {
        const user = verifyAccessToken(token);
        (socket as Socket & { user?: typeof user }).user = user;
      } catch {
        // Allow unauthenticated for queue watching
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as Socket & { user?: { userId: string; role: string } }).user;
    logger.info(`Socket connected: ${socket.id} user: ${user?.userId || 'anonymous'}`);

    // Join personal room
    if (user) {
      socket.join(`user:${user.userId}`);
      socket.join(`role:${user.role}`);
    }

    // Queue room subscription
    socket.on('subscribe:queue', (doctorId: string) => {
      socket.join(`queue:${doctorId}`);
      logger.debug(`Socket ${socket.id} subscribed to queue:${doctorId}`);
    });

    socket.on('unsubscribe:queue', (doctorId: string) => {
      socket.leave(`queue:${doctorId}`);
    });

    // Doctor room subscription
    socket.on('subscribe:doctor', (doctorId: string) => {
      socket.join(`doctor:${doctorId}`);
    });

    socket.on('unsubscribe:doctor', (doctorId: string) => {
      socket.leave(`doctor:${doctorId}`);
    });

    // Support room
    socket.on('subscribe:support', (ticketId: string) => {
      socket.join(`support:${ticketId}`);
    });

    socket.on('unsubscribe:support', (ticketId: string) => {
      socket.leave(`support:${ticketId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

// ============================================================
// Emit helpers
// ============================================================

export const emitQueueUpdate = (doctorId: string, data: unknown): void => {
  getIO().to(`queue:${doctorId}`).emit('queue:updated', data);
};

export const emitDoctorStatusChange = (doctorId: string, data: unknown): void => {
  getIO().to(`doctor:${doctorId}`).emit('doctor:status_changed', data);
  // Also broadcast to all for discovery
  getIO().emit('doctor:status_changed', data);
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  getIO().to(`user:${userId}`).emit(event, data);
};

export const emitNotification = (userId: string, notification: unknown): void => {
  getIO().to(`user:${userId}`).emit('notification:new', notification);
};

export const emitSupportMessage = (ticketId: string, message: unknown): void => {
  getIO().to(`support:${ticketId}`).emit('support:message', message);
};

export const emitAppointmentUpdate = (patientUserId: string, appointment: unknown): void => {
  getIO().to(`user:${patientUserId}`).emit('appointment:updated', appointment);
};

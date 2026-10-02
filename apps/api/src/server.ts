import 'dotenv/config';
import http from 'http';
import app from './app';
import { initSocket } from './socket/socket';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error('Force shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    server.listen(PORT, () => {
      logger.info(`🏥 CareSync API running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`❤️  Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

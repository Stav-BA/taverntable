import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { createSocketServer } from './socket';
import sessionsRouter from './api/routes/sessions';
import charactersRouter from './api/routes/characters';
import aiDmRouter from './api/routes/aiDm';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';
import { prisma } from './db/client';
import { redis } from './redis/client';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

async function bootstrap(): Promise<void> {
  // Verify DB connection
  await prisma.$connect();
  console.log('[Prisma] Connected to database');

  // Verify Redis (already connects on import, just ping)
  await redis.ping();
  console.log('[Redis] Ping OK');

  const app = express();

  // Middleware
  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/characters', charactersRouter);
  app.use('/api/ai', aiDmRouter);

  // 404 + error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  const httpServer = http.createServer(app);

  // Socket.io
  const io = createSocketServer(httpServer);
  console.log('[Socket.io] Server attached');

  httpServer.listen(PORT, () => {
    console.log(`[Server] Listening on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
    io.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

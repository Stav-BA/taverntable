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

// Track connection state for informational health reporting
let dbReady = false;
let redisReady = false;

async function bootstrap(): Promise<void> {
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

  // Health check — responds immediately so Render never times out waiting for DB/Redis
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbReady ? 'connected' : 'connecting',
      redis: redisReady ? 'connected' : 'connecting',
    });
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

  // Bind to port FIRST — health check must respond before DB/Redis are ready
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
      resolve();
    });
  });

  // Connect to DB and Redis in the background — non-blocking
  prisma.$connect()
    .then(() => { dbReady = true; console.log('[Prisma] Connected to database'); })
    .catch((err) => console.error('[Prisma] DB connection error:', err.message));

  redis.ping()
    .then(() => { redisReady = true; console.log('[Redis] Ping OK'); })
    .catch((err) => console.error('[Redis] Ping error:', err.message));

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

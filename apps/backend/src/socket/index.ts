import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { registerSessionHandlers } from './handlers/session';
import { registerGameHandlers } from './handlers/game';
import { registerDiceHandlers } from './handlers/dice';
import { registerChatHandlers } from './handlers/chat';
import { registerAIDMHandlers } from './handlers/aiDm';

export function createSocketServer(httpServer: HttpServer): Server {
  const corsOrigin = process.env.CORS_ORIGIN
    ? [process.env.CORS_ORIGIN, 'http://localhost:5173']
    : 'http://localhost:5173';

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    registerSessionHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerDiceHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerAIDMHandlers(io, socket);

    socket.on('error', (err) => {
      console.error(`[Socket] Error on ${socket.id}:`, err);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} — reason: ${reason}`);
    });
  });

  return io;
}

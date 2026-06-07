import { Server, Socket } from 'socket.io';
import { appendChat } from '../../redis/sessionState';
import { randomUUID } from 'crypto';

interface SocketWithMeta extends Socket {
  _sessionId?: string;
  _playerId?: string;
  _playerName?: string;
}

export function registerChatHandlers(io: Server, socket: Socket): void {
  const s = socket as SocketWithMeta;

  socket.on('chat:message', async (payload: { text: string }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) {
        socket.emit('error', { code: 'NOT_IN_SESSION', message: 'Join a session first' });
        return;
      }

      const { text } = payload;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'text is required' });
        return;
      }

      if (text.length > 1000) {
        socket.emit('error', { code: 'MESSAGE_TOO_LONG', message: 'Message must be 1000 chars or less' });
        return;
      }

      const entry = {
        id: randomUUID(),
        playerId: s._playerId ?? socket.id,
        playerName: s._playerName ?? 'Unknown',
        text: text.trim(),
        timestamp: Date.now(),
      };

      await appendChat(sessionId, entry);

      // Broadcast to everyone in the room including sender
      io.to(sessionId).emit('chat:message', entry);
    } catch (err) {
      console.error('[chat:message]', err);
      socket.emit('error', { code: 'CHAT_FAILED', message: (err as Error).message });
    }
  });
}

import { Server, Socket } from 'socket.io';
import { updateToken, revealFog, advanceTurn } from '../../redis/sessionState';

interface SocketWithMeta extends Socket {
  _sessionId?: string;
  _playerId?: string;
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  const s = socket as SocketWithMeta;

  socket.on('token:move', async (payload: { tokenId: string; x: number; y: number }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) {
        socket.emit('error', { code: 'NOT_IN_SESSION', message: 'Join a session first' });
        return;
      }

      const { tokenId, x, y } = payload;
      if (!tokenId || typeof x !== 'number' || typeof y !== 'number') {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'tokenId, x, y are required' });
        return;
      }

      const state = await updateToken(sessionId, tokenId, x, y);
      if (!state) {
        socket.emit('error', { code: 'STATE_NOT_FOUND', message: 'Game state not found' });
        return;
      }

      // Broadcast to everyone in room (including sender)
      io.to(sessionId).emit('token:moved', { tokenId, x, y, movedBy: s._playerId });
    } catch (err) {
      console.error('[token:move]', err);
      socket.emit('error', { code: 'TOKEN_MOVE_FAILED', message: (err as Error).message });
    }
  });

  socket.on('fog:reveal', async (payload: { polygonPoints: number[][] }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) {
        socket.emit('error', { code: 'NOT_IN_SESSION', message: 'Join a session first' });
        return;
      }

      const { polygonPoints } = payload;
      if (!Array.isArray(polygonPoints)) {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'polygonPoints must be an array' });
        return;
      }

      const state = await revealFog(sessionId, polygonPoints);
      if (!state) {
        socket.emit('error', { code: 'STATE_NOT_FOUND', message: 'Game state not found' });
        return;
      }

      // Broadcast fog update to all in room
      io.to(sessionId).emit('fog:updated', { fog: state.fog, revealedBy: s._playerId });
    } catch (err) {
      console.error('[fog:reveal]', err);
      socket.emit('error', { code: 'FOG_REVEAL_FAILED', message: (err as Error).message });
    }
  });

  socket.on('turn:next', async () => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) {
        socket.emit('error', { code: 'NOT_IN_SESSION', message: 'Join a session first' });
        return;
      }

      const state = await advanceTurn(sessionId);
      if (!state) {
        socket.emit('error', { code: 'STATE_NOT_FOUND', message: 'Game state not found' });
        return;
      }

      const currentEntry = state.initiative[state.currentTurn];
      const currentTurnPlayerId = currentEntry?.playerId ?? null;

      io.to(sessionId).emit('turn:changed', {
        currentTurnPlayerId,
        currentTurn: state.currentTurn,
        initiative: state.initiative,
      });
    } catch (err) {
      console.error('[turn:next]', err);
      socket.emit('error', { code: 'TURN_NEXT_FAILED', message: (err as Error).message });
    }
  });
}

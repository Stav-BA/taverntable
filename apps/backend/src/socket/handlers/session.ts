import { Server, Socket } from 'socket.io';
import { prisma } from '../../db/client';
import { initGameState, getGameState, deleteGameState } from '../../redis/sessionState';

// Ambiguous chars excluded: 0, O, 1, I, L
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function generateUniqueCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateCode();
    const existing = await prisma.session.findUnique({ where: { code } });
    if (!existing) return code;
    attempts++;
  }
  throw new Error('Failed to generate unique session code after 10 attempts');
}

export function registerSessionHandlers(io: Server, socket: Socket): void {
  // Map socket.id → { sessionId, playerId }
  const socketMeta = (socket as Socket & { _sessionId?: string; _playerId?: string });

  socket.on('session:create', async (payload: { name: string; dmName: string }, ack) => {
    try {
      const { name, dmName } = payload;
      if (!name || !dmName) {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'name and dmName are required' });
        return;
      }

      const code = await generateUniqueCode();

      const session = await prisma.session.create({
        data: {
          code,
          name,
          dmUserId: socket.id, // use socket.id as provisional DM id
          players: {
            create: {
              name: dmName,
              colour: '#f59e0b',
              isConnected: true,
            },
          },
        },
        include: { players: true },
      });

      const player = session.players[0];

      // Init Redis game state
      await initGameState(session.id);

      // Join socket room
      await socket.join(session.id);
      socketMeta._sessionId = session.id;
      socketMeta._playerId = player.id;

      const result = { sessionId: session.id, code: session.code, playerId: player.id };

      if (typeof ack === 'function') {
        ack(result);
      } else {
        socket.emit('session:created', result);
      }
    } catch (err) {
      console.error('[session:create]', err);
      socket.emit('error', { code: 'CREATE_FAILED', message: (err as Error).message });
    }
  });

  socket.on('session:join', async (payload: {
    code?: string;
    sessionId?: string;   // frontend sends 'session-CODE'
    playerId?: string;    // frontend-generated client ID
    playerName?: string;
    isDM?: boolean;
    colour?: string;
  }, ack) => {
    try {
      // Accept { code } OR { sessionId: 'session-CODE' } from frontend
      let code = payload.code;
      if (!code && payload.sessionId) {
        code = payload.sessionId.replace(/^session-/i, '');
      }
      const playerName = payload.playerName;

      if (!code || !playerName) {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'Session code and player name are required' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!session) {
        socket.emit('error', { code: 'SESSION_NOT_FOUND', message: `No session with code ${code}` });
        return;
      }

      // Use client-provided playerId if given, else create one
      const playerId = payload.playerId || socket.id;

      const gameState = await getGameState(session.id);

      await socket.join(session.id);
      socketMeta._sessionId = session.id;
      socketMeta._playerId = playerId;

      // Notify others of the joining player
      socket.to(session.id).emit('player:joined', {
        playerId,
        name: playerName,
        colour: payload.colour ?? '#4169E1',
      });

      // Build game:state response matching frontend useSocket.ts expectations
      const fogRevealed = (gameState?.fog?.revealed ?? []) as Array<{
        id?: string; type: string; cx?: number; cy?: number; radius?: number;
        x?: number; y?: number; width?: number; height?: number;
      }>;

      const responseState = {
        tokens: gameState?.tokens ?? [],
        fogRevealed,
        fogEnabled: true,
        initiative: [],
        currentTurnIndex: gameState?.currentTurn ?? 0,
        inCombat: false,
        currentMap: null,
      };

      if (typeof ack === 'function') {
        ack({ sessionId: session.id, playerId, ...responseState });
      } else {
        socket.emit('game:state', responseState);
      }
    } catch (err) {
      console.error('[session:join]', err);
      socket.emit('error', { code: 'JOIN_FAILED', message: (err as Error).message });
    }
  });

  socket.on('session:leave', async (_payload, ack) => {
    try {
      const sessionId = socketMeta._sessionId;
      const playerId = socketMeta._playerId;

      if (!sessionId || !playerId) return;

      await prisma.player.update({
        where: { id: playerId },
        data: { isConnected: false },
      });

      socket.to(sessionId).emit('player:left', { playerId });
      await socket.leave(sessionId);

      socketMeta._sessionId = undefined;
      socketMeta._playerId = undefined;

      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      console.error('[session:leave]', err);
      socket.emit('error', { code: 'LEAVE_FAILED', message: (err as Error).message });
    }
  });

  socket.on('disconnect', async () => {
    try {
      const sessionId = socketMeta._sessionId;
      const playerId = socketMeta._playerId;

      if (!sessionId || !playerId) return;

      await prisma.player.update({
        where: { id: playerId },
        data: { isConnected: false },
      });

      io.to(sessionId).emit('player:left', { playerId });
    } catch (err) {
      console.error('[disconnect cleanup]', err);
    }
  });
}

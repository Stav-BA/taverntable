import { Server, Socket } from 'socket.io';
import { prisma } from '../../db/client';
import { initGameState, getOrInitGameState } from '../../redis/sessionState';

// In-memory map of sessionId → connected players (for rooms not persisted to DB)
const roomPlayers = new Map<string, Map<string, { id: string; name: string; colour: string; ready?: boolean }>>();

function getRoomPlayers(sessionId: string): Map<string, { id: string; name: string; colour: string; ready?: boolean }> {
  if (!roomPlayers.has(sessionId)) {
    roomPlayers.set(sessionId, new Map());
  }
  return roomPlayers.get(sessionId)!;
}

function roomPlayersList(sessionId: string): Array<{ id: string; name: string; colour: string; ready?: boolean }> {
  return Array.from(getRoomPlayers(sessionId).values());
}

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

      // Register DM in in-memory room player registry
      getRoomPlayers(session.id).set(player.id, { id: player.id, name: dmName, colour: '#f59e0b' });

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
    sessionId?: string;   // 'session-CODE' format from DMLobbyPage / JoinPage
    playerId?: string;    // frontend-generated client ID
    playerName?: string;
    isDM?: boolean;
    colour?: string;
  }, ack) => {
    try {
      const playerName = payload.playerName;
      if (!playerName) {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'Player name is required' });
        return;
      }

      // Use the sessionId directly as the Socket.io room key — no DB lookup required.
      // Both DM (DMLobbyPage) and players (JoinPage) set sessionId = 'session-CODE',
      // so they naturally land in the same room without Prisma.
      const roomId = payload.sessionId ?? (payload.code ? `session-${payload.code.toUpperCase()}` : null);

      if (!roomId) {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'sessionId or code is required' });
        return;
      }

      // Use client-provided playerId if given, else fall back to socket.id
      const playerId = payload.playerId || socket.id;

      console.log(`[session:join] player="${playerName}" isDM=${payload.isDM} room="${roomId}" socketId=${socket.id}`);

      // Get-or-init Redis game state for this room
      const gameState = await getOrInitGameState(roomId);

      await socket.join(roomId);
      socketMeta._sessionId = roomId;
      socketMeta._playerId = playerId;

      // Track this player in the in-memory room registry
      const playerEntry = { id: playerId, name: playerName, colour: payload.colour ?? '#4169E1' };
      getRoomPlayers(roomId).set(playerId, playerEntry);

      // Notify ALL others in the room that a new player joined
      socket.to(roomId).emit('player:joined', playerEntry);

      // Broadcast updated players list to ALL in the room (so DM Players tab refreshes)
      const playersList = roomPlayersList(roomId);
      console.log(`[session:join] broadcasting players:list to room "${roomId}":`, playersList.map(p => p.name));
      io.to(roomId).emit('players:list', playersList);

      // Build game:state response
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
        mapId: gameState?.mapId ?? null,
        currentMap: null,
        connectedPlayers: roomPlayersList(roomId),
      };

      if (typeof ack === 'function') {
        ack({ sessionId: roomId, playerId, ...responseState });
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

      // Look up display name before removing from registry
      const playerName = getRoomPlayers(sessionId).get(playerId)?.name ?? playerId;

      // Remove from in-memory room registry
      getRoomPlayers(sessionId).delete(playerId);

      // Best-effort DB update — player row may not exist for client-generated IDs
      try {
        await prisma.player.update({ where: { id: playerId }, data: { isConnected: false } });
      } catch {
        // Non-DB player (client-generated ID) — safe to ignore
      }

      socket.to(sessionId).emit('player:left', { playerId, playerName });
      io.to(sessionId).emit('players:list', roomPlayersList(sessionId));
      await socket.leave(sessionId);

      socketMeta._sessionId = undefined;
      socketMeta._playerId = undefined;

      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      console.error('[session:leave]', err);
      socket.emit('error', { code: 'LEAVE_FAILED', message: (err as Error).message });
    }
  });

  // ── Player: ready ───────────────────────────────────────────────────────────
  socket.on('player:ready', (payload: { playerId: string; ready: boolean }) => {
    try {
      const sessionId = socketMeta._sessionId;
      if (!sessionId) return;
      const { playerId, ready } = payload;
      const players = getRoomPlayers(sessionId);
      const existing = players.get(playerId);
      if (existing) {
        players.set(playerId, { ...existing, ready });
      }
      // Broadcast updated players list to all in room
      io.to(sessionId).emit('players:list', roomPlayersList(sessionId));
    } catch (err) {
      console.error('[player:ready]', err);
    }
  });

  // ── Adventure: start ────────────────────────────────────────────────────────
  socket.on('adventure:start', (payload: { campaignName: string; lore: string }) => {
    try {
      const sessionId = socketMeta._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('adventure:started', {
        campaignName: payload.campaignName ?? '',
        lore: payload.lore ?? '',
      });
    } catch (err) {
      console.error('[adventure:start]', err);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const sessionId = socketMeta._sessionId;
      const playerId = socketMeta._playerId;

      if (!sessionId || !playerId) return;

      // Look up display name before removing from registry
      const playerName = getRoomPlayers(sessionId).get(playerId)?.name ?? playerId;

      // Remove from in-memory room registry
      getRoomPlayers(sessionId).delete(playerId);

      // Best-effort DB update — player row may not exist for client-generated IDs
      try {
        await prisma.player.update({ where: { id: playerId }, data: { isConnected: false } });
      } catch {
        // Non-DB player (client-generated ID) — safe to ignore
      }

      io.to(sessionId).emit('player:left', { playerId, playerName });
      io.to(sessionId).emit('players:list', roomPlayersList(sessionId));
    } catch (err) {
      console.error('[disconnect cleanup]', err);
    }
  });
}

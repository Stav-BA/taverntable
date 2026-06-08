import { Server, Socket } from 'socket.io';
import { updateToken, addToken, revealFog, setGameMap, setInitiative, advanceTurn } from '../../redis/sessionState';
import type { Token, RevealedArea } from '../../redis/sessionState';

interface SocketWithMeta extends Socket {
  _sessionId?: string;
  _playerId?: string;
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  const s = socket as SocketWithMeta;

  // ── Token: move ─────────────────────────────────────────────────────────────
  socket.on('token:move', async (payload: { tokenId: string; x: number; y: number }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;

      const { tokenId, x, y } = payload;
      if (!tokenId || typeof x !== 'number' || typeof y !== 'number') return;

      await updateToken(sessionId, tokenId, x, y);
      io.to(sessionId).emit('token:moved', { tokenId, x, y, movedBy: s._playerId });
    } catch (err) {
      console.error('[token:move]', err);
    }
  });

  // ── Token: add ──────────────────────────────────────────────────────────────
  socket.on('token:add', async (payload: Token) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;

      const token: Token = {
        id: payload.id || `tok-${Date.now()}`,
        x: payload.x ?? 2,
        y: payload.y ?? 2,
        name: payload.name || 'Unknown',
        hp: payload.hp ?? 10,
        maxHp: payload.maxHp ?? 10,
        ac: payload.ac ?? 10,
        colour: payload.colour || '#4169E1',
        isNpc: payload.isNpc ?? false,
        isPlayer: payload.isPlayer ?? true,
        playerId: payload.playerId,
        conditions: [],
        isVisible: true,
      };

      await addToken(sessionId, token);
      io.to(sessionId).emit('token:added', token);
    } catch (err) {
      console.error('[token:add]', err);
    }
  });

  // ── Token: update ───────────────────────────────────────────────────────────
  socket.on('token:update', async (payload: { tokenId: string; updates: Partial<Token> }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;

      const { tokenId, updates } = payload;
      await updateToken(sessionId, tokenId, updates.x ?? 0, updates.y ?? 0);
      io.to(sessionId).emit('token:updated', { tokenId, updates });
    } catch (err) {
      console.error('[token:update]', err);
    }
  });

  // ── Token: remove ───────────────────────────────────────────────────────────
  socket.on('token:remove', async (payload: { tokenId: string }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('token:removed', { tokenId: payload.tokenId });
    } catch (err) {
      console.error('[token:remove]', err);
    }
  });

  // ── Fog: reveal ─────────────────────────────────────────────────────────────
  socket.on('fog:reveal', async (payload: { area?: RevealedArea; polygonPoints?: number[][] }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;

      if (payload.area) {
        // New frontend format: { area: RevealedArea }
        await revealFog(sessionId, payload.area);
        io.to(sessionId).emit('fog:revealed', payload.area);
      }
    } catch (err) {
      console.error('[fog:reveal]', err);
    }
  });

  // ── Fog: toggle ─────────────────────────────────────────────────────────────
  socket.on('fog:toggle', async (payload: { enabled: boolean }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('fog:toggled', { enabled: payload.enabled });
    } catch (err) {
      console.error('[fog:toggle]', err);
    }
  });

  // ── Map: change ─────────────────────────────────────────────────────────────
  socket.on('map:change', async (payload: { mapId: string; mapConfig?: unknown }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;

      if (payload.mapId) {
        await setGameMap(sessionId, payload.mapId);
      }

      // Broadcast the full map config if provided, otherwise just the id
      io.to(sessionId).emit('map:changed', payload.mapConfig ?? { id: payload.mapId });
    } catch (err) {
      console.error('[map:change]', err);
    }
  });

  // ── Initiative: set ─────────────────────────────────────────────────────────
  socket.on('initiative:set', async (payload: { combatants: unknown[] }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('initiative:set', payload.combatants);
    } catch (err) {
      console.error('[initiative:set]', err);
    }
  });

  // ── Initiative: next ────────────────────────────────────────────────────────
  socket.on('initiative:next', async () => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('initiative:next');
    } catch (err) {
      console.error('[initiative:next]', err);
    }
  });

  // ── Initiative: update ──────────────────────────────────────────────────────
  socket.on('initiative:update', async (payload: { id: string; updates: Record<string, unknown> }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('initiative:updated', payload);
    } catch (err) {
      console.error('[initiative:update]', err);
    }
  });

  // ── Combat: start ───────────────────────────────────────────────────────────
  socket.on('combat:start', async () => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('combat:started');
    } catch (err) {
      console.error('[combat:start]', err);
    }
  });

  // ── Combat: end ─────────────────────────────────────────────────────────────
  socket.on('combat:end', async () => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('combat:ended');
    } catch (err) {
      console.error('[combat:end]', err);
    }
  });

  // ── Ping ────────────────────────────────────────────────────────────────────
  socket.on('ping', (payload: { x: number; y: number; colour: string }) => {
    const sessionId = s._sessionId;
    if (!sessionId) return;
    socket.to(sessionId).emit('ping', { ...payload, playerId: s._playerId });
  });

  // ── Rest: short ─────────────────────────────────────────────────────────────
  socket.on('rest:short', async () => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('rest:taken', { type: 'short' });
    } catch (err) {
      console.error('[rest:short]', err);
    }
  });

  // ── Rest: long ──────────────────────────────────────────────────────────────
  socket.on('rest:long', async () => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      // Broadcast rest to all clients; exhaustion clearing handled client-side
      io.to(sessionId).emit('rest:taken', { type: 'long' });
    } catch (err) {
      console.error('[rest:long]', err);
    }
  });

  // ── Legacy turn:next ────────────────────────────────────────────────────────
  socket.on('turn:next', async () => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) return;
      io.to(sessionId).emit('initiative:next');
    } catch (err) {
      console.error('[turn:next]', err);
    }
  });
}

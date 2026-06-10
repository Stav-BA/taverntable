import { Server, Socket } from 'socket.io';
import { updateToken, addToken, revealFog, setGameMap, setInitiative, advanceTurn } from '../../redis/sessionState';
import type { Token, RevealedArea } from '../../redis/sessionState';
import { redis } from '../../redis/client';

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

  // ── Monster: spawn ──────────────────────────────────────────────────────────
  socket.on(
    'monster:spawn',
    async (payload: {
      sessionId: string;
      monster: {
        id: string;
        name: string;
        emoji: string;
        imageUrl?: string;
        hp: number;
        maxHp: number;
        ac: number;
        speed: number;
        cr: string;
        colour: string;
        x: number;
        y: number;
        tokenId: string;
      };
    }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;

        const { monster } = payload;

        const token: Token = {
          id: monster.tokenId,
          x: monster.x,
          y: monster.y,
          name: monster.name,
          hp: monster.hp,
          maxHp: monster.maxHp,
          ac: monster.ac,
          colour: monster.colour,
          isNpc: true,
          isPlayer: false,
          conditions: [],
          isVisible: true,
          ...(monster.imageUrl ? { imageUrl: monster.imageUrl } : {}),
        };

        await addToken(sessionId, token);
        io.to(sessionId).emit('token:added', token);
      } catch (err) {
        console.error('[monster:spawn]', err);
      }
    },
  );

  // ── Monster: action ─────────────────────────────────────────────────────────
  socket.on(
    'monster:action',
    async (payload: {
      sessionId: string;
      monsterId: string;
      actionName: string;
      targetId?: string;
      targetName?: string;
      monsterName?: string;
      roll?: number;
    }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;

        const { monsterId, actionName, targetId, targetName, monsterName, roll } = payload;
        const timestamp = Date.now();

        io.to(sessionId).emit('monster:action:resolved', {
          monsterId,
          actionName,
          targetId,
          roll,
          timestamp,
        });

        const displayName = monsterName ?? monsterId;
        const text = targetName
          ? `🎲 ${displayName} attacks ${targetName} with ${actionName}!`
          : `🎲 ${displayName} uses ${actionName}!`;

        io.to(sessionId).emit('chat:message', {
          id: `sys-${timestamp}`,
          type: 'system',
          text,
          timestamp,
        });
      } catch (err) {
        console.error('[monster:action]', err);
      }
    },
  );

  // ── Combat: attack resolved on client, broadcast result ───────────────────
  socket.on(
    'combat:attack',
    async (payload: {
      sessionId: string;
      attackerName: string;
      targetId: string;
      targetName: string;
      actionName: string;
      roll: number;
      attackBonus: number;
      total: number;
      targetAC: number;
      hit: boolean;
      isCrit: boolean;
      isFumble: boolean;
      damageTotal: number;
      damageType: string;
      newTargetHp: number;
      newTargetConditions: string[];
    }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;

        const { attackerName, targetName, actionName, roll, attackBonus, total, targetAC, hit, isCrit, isFumble, damageTotal, damageType, newTargetHp, newTargetConditions, targetId } = payload;

        // Apply HP update to Redis game state
        const state = await import('../../redis/sessionState').then((m) => m.getGameState(sessionId));
        if (state) {
          const token = state.tokens.find((t) => t.id === targetId);
          if (token) {
            token.hp = newTargetHp;
            await import('../../redis/sessionState').then((m) => m.setGameState(state));
          }
        }

        // Broadcast the initiative update so all clients sync HP
        io.to(sessionId).emit('initiative:updated', {
          id: targetId,
          updates: { hp: newTargetHp, conditions: newTargetConditions },
        });

        // Build and broadcast chat message
        const hitLabel = isCrit ? '⚡ CRITICAL HIT' : isFumble ? '💥 FUMBLE (Natural 1)' : hit ? '✓ HIT' : '✗ MISS';
        const rollDisplay = isCrit || isFumble ? `Natural ${roll}!` : `d20: ${roll}+${attackBonus}=${total} vs AC ${targetAC}`;
        const damageText = hit ? ` for **${damageTotal}** ${damageType} damage` : '';
        const critText = isCrit ? ' *(double damage dice)*' : '';
        const fallText = newTargetHp <= 0 && hit ? ` ☠️ ${targetName} falls!` : '';
        const text = `⚔️ ${attackerName} attacks ${targetName} with ${actionName} (${rollDisplay}) → **${hitLabel}**${damageText}${critText}${fallText}`;

        io.to(sessionId).emit('chat:message', {
          id: `combat-${Date.now()}`,
          type: 'system',
          text,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[combat:attack]', err);
      }
    },
  );

  // ── Combat: non-attack action broadcast ───────────────────────────────────
  socket.on(
    'combat:action',
    async (payload: { sessionId: string; actorName: string; actionName: string; description: string }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;
        const { actorName, actionName, description } = payload;
        const text = `🎭 ${actorName} uses **${actionName}** — ${description}`;
        io.to(sessionId).emit('chat:message', {
          id: `action-${Date.now()}`,
          type: 'system',
          text,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[combat:action]', err);
      }
    },
  );

  // ── Combat: fumble consequence announced by DM ─────────────────────────────
  socket.on(
    'combat:fumble',
    async (payload: { sessionId: string; attackerName: string; consequence: string }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;
        const { attackerName, consequence } = payload;
        const text = `💥 **FUMBLE!** ${attackerName} rolled a Natural 1 — DM ruling: *${consequence}*`;
        io.to(sessionId).emit('chat:message', {
          id: `fumble-${Date.now()}`,
          type: 'system',
          text,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[combat:fumble]', err);
      }
    },
  );

  // ── Initiative: DM requests all players to roll ───────────────────────────
  socket.on('initiative:request', async (payload: { sessionId: string }) => {
    try {
      const sessionId = payload.sessionId ?? s._sessionId;
      if (!sessionId) return;
      // Broadcast to everyone in the room (players need to see the roll prompt)
      io.to(sessionId).emit('initiative:requested');
    } catch (err) {
      console.error('[initiative:request]', err);
    }
  });

  // ── Initiative: player submits their own roll → forward to DM ─────────────
  socket.on(
    'initiative:roll:submit',
    async (payload: { sessionId: string; playerId: string; roll: number }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;
        const { playerId, roll } = payload;
        // Broadcast back to room — DM's modal listens for this
        io.to(sessionId).emit('initiative:roll:received', { playerId, roll });
      } catch (err) {
        console.error('[initiative:roll:submit]', err);
      }
    },
  );

  // ── XP award (DM → broadcast to all players) ──────────────────────────────
  socket.on(
    'xp:award',
    async (payload: { sessionId: string; playerId: string; amount: number }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;
        const { playerId, amount } = payload;
        io.to(sessionId).emit('xp:awarded', { playerId, amount });
        io.to(sessionId).emit('chat:message', {
          id: `xp-${Date.now()}`,
          type: 'system',
          text: `⭐ ${amount} XP awarded!`,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[xp:award]', err);
      }
    },
  );

  // ── Character sync (player → broadcast their sheet snapshot) ──────────────
  socket.on(
    'character:sync',
    async (payload: { sessionId: string; playerId: string; updates: Record<string, unknown> }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;
        // Broadcast to others in room (not back to sender)
        socket.to(sessionId).emit('character:updated', {
          playerId: payload.playerId,
          updates: payload.updates,
        });
      } catch (err) {
        console.error('[character:sync]', err);
      }
    },
  );

  // ── Random encounter: toggle ────────────────────────────────────────────────
  socket.on(
    'random:encounter:toggle',
    async (payload: { sessionId: string; enabled: boolean; biome: string; partyLevel: number }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;

        const { enabled, biome, partyLevel } = payload;

        await redis.hset(`session:${sessionId}:encounter`, {
          enabled: String(enabled),
          biome,
          partyLevel: String(partyLevel),
        });

        io.to(sessionId).emit('random:encounter:updated', { sessionId, enabled, biome, partyLevel });
      } catch (err) {
        console.error('[random:encounter:toggle]', err);
      }
    },
  );

  // ── Random encounter: trigger ───────────────────────────────────────────────
  socket.on(
    'random:encounter:trigger',
    async (payload: { sessionId: string; x: number; y: number }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;

        const { x, y } = payload;

        const settings = await redis.hgetall(`session:${sessionId}:encounter`);
        if (settings && settings.enabled === 'true') {
          socket.emit('random:encounter:spawn', {
            x,
            y,
            biome: settings.biome ?? 'forest',
            partyLevel: Number(settings.partyLevel ?? 1),
          });
        }
      } catch (err) {
        console.error('[random:encounter:trigger]', err);
      }
    },
  );

  // ── Shop: DM opens a shop → broadcast to all players ─────────────────────
  socket.on('shop:open', async (payload: { sessionId: string; shopId: string }) => {
    try {
      const sessionId = payload.sessionId ?? s._sessionId;
      if (!sessionId) return;
      const { shopId } = payload;
      // Store active shop in Redis
      await redis.hset(`session:${sessionId}:shop`, { shopId, openedAt: String(Date.now()) });
      io.to(sessionId).emit('shop:opened', { shopId });
      io.to(sessionId).emit('chat:message', {
        id: `shop-${Date.now()}`,
        type: 'system',
        text: `🏪 The DM has opened a shop! Browse it in the Shop tab.`,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[shop:open]', err);
    }
  });

  // ── Shop: DM closes the shop ──────────────────────────────────────────────
  socket.on('shop:close', async (payload: { sessionId: string }) => {
    try {
      const sessionId = payload.sessionId ?? s._sessionId;
      if (!sessionId) return;
      await redis.del(`session:${sessionId}:shop`);
      io.to(sessionId).emit('shop:closed');
      io.to(sessionId).emit('chat:message', {
        id: `shop-closed-${Date.now()}`,
        type: 'system',
        text: `🏪 The shop has closed.`,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[shop:close]', err);
    }
  });

  // ── Shop: player purchases an item → broadcast to chat ───────────────────
  socket.on(
    'shop:purchase',
    async (payload: { sessionId: string; playerId: string; playerName: string; itemName: string; costGp: number }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;
        const { playerName, itemName, costGp } = payload;
        io.to(sessionId).emit('shop:purchase', { playerName, itemName, costGp });
        io.to(sessionId).emit('chat:message', {
          id: `purchase-${Date.now()}`,
          type: 'system',
          text: `💰 ${playerName} bought ${itemName} for ${costGp} gp`,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[shop:purchase]', err);
      }
    },
  );

  // ── Loot: DM drops loot → all players see the popup ──────────────────────
  socket.on(
    'loot:drop',
    async (payload: {
      sessionId: string;
      lootId: string;
      items: Array<{ name: string; type: string; quantity: number; costGp?: number }>;
      gold: number;
      label?: string;
    }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;
        const { lootId, items, gold, label } = payload;
        io.to(sessionId).emit('loot:dropped', { lootId, items, gold, label: label ?? 'Loot' });
        io.to(sessionId).emit('chat:message', {
          id: `loot-${Date.now()}`,
          type: 'system',
          text: `💎 ${label ?? 'Loot'} is available! Check the Loot popup.`,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[loot:drop]', err);
      }
    },
  );

  // ── Loot: player takes an item ────────────────────────────────────────────
  socket.on(
    'loot:take',
    async (payload: { sessionId: string; lootId: string; playerId: string; playerName: string; itemName: string }) => {
      try {
        const sessionId = payload.sessionId ?? s._sessionId;
        if (!sessionId) return;
        const { lootId, playerId, playerName, itemName } = payload;
        // Mark as taken in Redis
        await redis.sadd(`session:${sessionId}:loot:${lootId}:taken`, `${playerId}:${itemName}`);
        io.to(sessionId).emit('loot:taken', { lootId, playerId, playerName, itemName });
        io.to(sessionId).emit('chat:message', {
          id: `loot-take-${Date.now()}`,
          type: 'system',
          text: `💎 ${playerName} took ${itemName}`,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[loot:take]', err);
      }
    },
  );
}

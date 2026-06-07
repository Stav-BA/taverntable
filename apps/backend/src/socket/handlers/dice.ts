import { Server, Socket } from 'socket.io';
import { appendChat } from '../../redis/sessionState';
import { randomUUID } from 'crypto';

interface SocketWithMeta extends Socket {
  _sessionId?: string;
  _playerId?: string;
  _playerName?: string;
}

interface DieResult {
  die: number;
  roll: number;
}

interface RollBreakdown {
  notation: string;
  dice: DieResult[];
  modifier: number;
  total: number;
}

/**
 * Parse dice notation like "2d6+3", "1d20", "4d4-1"
 */
function parseNotation(notation: string): { count: number; sides: number; modifier: number } | null {
  const match = notation.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
}

function rollDice(count: number, sides: number, modifier: number): RollBreakdown & { notation: string } {
  const dice: DieResult[] = [];
  for (let i = 0; i < count; i++) {
    dice.push({
      die: sides,
      roll: Math.floor(Math.random() * sides) + 1,
    });
  }
  const diceSum = dice.reduce((acc, d) => acc + d.roll, 0);
  const total = diceSum + modifier;
  const notation = `${count}d${sides}${modifier > 0 ? '+' + modifier : modifier < 0 ? modifier : ''}`;
  return { notation, dice, modifier, total };
}

export function registerDiceHandlers(io: Server, socket: Socket): void {
  const s = socket as SocketWithMeta;

  socket.on('dice:roll', async (payload: { notation: string; secret?: boolean }) => {
    try {
      const sessionId = s._sessionId;
      if (!sessionId) {
        socket.emit('error', { code: 'NOT_IN_SESSION', message: 'Join a session first' });
        return;
      }

      const { notation, secret = false } = payload;
      if (!notation) {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'notation is required' });
        return;
      }

      const parsed = parseNotation(notation);
      if (!parsed) {
        socket.emit('error', { code: 'INVALID_NOTATION', message: `Cannot parse dice notation: ${notation}` });
        return;
      }

      if (parsed.count < 1 || parsed.count > 100) {
        socket.emit('error', { code: 'INVALID_NOTATION', message: 'Dice count must be 1–100' });
        return;
      }
      if (![4, 6, 8, 10, 12, 20, 100].includes(parsed.sides)) {
        socket.emit('error', { code: 'INVALID_NOTATION', message: 'Supported dice: d4, d6, d8, d10, d12, d20, d100' });
        return;
      }

      const result = rollDice(parsed.count, parsed.sides, parsed.modifier);
      const playerName = s._playerName ?? 'Unknown';
      const playerId = s._playerId ?? socket.id;

      const rollEvent = {
        id: randomUUID(),
        playerId,
        playerName,
        notation: result.notation,
        breakdown: result.dice,
        modifier: result.modifier,
        total: result.total,
        secret,
        timestamp: Date.now(),
      };

      // Log in chat
      await appendChat(sessionId, {
        id: rollEvent.id,
        playerId,
        playerName,
        text: `rolled ${result.notation} → **${result.total}**`,
        timestamp: rollEvent.timestamp,
        isSecret: secret,
      });

      if (secret) {
        // Only emit back to the roller
        socket.emit('dice:result', rollEvent);
        // Notify others that a secret roll happened (without the value)
        socket.to(sessionId).emit('dice:secret', { playerId, playerName, notation: result.notation });
      } else {
        io.to(sessionId).emit('dice:result', rollEvent);
      }
    } catch (err) {
      console.error('[dice:roll]', err);
      socket.emit('error', { code: 'DICE_ROLL_FAILED', message: (err as Error).message });
    }
  });
}

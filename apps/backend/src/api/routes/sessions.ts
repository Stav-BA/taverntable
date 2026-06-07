import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';
import { getGameState } from '../../redis/sessionState';

const router = Router();

// POST /sessions — create a new session (REST fallback, main flow uses Socket.io)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, dmName } = req.body as { name?: string; dmName?: string };
    if (!name || !dmName) {
      res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'name and dmName are required' } });
      return;
    }

    // Generate unique code
    const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    let attempts = 0;
    while (attempts < 10) {
      let candidate = '';
      for (let i = 0; i < 6; i++) {
        candidate += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      }
      const existing = await prisma.session.findUnique({ where: { code: candidate } });
      if (!existing) {
        code = candidate;
        break;
      }
      attempts++;
    }
    if (!code) {
      res.status(500).json({ error: { code: 'CODE_GENERATION_FAILED', message: 'Could not generate unique code' } });
      return;
    }

    const session = await prisma.session.create({
      data: {
        code,
        name,
        dmUserId: 'rest-api',
        players: {
          create: {
            name: dmName,
            colour: '#f59e0b',
            isConnected: false,
          },
        },
      },
      include: { players: true },
    });

    res.status(201).json({
      sessionId: session.id,
      code: session.code,
      name: session.name,
      dmPlayerId: session.players[0]?.id,
    });
  } catch (err) {
    next(err);
  }
});

// GET /sessions/:code — look up session by code
router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const session = await prisma.session.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        players: {
          select: {
            id: true,
            name: true,
            colour: true,
            isConnected: true,
            characterId: true,
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: `No session with code ${code}` } });
      return;
    }

    const gameState = await getGameState(session.id);

    res.json({ session, gameState });
  } catch (err) {
    next(err);
  }
});

export default router;

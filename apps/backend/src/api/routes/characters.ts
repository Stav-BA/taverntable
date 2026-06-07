import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

const router = Router();

// GET /characters — list all characters (could be paginated in future)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const characters = await prisma.character.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        species: true,
        class: true,
        subclass: true,
        level: true,
        xp: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ characters });
  } catch (err) {
    next(err);
  }
});

// GET /characters/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      res.status(404).json({ error: { code: 'CHARACTER_NOT_FOUND', message: `No character with id ${id}` } });
      return;
    }
    res.json({ character });
  } catch (err) {
    next(err);
  }
});

// POST /characters
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, species, cls, subclass, level, xp, data } = req.body as {
      name?: string;
      species?: string;
      cls?: string;
      subclass?: string;
      level?: number;
      xp?: number;
      data?: Record<string, unknown>;
    };

    if (!name || !species || !cls) {
      res.status(400).json({
        error: { code: 'INVALID_PAYLOAD', message: 'name, species, and cls are required' },
      });
      return;
    }

    const character = await prisma.character.create({
      data: {
        name,
        species,
        class: cls,
        subclass: subclass ?? null,
        level: level ?? 1,
        xp: xp ?? 0,
        data: data ?? {},
      },
    });

    res.status(201).json({ character });
  } catch (err) {
    next(err);
  }
});

// PATCH /characters/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, species, cls, subclass, level, xp, data } = req.body as {
      name?: string;
      species?: string;
      cls?: string;
      subclass?: string;
      level?: number;
      xp?: number;
      data?: Record<string, unknown>;
    };

    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: { code: 'CHARACTER_NOT_FOUND', message: `No character with id ${id}` } });
      return;
    }

    const character = await prisma.character.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(species !== undefined && { species }),
        ...(cls !== undefined && { class: cls }),
        ...(subclass !== undefined && { subclass }),
        ...(level !== undefined && { level }),
        ...(xp !== undefined && { xp }),
        ...(data !== undefined && { data }),
      },
    });

    res.json({ character });
  } catch (err) {
    next(err);
  }
});

// DELETE /characters/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: { code: 'CHARACTER_NOT_FOUND', message: `No character with id ${id}` } });
      return;
    }

    await prisma.character.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

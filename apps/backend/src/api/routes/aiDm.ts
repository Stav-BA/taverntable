/**
 * aiDm.ts (routes)
 * REST API endpoints for AI DM session management.
 * These are complementary to the Socket.io events — used for async
 * operations, DM tooling, and data that doesn't need real-time delivery.
 *
 * All routes are mounted at /api/ai
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DMService } from '../../ai/dmService';
import { MemoryManager } from '../../ai/memoryManager';
import { generateNPC, generateLocation, generateHook } from '../../ai/generators';
import type { CampaignContext } from '../../ai/dmPrompt';
import type { Quest, WorldState } from '../../ai/memoryManager';
import { randomUUID } from 'crypto';

const router = Router();

// ---------------------------------------------------------------------------
// Lazy singletons
// ---------------------------------------------------------------------------

let _dmService: DMService | null = null;
let _memoryManager: MemoryManager | null = null;

function getDMService(): DMService {
  if (!_dmService) _dmService = new DMService();
  return _dmService;
}

function getMemoryManager(): MemoryManager {
  if (!_memoryManager) _memoryManager = new MemoryManager();
  return _memoryManager;
}

// ---------------------------------------------------------------------------
// POST /api/ai/session/:id/tone
// Set the campaign tone for a session
// ---------------------------------------------------------------------------

router.post(
  '/session/:id/tone',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { tone } = req.body as { tone?: CampaignContext['tone'] };

      const validTones: CampaignContext['tone'][] = ['heroic', 'gritty', 'comedic', 'horror', 'mystery'];
      if (!tone || !validTones.includes(tone)) {
        res.status(400).json({
          error: { code: 'INVALID_TONE', message: `tone must be one of: ${validTones.join(', ')}` },
        });
        return;
      }

      const memory = getMemoryManager();
      const campaignMemory = await memory.load(id);
      campaignMemory.context.tone = tone;
      await memory.save(id, campaignMemory);

      res.json({ sessionId: id, tone });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// GET /api/ai/session/:id/memory
// Get the current world state and campaign context
// ---------------------------------------------------------------------------

router.get(
  '/session/:id/memory',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const memory = getMemoryManager();
      const campaignMemory = await memory.load(id);

      res.json({
        sessionId: id,
        context: campaignMemory.context,
        worldState: campaignMemory.worldState,
        historySummary: campaignMemory.historySummary ?? null,
        messageCount: campaignMemory.messageHistory.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// PUT /api/ai/session/:id/memory
// DM manually edits world state (e.g. time of day, weather, location)
// ---------------------------------------------------------------------------

router.put(
  '/session/:id/memory',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const patch = req.body as Partial<WorldState>;

      if (!patch || typeof patch !== 'object') {
        res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'Request body must be a WorldState patch object' } });
        return;
      }

      const memory = getMemoryManager();
      await memory.updateWorldState(id, patch);
      const updated = await memory.load(id);

      res.json({ sessionId: id, worldState: updated.worldState });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/ai/session/:id/npc
// Add or update an NPC in the session
// ---------------------------------------------------------------------------

router.post(
  '/session/:id/npc',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { npcName, disposition, lastInteraction, notes } = req.body as {
        npcName?: string;
        disposition?: string;
        lastInteraction?: string;
        notes?: string;
      };

      if (!npcName) {
        res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'npcName is required' } });
        return;
      }

      const memory = getMemoryManager();
      await memory.updateNPCRelationship(id, npcName, {
        npcName,
        ...(disposition && { disposition: disposition as any }),
        ...(lastInteraction && { lastInteraction }),
        ...(notes && { notes }),
      });

      const updated = await memory.load(id);
      const npc = updated.context.npcRelationships.find(
        (n) => n.npcName.toLowerCase() === npcName.toLowerCase(),
      );

      res.status(201).json({ sessionId: id, npc });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/ai/session/:id/quest
// Add a new quest to the session
// ---------------------------------------------------------------------------

router.post(
  '/session/:id/quest',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, description, objectives } = req.body as {
        name?: string;
        description?: string;
        objectives?: Array<{ description: string }>;
      };

      if (!name || !description) {
        res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'name and description are required' } });
        return;
      }

      const quest: Quest = {
        id: randomUUID(),
        name,
        description,
        status: 'active',
        objectives: (objectives ?? []).map((o) => ({
          id: randomUUID(),
          description: o.description,
          completed: false,
        })),
      };

      const memory = getMemoryManager();
      const campaignMemory = await memory.load(id);
      campaignMemory.worldState.activeQuests.push(quest);
      await memory.save(id, campaignMemory);

      res.status(201).json({ sessionId: id, quest });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// PUT /api/ai/session/:id/quest/:qid
// Update quest status (active → completed / failed)
// ---------------------------------------------------------------------------

router.put(
  '/session/:id/quest/:qid',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, qid } = req.params;
      const { status, objectives } = req.body as {
        status?: Quest['status'];
        objectives?: Array<{ id: string; completed: boolean }>;
      };

      const memory = getMemoryManager();
      const campaignMemory = await memory.load(id);

      const quest = campaignMemory.worldState.activeQuests.find((q) => q.id === qid)
        ?? campaignMemory.worldState.completedQuests.find((q) => q.id === qid);

      if (!quest) {
        res.status(404).json({ error: { code: 'QUEST_NOT_FOUND', message: `No quest with id ${qid}` } });
        return;
      }

      if (status) quest.status = status;

      if (objectives) {
        objectives.forEach(({ id: oid, completed }) => {
          const obj = quest.objectives.find((o) => o.id === oid);
          if (obj) obj.completed = completed;
        });
      }

      // Move quest between lists if status changed
      if (status === 'completed' || status === 'failed') {
        campaignMemory.worldState.activeQuests = campaignMemory.worldState.activeQuests.filter(
          (q) => q.id !== qid,
        );
        if (!campaignMemory.worldState.completedQuests.find((q) => q.id === qid)) {
          campaignMemory.worldState.completedQuests.push(quest);
        }
      }

      await memory.save(id, campaignMemory);

      res.json({ sessionId: id, quest });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// GET /api/ai/session/:id/history
// Get the session event log
// ---------------------------------------------------------------------------

router.get(
  '/session/:id/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { limit } = req.query;

      const memory = getMemoryManager();
      const campaignMemory = await memory.load(id);

      const cap = Math.min(Number(limit ?? 50), 200);
      const events = campaignMemory.context.worldEvents.slice(0, cap);

      res.json({
        sessionId: id,
        events,
        sessionHistory: campaignMemory.context.sessionHistory,
        historySummary: campaignMemory.historySummary ?? null,
        total: campaignMemory.context.worldEvents.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/ai/generate/hook
// Generate an adventure hook (no session context required)
// ---------------------------------------------------------------------------

router.post(
  '/generate/hook',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { partyLevel = 1, tone = 'heroic', playerBackstories = [] } = req.body as {
        partyLevel?: number;
        tone?: string;
        playerBackstories?: string[];
      };

      const hook = await generateHook({ partyLevel, tone, playerBackstories });
      res.json(hook);
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/ai/generate/npc
// Generate an NPC with personality and secret
// ---------------------------------------------------------------------------

router.post(
  '/generate/npc',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { race, role, disposition, setting } = req.body as {
        race?: string;
        role?: string;
        disposition?: string;
        setting?: string;
      };

      const npc = await generateNPC({ race, role, disposition, setting });
      res.json(npc);
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/ai/generate/location
// Generate a location description
// ---------------------------------------------------------------------------

router.post(
  '/generate/location',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, tone = 'heroic', partyLevel = 1 } = req.body as {
        type?: 'tavern' | 'dungeon' | 'city' | 'wilderness' | 'castle' | 'temple';
        tone?: string;
        partyLevel?: number;
      };

      const validTypes = ['tavern', 'dungeon', 'city', 'wilderness', 'castle', 'temple'];
      if (!type || !validTypes.includes(type)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TYPE',
            message: `type must be one of: ${validTypes.join(', ')}`,
          },
        });
        return;
      }

      const location = await generateLocation({ type, tone, partyLevel });
      res.json(location);
    } catch (err) {
      next(err);
    }
  },
);

export default router;

/**
 * memoryManager.ts
 * Manages persistent campaign memory using Redis (fast, 24h TTL)
 * and PostgreSQL via Prisma (durable, long-term storage).
 *
 * Architecture:
 * - Reads prefer Redis (sub-ms); falls back to DB on cache miss
 * - Writes go to Redis immediately; DB write is async (fire-and-forget with error logging)
 * - History older than 50 events is summarised by Claude into a compact "Previously..." block
 */

import Anthropic from '@anthropic-ai/sdk';
import { redis } from '../redis/client';
import { prisma } from '../db/client';
import type {
  CampaignContext,
  NPCRelationship,
  PlayerContext,
  WorldEvent,
} from './dmPrompt';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  objectives: QuestObjective[];
}

export interface NPCState {
  name: string;
  location: string;
  disposition: NPCRelationship['disposition'];
  notes: string;
}

export interface WorldState {
  currentLocation: string;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'midnight';
  weather: string;
  activeQuests: Quest[];
  completedQuests: Quest[];
  discoveredLocations: string[];
  killedNPCs: string[];
  livingNPCs: NPCState[];
}

export interface CampaignMemory {
  sessionId: string;
  campaignId?: string;
  context: CampaignContext;
  /** Sliding window of last 50 messages */
  messageHistory: AIMessage[];
  worldState: WorldState;
  /** Compact summary of history older than the sliding window */
  historySummary?: string;
}

// ---------------------------------------------------------------------------
// Redis key helpers
// ---------------------------------------------------------------------------

const MEMORY_KEY = (sessionId: string): string => `ai:memory:${sessionId}`;
const MEMORY_TTL = 60 * 60 * 24; // 24 hours
const MAX_MESSAGE_HISTORY = 50;
const MAX_EVENTS_BEFORE_SUMMARISE = 50;

// ---------------------------------------------------------------------------
// Default factory
// ---------------------------------------------------------------------------

function defaultWorldState(): WorldState {
  return {
    currentLocation: 'Unknown',
    timeOfDay: 'morning',
    weather: 'clear',
    activeQuests: [],
    completedQuests: [],
    discoveredLocations: [],
    killedNPCs: [],
    livingNPCs: [],
  };
}

function defaultCampaignContext(sessionId: string): CampaignContext {
  return {
    sessionId,
    campaignName: 'New Campaign',
    tone: 'heroic',
    setting: 'high fantasy',
    currentScene: 'The adventure begins.',
    players: [],
    npcRelationships: [],
    worldEvents: [],
    sessionHistory: [],
  };
}

// ---------------------------------------------------------------------------
// MemoryManager class
// ---------------------------------------------------------------------------

export class MemoryManager {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // -------------------------------------------------------------------------
  // load
  // -------------------------------------------------------------------------

  /**
   * Load campaign memory for a session.
   * Checks Redis first (fast path); falls back to Prisma DB on miss.
   * If neither has data, returns a fresh default memory object.
   *
   * @param sessionId - The game session UUID
   * @returns Populated CampaignMemory
   */
  async load(sessionId: string): Promise<CampaignMemory> {
    // 1. Try Redis
    const cached = await redis.get(MEMORY_KEY(sessionId));
    if (cached) {
      try {
        return JSON.parse(cached) as CampaignMemory;
      } catch {
        console.warn(`[MemoryManager] Redis cache corrupt for ${sessionId}, falling back to DB`);
      }
    }

    // 2. Try Prisma DB
    try {
      const record = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { aiMemory: true } as any,
      });

      if (record && (record as any).aiMemory) {
        const memory = JSON.parse((record as any).aiMemory) as CampaignMemory;
        // Backfill Redis cache
        await redis.set(MEMORY_KEY(sessionId), JSON.stringify(memory), 'EX', MEMORY_TTL);
        return memory;
      }
    } catch (err) {
      // DB may not have the aiMemory column yet — that's fine, return default
      console.warn('[MemoryManager] DB load failed (column may not exist yet):', (err as Error).message);
    }

    // 3. Return fresh default
    return {
      sessionId,
      context: defaultCampaignContext(sessionId),
      messageHistory: [],
      worldState: defaultWorldState(),
    };
  }

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------

  /**
   * Persist campaign memory.
   * Writes synchronously to Redis; DB write is best-effort async.
   *
   * @param sessionId - The game session UUID
   * @param memory    - Memory object to persist
   */
  async save(sessionId: string, memory: CampaignMemory): Promise<void> {
    const serialised = JSON.stringify(memory);

    // Synchronous Redis write (callers wait for this)
    await redis.set(MEMORY_KEY(sessionId), serialised, 'EX', MEMORY_TTL);

    // Async DB write — do not block the caller
    prisma.session
      .update({
        where: { id: sessionId },
        data: { aiMemory: serialised } as any,
      })
      .catch((err: Error) => {
        console.warn('[MemoryManager] DB save failed:', err.message);
      });
  }

  // -------------------------------------------------------------------------
  // addMessage
  // -------------------------------------------------------------------------

  /**
   * Append an AI conversation message and maintain the sliding window.
   * Automatically trims to MAX_MESSAGE_HISTORY messages.
   *
   * @param sessionId - The game session UUID
   * @param message   - The message to append
   */
  async addMessage(sessionId: string, message: AIMessage): Promise<void> {
    const memory = await this.load(sessionId);
    memory.messageHistory.push(message);

    if (memory.messageHistory.length > MAX_MESSAGE_HISTORY) {
      memory.messageHistory = memory.messageHistory.slice(-MAX_MESSAGE_HISTORY);
    }

    await this.save(sessionId, memory);
  }

  // -------------------------------------------------------------------------
  // addEvent
  // -------------------------------------------------------------------------

  /**
   * Append a world event to the session history.
   * If the event log exceeds MAX_EVENTS_BEFORE_SUMMARISE, the oldest half
   * is compressed into a "Previously..." summary via Claude Haiku.
   *
   * @param sessionId - The game session UUID
   * @param event     - The world event to append
   */
  async addEvent(sessionId: string, event: WorldEvent): Promise<void> {
    const memory = await this.load(sessionId);

    // Add to worldEvents array
    memory.context.worldEvents.unshift(event); // newest first

    // Add human-readable line to sessionHistory
    memory.context.sessionHistory.unshift(event.description);

    // Summarise if history is too long
    if (memory.context.sessionHistory.length > MAX_EVENTS_BEFORE_SUMMARISE) {
      const oldEvents = memory.context.sessionHistory.splice(MAX_EVENTS_BEFORE_SUMMARISE);
      const oldMessages: AIMessage[] = oldEvents.map((desc) => ({
        role: 'assistant',
        content: desc,
        timestamp: Date.now(),
      }));

      try {
        const summary = await this.summariseHistory(oldMessages);
        memory.historySummary = memory.historySummary
          ? `${memory.historySummary} ${summary}`
          : summary;
      } catch (err) {
        console.warn('[MemoryManager] History summarisation failed:', (err as Error).message);
        // Keep the old events rather than losing them
        memory.context.sessionHistory.push(...oldEvents);
      }
    }

    // Keep worldEvents array in sync (cap at 200)
    if (memory.context.worldEvents.length > 200) {
      memory.context.worldEvents = memory.context.worldEvents.slice(0, 200);
    }

    await this.save(sessionId, memory);
  }

  // -------------------------------------------------------------------------
  // updateNPCRelationship
  // -------------------------------------------------------------------------

  /**
   * Update or insert an NPC relationship after a player interaction.
   *
   * @param sessionId - The game session UUID
   * @param npcName   - Name of the NPC
   * @param update    - Partial fields to merge into the existing relationship
   */
  async updateNPCRelationship(
    sessionId: string,
    npcName: string,
    update: Partial<NPCRelationship>,
  ): Promise<void> {
    const memory = await this.load(sessionId);
    const existing = memory.context.npcRelationships.find(
      (n) => n.npcName.toLowerCase() === npcName.toLowerCase(),
    );

    if (existing) {
      Object.assign(existing, update);
    } else {
      memory.context.npcRelationships.push({
        npcName,
        disposition: 'neutral',
        lastInteraction: '',
        notes: '',
        ...update,
      });
    }

    await this.save(sessionId, memory);
  }

  // -------------------------------------------------------------------------
  // updateWorldState
  // -------------------------------------------------------------------------

  /**
   * Merge partial world state changes into the stored state.
   *
   * @param sessionId  - The game session UUID
   * @param patch      - Partial world state fields to update
   */
  async updateWorldState(
    sessionId: string,
    patch: Partial<WorldState>,
  ): Promise<void> {
    const memory = await this.load(sessionId);
    Object.assign(memory.worldState, patch);
    await this.save(sessionId, memory);
  }

  // -------------------------------------------------------------------------
  // undoLastEvent
  // -------------------------------------------------------------------------

  /**
   * Remove the most recent world event from the session history.
   * Useful for correcting mistakes mid-session.
   *
   * @param sessionId - The game session UUID
   * @returns The removed event, or null if history was empty
   */
  async undoLastEvent(sessionId: string): Promise<WorldEvent | null> {
    const memory = await this.load(sessionId);

    if (!memory.context.worldEvents.length) return null;

    const removed = memory.context.worldEvents.shift()!; // remove newest
    memory.context.sessionHistory.shift(); // remove corresponding text line
    await this.save(sessionId, memory);
    return removed;
  }

  // -------------------------------------------------------------------------
  // summariseHistory
  // -------------------------------------------------------------------------

  /**
   * Compress a list of old AI messages into a compact "Previously in the campaign..."
   * summary block using Claude Haiku (fast, cheap).
   *
   * @param messages - Array of old AI messages to summarise
   * @returns A compact summary paragraph (≤150 words)
   */
  async summariseHistory(messages: AIMessage[]): Promise<string> {
    const events = messages.map((m) => `- ${m.content}`).join('\n');

    const response = await this.anthropic.messages.create({
      model: process.env.AI_DM_COMBAT_MODEL ?? 'claude-haiku-4-5',
      max_tokens: 200,
      system:
        'You are a concise campaign scribe. Summarise D&D session events into a single "Previously..." paragraph of 100 words or fewer. Use past tense. Include the most important plot beats, NPC interactions, and character moments. Omit minor details.',
      messages: [
        {
          role: 'user',
          content: `Summarise these campaign events:\n\n${events}`,
        },
      ],
    });

    const block = response.content[0];
    return block.type === 'text' ? block.text : 'Previously, the party adventured onward...';
  }

  // -------------------------------------------------------------------------
  // getMessageHistory
  // -------------------------------------------------------------------------

  /**
   * Return the conversation message history formatted for the Anthropic API.
   * Prepends the history summary as an assistant turn when present.
   *
   * @param sessionId - The game session UUID
   * @returns Array of messages ready for `messages` parameter
   */
  async getMessageHistory(
    sessionId: string,
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const memory = await this.load(sessionId);
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Inject the history summary as a synthetic first assistant message
    if (memory.historySummary) {
      messages.push({
        role: 'assistant',
        content: `[Campaign Summary] ${memory.historySummary}`,
      });
    }

    messages.push(
      ...memory.messageHistory.map((m) => ({ role: m.role, content: m.content })),
    );

    return messages;
  }
}

/**
 * aiDm.ts
 * Socket.io event handlers for the AI Dungeon Master.
 *
 * Events received from clients:
 *   dm:narrate        — Player action → streaming AI DM response
 *   dm:npc-speak      — Player addresses an NPC
 *   dm:scene-enter    — Party enters a new location
 *   dm:combat-narrate — Post-combat-action narration (fast, 1-2 sentences)
 *   dm:generate-hook  — DM requests an adventure hook
 *   dm:set-tone       — DM changes campaign tone mid-session
 *   dm:update-scene   — DM updates the current scene description
 *   dm:undo-event     — Undo the last world event
 *
 * Events emitted to clients:
 *   dm:chunk          — Streaming text chunk (typewriter effect)
 *   dm:response       — Full response when streaming completes
 *   dm:error          — Error with fallback narration
 *   dm:memory-updated — World state changed notification
 */

import { Server, Socket } from 'socket.io';
import { DMService } from '../../ai/dmService';
import { MemoryManager } from '../../ai/memoryManager';
import type { CombatEvent, CampaignContext } from '../../ai/dmPrompt';

// ---------------------------------------------------------------------------
// Extended socket type (mirrors existing pattern from chat.ts)
// ---------------------------------------------------------------------------

interface SocketWithMeta extends Socket {
  _sessionId?: string;
  _playerId?: string;
  _playerName?: string;
}

// ---------------------------------------------------------------------------
// Lazy singletons — shared across all socket connections
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
// Payload types
// ---------------------------------------------------------------------------

interface NarratePayload {
  action: string;
}

interface NPCSpeakPayload {
  npcName: string;
  message: string;
}

interface SceneEnterPayload {
  location: string;
  timeOfDay?: string;
}

interface CombatNarratePayload {
  event: CombatEvent;
}

interface GenerateHookPayload {
  partyLevel: number;
  tone?: string;
}

interface SetTonePayload {
  tone: CampaignContext['tone'];
}

interface UpdateScenePayload {
  scene: string;
}

interface LoreGeneratePayload {
  tone: string;
  seed?: string;
}

// ---------------------------------------------------------------------------
// Registration function
// ---------------------------------------------------------------------------

/**
 * Register all AI DM socket event handlers on a connected socket.
 *
 * @param io     - The Socket.io server instance
 * @param socket - The individual connected socket
 */
export function registerAIDMHandlers(io: Server, socket: Socket): void {
  const s = socket as SocketWithMeta;
  const dm = getDMService();
  const memory = getMemoryManager();

  // -------------------------------------------------------------------------
  // Helper: validate session
  // -------------------------------------------------------------------------

  function getSessionId(): string | null {
    if (!s._sessionId) {
      socket.emit('dm:error', {
        code: 'NOT_IN_SESSION',
        message: 'Join a session before using AI DM features.',
        fallback: null,
      });
      return null;
    }
    return s._sessionId;
  }

  // -------------------------------------------------------------------------
  // dm:narrate — player declares an action, DM streams the response
  // -------------------------------------------------------------------------

  socket.on('dm:narrate', async (payload: NarratePayload) => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const { action } = payload;
    if (!action || typeof action !== 'string' || !action.trim()) {
      socket.emit('dm:error', { code: 'INVALID_PAYLOAD', message: 'action is required' });
      return;
    }

    let fullText = '';

    try {
      await dm.narrateStream(
        sessionId,
        action.trim(),
        (chunk) => {
          fullText += chunk;
          // Broadcast chunk to the whole room for typewriter effect
          io.to(sessionId).emit('dm:chunk', { chunk, sessionId });
        },
      );

      // Emit the completed response
      io.to(sessionId).emit('dm:response', {
        type: 'narration',
        text: fullText,
        sessionId,
        triggeredBy: s._playerName ?? 'Unknown',
      });

      // Notify all clients that memory was updated
      io.to(sessionId).emit('dm:memory-updated', { sessionId, reason: 'narration' });
    } catch (err) {
      console.error('[aiDm] dm:narrate error:', err);
      socket.emit('dm:error', {
        code: 'NARRATION_FAILED',
        message: (err as Error).message,
        fallback: 'The DM pauses to consider your action carefully...',
      });
    }
  });

  // -------------------------------------------------------------------------
  // dm:npc-speak — player addresses an NPC
  // -------------------------------------------------------------------------

  socket.on('dm:npc-speak', async (payload: NPCSpeakPayload) => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const { npcName, message } = payload;
    if (!npcName || !message) {
      socket.emit('dm:error', { code: 'INVALID_PAYLOAD', message: 'npcName and message are required' });
      return;
    }

    try {
      const response = await dm.npcSpeak(sessionId, npcName.trim(), message.trim());

      io.to(sessionId).emit('dm:response', {
        type: 'npc-dialogue',
        npcName: npcName.trim(),
        text: response,
        sessionId,
      });
    } catch (err) {
      console.error('[aiDm] dm:npc-speak error:', err);
      socket.emit('dm:error', {
        code: 'NPC_FAILED',
        message: (err as Error).message,
        fallback: `${npcName} stares at you without a word.`,
      });
    }
  });

  // -------------------------------------------------------------------------
  // dm:scene-enter — party enters a new location
  // -------------------------------------------------------------------------

  socket.on('dm:scene-enter', async (payload: SceneEnterPayload) => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const { location, timeOfDay = 'morning' } = payload;
    if (!location) {
      socket.emit('dm:error', { code: 'INVALID_PAYLOAD', message: 'location is required' });
      return;
    }

    try {
      const description = await dm.describeScene(sessionId, location.trim(), timeOfDay);

      io.to(sessionId).emit('dm:response', {
        type: 'scene-description',
        location: location.trim(),
        timeOfDay,
        text: description,
        sessionId,
      });

      io.to(sessionId).emit('dm:memory-updated', { sessionId, reason: 'scene-enter', location });
    } catch (err) {
      console.error('[aiDm] dm:scene-enter error:', err);
      socket.emit('dm:error', {
        code: 'SCENE_FAILED',
        message: (err as Error).message,
        fallback: `You arrive at ${location}.`,
      });
    }
  });

  // -------------------------------------------------------------------------
  // dm:combat-narrate — quick post-combat-action narration
  // -------------------------------------------------------------------------

  socket.on('dm:combat-narrate', async (payload: CombatNarratePayload) => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const { event } = payload;
    if (!event || !event.actorName || !event.outcome) {
      socket.emit('dm:error', { code: 'INVALID_PAYLOAD', message: 'event with actorName and outcome is required' });
      return;
    }

    try {
      const narration = await dm.narrateCombat(sessionId, event);

      // Combat narration broadcasts to whole room immediately (no streaming)
      io.to(sessionId).emit('dm:response', {
        type: 'combat-narration',
        text: narration,
        sessionId,
        combatEvent: event,
      });
    } catch (err) {
      console.error('[aiDm] dm:combat-narrate error:', err);
      socket.emit('dm:error', {
        code: 'COMBAT_NARRATION_FAILED',
        message: (err as Error).message,
        fallback: `${event.actorName} acts — ${event.outcome}.`,
      });
    }
  });

  // -------------------------------------------------------------------------
  // dm:generate-hook — DM requests an adventure hook
  // -------------------------------------------------------------------------

  socket.on('dm:generate-hook', async (payload: GenerateHookPayload) => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const { partyLevel = 1, tone } = payload;

    try {
      const campaignMemory = await memory.load(sessionId);
      const activeTone = tone ?? campaignMemory.context.tone;
      const hook = await dm.generateHook(sessionId, partyLevel, activeTone);

      // Hooks are sent only to the requester (DM-only info)
      socket.emit('dm:response', {
        type: 'adventure-hook',
        text: hook,
        sessionId,
      });
    } catch (err) {
      console.error('[aiDm] dm:generate-hook error:', err);
      socket.emit('dm:error', {
        code: 'HOOK_FAILED',
        message: (err as Error).message,
        fallback: 'A stranger approaches with news of trouble to the north...',
      });
    }
  });

  // -------------------------------------------------------------------------
  // dm:set-tone — DM changes campaign tone
  // -------------------------------------------------------------------------

  socket.on('dm:set-tone', async (payload: SetTonePayload) => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const { tone } = payload;
    const validTones: CampaignContext['tone'][] = ['heroic', 'gritty', 'comedic', 'horror', 'mystery'];

    if (!tone || !validTones.includes(tone)) {
      socket.emit('dm:error', {
        code: 'INVALID_TONE',
        message: `tone must be one of: ${validTones.join(', ')}`,
      });
      return;
    }

    try {
      const campaignMemory = await memory.load(sessionId);
      campaignMemory.context.tone = tone;
      await memory.save(sessionId, campaignMemory);

      io.to(sessionId).emit('dm:memory-updated', {
        sessionId,
        reason: 'tone-change',
        tone,
      });
    } catch (err) {
      console.error('[aiDm] dm:set-tone error:', err);
      socket.emit('dm:error', { code: 'TONE_FAILED', message: (err as Error).message });
    }
  });

  // -------------------------------------------------------------------------
  // dm:update-scene — DM manually updates the current scene description
  // -------------------------------------------------------------------------

  socket.on('dm:update-scene', async (payload: UpdateScenePayload) => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const { scene } = payload;
    if (!scene || typeof scene !== 'string' || !scene.trim()) {
      socket.emit('dm:error', { code: 'INVALID_PAYLOAD', message: 'scene description is required' });
      return;
    }

    try {
      const campaignMemory = await memory.load(sessionId);
      campaignMemory.context.currentScene = scene.trim();
      await memory.save(sessionId, campaignMemory);

      io.to(sessionId).emit('dm:memory-updated', {
        sessionId,
        reason: 'scene-update',
        scene: scene.trim(),
      });
    } catch (err) {
      console.error('[aiDm] dm:update-scene error:', err);
      socket.emit('dm:error', { code: 'SCENE_UPDATE_FAILED', message: (err as Error).message });
    }
  });

  // -------------------------------------------------------------------------
  // dm:undo-event — undo the last world event
  // -------------------------------------------------------------------------

  socket.on('dm:undo-event', async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      const removed = await memory.undoLastEvent(sessionId);

      socket.emit('dm:response', {
        type: 'undo-event',
        removedEvent: removed,
        sessionId,
        message: removed
          ? `Removed event: "${removed.description}"`
          : 'No events to undo.',
      });

      if (removed) {
        io.to(sessionId).emit('dm:memory-updated', {
          sessionId,
          reason: 'undo-event',
        });
      }
    } catch (err) {
      console.error('[aiDm] dm:undo-event error:', err);
      socket.emit('dm:error', { code: 'UNDO_FAILED', message: (err as Error).message });
    }
  });

  // -------------------------------------------------------------------------
  // lore:generate — DM requests campaign lore generation before session start
  // No active session required — streams directly back to the requesting socket
  // -------------------------------------------------------------------------

  socket.on('lore:generate', async (payload: LoreGeneratePayload) => {
    const { tone, seed } = payload ?? {};

    if (!tone || typeof tone !== 'string') {
      socket.emit('dm:error', { code: 'INVALID_PAYLOAD', message: 'tone is required' });
      return;
    }

    const seedText = seed && seed.trim() ? seed.trim() : 'a classic fantasy world';

    const prompt = `Generate a rich D&D campaign lore of approximately 200 words. Tone: ${tone}. Theme hint: ${seedText}. Write in second person ("Your party finds themselves..."). Include: world setting, main threat/conflict, a mystery, and what's at stake. Do not use headers or bullet points — write flowing prose.`;

    let fullText = '';

    try {
      const genAI = new (await import('@google/generative-ai')).GoogleGenerativeAI(
        process.env.GOOGLE_API_KEY ?? '',
      );
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { maxOutputTokens: 400, temperature: 0.85 },
      });

      const streamResult = await model.generateContentStream(prompt);

      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          socket.emit('lore:chunk', { chunk: chunkText });
        }
      }

      socket.emit('lore:done', { text: fullText });
    } catch (err) {
      console.error('[aiDm] lore:generate error:', err);
      socket.emit('lore:done', {
        text: 'Your party finds themselves on the edge of a forgotten kingdom, where an ancient evil stirs beneath the mountains. The land groans under a creeping shadow — crops wither, travelers vanish, and the stars themselves seem dimmer each night. At the heart of this darkness lies a mystery: a sealed vault beneath the ruins of Moonsreach, said to contain either salvation or annihilation. The weight of countless lives rests on your shoulders.',
      });
    }
  });
}

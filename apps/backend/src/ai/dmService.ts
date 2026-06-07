/**
 * dmService.ts
 * Main AI Dungeon Master service — wraps Anthropic Claude API calls
 * with campaign memory, prompt construction, and streaming support.
 *
 * Model strategy:
 * - claude-opus-4-5  → full narration, NPC dialogue, scene descriptions (rich, creative)
 * - claude-haiku-4-5 → combat narration, hook generation (fast, low-latency)
 */

import Anthropic from '@anthropic-ai/sdk';
import { MemoryManager } from './memoryManager';
import {
  buildSystemPrompt,
  buildNarrationPrompt,
  buildCombatNarrationPrompt,
  type CombatEvent,
} from './dmPrompt';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL_NARRATION = process.env.AI_DM_MODEL ?? 'claude-opus-4-5';
const MODEL_COMBAT = process.env.AI_DM_COMBAT_MODEL ?? 'claude-haiku-4-5';
const MAX_TOKENS_NARRATION = Number(process.env.AI_DM_MAX_TOKENS ?? 300);
const MAX_TOKENS_COMBAT = 100;
const MAX_TOKENS_NPC = 200;
const MAX_TOKENS_SCENE = 250;
const MAX_TOKENS_HOOK = 300;

/** Fallback narration when the AI call fails (avoids dead silence at the table) */
const FALLBACK_NARRATION =
  'The air crackles with possibility. The world holds its breath, waiting to see what you do next. What is your move?';

// ---------------------------------------------------------------------------
// DMService
// ---------------------------------------------------------------------------

export class DMService {
  private client: Anthropic;
  private memoryManager: MemoryManager;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.memoryManager = new MemoryManager();
  }

  // -------------------------------------------------------------------------
  // narrate
  // -------------------------------------------------------------------------

  /**
   * Main narration: a player declares an action and the DM responds.
   * Uses the full campaign context and sliding-window message history.
   * Saves both the player action and DM response to memory.
   *
   * @param sessionId    - The game session UUID
   * @param playerAction - The player's declared action (free text)
   * @param playerId     - The player's ID (for attribution in memory)
   * @returns The AI DM's narration response
   */
  async narrate(
    sessionId: string,
    playerAction: string,
    playerId: string,
  ): Promise<string> {
    const memory = await this.memoryManager.load(sessionId);
    const systemPrompt = buildSystemPrompt(memory.context);
    const userPrompt = buildNarrationPrompt(playerAction, memory.context);

    const history = await this.memoryManager.getMessageHistory(sessionId);

    try {
      const response = await this.client.messages.create({
        model: MODEL_NARRATION,
        max_tokens: MAX_TOKENS_NARRATION,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          ...history,
          { role: 'user', content: userPrompt },
        ],
      });

      const text =
        response.content[0]?.type === 'text'
          ? response.content[0].text
          : FALLBACK_NARRATION;

      // Persist to memory
      const ts = Date.now();
      await this.memoryManager.addMessage(sessionId, {
        role: 'user',
        content: userPrompt,
        timestamp: ts,
      });
      await this.memoryManager.addMessage(sessionId, {
        role: 'assistant',
        content: text,
        timestamp: ts + 1,
      });

      // Record as a world event
      await this.memoryManager.addEvent(sessionId, {
        id: randomUUID(),
        timestamp: ts,
        type: 'roleplay',
        description: `Player action: ${playerAction.slice(0, 100)}`,
        involvedCharacters: [playerId],
      });

      return text;
    } catch (err) {
      console.error('[DMService.narrate] Error:', (err as Error).message);
      return FALLBACK_NARRATION;
    }
  }

  // -------------------------------------------------------------------------
  // narrateCombat
  // -------------------------------------------------------------------------

  /**
   * Quick combat narration — 1-2 sentences, fast model, low latency.
   * Does NOT append to the full conversation history (keeps it clean).
   *
   * @param sessionId   - The game session UUID
   * @param combatEvent - Structured description of the combat action
   * @returns Short, punchy combat narration
   */
  async narrateCombat(sessionId: string, event: CombatEvent): Promise<string> {
    const memory = await this.memoryManager.load(sessionId);
    const systemPrompt = buildSystemPrompt(memory.context);
    const userPrompt = buildCombatNarrationPrompt(event, memory.context);

    try {
      const response = await this.client.messages.create({
        model: MODEL_COMBAT,
        max_tokens: MAX_TOKENS_COMBAT,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text =
        response.content[0]?.type === 'text'
          ? response.content[0].text
          : `${event.actorName} acts decisively. ${event.outcome}.`;

      // Log as a combat event
      await this.memoryManager.addEvent(sessionId, {
        id: randomUUID(),
        timestamp: Date.now(),
        type: 'combat',
        description: `${event.actorName} → ${event.actionType}: ${event.outcome}`,
        involvedCharacters: [
          event.actorName,
          ...(event.targetName ? [event.targetName] : []),
        ],
      });

      return text;
    } catch (err) {
      console.error('[DMService.narrateCombat] Error:', (err as Error).message);
      return `${event.actorName} ${event.outcome}.`;
    }
  }

  // -------------------------------------------------------------------------
  // npcSpeak
  // -------------------------------------------------------------------------

  /**
   * Generate NPC dialogue — in-character, consistent with their disposition.
   *
   * @param sessionId      - The game session UUID
   * @param npcName        - Name of the NPC speaking
   * @param playerQuestion - What the player said/asked
   * @returns The NPC's in-character response
   */
  async npcSpeak(
    sessionId: string,
    npcName: string,
    playerQuestion: string,
  ): Promise<string> {
    const memory = await this.memoryManager.load(sessionId);
    const npc = memory.context.npcRelationships.find(
      (n) => n.npcName.toLowerCase() === npcName.toLowerCase(),
    );

    const npcContext = npc
      ? `NPC: ${npcName}\nDisposition: ${npc.disposition}\nNotes: ${npc.notes}\nLast interaction: ${npc.lastInteraction}`
      : `NPC: ${npcName}\nDisposition: neutral\n(No prior interaction on record)`;

    const systemPrompt = buildSystemPrompt(memory.context);

    try {
      const response = await this.client.messages.create({
        model: MODEL_NARRATION,
        max_tokens: MAX_TOKENS_NPC,
        temperature: 0.85,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `The players approach ${npcName} and say: "${playerQuestion}"\n\n${npcContext}\n\nRespond as ${npcName} would, in character. Include a brief narrative beat before/after the dialogue if appropriate.`,
          },
        ],
      });

      return response.content[0]?.type === 'text'
        ? response.content[0].text
        : `${npcName} looks at you warily but says nothing.`;
    } catch (err) {
      console.error('[DMService.npcSpeak] Error:', (err as Error).message);
      return `${npcName} regards you carefully but remains silent for now.`;
    }
  }

  // -------------------------------------------------------------------------
  // describeScene
  // -------------------------------------------------------------------------

  /**
   * Generate a rich scene description when the party enters a new area.
   * Engages multiple senses; stays under 150 words.
   *
   * @param sessionId - The game session UUID
   * @param location  - Name/type of the location being entered
   * @param timeOfDay - Current time of day for lighting/atmosphere
   * @returns Vivid scene description
   */
  async describeScene(
    sessionId: string,
    location: string,
    timeOfDay: string,
  ): Promise<string> {
    const memory = await this.memoryManager.load(sessionId);

    // Update world state with new location
    await this.memoryManager.updateWorldState(sessionId, {
      currentLocation: location,
      timeOfDay: timeOfDay as any,
    });

    const systemPrompt = buildSystemPrompt(memory.context);

    try {
      const response = await this.client.messages.create({
        model: MODEL_NARRATION,
        max_tokens: MAX_TOKENS_SCENE,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `The party arrives at: ${location}\nTime of day: ${timeOfDay}\nSetting: ${memory.context.setting}\n\nDescribe this location in 100–150 words. Engage at least 3 senses. End with something that invites exploration or raises a question.`,
          },
        ],
      });

      const text =
        response.content[0]?.type === 'text'
          ? response.content[0].text
          : `You arrive at ${location}. The area feels charged with potential.`;

      // Record the discovery
      if (!memory.worldState.discoveredLocations.includes(location)) {
        await this.memoryManager.updateWorldState(sessionId, {
          discoveredLocations: [...memory.worldState.discoveredLocations, location],
        });
        await this.memoryManager.addEvent(sessionId, {
          id: randomUUID(),
          timestamp: Date.now(),
          type: 'discovery',
          description: `Party discovered: ${location}`,
          involvedCharacters: memory.context.players.map((p) => p.characterName),
        });
      }

      return text;
    } catch (err) {
      console.error('[DMService.describeScene] Error:', (err as Error).message);
      return `You arrive at ${location}. The world stretches before you.`;
    }
  }

  // -------------------------------------------------------------------------
  // generateHook
  // -------------------------------------------------------------------------

  /**
   * Generate an adventure hook appropriate for the party level and campaign tone.
   * Can be used by the DM to seed the next session.
   *
   * @param sessionId  - The game session UUID
   * @param partyLevel - Average party level (1-20)
   * @param tone       - Campaign tone override (defaults to context tone)
   * @returns A narrative adventure hook with DM notes
   */
  async generateHook(
    sessionId: string,
    partyLevel: number,
    tone: string,
  ): Promise<string> {
    const memory = await this.memoryManager.load(sessionId);
    const systemPrompt = buildSystemPrompt(memory.context);

    const backstories = memory.context.players
      .map((p) => `- ${p.characterName}: ${p.backstory}`)
      .join('\n');

    try {
      const response = await this.client.messages.create({
        model: MODEL_COMBAT,
        max_tokens: MAX_TOKENS_HOOK,
        temperature: 0.9,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Generate an adventure hook for a party of level ${partyLevel} in a ${tone} campaign.\n\nPlayer backstories to potentially tie in:\n${backstories}\n\nProvide:\n1. The hook (2-3 sentences, present-tense, immediate)\n2. What's really going on (DM secret, 1-2 sentences)\n3. Suggested difficulty: Easy / Medium / Hard / Deadly`,
          },
        ],
      });

      return response.content[0]?.type === 'text'
        ? response.content[0].text
        : 'A mysterious stranger approaches the party with an urgent message...';
    } catch (err) {
      console.error('[DMService.generateHook] Error:', (err as Error).message);
      return 'A messenger arrives bearing a sealed letter with an unfamiliar crest.';
    }
  }

  // -------------------------------------------------------------------------
  // narrateStream
  // -------------------------------------------------------------------------

  /**
   * Stream narration in real-time via a callback.
   * Uses the Anthropic streaming API for a typewriter effect on the client.
   * Automatically saves the complete response to memory when done.
   *
   * @param sessionId    - The game session UUID
   * @param playerAction - The player's declared action
   * @param onChunk      - Callback fired for each text chunk received
   */
  async narrateStream(
    sessionId: string,
    playerAction: string,
    onChunk: (text: string) => void,
  ): Promise<void> {
    const memory = await this.memoryManager.load(sessionId);
    const systemPrompt = buildSystemPrompt(memory.context);
    const userPrompt = buildNarrationPrompt(playerAction, memory.context);
    const history = await this.memoryManager.getMessageHistory(sessionId);

    let fullText = '';

    try {
      const stream = await this.client.messages.stream({
        model: MODEL_NARRATION,
        max_tokens: MAX_TOKENS_NARRATION,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          ...history,
          { role: 'user', content: userPrompt },
        ],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          onChunk(chunk.delta.text);
          fullText += chunk.delta.text;
        }
      }

      // Persist full response to memory
      const ts = Date.now();
      await this.memoryManager.addMessage(sessionId, {
        role: 'user',
        content: userPrompt,
        timestamp: ts,
      });
      await this.memoryManager.addMessage(sessionId, {
        role: 'assistant',
        content: fullText,
        timestamp: ts + 1,
      });
    } catch (err) {
      console.error('[DMService.narrateStream] Error:', (err as Error).message);
      onChunk(FALLBACK_NARRATION);
    }
  }
}

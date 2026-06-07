/**
 * dmService.ts
 * Main AI Dungeon Master service — wraps Google Gemini API calls
 * with campaign memory, prompt construction, and streaming support.
 *
 * Model strategy:
 * - gemini-1.5-pro   → full narration, NPC dialogue, scene descriptions (rich, creative)
 * - gemini-1.5-flash → combat narration, hook generation (fast, low-latency)
 */

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
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

const MODEL_NARRATION = process.env.AI_DM_MODEL ?? 'gemini-1.5-pro';
const MODEL_COMBAT = process.env.AI_DM_COMBAT_MODEL ?? 'gemini-1.5-flash';
const MAX_TOKENS_NARRATION = Number(process.env.AI_DM_MAX_TOKENS ?? 300);
const MAX_TOKENS_COMBAT = 100;
const MAX_TOKENS_NPC = 200;
const MAX_TOKENS_SCENE = 250;
const MAX_TOKENS_HOOK = 300;

/** Fallback narration when the AI call fails (avoids dead silence at the table) */
const FALLBACK_NARRATION =
  'The air crackles with possibility. The world holds its breath, waiting to see what you do next. What is your move?';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert our internal message history to Gemini's Content[] format */
function toGeminiHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Content[] {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// ---------------------------------------------------------------------------
// DMService
// ---------------------------------------------------------------------------

export class DMService {
  private genAI: GoogleGenerativeAI;
  private memoryManager: MemoryManager;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '');
    this.memoryManager = new MemoryManager();
  }

  // -------------------------------------------------------------------------
  // narrate
  // -------------------------------------------------------------------------

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
      const model = this.genAI.getGenerativeModel({
        model: MODEL_NARRATION,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: MAX_TOKENS_NARRATION, temperature: 0.8 },
      });

      const chat = model.startChat({ history: toGeminiHistory(history) });
      const result = await chat.sendMessage(userPrompt);
      const text = result.response.text() || FALLBACK_NARRATION;

      const ts = Date.now();
      await this.memoryManager.addMessage(sessionId, { role: 'user', content: userPrompt, timestamp: ts });
      await this.memoryManager.addMessage(sessionId, { role: 'assistant', content: text, timestamp: ts + 1 });
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

  async narrateCombat(sessionId: string, event: CombatEvent): Promise<string> {
    const memory = await this.memoryManager.load(sessionId);
    const systemPrompt = buildSystemPrompt(memory.context);
    const userPrompt = buildCombatNarrationPrompt(event, memory.context);

    try {
      const model = this.genAI.getGenerativeModel({
        model: MODEL_COMBAT,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: MAX_TOKENS_COMBAT, temperature: 0.7 },
      });

      const result = await model.generateContent(userPrompt);
      const text = result.response.text() || `${event.actorName} acts decisively. ${event.outcome}.`;

      await this.memoryManager.addEvent(sessionId, {
        id: randomUUID(),
        timestamp: Date.now(),
        type: 'combat',
        description: `${event.actorName} → ${event.actionType}: ${event.outcome}`,
        involvedCharacters: [event.actorName, ...(event.targetName ? [event.targetName] : [])],
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
      const model = this.genAI.getGenerativeModel({
        model: MODEL_NARRATION,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: MAX_TOKENS_NPC, temperature: 0.85 },
      });

      const prompt = `The players approach ${npcName} and say: "${playerQuestion}"\n\n${npcContext}\n\nRespond as ${npcName} would, in character. Include a brief narrative beat before/after the dialogue if appropriate.`;
      const result = await model.generateContent(prompt);
      return result.response.text() || `${npcName} looks at you warily but says nothing.`;
    } catch (err) {
      console.error('[DMService.npcSpeak] Error:', (err as Error).message);
      return `${npcName} regards you carefully but remains silent for now.`;
    }
  }

  // -------------------------------------------------------------------------
  // describeScene
  // -------------------------------------------------------------------------

  async describeScene(
    sessionId: string,
    location: string,
    timeOfDay: string,
  ): Promise<string> {
    const memory = await this.memoryManager.load(sessionId);

    await this.memoryManager.updateWorldState(sessionId, {
      currentLocation: location,
      timeOfDay: timeOfDay as any,
    });

    const systemPrompt = buildSystemPrompt(memory.context);

    try {
      const model = this.genAI.getGenerativeModel({
        model: MODEL_NARRATION,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: MAX_TOKENS_SCENE, temperature: 0.8 },
      });

      const prompt = `The party arrives at: ${location}\nTime of day: ${timeOfDay}\nSetting: ${memory.context.setting}\n\nDescribe this location in 100–150 words. Engage at least 3 senses. End with something that invites exploration or raises a question.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text() || `You arrive at ${location}. The area feels charged with potential.`;

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
      const model = this.genAI.getGenerativeModel({
        model: MODEL_COMBAT,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: MAX_TOKENS_HOOK, temperature: 0.9 },
      });

      const prompt = `Generate an adventure hook for a party of level ${partyLevel} in a ${tone} campaign.\n\nPlayer backstories to potentially tie in:\n${backstories}\n\nProvide:\n1. The hook (2-3 sentences, present-tense, immediate)\n2. What's really going on (DM secret, 1-2 sentences)\n3. Suggested difficulty: Easy / Medium / Hard / Deadly`;
      const result = await model.generateContent(prompt);
      return result.response.text() || 'A mysterious stranger approaches the party with an urgent message...';
    } catch (err) {
      console.error('[DMService.generateHook] Error:', (err as Error).message);
      return 'A messenger arrives bearing a sealed letter with an unfamiliar crest.';
    }
  }

  // -------------------------------------------------------------------------
  // narrateStream
  // -------------------------------------------------------------------------

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
      const model = this.genAI.getGenerativeModel({
        model: MODEL_NARRATION,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: MAX_TOKENS_NARRATION, temperature: 0.8 },
      });

      const chat = model.startChat({ history: toGeminiHistory(history) });
      const streamResult = await chat.sendMessageStream(userPrompt);

      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          onChunk(chunkText);
          fullText += chunkText;
        }
      }

      const ts = Date.now();
      await this.memoryManager.addMessage(sessionId, { role: 'user', content: userPrompt, timestamp: ts });
      await this.memoryManager.addMessage(sessionId, { role: 'assistant', content: fullText, timestamp: ts + 1 });
    } catch (err) {
      console.error('[DMService.narrateStream] Error:', (err as Error).message);
      onChunk(FALLBACK_NARRATION);
    }
  }
}

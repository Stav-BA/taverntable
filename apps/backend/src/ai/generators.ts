/**
 * generators.ts
 * One-shot content generators — no session context required.
 * These are used for pre-session prep, on-the-fly table needs,
 * and DM tooling (NPC generator, location designer, trap builder).
 *
 * All generators use gemini-1.5-flash for speed and cost efficiency.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '');
  }
  return _genAI;
}

const MODEL = process.env.AI_DM_COMBAT_MODEL ?? 'gemini-1.5-flash';

async function callGemini(prompt: string, maxTokens: number, temperature = 0.9): Promise<string> {
  const model = getGenAI().getGenerativeModel({
    model: MODEL,
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ---------------------------------------------------------------------------
// Result interfaces
// ---------------------------------------------------------------------------

export interface GeneratedNPC {
  name: string;
  race: string;
  role: string;
  appearance: string;
  personality: string;
  secret: string;
  speechPattern: string;
  disposition: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'ally';
}

export interface GeneratedLocation {
  name: string;
  type: string;
  description: string;
  pointsOfInterest: string[];
  hooks: string[];
  ambience: string;
}

export interface AdventureHook {
  title: string;
  hook: string;
  truth: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Deadly';
  backstoryConnections: string[];
}

export interface GeneratedTrap {
  name: string;
  type: string;
  readAloud: string;
  detectionDC: number;
  disarmCheck: string;
  effect: string;
  cr: number;
}

// ---------------------------------------------------------------------------
// generateNPC
// ---------------------------------------------------------------------------

export async function generateNPC(options: {
  race?: string;
  role?: string;
  disposition?: string;
  setting?: string;
}): Promise<GeneratedNPC> {
  const { race = 'any', role = 'commoner', disposition = 'neutral', setting = 'high fantasy' } = options;

  const prompt = `Generate a D&D NPC for a ${setting} setting.
Race/species: ${race}
Role: ${role}
Disposition toward adventurers: ${disposition}

Respond ONLY with valid JSON matching this schema (no markdown, no extra text):
{
  "name": "string",
  "race": "string",
  "role": "string",
  "appearance": "one vivid sentence",
  "personality": "2-3 core traits as a sentence",
  "secret": "one hidden truth or motive",
  "speechPattern": "how they speak (accent, habit, catchphrase)",
  "disposition": "${disposition}"
}`;

  try {
    const text = await callGemini(prompt, 300, 0.9);
    const json = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json) as GeneratedNPC;
  } catch {
    return {
      name: 'Mira Ashvale',
      race: race === 'any' ? 'Human' : race,
      role,
      appearance: 'A weathered figure with sharp eyes that miss nothing.',
      personality: 'Cautious, pragmatic, and unexpectedly kind when trust is earned.',
      secret: "She owes a dangerous debt to a thieves' guild.",
      speechPattern: 'Speaks in short sentences. Pauses before answering questions.',
      disposition: disposition as GeneratedNPC['disposition'],
    };
  }
}

// ---------------------------------------------------------------------------
// generateLocation
// ---------------------------------------------------------------------------

export async function generateLocation(options: {
  type: 'tavern' | 'dungeon' | 'city' | 'wilderness' | 'castle' | 'temple';
  tone: string;
  partyLevel: number;
}): Promise<GeneratedLocation> {
  const { type, tone, partyLevel } = options;

  const prompt = `Generate a D&D location for a ${tone} campaign. Party level: ${partyLevel}.
Location type: ${type}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "name": "string",
  "type": "${type}",
  "description": "atmospheric description, max 150 words, 3 senses",
  "pointsOfInterest": ["poi1", "poi2", "poi3"],
  "hooks": ["hook1", "hook2"],
  "ambience": "sounds and smells in one sentence"
}`;

  try {
    const text = await callGemini(prompt, 400, 0.85);
    const json = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json) as GeneratedLocation;
  } catch {
    return {
      name: `The ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      description: `A ${tone} ${type} that feels heavy with history and possibility.`,
      pointsOfInterest: ['A locked door', 'An old notice board', 'A suspicious stain on the floor'],
      hooks: ['Something is not right here', 'A stranger watches from the shadows'],
      ambience: 'The creak of old wood and the smell of dust and old smoke.',
    };
  }
}

// ---------------------------------------------------------------------------
// generateHook
// ---------------------------------------------------------------------------

export async function generateHook(options: {
  partyLevel: number;
  tone: string;
  playerBackstories: string[];
}): Promise<AdventureHook> {
  const { partyLevel, tone, playerBackstories } = options;

  const backstoryBlock = playerBackstories.length
    ? `Player backstories to weave in:\n${playerBackstories.map((b, i) => `${i + 1}. ${b}`).join('\n')}`
    : '';

  const prompt = `Generate a D&D adventure hook.
Party level: ${partyLevel}
Tone: ${tone}
${backstoryBlock}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "title": "short memorable title",
  "hook": "what the players hear/see — 2-3 sentences, immediate and urgent",
  "truth": "what's really happening (DM secret) — 1-2 sentences",
  "difficulty": "Easy|Medium|Hard|Deadly",
  "backstoryConnections": ["which backstory this connects to and how"]
}`;

  try {
    const text = await callGemini(prompt, 350, 0.9);
    const json = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json) as AdventureHook;
  } catch {
    return {
      title: 'A Cry in the Night',
      hook: 'A breathless child bursts into the tavern, sobbing about monsters near the mill.',
      truth: 'The mill owner is secretly summoning creatures to drive away a rival.',
      difficulty: 'Medium',
      backstoryConnections: [],
    };
  }
}

// ---------------------------------------------------------------------------
// generateTrap
// ---------------------------------------------------------------------------

export async function generateTrap(options: {
  cr: number;
  type: string;
  environment: string;
}): Promise<GeneratedTrap> {
  const { cr, type, environment } = options;

  const prompt = `Generate a D&D 5e trap.
CR: ${cr}
Type: ${type}
Environment: ${environment}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "name": "trap name",
  "type": "${type}",
  "readAloud": "what players might notice — write as a subtle environmental detail, not a direct warning",
  "detectionDC": 15,
  "disarmCheck": "Dexterity (Thieves' Tools) DC 15",
  "effect": "damage type and amount, plus any conditions (e.g. 2d6 piercing, DC 14 Con save or Poisoned for 1 hour)",
  "cr": ${cr}
}`;

  try {
    const text = await callGemini(prompt, 250, 0.7);
    const json = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json) as GeneratedTrap;
  } catch {
    return {
      name: 'Pressure Plate Dart Trap',
      type,
      readAloud: 'The stones here look slightly different — a faint discolouration near the floor.',
      detectionDC: 15,
      disarmCheck: "Dexterity (Thieves' Tools) DC 14",
      effect: '2d6 piercing damage, DC 13 Constitution save or Poisoned for 1 hour',
      cr,
    };
  }
}

/**
 * generators.ts
 * One-shot content generators — no session context required.
 * These are used for pre-session prep, on-the-fly table needs,
 * and DM tooling (NPC generator, location designer, trap builder).
 *
 * All generators use claude-haiku-4-5 for speed and cost efficiency.
 */

import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const MODEL = process.env.AI_DM_COMBAT_MODEL ?? 'claude-haiku-4-5';

// ---------------------------------------------------------------------------
// Result interfaces
// ---------------------------------------------------------------------------

export interface GeneratedNPC {
  name: string;
  race: string;
  role: string;
  /** One-sentence visual description */
  appearance: string;
  /** Core personality traits */
  personality: string;
  /** Hidden motive or secret */
  secret: string;
  /** Default speech patterns or catchphrase */
  speechPattern: string;
  disposition: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'ally';
}

export interface GeneratedLocation {
  name: string;
  type: string;
  /** Atmospheric scene description (150 words max) */
  description: string;
  /** 3 notable features or points of interest */
  pointsOfInterest: string[];
  /** Possible encounters or hooks here */
  hooks: string[];
  /** Ambient sounds and smells */
  ambience: string;
}

export interface AdventureHook {
  title: string;
  /** Public-facing hook (what the players hear) */
  hook: string;
  /** DM-only: what's really going on */
  truth: string;
  /** Suggested encounters (Easy / Medium / Hard / Deadly) */
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Deadly';
  /** Which backstories this ties into */
  backstoryConnections: string[];
}

export interface GeneratedTrap {
  name: string;
  type: string;
  /** Read-aloud description (what players might notice) */
  readAloud: string;
  /** Perception/Investigation DC to notice */
  detectionDC: number;
  /** Ability check and DC to disarm */
  disarmCheck: string;
  /** Damage, conditions, or other effects on trigger */
  effect: string;
  /** Challenge Rating equivalent */
  cr: number;
}

// ---------------------------------------------------------------------------
// generateNPC
// ---------------------------------------------------------------------------

/**
 * Generate a random NPC with name, appearance, personality, and a secret.
 * Results are suitable for immediate use at the table.
 *
 * @param options.race        - Species/race hint (e.g. "dwarf", "tiefling")
 * @param options.role        - Social role (e.g. "innkeeper", "merchant", "guard")
 * @param options.disposition - Default attitude toward the party
 * @param options.setting     - Campaign setting for flavour (e.g. "dark gothic")
 * @returns A fully generated NPC object
 */
export async function generateNPC(options: {
  race?: string;
  role?: string;
  disposition?: string;
  setting?: string;
}): Promise<GeneratedNPC> {
  const client = getClient();
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
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as GeneratedNPC;
  } catch {
    // Fallback NPC
    return {
      name: 'Mira Ashvale',
      race: race === 'any' ? 'Human' : race,
      role,
      appearance: 'A weathered figure with sharp eyes that miss nothing.',
      personality: 'Cautious, pragmatic, and unexpectedly kind when trust is earned.',
      secret: 'She owes a dangerous debt to a thieves\' guild.',
      speechPattern: 'Speaks in short sentences. Pauses before answering questions.',
      disposition: disposition as GeneratedNPC['disposition'],
    };
  }
}

// ---------------------------------------------------------------------------
// generateLocation
// ---------------------------------------------------------------------------

/**
 * Generate a detailed location description with points of interest and hooks.
 *
 * @param options.type       - Location archetype
 * @param options.tone       - Campaign tone for atmospheric flavour
 * @param options.partyLevel - Used to calibrate encounter difficulty hints
 * @returns A fully generated location object
 */
export async function generateLocation(options: {
  type: 'tavern' | 'dungeon' | 'city' | 'wilderness' | 'castle' | 'temple';
  tone: string;
  partyLevel: number;
}): Promise<GeneratedLocation> {
  const client = getClient();
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
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.85,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as GeneratedLocation;
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

/**
 * Generate a complete adventure hook tied to player backstories.
 *
 * @param options.partyLevel       - Average party level
 * @param options.tone             - Campaign tone
 * @param options.playerBackstories - Array of player backstory summaries
 * @returns A fully generated adventure hook
 */
export async function generateHook(options: {
  partyLevel: number;
  tone: string;
  playerBackstories: string[];
}): Promise<AdventureHook> {
  const client = getClient();
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
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 350,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as AdventureHook;
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

/**
 * Generate a trap with mechanics and read-aloud text.
 *
 * @param options.cr          - Challenge rating equivalent (influences lethality)
 * @param options.type        - Trap mechanism type (e.g. "poison dart", "pit", "magical")
 * @param options.environment - Where the trap is located (affects flavour)
 * @returns A fully generated trap with game mechanics
 */
export async function generateTrap(options: {
  cr: number;
  type: string;
  environment: string;
}): Promise<GeneratedTrap> {
  const client = getClient();
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
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 250,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as GeneratedTrap;
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

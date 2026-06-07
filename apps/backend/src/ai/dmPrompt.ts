/**
 * dmPrompt.ts
 * Master system prompt builder for the TavernTable AI Dungeon Master.
 * This is the "soul" of the AI DM — it defines personality, tone, rules knowledge,
 * and narrative constraints that shape every response Claude produces.
 */

// ---------------------------------------------------------------------------
// Core context interfaces
// ---------------------------------------------------------------------------

export interface PlayerContext {
  /** Player's real name (used for language detection) */
  name: string;
  /** In-world character name */
  characterName: string;
  species: string;
  class: string;
  level: number;
  /** Short backstory paragraph */
  backstory: string;
  /** DM's private notes on personality, motivations, hooks */
  personalityNotes: string;
  currentHP: number;
  maxHP: number;
  /** Active conditions: "Poisoned", "Frightened", "Prone", etc. */
  conditions: string[];
}

export interface NPCRelationship {
  npcName: string;
  disposition: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'ally';
  /** Human-readable summary of the last meaningful interaction */
  lastInteraction: string;
  /** Private DM notes: secrets, motivations, stat block hints */
  notes: string;
}

export interface WorldEvent {
  id: string;
  /** Unix ms timestamp */
  timestamp: number;
  type: 'combat' | 'roleplay' | 'discovery' | 'death' | 'levelup' | 'major';
  description: string;
  involvedCharacters: string[];
}

export interface EncounterContext {
  type: 'combat' | 'social' | 'exploration' | 'puzzle';
  description: string;
  /** Active combatant names in initiative order */
  initiativeOrder?: string[];
  currentRound?: number;
  partyConditions?: string;
}

export interface CombatEvent {
  actorName: string;
  actionType: 'attack' | 'spell' | 'ability' | 'movement' | 'dodge' | 'help' | 'item';
  targetName?: string;
  /** e.g. "hits for 14 slashing damage", "misses", "saves against the spell" */
  outcome: string;
  isCritical?: boolean;
  isDowned?: boolean;
}

export interface CampaignContext {
  sessionId: string;
  campaignName: string;
  tone: 'heroic' | 'gritty' | 'comedic' | 'horror' | 'mystery';
  /** Free-text: "high fantasy Faerûn", "dark gothic Ravenloft", "nautical swashbuckling" */
  setting: string;
  /** One paragraph describing the current scene/location */
  currentScene: string;
  players: PlayerContext[];
  npcRelationships: NPCRelationship[];
  /** Significant world events, newest first */
  worldEvents: WorldEvent[];
  /** Last 20 significant in-session moments (plain text) */
  sessionHistory: string[];
  currentEncounter?: EncounterContext;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Detect whether the session is likely Hebrew-language based on player names */
function detectHebrew(players: PlayerContext[]): boolean {
  const hebrewRange = /[֐-׿]/;
  return players.some(
    (p) => hebrewRange.test(p.name) || hebrewRange.test(p.characterName),
  );
}

/** Map tone to a rich personality descriptor */
function toneDescriptor(tone: CampaignContext['tone']): string {
  const map: Record<CampaignContext['tone'], string> = {
    heroic:
      'epic and inspiring — moments of triumph feel legendary, sacrifices are honoured, hope always flickers even in darkness',
    gritty:
      'raw and grounded — wounds hurt, choices have weight, morality is grey, and survival is never guaranteed',
    comedic:
      'light-hearted and witty — lean into absurdity, puns are welcome, pratfalls are fair game, but never mock a player sincerely',
    horror:
      'slow-burn dread — emphasise the unknown, describe what is *heard* before what is *seen*, let silence be a weapon',
    mystery:
      'atmospheric and cryptic — drop clues like breadcrumbs, let players feel clever when they connect dots, keep secrets layered',
  };
  return map[tone];
}

/** Format a player for the system prompt */
function formatPlayer(p: PlayerContext): string {
  const hpPct = Math.round((p.currentHP / p.maxHP) * 100);
  const hpStatus =
    hpPct > 75 ? 'healthy' : hpPct > 50 ? 'lightly wounded' : hpPct > 25 ? 'bloodied' : 'critically wounded';
  const conditions = p.conditions.length ? ` [${p.conditions.join(', ')}]` : '';
  return `- **${p.characterName}** (${p.species} ${p.class} ${p.level}) — ${hpStatus}${conditions}
    Player: ${p.name} | Backstory hook: ${p.backstory}
    Personality: ${p.personalityNotes}`;
}

/** Format NPC relationships */
function formatNPCs(npcs: NPCRelationship[]): string {
  if (!npcs.length) return 'No notable NPCs established yet.';
  return npcs
    .map(
      (n) =>
        `- **${n.npcName}** [${n.disposition.toUpperCase()}]: ${n.lastInteraction}`,
    )
    .join('\n');
}

/** Format recent history */
function formatHistory(history: string[]): string {
  if (!history.length) return 'This is the very start of the campaign.';
  return history.map((h, i) => `${i + 1}. ${h}`).join('\n');
}

// ---------------------------------------------------------------------------
// Public prompt builders
// ---------------------------------------------------------------------------

/**
 * Build the full Claude system prompt for the AI Dungeon Master.
 * This is injected as the `system` parameter in every Anthropic API call.
 *
 * @param context - Full campaign context including players, world state, and tone
 * @returns A richly detailed system prompt string
 */
export function buildSystemPrompt(context: CampaignContext): string {
  const isHebrew = detectHebrew(context.players);
  const langNote = isHebrew
    ? '\n\n**LANGUAGE**: The players appear to be Hebrew-speaking. Respond entirely in Hebrew (עברית), matching their register and tone. Use Hebrew fantasy vocabulary where natural.'
    : '';

  const playerList = context.players.map(formatPlayer).join('\n');
  const npcList = formatNPCs(context.npcRelationships);
  const historyList = formatHistory(context.sessionHistory);

  const encounterBlock = context.currentEncounter
    ? `\n## Current Encounter\nType: ${context.currentEncounter.type}\n${context.currentEncounter.description}${
        context.currentEncounter.initiativeOrder?.length
          ? `\nInitiative: ${context.currentEncounter.initiativeOrder.join(' → ')} (Round ${context.currentEncounter.currentRound ?? 1})`
          : ''
      }`
    : '';

  return `You are the Dungeon Master for **${context.campaignName}**, a Dungeons & Dragons 5th Edition (2024 rules) campaign set in ${context.setting}.

Your tone is ${toneDescriptor(context.tone)}.

Adapt dynamically: if players lean into seriousness, honour that gravity; if they go off-script with humour, ride the wave without breaking immersion entirely. Mirror their energy while maintaining narrative coherence.${langNote}

---

## Your Role

You are not a storyteller who railroads players — you are a **reactive world**. Players have agency over their characters; you control everything else. When a player declares an action, adjudicate it fairly, narrate the outcome vividly, and present the world's response. Always leave the player in the driver's seat.

**Never:**
- Decide what a player's character does, thinks, or feels without explicit permission
- Block creative solutions with "that's not possible" — find a way to make it work or ask for a roll
- Repeat the same descriptive phrases across responses
- Ignore a character's backstory when it is clearly relevant

**Always:**
- End regular narration with an implicit or explicit "What do you do?" or a clear choice
- Reference player backstories naturally when the moment earns it (not every response)
- Acknowledge current HP/conditions when they are dramatically relevant
- Be consistent with established fiction — if a door was locked, it stays locked until opened

---

## D&D 5e 2024 Rules Reference

Apply these rules accurately when adjudicating:

**Core changes from 2014:**
- Species (not Race) — no ability score increases from species; ASIs come from **Background**
- Backgrounds grant: +2 to one ability, +1 to another, plus an Origin feat
- Weapon Mastery properties (Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex) — apply automatically to equipped weapons the character has proficiency with
- Subclasses are chosen at **level 3** for all classes

**Combat rules:**
- Surprise: surprised creatures have **Disadvantage on their Initiative roll** (they do NOT lose their turn)
- Death saves: 3 successes = stabilised, 3 failures = dead; a natural 20 = regain 1 HP
- Critical hits: double the number of damage dice rolled
- Grapple / Shove: Strength (Athletics) vs. target's choice of Athletics or Acrobatics
- Ready action: holds until the trigger condition occurs or start of next turn

**Conditions & effects:**
- Exhaustion: each level imposes **−2 to all d20 Tests** (attack rolls, ability checks, saving throws); level 6 = death
- Concentration: broken by taking damage (Con save DC 10 or half damage, whichever is higher)
- Prone: melee attacks against prone = Advantage; ranged = Disadvantage; costs half movement to stand

**Resting:**
- Short rest (1 hour): players spend Hit Dice to recover HP; some class features recharge
- Long rest (8 hours): full HP recovery, all spell slots restored, most features recharge
- Interrupted long rest can be resumed (must complete 8 total hours)

**Potions & items:**
- Drinking a Healing Potion yourself: **Bonus Action**
- Administering a Healing Potion to another: **Action**

**Spellcasting:**
- Upcasting: specify when a spell's effects scale with slot level
- Concentration maximum: 1 concentration spell at a time
- Material components: ignore unless the spell specifies a cost or the component is consumed

---

## The Party

${playerList}

---

## NPC Relationships

${npcList}

---

## Session History (Most Recent)

${historyList}

---
${encounterBlock}

## Current Scene

${context.currentScene}

---

## Narration Guidelines

**Length:**
- Regular narration: **maximum 200 words**. Be vivid but tight. Every sentence should earn its place.
- Combat narration (per action): **1–2 sentences maximum**. Punchy and kinetic.
- Scene descriptions (new location): up to 150 words. Engage at least 3 senses.
- NPC dialogue: stay in character; keep speeches under 60 words unless dramatically justified.

**Structure:**
- Open with action/consequence, not exposition
- Layer sensory details: sight, sound, smell, temperature, texture
- Use active voice; avoid passive constructions
- Name characters by name, not "the fighter" or "the player"

**Tone calibration:**
- ${context.tone === 'heroic' ? 'Use elevated language for moments of triumph. Let victories resonate.' : ''}
- ${context.tone === 'gritty' ? 'Consequences linger. Describe physical exhaustion and emotional weight.' : ''}
- ${context.tone === 'comedic' ? 'Timing matters. Set up the absurd straight-faced, then let it land.' : ''}
- ${context.tone === 'horror' ? 'Withhold information. Imply rather than show. Silence is terrifying.' : ''}
- ${context.tone === 'mystery' ? 'Every answer raises a new question. The players should feel like detectives.' : ''}

Remember: you are the world, not the author. Narrate consequences, not scripts.`;
}

/**
 * Build a user-turn prompt for a player declaring an action.
 * This wraps the raw player action with character context for clarity.
 *
 * @param userAction - The raw player action text (e.g. "I try to pick the lock")
 * @param context    - Full campaign context
 * @returns Formatted prompt string for the user turn
 */
export function buildNarrationPrompt(
  userAction: string,
  context: CampaignContext,
): string {
  // Find relevant player if we can detect them (heuristic: first-person phrasing)
  const scene = context.currentScene;
  return `[Scene: ${scene}]

${userAction}`;
}

/**
 * Build a concise combat narration prompt.
 * Instructs Claude to stay under 2 sentences — fast, punchy, kinetic.
 *
 * @param combatEvent - Structured description of what just happened in combat
 * @param context     - Campaign context for tone and character names
 * @returns Formatted prompt string for combat narration
 */
export function buildCombatNarrationPrompt(
  combatEvent: CombatEvent,
  context: CampaignContext,
): string {
  const critNote = combatEvent.isCritical ? ' [CRITICAL HIT — make it spectacular]' : '';
  const downNote = combatEvent.isDowned
    ? ` [${combatEvent.targetName ?? 'the target'} is now unconscious/dying — mark the weight of this moment]`
    : '';

  return `Combat narration (${context.tone} tone, 1–2 sentences max):
${combatEvent.actorName} uses ${combatEvent.actionType}${combatEvent.targetName ? ` against ${combatEvent.targetName}` : ''} — ${combatEvent.outcome}.${critNote}${downNote}`;
}

/**
 * D&D 5e 2024 Edition — Core Rules Constants & Helpers
 * Source: 2024 Player's Handbook & Dungeon Master's Guide
 */

// ── Conditions ────────────────────────────────────────────────────────────────

export interface ConditionDefinition {
  name: string;
  icon: string;
  effects: string[];
}

export const CONDITIONS: Record<string, ConditionDefinition> = {
  blinded: {
    name: 'Blinded',
    icon: '👁️',
    effects: [
      "Can't see; auto-fail sight-based checks",
      'Attacks against you have Advantage',
      'Your attacks have Disadvantage',
    ],
  },
  charmed: {
    name: 'Charmed',
    icon: '💕',
    effects: [
      "Can't attack or target the charmer with harmful abilities",
      'Charmer has Advantage on social checks against you',
    ],
  },
  deafened: {
    name: 'Deafened',
    icon: '🔇',
    effects: [
      "Can't hear; auto-fail hearing-based checks",
    ],
  },
  exhaustion: {
    name: 'Exhaustion',
    icon: '😓',
    effects: [
      'Level 1–5: –2 to all d20 Tests per level, –5 speed per level',
      'Level 6: Death',
      'Each Long Rest removes 1 level',
    ],
  },
  frightened: {
    name: 'Frightened',
    icon: '😨',
    effects: [
      'Disadvantage on checks and attacks while source is in sight',
      "Can't willingly move closer to the source of fear",
    ],
  },
  grappled: {
    name: 'Grappled',
    icon: '🤝',
    effects: [
      'Speed becomes 0',
      'Disadvantage on attacks against creatures other than grappler',
    ],
  },
  incapacitated: {
    name: 'Incapacitated',
    icon: '🚫',
    effects: [
      'No Actions, Bonus Actions, or Reactions',
      "Can't speak",
      'Breaks Concentration',
    ],
  },
  invisible: {
    name: 'Invisible',
    icon: '👻',
    effects: [
      "Can't be seen without magic or special senses",
      'Attacks against you have Disadvantage',
      'Your attacks have Advantage',
    ],
  },
  paralyzed: {
    name: 'Paralyzed',
    icon: '⚡',
    effects: [
      'Incapacitated + Speed 0',
      'Auto-fail STR and DEX saving throws',
      'Attacks against you have Advantage',
      'Hits within 5 ft are automatic critical hits',
    ],
  },
  petrified: {
    name: 'Petrified',
    icon: '🗿',
    effects: [
      'Incapacitated + Speed 0',
      'Attacks against you have Advantage',
      'Auto-fail STR and DEX saving throws',
      'Resistance to all damage',
      'Immune to Poison and Disease (existing ones paused)',
    ],
  },
  poisoned: {
    name: 'Poisoned',
    icon: '🤢',
    effects: [
      'Disadvantage on attack rolls',
      'Disadvantage on ability checks',
    ],
  },
  prone: {
    name: 'Prone',
    icon: '⬇️',
    effects: [
      'Can only crawl (costs 2 ft per ft) or spend half Speed to stand',
      'Disadvantage on your attack rolls',
      'Melee attacks against you have Advantage',
      'Ranged attacks against you have Disadvantage',
    ],
  },
  restrained: {
    name: 'Restrained',
    icon: '⛓️',
    effects: [
      'Speed becomes 0',
      'Attacks against you have Advantage',
      'Your attacks have Disadvantage',
      'Disadvantage on DEX saving throws',
    ],
  },
  stunned: {
    name: 'Stunned',
    icon: '💫',
    effects: [
      'Incapacitated + auto-fail STR and DEX saving throws',
      'Attacks against you have Advantage',
    ],
  },
  unconscious: {
    name: 'Unconscious',
    icon: '💤',
    effects: [
      'Incapacitated + Prone + drop held items',
      'Speed 0, unaware of surroundings',
      'Attacks against you have Advantage',
      'Auto-fail STR and DEX saving throws',
      'Hits within 5 ft are automatic critical hits',
    ],
  },
};

export const CONDITION_NAMES = Object.keys(CONDITIONS) as Array<keyof typeof CONDITIONS>;

// ── Encounter XP Budgets (2024 DMG) — per character ──────────────────────────

export interface XPBudget {
  low: number;
  moderate: number;
  high: number;
}

export const ENCOUNTER_XP_BUDGET: Record<number, XPBudget> = {
  1:  { low: 50,   moderate: 75,    high: 100   },
  2:  { low: 100,  moderate: 150,   high: 200   },
  3:  { low: 150,  moderate: 225,   high: 400   },
  4:  { low: 250,  moderate: 375,   high: 500   },
  5:  { low: 500,  moderate: 750,   high: 1100  },
  6:  { low: 600,  moderate: 1000,  high: 1400  },
  7:  { low: 750,  moderate: 1300,  high: 1700  },
  8:  { low: 1000, moderate: 1700,  high: 2100  },
  9:  { low: 1300, moderate: 2000,  high: 2600  },
  10: { low: 1600, moderate: 2300,  high: 3100  },
  11: { low: 1900, moderate: 2900,  high: 4100  },
  12: { low: 2200, moderate: 3700,  high: 4700  },
  13: { low: 2600, moderate: 4200,  high: 5400  },
  14: { low: 2900, moderate: 4900,  high: 6200  },
  15: { low: 3300, moderate: 5400,  high: 7800  },
  16: { low: 3800, moderate: 6100,  high: 9800  },
  17: { low: 4500, moderate: 7200,  high: 11700 },
  18: { low: 5000, moderate: 8700,  high: 14200 },
  19: { low: 5500, moderate: 10700, high: 17200 },
  20: { low: 6400, moderate: 13200, high: 22000 },
};

// ── CR to XP ──────────────────────────────────────────────────────────────────

export const CR_TO_XP: Record<string, number> = {
  '0':    10,
  '1/8':  25,
  '0.125': 25,
  '1/4':  50,
  '0.25': 50,
  '1/2':  100,
  '0.5':  100,
  '1':    200,
  '2':    450,
  '3':    700,
  '4':    1100,
  '5':    1800,
  '6':    2300,
  '7':    2900,
  '8':    3900,
  '9':    5000,
  '10':   5900,
  '11':   7200,
  '12':   8400,
  '13':   10000,
  '14':   11500,
  '15':   13000,
  '16':   15000,
  '17':   18000,
  '18':   20000,
  '19':   22000,
  '20':   25000,
};

// ── DC Table ──────────────────────────────────────────────────────────────────

export interface DCEntry {
  label: string;
  dc: number;
}

export const DC_TABLE: DCEntry[] = [
  { label: 'Very Easy',  dc: 5  },
  { label: 'Easy',       dc: 10 },
  { label: 'Medium',     dc: 15 },
  { label: 'Hard',       dc: 20 },
  { label: 'Very Hard',  dc: 25 },
  { label: 'Nearly Impossible', dc: 30 },
];

// ── Death Saving Throw Rules ──────────────────────────────────────────────────

export const DEATH_SAVE_RULES = {
  successThreshold: 3,
  failureThreshold: 3,
  successMinRoll: 10,
  natural20Effect: 'Regain 1 HP and regain consciousness',
  natural1Effect: '2 failures counted',
  stableEffect: 'Unconscious but stable — stop rolling',
  deadEffect: 'Character dies',
  healingEffect: 'Any healing resets count and restores HP',
  noModifiers: true,
} as const;

// ── Rest Rules ────────────────────────────────────────────────────────────────

export const REST_RULES = {
  short: {
    duration: '1 hour',
    benefits: [
      'Spend any number of Hit Dice (roll die + CON modifier)',
      'Regain HP equal to dice rolled',
      'Some class features recharge',
    ],
  },
  long: {
    duration: '8 hours (no more than 1 hour of strenuous activity)',
    benefits: [
      'Regain all lost HP',
      'Regain ALL spent Hit Dice (2024 rule change)',
      'Restore all expended spell slots',
      'Remove 1 level of Exhaustion',
    ],
  },
} as const;

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Convert a CR string or number to its XP value.
 * Handles fractional CRs like 0.25, 0.5, "1/4", "1/2", etc.
 */
export function crToXP(cr: string | number): number {
  const key = String(cr);
  if (CR_TO_XP[key] !== undefined) return CR_TO_XP[key];
  // Numeric fallback
  const num = Number(cr);
  if (!isNaN(num)) {
    if (num === 0)    return 10;
    if (num <= 0.125) return 25;
    if (num <= 0.25)  return 50;
    if (num <= 0.5)   return 100;
    const rounded = Math.round(num);
    return CR_TO_XP[String(rounded)] ?? 0;
  }
  return 0;
}

/**
 * Concentration saving throw DC = max(10, floor(damage / 2)), capped at 30.
 */
export function concentrationDC(damageTaken: number): number {
  return Math.min(30, Math.max(10, Math.floor(damageTaken / 2)));
}

/**
 * Determine encounter difficulty using 2024 DMG XP budgets.
 * totalXP = sum of all monster XP (no multiplier in 2024 rules).
 */
export function getEncounterDifficulty(
  partyLevel: number,
  partySize: number,
  totalXP: number,
): 'Low' | 'Moderate' | 'High' | 'Above High' {
  const level = Math.max(1, Math.min(20, partyLevel));
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const budget = ENCOUNTER_XP_BUDGET[level]!;
  const low      = budget.low      * partySize;
  const moderate = budget.moderate * partySize;
  const high     = budget.high     * partySize;

  if (totalXP < low)      return 'Low';
  if (totalXP < moderate) return 'Moderate';
  if (totalXP < high)     return 'High';
  return 'Above High';
}

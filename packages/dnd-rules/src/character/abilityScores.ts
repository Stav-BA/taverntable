/**
 * Ability Scores — D&D 5e 2024
 *
 * Covers:
 * - Modifier calculation
 * - Proficiency bonus by level
 * - Three generation methods: roll (4d6 drop lowest), standard array, point buy
 */

import { rollNd } from '../dice/roller.js';

export type AbilityScore =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export const ABILITY_SCORES: AbilityScore[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

// ─── Modifier ────────────────────────────────────────────────────────────────

/**
 * Convert an ability score to its modifier.
 * Formula: floor((score - 10) / 2)
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ─── Proficiency Bonus ───────────────────────────────────────────────────────

const PROFICIENCY_BONUS_TABLE: Record<number, number> = {
  1: 2,
  2: 2,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 3,
  8: 3,
  9: 4,
  10: 4,
  11: 4,
  12: 4,
  13: 5,
  14: 5,
  15: 5,
  16: 5,
  17: 6,
  18: 6,
  19: 6,
  20: 6,
};

/**
 * Proficiency bonus for a given character level (1–20).
 */
export function getProficiencyBonus(level: number): number {
  if (level < 1 || level > 20) {
    throw new RangeError(`Level must be between 1 and 20, got ${level}`);
  }
  return PROFICIENCY_BONUS_TABLE[level];
}

// ─── Score Generation Methods ─────────────────────────────────────────────────

export interface RolledAbilityScore {
  /** All four dice results */
  allRolls: number[];
  /** The three dice kept (highest three) */
  keptRolls: number[];
  /** The final score (sum of keptRolls) */
  score: number;
}

/**
 * Roll 4d6, drop the lowest, return all four rolls and the final score.
 */
export function rollAbilityScore(seed?: number): RolledAbilityScore {
  const allRolls = rollNd(4, 6, seed);
  const sorted = [...allRolls].sort((a, b) => b - a);
  const keptRolls = sorted.slice(0, 3);
  const score = keptRolls.reduce((s, r) => s + r, 0);
  return { allRolls, keptRolls, score };
}

/**
 * Roll a complete set of 6 ability scores (4d6 drop lowest each).
 * When a seed is provided each score gets a derived seed to stay deterministic.
 */
export function rollAbilityScoreSet(seed?: number): RolledAbilityScore[] {
  return ABILITY_SCORES.map((_, i) =>
    rollAbilityScore(seed !== undefined ? seed + i * 1000 : undefined),
  );
}

/**
 * The standard array of ability scores (2024 PHB).
 */
export function standardArray(): number[] {
  return [15, 14, 13, 12, 10, 8];
}

// ─── Point Buy ───────────────────────────────────────────────────────────────

/** Point cost to buy a given ability score (range 8–15). */
const POINT_BUY_COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

/**
 * Cost in points for a given score (8–15).
 * Throws if the score is out of range.
 */
export function pointBuyCost(score: number): number {
  if (!(score in POINT_BUY_COST_TABLE)) {
    throw new RangeError(
      `Point buy score must be between ${POINT_BUY_MIN} and ${POINT_BUY_MAX}, got ${score}`,
    );
  }
  return POINT_BUY_COST_TABLE[score];
}

/**
 * Validate that a set of ability scores is a legal point-buy allocation.
 * Returns true when valid.
 */
export function validatePointBuy(scores: Record<AbilityScore, number>): boolean {
  let total = 0;
  for (const ability of ABILITY_SCORES) {
    const score = scores[ability];
    if (score < POINT_BUY_MIN || score > POINT_BUY_MAX) return false;
    total += pointBuyCost(score);
    if (total > POINT_BUY_BUDGET) return false;
  }
  return total <= POINT_BUY_BUDGET;
}

/**
 * Calculate how many points a point-buy array spends.
 */
export function pointBuySpent(scores: Record<AbilityScore, number>): number {
  return ABILITY_SCORES.reduce((sum, a) => sum + pointBuyCost(scores[a]), 0);
}

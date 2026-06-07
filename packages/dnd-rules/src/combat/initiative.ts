/**
 * Initiative — D&D 5e 2024
 *
 * 2024 rule change: surprised creatures roll initiative with disadvantage.
 */

import { rollWithAdvantageState } from '../dice/advantage.js';
import type { AdvantageResult } from '../dice/advantage.js';

export interface InitiativeResult extends AdvantageResult {
  dexMod: number;
  surprised: boolean;
}

/**
 * Roll initiative for a creature.
 *
 * @param dexMod   – the creature's Dexterity modifier
 * @param surprised – 2024 rule: surprised creatures roll with disadvantage
 * @param seed     – optional seed for deterministic results
 */
export function rollInitiative(
  dexMod: number,
  surprised = false,
  seed?: number,
): InitiativeResult {
  const state = surprised ? 'disadvantage' : 'normal';
  const result = rollWithAdvantageState(state, dexMod, seed);
  return { ...result, dexMod, surprised };
}

/**
 * Sort a list of initiative results (descending). Ties are kept in input order
 * (stable sort). The caller is responsible for tiebreaking as needed.
 */
export function sortInitiative(results: InitiativeResult[]): InitiativeResult[] {
  return [...results].sort((a, b) => b.total - a.total);
}

/**
 * Advantage / Disadvantage rolling rules (D&D 5e 2024)
 *
 * Roll two d20s; advantage takes the higher, disadvantage the lower.
 * A natural 20 on either kept die is a critical hit.
 * A natural 1 on either kept die (when at disadvantage and the kept die is 1) is a critical fail.
 */

import { rollDice, mulberry32 } from './roller.js';
import type { DiceResult } from './roller.js';

export type AdvantageState = 'normal' | 'advantage' | 'disadvantage';

export interface AdvantageResult extends DiceResult {
  keptRoll: number;
  discardedRoll: number;
  advantageState: AdvantageState;
  isCrit: boolean;
  isCritFail: boolean;
}

/**
 * Roll a d20 with the given advantage state.
 *
 * @param state  – 'normal' | 'advantage' | 'disadvantage'
 * @param seed   – optional seed for deterministic results
 * @param modifier – modifier to add to the kept die
 */
export function rollWithAdvantageState(
  state: AdvantageState,
  modifier = 0,
  seed?: number,
): AdvantageResult {
  if (state === 'normal') {
    const result = rollDice(modifier >= 0 ? `1d20+${modifier}` : `1d20${modifier}`, seed);
    const keptRoll = result.rolls[0];
    return {
      ...result,
      keptRoll,
      discardedRoll: keptRoll,
      advantageState: state,
      isCrit: keptRoll === 20,
      isCritFail: keptRoll === 1,
    };
  }

  // Roll two d20s — give each a different seed derived from the original
  const rng = seed !== undefined ? mulberry32(seed) : Math.random;
  const roll1 = Math.floor(rng() * 20) + 1;
  const roll2 = Math.floor(rng() * 20) + 1;

  const keptRoll = state === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
  const discardedRoll = state === 'advantage' ? Math.min(roll1, roll2) : Math.max(roll1, roll2);
  const total = keptRoll + modifier;

  return {
    total,
    rolls: [roll1, roll2],
    modifier,
    notation: state === 'advantage' ? '2d20kh1' : '2d20kl1',
    keptRolls: [keptRoll],
    keptRoll,
    discardedRoll,
    advantageState: state,
    isCrit: keptRoll === 20,
    isCritFail: keptRoll === 1,
  };
}

/**
 * Roll 2d20, keep the highest (advantage).
 */
export function rollWithAdvantage(modifier = 0, seed?: number): AdvantageResult {
  return rollWithAdvantageState('advantage', modifier, seed);
}

/**
 * Roll 2d20, keep the lowest (disadvantage).
 */
export function rollWithDisadvantage(modifier = 0, seed?: number): AdvantageResult {
  return rollWithAdvantageState('disadvantage', modifier, seed);
}

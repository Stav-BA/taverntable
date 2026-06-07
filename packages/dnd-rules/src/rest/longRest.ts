/**
 * Long Rest — D&D 5e 2024
 *
 * During a long rest (at least 8 hours):
 *   - Regain all lost HP
 *   - Regain all spent Hit Dice (up to half the total, minimum 1)
 *   - Regain all spent spell slots
 *   - Remove one level of Exhaustion
 *   - Require at least 1 hour of light activity (spell casting ends the rest)
 *
 * A creature must have at least 1 HP to benefit from a long rest.
 */

import { restoreSlots } from '../spells/slots.js';
import type { CharacterState } from './shortRest.js';

export interface LongRestResult {
  /** Character state after the rest */
  state: CharacterState;
  /** HP gained */
  hpRestored: number;
  /** Hit dice regained */
  hitDiceRegained: number;
  /** Exhaustion levels removed */
  exhaustionRemoved: number;
  /** Whether spell slots were restored */
  slotsRestored: boolean;
}

/**
 * Complete a long rest.
 *
 * @param state – character state before the rest
 */
export function longRest(state: CharacterState): LongRestResult {
  if (state.currentHP <= 0) {
    throw new Error(`${state.name} must have at least 1 HP to benefit from a long rest`);
  }

  const hpBefore = state.currentHP;

  // 1. Full HP restore
  let newState: CharacterState = { ...state, currentHP: state.maxHP, tempHP: 0 };

  // 2. Regain hit dice: up to half the total (round down, minimum 1)
  const diceToRegain = Math.max(1, Math.floor(state.hitDice.total / 2));
  const hitDiceRegained = Math.min(diceToRegain, state.hitDice.total - state.hitDice.remaining);
  newState = {
    ...newState,
    hitDice: {
      ...newState.hitDice,
      remaining: Math.min(newState.hitDice.total, newState.hitDice.remaining + hitDiceRegained),
    },
  };

  // 3. Restore all spell slots
  let slotsRestored = false;
  if (newState.spellSlots) {
    newState = {
      ...newState,
      spellSlots: restoreSlots(newState.spellSlots, 'long', newState.className),
    };
    slotsRestored = true;
  }

  // 4. Remove one level of exhaustion (2024 rules)
  const exhaustionRemoved = newState.exhaustionLevel > 0 ? 1 : 0;
  newState = {
    ...newState,
    exhaustionLevel: Math.max(0, newState.exhaustionLevel - 1),
  };

  return {
    state: newState,
    hpRestored: newState.currentHP - hpBefore,
    hitDiceRegained,
    exhaustionRemoved,
    slotsRestored,
  };
}

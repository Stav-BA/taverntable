/**
 * Short Rest — D&D 5e 2024
 *
 * During a short rest (at least 1 hour):
 *   - Spend any number of Hit Dice to recover HP
 *   - Warlock regains all Pact Magic slots
 *   - Some class features recharge (tracked by the VTT, not here)
 *
 * This module handles the HP recovery math and state mutation.
 */

import { rollDice } from '../dice/roller.js';
import type { DiceResult } from '../dice/roller.js';
import { restoreSlots } from '../spells/slots.js';
import type { SpellSlotTable } from '../spells/slots.js';

export interface HitDicePool {
  /** Hit die size (e.g. 8 for d8) */
  dieSize: number;
  /** Total hit dice available (equals character level for single-class) */
  total: number;
  /** Hit dice remaining (not yet spent) */
  remaining: number;
}

export interface CharacterState {
  /** Character name for display */
  name: string;
  /** Current HP */
  currentHP: number;
  /** Maximum HP */
  maxHP: number;
  /** Temporary HP */
  tempHP: number;
  /** Hit dice pool */
  hitDice: HitDicePool;
  /** Constitution modifier */
  conMod: number;
  /** Current spell slots (undefined if non-caster) */
  spellSlots?: SpellSlotTable;
  /** Class name (for spell slot recovery) */
  className: string;
  /** Current exhaustion level (0–6) */
  exhaustionLevel: number;
}

export interface HitDieRoll {
  roll: DiceResult;
  hpGained: number;
  hitDiceSpent: number;
}

/**
 * Spend a single hit die during a short rest, gaining HP.
 *
 * @param state – current character state
 * @param seed  – optional seed for determinism
 */
export function spendHitDie(state: CharacterState, seed?: number): { state: CharacterState; result: HitDieRoll } {
  if (state.hitDice.remaining <= 0) {
    throw new Error(`${state.name} has no hit dice remaining to spend`);
  }
  if (state.currentHP >= state.maxHP) {
    throw new Error(`${state.name} is already at maximum HP`);
  }

  const roll = rollDice(`1d${state.hitDice.dieSize}`, seed);
  const hpGained = Math.max(0, roll.total + state.conMod);
  const newHP = Math.min(state.maxHP, state.currentHP + hpGained);

  const newState: CharacterState = {
    ...state,
    currentHP: newHP,
    hitDice: {
      ...state.hitDice,
      remaining: state.hitDice.remaining - 1,
    },
  };

  return {
    state: newState,
    result: {
      roll,
      hpGained: newHP - state.currentHP,
      hitDiceSpent: 1,
    },
  };
}

/**
 * Complete a short rest, spending a number of hit dice.
 *
 * @param state        – current character state
 * @param diceToSpend  – how many hit dice to spend (0 = none)
 * @param seeds        – optional array of seeds (one per die)
 */
export function shortRest(
  state: CharacterState,
  diceToSpend: number,
  seeds?: number[],
): CharacterState {
  if (diceToSpend < 0) throw new RangeError('diceToSpend must be >= 0');
  const actualDice = Math.min(diceToSpend, state.hitDice.remaining);

  let current = state;

  for (let i = 0; i < actualDice; i++) {
    const seed = seeds ? seeds[i] : undefined;
    const { state: next } = spendHitDie(current, seed);
    current = next;
    if (current.currentHP >= current.maxHP) break;
  }

  // Restore Warlock pact slots
  if (current.spellSlots && current.className.toLowerCase() === 'warlock') {
    current = {
      ...current,
      spellSlots: restoreSlots(current.spellSlots, 'short', current.className),
    };
  }

  return current;
}

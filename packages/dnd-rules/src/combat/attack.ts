/**
 * Attack Rolls, Hit/Miss, Damage — D&D 5e 2024
 */

import { rollWithAdvantageState } from '../dice/advantage.js';
import { rollDice } from '../dice/roller.js';
import type { DiceResult } from '../dice/roller.js';
import type { AdvantageState } from '../dice/advantage.js';

export type ArmorType = 'unarmored' | 'light' | 'medium' | 'heavy' | 'natural';

export interface AttackResult {
  /** The d20 roll result */
  d20Result: number;
  /** All dice rolled (2 when advantage/disadvantage) */
  allD20Rolls: number[];
  /** Total attack roll (d20 + attack bonus) */
  total: number;
  attackBonus: number;
  advantageState: AdvantageState;
  /** Natural 20 on kept die */
  isCrit: boolean;
  /** Natural 1 on kept die */
  isCritFail: boolean;
  /** Did the attack hit? (set after comparing to target AC) */
  hits?: boolean;
  targetAC?: number;
}

export interface DamageResult extends DiceResult {
  isCrit: boolean;
  damageBonus: number;
  damageType?: string;
}

/**
 * Calculate Armour Class.
 *
 * @param baseAC   – the base AC (armour value, natural armour, etc.)
 * @param dexMod   – Dexterity modifier
 * @param armorType – limits how much Dex applies
 */
export function calculateAC(baseAC: number, dexMod: number, armorType: ArmorType): number {
  switch (armorType) {
    case 'unarmored':
      // e.g. 10 + Dex (barbarian/monk override this with own formula)
      return baseAC + dexMod;
    case 'light':
      // Full Dex bonus
      return baseAC + dexMod;
    case 'medium':
      // Max +2 Dex
      return baseAC + Math.min(dexMod, 2);
    case 'heavy':
      // No Dex
      return baseAC;
    case 'natural':
      // Natural armour: AC = base + Dex (treated like unarmored for Dex)
      return baseAC + dexMod;
  }
}

/**
 * Roll an attack roll.
 *
 * @param attackBonus   – total attack bonus (proficiency + ability modifier + magic bonus)
 * @param advantageState – advantage, disadvantage, or normal
 * @param seed          – optional seed
 */
export function rollAttack(
  attackBonus: number,
  advantageState: AdvantageState = 'normal',
  seed?: number,
): AttackResult {
  const roll = rollWithAdvantageState(advantageState, attackBonus, seed);

  return {
    d20Result: roll.keptRoll,
    allD20Rolls: roll.rolls,
    total: roll.total,
    attackBonus,
    advantageState,
    isCrit: roll.keptRoll === 20,
    isCritFail: roll.keptRoll === 1,
  };
}

/**
 * Determine whether an attack hits given a target AC.
 * A natural 1 always misses; a natural 20 always hits.
 */
export function resolveHit(attack: AttackResult, targetAC: number): AttackResult {
  let hits: boolean;
  if (attack.isCritFail) {
    hits = false;
  } else if (attack.isCrit) {
    hits = true;
  } else {
    hits = attack.total >= targetAC;
  }
  return { ...attack, hits, targetAC };
}

/**
 * Roll damage for an attack.
 *
 * On a critical hit, all damage dice are doubled (2024 rules: roll twice the
 * number of dice, not maximise then add).
 *
 * @param damageDice  – notation like "1d8" or "2d6"
 * @param damageBonus – flat damage modifier
 * @param isCrit      – whether this is a critical hit
 * @param damageType  – optional damage type string
 * @param seed        – optional seed
 */
export function rollDamage(
  damageDice: string,
  damageBonus: number,
  isCrit: boolean,
  damageType?: string,
  seed?: number,
): DamageResult {
  const effectiveNotation = isCrit ? doubleDiceNotation(damageDice) : damageDice;
  // Add modifier
  const modSuffix =
    damageBonus !== 0
      ? (damageBonus > 0 ? `+${damageBonus}` : `${damageBonus}`)
      : '';
  const notation = `${effectiveNotation}${modSuffix}`;
  const result = rollDice(notation, seed);
  return {
    ...result,
    isCrit,
    damageBonus,
    damageType,
  };
}

/**
 * Double the number of dice in a notation string (for critical hits).
 * e.g. "1d8" → "2d8", "2d6" → "4d6"
 */
function doubleDiceNotation(notation: string): string {
  // Handle simple NdS patterns (no keep notation — damage dice don't use kh/kl)
  const match = notation.trim().match(/^(\d+)d(\d+)$/i);
  if (match) {
    const count = parseInt(match[1], 10) * 2;
    return `${count}d${match[2]}`;
  }
  throw new Error(`Cannot double dice notation "${notation}": unsupported format`);
}

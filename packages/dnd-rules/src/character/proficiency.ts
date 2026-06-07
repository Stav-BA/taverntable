/**
 * Proficiency-related utilities — D&D 5e 2024
 */

import { getProficiencyBonus } from './abilityScores.js';

export type ProficiencyLevel = 'none' | 'half' | 'proficient' | 'expert';

/**
 * Calculate the effective bonus for a given proficiency level and character level.
 *
 * - none      → 0
 * - half      → floor(proficiency / 2) (Bard's Jack of All Trades, etc.)
 * - proficient → full proficiency bonus
 * - expert    → proficiency bonus × 2 (Expertise)
 */
export function proficiencyBonusForLevel(
  characterLevel: number,
  proficiencyLevel: ProficiencyLevel,
): number {
  const base = getProficiencyBonus(characterLevel);
  switch (proficiencyLevel) {
    case 'none':
      return 0;
    case 'half':
      return Math.floor(base / 2);
    case 'proficient':
      return base;
    case 'expert':
      return base * 2;
  }
}

/**
 * Calculate a skill / save check bonus.
 *
 * @param abilityMod       – the relevant ability modifier
 * @param characterLevel   – character level (1–20)
 * @param profLevel        – proficiency level in this skill
 */
export function skillBonus(
  abilityMod: number,
  characterLevel: number,
  profLevel: ProficiencyLevel,
): number {
  return abilityMod + proficiencyBonusForLevel(characterLevel, profLevel);
}

/** Re-export for convenience. */
export { getProficiencyBonus } from './abilityScores.js';

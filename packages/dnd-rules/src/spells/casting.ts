/**
 * Casting Rules & Concentration — D&D 5e 2024
 */

import { rollWithAdvantageState } from '../dice/advantage.js';
import type { AdvantageResult } from '../dice/advantage.js';

// ─── Concentration ────────────────────────────────────────────────────────────

export interface ConcentrationState {
  /** The name of the spell being concentrated on */
  spellName: string;
  /** Whether the caster has the War Caster feat (advantage on Con saves) */
  hasWarCaster: boolean;
  /** Whether the caster has the Resilient (Constitution) feat (proficiency on Con saves) */
  hasResilientConstitution: boolean;
  /** The caster's Constitution modifier */
  conMod: number;
  /** Proficiency bonus (for Resilient Con) */
  proficiencyBonus: number;
}

export interface ConcentrationCheckResult {
  /** The d20 result for the saving throw */
  roll: AdvantageResult;
  /** DC for the check (max(10, half damage)) */
  dc: number;
  /** Whether the concentration was maintained */
  maintained: boolean;
  /** Total save value (roll + modifiers) */
  saveTotal: number;
}

/**
 * Roll a Concentration saving throw.
 *
 * DC = max(10, floor(damageTaken / 2))
 * War Caster feat: advantage on the save
 * Incapacitated: automatically fail (caller should check conditions first)
 *
 * @param damageTaken   – HP damage that triggered the check
 * @param state         – concentration state
 * @param seed          – optional seed
 */
export function rollConcentrationCheck(
  damageTaken: number,
  state: ConcentrationState,
  seed?: number,
): ConcentrationCheckResult {
  const dc = Math.max(10, Math.floor(damageTaken / 2));

  const advantageState = state.hasWarCaster ? 'advantage' : 'normal';

  let modifier = state.conMod;
  if (state.hasResilientConstitution) {
    modifier += state.proficiencyBonus;
  }

  const roll = rollWithAdvantageState(advantageState, modifier, seed);
  const saveTotal = roll.total;
  const maintained = saveTotal >= dc;

  return { roll, dc, maintained, saveTotal };
}

// ─── Spell Levels & Upcasting ─────────────────────────────────────────────────

export interface SpellCastOptions {
  /** The base level of the spell (1–9) */
  baseLevel: number;
  /** The slot level used to cast (>= baseLevel) */
  castLevel: number;
}

/**
 * Validate that a spell can be upcast at the chosen level.
 */
export function validateCastLevel(options: SpellCastOptions): boolean {
  if (options.castLevel < options.baseLevel) return false;
  if (options.castLevel < 1 || options.castLevel > 9) return false;
  return true;
}

/**
 * How many extra levels the spell is upcast by.
 */
export function upcasting(options: SpellCastOptions): number {
  if (!validateCastLevel(options)) return 0;
  return options.castLevel - options.baseLevel;
}

// ─── Cantrip Scaling ──────────────────────────────────────────────────────────

/**
 * Cantrip dice scale with total character level (not class level).
 * Returns the number of dice for a cantrip at the given total level.
 *
 * Levels 1–4  → 1 die
 * Levels 5–10 → 2 dice
 * Levels 11–16 → 3 dice
 * Levels 17–20 → 4 dice
 */
export function cantripDiceCount(totalLevel: number): number {
  if (totalLevel < 5) return 1;
  if (totalLevel < 11) return 2;
  if (totalLevel < 17) return 3;
  return 4;
}

// ─── Ritual Casting ───────────────────────────────────────────────────────────

/**
 * Check if a spell can be ritual cast (adds 10 minutes; does not expend a slot).
 * The caller verifies whether the caster class can ritual cast.
 */
export function isRitualCast(spellHasRitualTag: boolean, casterCanRitual: boolean): boolean {
  return spellHasRitualTag && casterCanRitual;
}

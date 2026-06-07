/**
 * Spell Slot Tables — D&D 5e 2024
 *
 * Full tables for all spellcasting classes:
 *   Full casters:   Bard, Cleric, Druid, Sorcerer, Wizard
 *   Half casters:   Paladin, Ranger
 *   Third casters:  Arcane Trickster (Rogue), Eldritch Knight (Fighter)
 *   Pact magic:     Warlock (separate slot mechanic)
 */

export type SpellcastingType =
  | 'full'
  | 'half'
  | 'third'
  | 'pact';

export interface SpellSlotTable {
  /** Slots available indexed 1–9 (index 0 unused) */
  slots: [0, ...number[]]; // length 10
  /** Class this table belongs to */
  className: string;
  /** Character level */
  level: number;
}

/** Warlock pact magic slots have a fixed level and multiple slots. */
export interface PactMagicTable {
  slotLevel: number;
  slotCount: number;
  className: 'warlock';
  level: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function slots(s1=0,s2=0,s3=0,s4=0,s5=0,s6=0,s7=0,s8=0,s9=0): [0,...number[]] {
  return [0, s1, s2, s3, s4, s5, s6, s7, s8, s9];
}

// ─── Full Casters (Bard / Cleric / Druid / Sorcerer / Wizard) ────────────────

const FULL_CASTER_TABLE: Record<number, [0, ...number[]]> = {
  1:  slots(2),
  2:  slots(3),
  3:  slots(4,2),
  4:  slots(4,3),
  5:  slots(4,3,2),
  6:  slots(4,3,3),
  7:  slots(4,3,3,1),
  8:  slots(4,3,3,2),
  9:  slots(4,3,3,3,1),
  10: slots(4,3,3,3,2),
  11: slots(4,3,3,3,2,1),
  12: slots(4,3,3,3,2,1),
  13: slots(4,3,3,3,2,1,1),
  14: slots(4,3,3,3,2,1,1),
  15: slots(4,3,3,3,2,1,1,1),
  16: slots(4,3,3,3,2,1,1,1),
  17: slots(4,3,3,3,2,1,1,1,1),
  18: slots(4,3,3,3,3,1,1,1,1),
  19: slots(4,3,3,3,3,2,1,1,1),
  20: slots(4,3,3,3,3,2,2,1,1),
};

const FULL_CASTER_CLASSES = new Set(['bard','cleric','druid','sorcerer','wizard']);

// ─── Half Casters (Paladin / Ranger) ─────────────────────────────────────────
// Half casters gain spell slots starting at level 2 (Paladin) or level 2 (Ranger).
// Effective caster level = floor(class level / 2).

const HALF_CASTER_TABLE: Record<number, [0, ...number[]]> = {
  1:  slots(), // no slots at level 1
  2:  slots(2),
  3:  slots(3),
  4:  slots(3),
  5:  slots(4,2),
  6:  slots(4,2),
  7:  slots(4,3),
  8:  slots(4,3),
  9:  slots(4,3,2),
  10: slots(4,3,2),
  11: slots(4,3,3),
  12: slots(4,3,3),
  13: slots(4,3,3,1),
  14: slots(4,3,3,1),
  15: slots(4,3,3,2),
  16: slots(4,3,3,2),
  17: slots(4,3,3,3,1),
  18: slots(4,3,3,3,1),
  19: slots(4,3,3,3,2),
  20: slots(4,3,3,3,2),
};

const HALF_CASTER_CLASSES = new Set(['paladin','ranger']);

// ─── Third Casters (Arcane Trickster / Eldritch Knight) ──────────────────────
// Third casters gain spell slots at level 3; effective caster level = ceil(class level / 3).

const THIRD_CASTER_TABLE: Record<number, [0, ...number[]]> = {
  1:  slots(),
  2:  slots(),
  3:  slots(2),
  4:  slots(3),
  5:  slots(3),
  6:  slots(3),
  7:  slots(4,2),
  8:  slots(4,2),
  9:  slots(4,2),
  10: slots(4,3),
  11: slots(4,3),
  12: slots(4,3),
  13: slots(4,3,2),
  14: slots(4,3,2),
  15: slots(4,3,2),
  16: slots(4,3,3),
  17: slots(4,3,3),
  18: slots(4,3,3),
  19: slots(4,3,3,1),
  20: slots(4,3,3,1),
};

const THIRD_CASTER_CLASSES = new Set(['arcane trickster','eldritch knight']);

// ─── Warlock Pact Magic ───────────────────────────────────────────────────────

interface WarlockRow { slotLevel: number; slotCount: number }

const WARLOCK_TABLE: Record<number, WarlockRow> = {
  1:  { slotLevel: 1, slotCount: 1 },
  2:  { slotLevel: 1, slotCount: 2 },
  3:  { slotLevel: 2, slotCount: 2 },
  4:  { slotLevel: 2, slotCount: 2 },
  5:  { slotLevel: 3, slotCount: 2 },
  6:  { slotLevel: 3, slotCount: 2 },
  7:  { slotLevel: 4, slotCount: 2 },
  8:  { slotLevel: 4, slotCount: 2 },
  9:  { slotLevel: 5, slotCount: 2 },
  10: { slotLevel: 5, slotCount: 2 },
  11: { slotLevel: 5, slotCount: 3 },
  12: { slotLevel: 5, slotCount: 3 },
  13: { slotLevel: 5, slotCount: 3 },
  14: { slotLevel: 5, slotCount: 3 },
  15: { slotLevel: 5, slotCount: 3 },
  16: { slotLevel: 5, slotCount: 3 },
  17: { slotLevel: 5, slotCount: 4 },
  18: { slotLevel: 5, slotCount: 4 },
  19: { slotLevel: 5, slotCount: 4 },
  20: { slotLevel: 5, slotCount: 4 },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the spell slot table for a class at a given level.
 *
 * @param className – class name (case-insensitive)
 * @param level     – character level 1–20
 */
export function getSpellSlots(className: string, level: number): SpellSlotTable {
  if (level < 1 || level > 20) {
    throw new RangeError(`Level must be 1–20, got ${level}`);
  }
  const key = className.toLowerCase();

  let tableSlots: [0, ...number[]];

  if (FULL_CASTER_CLASSES.has(key)) {
    tableSlots = [...FULL_CASTER_TABLE[level]] as [0, ...number[]];
  } else if (HALF_CASTER_CLASSES.has(key)) {
    tableSlots = [...HALF_CASTER_TABLE[level]] as [0, ...number[]];
  } else if (THIRD_CASTER_CLASSES.has(key)) {
    tableSlots = [...THIRD_CASTER_TABLE[level]] as [0, ...number[]];
  } else if (key === 'warlock') {
    // Warlock: represent pact slots as a conventional table for consistency
    const row = WARLOCK_TABLE[level];
    const s = slots();
    s[row.slotLevel] = row.slotCount;
    tableSlots = s;
  } else {
    throw new Error(`Unknown spellcasting class: "${className}"`);
  }

  return { slots: tableSlots, className: key, level };
}

/**
 * Get warlock pact magic details.
 */
export function getWarlockPactMagic(level: number): PactMagicTable {
  if (level < 1 || level > 20) throw new RangeError(`Level must be 1–20`);
  const row = WARLOCK_TABLE[level];
  return { ...row, className: 'warlock', level };
}

/**
 * Whether a caster can cast a spell of the given level with their current slots.
 */
export function canCastSpell(table: SpellSlotTable, spellLevel: number): boolean {
  if (spellLevel < 1 || spellLevel > 9) return false;
  return table.slots[spellLevel] > 0;
}

/**
 * Expend a spell slot of the given level. Throws if none available.
 */
export function expendSlot(table: SpellSlotTable, spellLevel: number): SpellSlotTable {
  if (!canCastSpell(table, spellLevel)) {
    throw new Error(
      `No level ${spellLevel} spell slots remaining for ${table.className} at level ${table.level}`,
    );
  }
  const newSlots = [...table.slots] as [0, ...number[]];
  newSlots[spellLevel] -= 1;
  return { ...table, slots: newSlots };
}

/**
 * Restore spell slots after a rest.
 *
 * - Long rest: all slots restored for full/half/third casters
 * - Short rest: Warlock restores all pact slots; others restore nothing by default
 *
 * @param table     – current slot table
 * @param restType  – 'short' or 'long'
 * @param className – class name (case-insensitive)
 */
export function restoreSlots(
  table: SpellSlotTable,
  restType: 'short' | 'long',
  className: string,
): SpellSlotTable {
  const key = className.toLowerCase();

  if (restType === 'long') {
    // Restore to full per class/level table
    return getSpellSlots(className, table.level);
  }

  // Short rest
  if (key === 'warlock') {
    // Warlocks regain all pact magic slots on a short rest
    return getSpellSlots(className, table.level);
  }

  // Other classes do not recover slots on a short rest (unless a specific feature applies)
  return table;
}

export const SUPPORTED_CLASSES = [
  'bard', 'cleric', 'druid', 'sorcerer', 'wizard',
  'paladin', 'ranger',
  'arcane trickster', 'eldritch knight',
  'warlock',
] as const;

export type SupportedClass = (typeof SUPPORTED_CLASSES)[number];

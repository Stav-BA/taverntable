import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ClassName, AbilityKey, CLASSES, SKILLS,
  abilityMod, proficiencyBonus, getSpellSlots, getWarlockSlots,
  maxHpAtLevel, maxHitDice, xpToLevel, XP_THRESHOLDS,
} from '@/lib/classes5e';
import type { Spell } from '@/lib/classes5e';
import type { Currency } from '@/lib/equipment5e';
import { toGoldValue, subtractCost } from '@/lib/equipment5e';

export type { Currency };

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  type: 'weapon' | 'armor' | 'potion' | 'misc' | 'magic';
  healingDice?: string; // e.g. "2d4+2" for healing potion
  // Equipment linking & state
  equipped?: boolean;
  weaponId?: string;           // references Weapon.id from equipment5e.ts
  armorId?: string;            // references Armor.id from equipment5e.ts
  magicItemId?: string;        // references MagicItem.id from equipment5e.ts
  attackBonus?: number;        // manual override or magic +X
  damageDice?: string;         // override or copy from weapon
  damageType?: string;         // override or copy from weapon
  rarity?: string;             // e.g. 'Uncommon'
  requiresAttunement?: boolean;
  attuned?: boolean;
  costGp?: number;
}

export interface DeathSaves {
  successes: number; // 0-3
  failures: number;  // 0-3
}

export interface CharacterSheet {
  // Identity
  playerId: string;
  characterName: string;
  playerName: string;
  className: ClassName;
  level: number;
  xp: number;
  background: string;
  race: string;
  alignment: string;

  // Ability scores
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;

  // Combat
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  speed: number;
  initiative: number; // override; if 0 uses DEX mod

  // Hit Dice
  hitDiceCurrent: number;
  hitDiceMax: number;

  // Spell slots [level1..level9] — current remaining
  spellSlots: [number,number,number,number,number,number,number,number,number];
  spellSlotsMax: [number,number,number,number,number,number,number,number,number];

  // Warlock pact slots
  warlockSlotsCurrent: number;
  warlockSlotsMax: number;
  warlockSlotLevel: number;

  // Proficiencies
  savingThrowProficiencies: AbilityKey[];
  skillProficiencies: string[];   // skill names
  skillExpertise: string[];       // skill names with expertise (double prof)

  // Spells
  preparedSpells: Spell[];
  concentrating: string | null;  // spell name being concentrated on

  // Equipment
  equipment: EquipmentItem[];

  // Currency
  currency: Currency;

  // Death saves
  deathSaves: DeathSaves;
  isStabilized: boolean;

  // Notes
  notes: string;
  ideals: string;
  bonds: string;
  flaws: string;
  features: string;
}

function defaultSpellSlots(): [number,number,number,number,number,number,number,number,number] {
  return [0,0,0,0,0,0,0,0,0];
}

// Keep reference so other callers can still use it without triggering lint
void defaultSpellSlots;

export function buildDefaultSheet(playerId: string, characterName: string, playerName: string, className: ClassName, level = 1): CharacterSheet {
  const cls = CLASSES[className];
  const conMod = 0; // base 10 CON = mod 0
  const slots = getSpellSlots(className, level);
  const warlockSlots = className === 'Warlock' ? getWarlockSlots(level) : { slots: 0, slotLevel: 0 };
  const hp = maxHpAtLevel(className, level, conMod);

  return {
    playerId,
    characterName,
    playerName,
    className,
    level,
    xp: 0,
    background: '',
    race: '',
    alignment: '',
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    hp,
    maxHp: hp,
    tempHp: 0,
    ac: 10,
    speed: 30,
    initiative: 0,
    hitDiceCurrent: maxHitDice(level),
    hitDiceMax: maxHitDice(level),
    spellSlots: [...slots] as CharacterSheet['spellSlots'],
    spellSlotsMax: [...slots] as CharacterSheet['spellSlotsMax'],
    warlockSlotsCurrent: warlockSlots.slots,
    warlockSlotsMax: warlockSlots.slots,
    warlockSlotLevel: warlockSlots.slotLevel,
    savingThrowProficiencies: [...cls.savingThrows],
    skillProficiencies: [],
    skillExpertise: [],
    preparedSpells: [],
    concentrating: null,
    equipment: [
      { id: 'potion-1', name: 'Healing Potion', quantity: 1, type: 'potion', healingDice: '2d4+2', description: 'Drink as a bonus action to heal 2d4+2 HP.', magicItemId: 'potion-healing', costGp: 50 },
    ],
    currency: { cp: 0, sp: 10, ep: 0, gp: 0, pp: 0 },
    deathSaves: { successes: 0, failures: 0 },
    isStabilized: false,
    notes: '',
    ideals: '',
    bonds: '',
    flaws: '',
    features: '',
  };
}

// ── DERIVED STATS HELPERS ─────────────────────────────────────────────────────

export function getAbilityMod(sheet: CharacterSheet, ability: AbilityKey): number {
  return abilityMod(sheet[ability]);
}

export function getProfBonus(sheet: CharacterSheet): number {
  return proficiencyBonus(sheet.level);
}

export function getSavingThrowBonus(sheet: CharacterSheet, ability: AbilityKey): number {
  const mod = getAbilityMod(sheet, ability);
  const isProficient = sheet.savingThrowProficiencies.includes(ability);
  return mod + (isProficient ? getProfBonus(sheet) : 0);
}

export function getSkillBonus(sheet: CharacterSheet, skillName: string): number {
  const skill = SKILLS.find((s) => s.name === skillName);
  if (!skill) return 0;
  const mod = getAbilityMod(sheet, skill.ability);
  const prof = getProfBonus(sheet);
  if (sheet.skillExpertise.includes(skillName)) return mod + prof * 2;
  if (sheet.skillProficiencies.includes(skillName)) return mod + prof;
  return mod;
}

export function getPassivePerception(sheet: CharacterSheet): number {
  return 10 + getSkillBonus(sheet, 'Perception');
}

export function getSpellcastingBonus(sheet: CharacterSheet): number {
  const cls = CLASSES[sheet.className];
  if (!cls.spellcastingAbility) return 0;
  return getAbilityMod(sheet, cls.spellcastingAbility) + getProfBonus(sheet);
}

export function getSpellSaveDC(sheet: CharacterSheet): number {
  return 8 + getSpellcastingBonus(sheet);
}

export function xpToNextLevelInfo(sheet: CharacterSheet): { needed: number; current: number; percent: number } {
  if (sheet.level >= 20) return { needed: 0, current: 0, percent: 100 };
  const thisThreshold = XP_THRESHOLDS[sheet.level];
  const nextThreshold = XP_THRESHOLDS[sheet.level + 1];
  const needed = nextThreshold - thisThreshold;
  const current = sheet.xp - thisThreshold;
  return { needed, current, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

// ── STORE ─────────────────────────────────────────────────────────────────────

interface CharacterState {
  sheets: Record<string, CharacterSheet>; // keyed by playerId
  activePlayerId: string | null;

  // Mutations
  initSheet: (playerId: string, characterName: string, playerName: string, className: ClassName, level?: number) => void;
  setSheet: (sheet: CharacterSheet) => void;
  updateSheet: (playerId: string, updates: Partial<CharacterSheet>) => void;

  // HP
  applyDamage: (playerId: string, amount: number) => void;
  applyHealing: (playerId: string, amount: number) => void;
  setTempHp: (playerId: string, amount: number) => void;

  // Spell slots
  useSpellSlot: (playerId: string, slotLevel: number) => void; // 1-9
  restoreSpellSlots: (playerId: string) => void;
  useWarlockSlot: (playerId: string) => void;
  restoreWarlockSlots: (playerId: string) => void;

  // Hit Dice
  spendHitDie: (playerId: string) => number; // returns HP gained
  restoreHitDice: (playerId: string, count: number) => void;

  // XP & leveling
  awardXP: (playerId: string, amount: number) => boolean; // returns true if leveled up
  levelUp: (playerId: string) => void;

  // Equipment / potions
  addItem: (playerId: string, item: EquipmentItem) => void;
  removeItem: (playerId: string, itemId: string) => void;
  usePotion: (playerId: string, itemId: string) => number; // returns HP healed

  // Currency
  addCurrency: (playerId: string, currency: Partial<Currency>) => void;
  spendGold: (playerId: string, amountGp: number) => boolean; // false if can't afford

  // Death saves
  addDeathSaveSuccess: (playerId: string) => void;
  addDeathSaveFailure: (playerId: string) => void;
  resetDeathSaves: (playerId: string) => void;
  stabilize: (playerId: string) => void;

  // Concentration
  setConcentration: (playerId: string, spellName: string | null) => void;

  // Long rest
  longRest: (playerId: string) => void;
  shortRest: (playerId: string) => void;
}

function rollDice(expression: string): number {
  // e.g. "2d4+2" or "1d8"
  const match = expression.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) return 0;
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const bonus = parseInt(match[3] ?? '0') || 0;
  let total = bonus;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      sheets: {},
      activePlayerId: null,

      initSheet: (playerId, characterName, playerName, className, level = 1) => {
        const sheet = buildDefaultSheet(playerId, characterName, playerName, className, level);
        set((s) => ({ sheets: { ...s.sheets, [playerId]: sheet }, activePlayerId: playerId }));
      },

      setSheet: (sheet) => {
        set((s) => ({ sheets: { ...s.sheets, [sheet.playerId]: sheet } }));
      },

      updateSheet: (playerId, updates) => {
        set((s) => {
          const existing = s.sheets[playerId];
          if (!existing) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...existing, ...updates } } };
        });
      },

      applyDamage: (playerId, amount) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          let remaining = amount;
          let tempHp = sheet.tempHp;
          if (tempHp > 0) {
            const absorbed = Math.min(tempHp, remaining);
            tempHp -= absorbed;
            remaining -= absorbed;
          }
          const hp = Math.max(0, sheet.hp - remaining);
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, hp, tempHp } } };
        });
      },

      applyHealing: (playerId, amount) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const hp = Math.min(sheet.maxHp, sheet.hp + amount);
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, hp, isStabilized: hp > 0 ? true : sheet.isStabilized, deathSaves: hp > 0 ? { successes: 0, failures: 0 } : sheet.deathSaves } } };
        });
      },

      setTempHp: (playerId, amount) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const tempHp = Math.max(sheet.tempHp, amount); // temp HP doesn't stack, take higher
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, tempHp } } };
        });
      },

      useSpellSlot: (playerId, slotLevel) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const idx = slotLevel - 1;
          if (sheet.spellSlots[idx] <= 0) return s;
          const spellSlots = [...sheet.spellSlots] as CharacterSheet['spellSlots'];
          spellSlots[idx]--;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, spellSlots } } };
        });
      },

      restoreSpellSlots: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, spellSlots: [...sheet.spellSlotsMax] as CharacterSheet['spellSlots'] } } };
        });
      },

      useWarlockSlot: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet || sheet.warlockSlotsCurrent <= 0) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, warlockSlotsCurrent: sheet.warlockSlotsCurrent - 1 } } };
        });
      },

      restoreWarlockSlots: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, warlockSlotsCurrent: sheet.warlockSlotsMax } } };
        });
      },

      spendHitDie: (playerId) => {
        const sheet = get().sheets[playerId];
        if (!sheet || sheet.hitDiceCurrent <= 0) return 0;
        const cls = CLASSES[sheet.className];
        const conMod = abilityMod(sheet.con);
        const rolled = Math.floor(Math.random() * cls.hitDie) + 1;
        const healed = Math.max(1, rolled + conMod);
        const hp = Math.min(sheet.maxHp, sheet.hp + healed);
        set((s) => ({
          sheets: {
            ...s.sheets,
            [playerId]: { ...sheet, hp, hitDiceCurrent: sheet.hitDiceCurrent - 1 },
          },
        }));
        return healed;
      },

      restoreHitDice: (playerId, count) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const restored = Math.min(sheet.hitDiceMax, sheet.hitDiceCurrent + count);
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, hitDiceCurrent: restored } } };
        });
      },

      awardXP: (playerId, amount) => {
        const sheet = get().sheets[playerId];
        if (!sheet) return false;
        const oldLevel = sheet.level;
        const newXp = sheet.xp + amount;
        const newLevel = xpToLevel(newXp);
        const leveledUp = newLevel > oldLevel;
        set((s) => ({
          sheets: { ...s.sheets, [playerId]: { ...sheet, xp: newXp, level: newLevel } },
        }));
        if (leveledUp) get().levelUp(playerId);
        return leveledUp;
      },

      levelUp: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const level = sheet.level;
          const conMod = abilityMod(sheet.con);
          const cls = CLASSES[sheet.className];
          // HP increase: average HD + CON mod
          const hpIncrease = Math.floor(cls.hitDie / 2) + 1 + conMod;
          const newMaxHp = sheet.maxHp + hpIncrease;
          const newHp = sheet.hp + hpIncrease;
          // Spell slots
          const newSlotsMax = getSpellSlots(sheet.className, level);
          const newSlots = newSlotsMax.map((max, i) => Math.min(max, sheet.spellSlots[i] + (max - sheet.spellSlotsMax[i]))) as CharacterSheet['spellSlots'];
          // Warlock
          const wl = sheet.className === 'Warlock' ? getWarlockSlots(level) : null;
          // Hit Dice
          return {
            sheets: {
              ...s.sheets,
              [playerId]: {
                ...sheet,
                maxHp: newMaxHp,
                hp: newHp,
                spellSlotsMax: newSlotsMax as CharacterSheet['spellSlotsMax'],
                spellSlots: newSlots,
                hitDiceMax: maxHitDice(level),
                hitDiceCurrent: Math.min(maxHitDice(level), sheet.hitDiceCurrent + 1),
                warlockSlotsMax: wl?.slots ?? sheet.warlockSlotsMax,
                warlockSlotsMax_level: wl?.slotLevel ?? sheet.warlockSlotLevel,
              },
            },
          };
        });
      },

      addItem: (playerId, item) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, equipment: [...sheet.equipment, item] } } };
        });
      },

      removeItem: (playerId, itemId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, equipment: sheet.equipment.filter((i) => i.id !== itemId) } } };
        });
      },

      usePotion: (playerId, itemId) => {
        const sheet = get().sheets[playerId];
        if (!sheet) return 0;
        const potion = sheet.equipment.find((i) => i.id === itemId && i.type === 'potion');
        if (!potion) return 0;
        const healed = rollDice(potion.healingDice ?? '2d4+2');
        const hp = Math.min(sheet.maxHp, sheet.hp + healed);
        const updatedEquipment = potion.quantity <= 1
          ? sheet.equipment.filter((i) => i.id !== itemId)
          : sheet.equipment.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
        set((s) => ({
          sheets: { ...s.sheets, [playerId]: { ...sheet, hp, equipment: updatedEquipment } },
        }));
        return healed;
      },

      addCurrency: (playerId, delta) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const currency: Currency = {
            cp: (sheet.currency.cp) + (delta.cp ?? 0),
            sp: (sheet.currency.sp) + (delta.sp ?? 0),
            ep: (sheet.currency.ep) + (delta.ep ?? 0),
            gp: (sheet.currency.gp) + (delta.gp ?? 0),
            pp: (sheet.currency.pp) + (delta.pp ?? 0),
          };
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, currency } } };
        });
      },

      spendGold: (playerId, amountGp) => {
        const sheet = get().sheets[playerId];
        if (!sheet) return false;
        if (toGoldValue(sheet.currency) < amountGp) return false;
        const newCurrency = subtractCost(sheet.currency, amountGp);
        if (!newCurrency) return false;
        set((s) => ({
          sheets: { ...s.sheets, [playerId]: { ...sheet, currency: newCurrency } },
        }));
        return true;
      },

      addDeathSaveSuccess: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const successes = Math.min(3, sheet.deathSaves.successes + 1);
          const isStabilized = successes >= 3;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, deathSaves: { ...sheet.deathSaves, successes }, isStabilized } } };
        });
      },

      addDeathSaveFailure: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const failures = Math.min(3, sheet.deathSaves.failures + 1);
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, deathSaves: { ...sheet.deathSaves, failures } } } };
        });
      },

      resetDeathSaves: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, deathSaves: { successes: 0, failures: 0 }, isStabilized: false } } };
        });
      },

      stabilize: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, isStabilized: true, hp: 1 } } };
        });
      },

      setConcentration: (playerId, spellName) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, concentrating: spellName } } };
        });
      },

      longRest: (playerId) => {
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const restored: Partial<CharacterSheet> = {
            hp: sheet.maxHp,
            tempHp: 0,
            spellSlots: [...sheet.spellSlotsMax] as CharacterSheet['spellSlots'],
            warlockSlotsCurrent: sheet.warlockSlotsMax,
            hitDiceCurrent: Math.min(sheet.hitDiceMax, sheet.hitDiceCurrent + Math.max(1, Math.floor(sheet.hitDiceMax / 2))),
            concentrating: null,
            deathSaves: { successes: 0, failures: 0 },
            isStabilized: false,
          };
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, ...restored } } };
        });
      },

      shortRest: (playerId) => {
        // Short rest: warlocks restore pact slots, concentration ends at player's discretion
        set((s) => {
          const sheet = s.sheets[playerId];
          if (!sheet) return s;
          const warlockRestore = sheet.className === 'Warlock' ? { warlockSlotsCurrent: sheet.warlockSlotsMax } : {};
          return { sheets: { ...s.sheets, [playerId]: { ...sheet, ...warlockRestore } } };
        });
      },
    }),
    {
      name: 'taverntable-characters',
      partialize: (state) => ({ sheets: state.sheets, activePlayerId: state.activePlayerId }),
    }
  )
);

// 5e 2014 class definitions: spell slots, hit dice, saving throws, skills, spells

export type ClassName =
  | 'Barbarian' | 'Bard' | 'Cleric' | 'Druid' | 'Fighter'
  | 'Monk' | 'Paladin' | 'Ranger' | 'Rogue' | 'Sorcerer'
  | 'Warlock' | 'Wizard';

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

// Spell slots [level1..level9] per class level (index 0 = class level 1)
// null = no spellcasting
export type SpellSlotTable = Array<[number,number,number,number,number,number,number,number,number]>;

// Warlock uses pact magic — separate tracking
export interface WarlockSlots {
  slots: number;   // total slots (all same level)
  slotLevel: number; // 1-5
}

export const WARLOCK_PACT_SLOTS: WarlockSlots[] = [
  { slots: 1, slotLevel: 1 }, // level 1
  { slots: 2, slotLevel: 1 }, // level 2
  { slots: 2, slotLevel: 2 }, // level 3
  { slots: 2, slotLevel: 2 }, // level 4
  { slots: 2, slotLevel: 3 }, // level 5
  { slots: 2, slotLevel: 3 }, // level 6
  { slots: 2, slotLevel: 4 }, // level 7
  { slots: 2, slotLevel: 4 }, // level 8
  { slots: 2, slotLevel: 5 }, // level 9
  { slots: 2, slotLevel: 5 }, // level 10
  { slots: 3, slotLevel: 5 }, // level 11
  { slots: 3, slotLevel: 5 }, // level 12
  { slots: 3, slotLevel: 5 }, // level 13
  { slots: 3, slotLevel: 5 }, // level 14
  { slots: 3, slotLevel: 5 }, // level 15
  { slots: 3, slotLevel: 5 }, // level 16
  { slots: 4, slotLevel: 5 }, // level 17
  { slots: 4, slotLevel: 5 }, // level 18
  { slots: 4, slotLevel: 5 }, // level 19
  { slots: 4, slotLevel: 5 }, // level 20
];

// Full caster slot table (Bard, Cleric, Druid, Sorcerer, Wizard)
const FULL_CASTER: SpellSlotTable = [
  [2,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],
  [4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],
  [4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],
  [4,3,3,3,2,1,1,0,0],
  [4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],
  [4,3,3,3,3,1,1,1,1],
  [4,3,3,3,3,2,1,1,1],
  [4,3,3,3,3,2,2,1,1],
];

// Half caster (Paladin, Ranger — rounds down, starts at level 2)
const HALF_CASTER: SpellSlotTable = [
  [0,0,0,0,0,0,0,0,0],
  [2,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],
  [4,3,3,0,0,0,0,0,0],
  [4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],
];

// No spells
const NO_SPELLS: SpellSlotTable = Array(20).fill([0,0,0,0,0,0,0,0,0]) as SpellSlotTable;

// XP thresholds (5e 2014) — XP needed to reach this level
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

export function xpToLevel(xp: number): number {
  let level = 1;
  for (let lvl = 20; lvl >= 1; lvl--) {
    if (xp >= XP_THRESHOLDS[lvl]) { level = lvl; break; }
  }
  return level;
}

export function xpToNextLevel(xp: number): { current: number; next: number; level: number } {
  const level = xpToLevel(xp);
  const current = xp - XP_THRESHOLDS[level];
  const next = level < 20 ? XP_THRESHOLDS[level + 1] - XP_THRESHOLDS[level] : 0;
  return { current, next, level };
}

export interface Spell {
  name: string;
  level: number; // 0 = cantrip
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  concentration?: boolean;
  ritual?: boolean;
}

export interface ClassDefinition {
  name: ClassName;
  hitDie: number;
  savingThrows: [AbilityKey, AbilityKey];
  primaryAbility: AbilityKey;
  spellcasting: 'full' | 'half' | 'warlock' | 'none';
  spellcastingAbility?: AbilityKey;
  spellSlots: SpellSlotTable | null;
  armorProficiencies: string[];
  weaponProficiencies: string[];
  skillChoices: string[];
  numSkillChoices: number;
  cantripsKnown?: number[];  // per level, index 0 = level 1
  spellsKnown?: number[];    // for Bard/Ranger/Sorcerer/Warlock
  spellList: Spell[];
}

// ── SPELL LISTS ─────────────────────────────────────────────────────────────
// Representative spells per class (not exhaustive, curated for gameplay)

const WIZARD_SPELLS: Spell[] = [
  // Cantrips
  { name: 'Fire Bolt', level: 0, school: 'Evocation', castingTime: '1 action', range: '120 ft', components: 'V, S', duration: 'Instantaneous', description: 'Ranged spell attack. Hit: 1d10 fire damage (2d10 at 5th, 3d10 at 11th, 4d10 at 17th).' },
  { name: 'Mage Hand', level: 0, school: 'Conjuration', castingTime: '1 action', range: '30 ft', components: 'V, S', duration: '1 minute', description: 'Create a spectral hand. Can manipulate objects up to 10 lbs within range.' },
  { name: 'Prestidigitation', level: 0, school: 'Transmutation', castingTime: '1 action', range: '10 ft', components: 'V, S', duration: 'Up to 1 hour', description: 'Minor magical effects: light, clean, soil, chill, warm, flavor, color, small mark, trinket, music.' },
  { name: 'Ray of Frost', level: 0, school: 'Evocation', castingTime: '1 action', range: '60 ft', components: 'V, S', duration: 'Instantaneous', description: 'Ranged spell attack. Hit: 1d8 cold damage, speed reduced 10 ft until start of your next turn.' },
  { name: 'Minor Illusion', level: 0, school: 'Illusion', castingTime: '1 action', range: '30 ft', components: 'S, M', duration: '1 minute', description: 'Create a sound or image. Investigation DC 14 to disbelieve.' },
  { name: 'Shocking Grasp', level: 0, school: 'Evocation', castingTime: '1 action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', description: 'Melee spell attack. Hit: 1d8 lightning. Advantage if target wearing metal armor. Target can\'t take reactions until its next turn.' },
  // 1st level
  { name: 'Magic Missile', level: 1, school: 'Evocation', castingTime: '1 action', range: '120 ft', components: 'V, S', duration: 'Instantaneous', description: 'Three darts, each 1d4+1 force damage. +1 dart per slot level above 1st. Always hits.' },
  { name: 'Shield', level: 1, school: 'Abjuration', castingTime: '1 reaction', range: 'Self', components: 'V, S', duration: '1 round', description: 'Reaction when hit or targeted by Magic Missile. +5 AC until start of next turn, immune to Magic Missile.' },
  { name: 'Mage Armor', level: 1, school: 'Abjuration', castingTime: '1 action', range: 'Touch', components: 'V, S, M', duration: '8 hours', description: 'AC becomes 13 + DEX modifier for a creature not wearing armor.' },
  { name: 'Detect Magic', level: 1, school: 'Divination', castingTime: '1 action', range: 'Self', components: 'V, S', duration: 'Concentration, up to 10 minutes', description: 'Sense presence of magic within 30 ft. See aura and learn school of magic.', concentration: true, ritual: true },
  { name: 'Charm Person', level: 1, school: 'Enchantment', castingTime: '1 action', range: '30 ft', components: 'V, S', duration: 'Concentration, 1 hour', description: 'WIS save or charmed. Regards you as friendly. +1 target per slot level above 1st.', concentration: true },
  { name: 'Sleep', level: 1, school: 'Enchantment', castingTime: '1 action', range: '90 ft', components: 'V, S, M', duration: '1 minute', description: 'Roll 5d8; lowest HP creatures fall unconscious up to that total. +2d8 per slot level above 1st.' },
  { name: 'Thunderwave', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Self (15-ft cube)', components: 'V, S', duration: 'Instantaneous', description: 'CON save. Fail: 2d8 thunder damage + pushed 10 ft. Success: half. Unsecured objects pushed. +1d8 per slot above 1st.' },
  { name: 'Identify', level: 1, school: 'Divination', castingTime: '1 minute', range: 'Touch', components: 'V, S, M', duration: 'Instantaneous', description: 'Learn properties of magic item or spell affecting creature.', ritual: true },
  // 2nd level
  { name: 'Misty Step', level: 2, school: 'Conjuration', castingTime: '1 bonus action', range: 'Self', components: 'V', duration: 'Instantaneous', description: 'Teleport up to 30 ft to unoccupied space you can see.' },
  { name: 'Hold Person', level: 2, school: 'Enchantment', castingTime: '1 action', range: '60 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'WIS save or paralyzed. +1 target per slot above 2nd. Repeat save each turn.', concentration: true },
  { name: 'Invisibility', level: 2, school: 'Illusion', castingTime: '1 action', range: 'Touch', components: 'V, S, M', duration: 'Concentration, 1 hour', description: 'Target invisible until attacks or casts a spell. +1 target per slot above 2nd.', concentration: true },
  { name: 'Scorching Ray', level: 2, school: 'Evocation', castingTime: '1 action', range: '120 ft', components: 'V, S', duration: 'Instantaneous', description: 'Three rays, each ranged spell attack. Hit: 2d6 fire. +1 ray per slot above 2nd.' },
  { name: 'Suggestion', level: 2, school: 'Enchantment', castingTime: '1 action', range: '30 ft', components: 'V, M', duration: 'Concentration, 8 hours', description: 'WIS save or must follow reasonable 1–2 sentence suggestion.', concentration: true },
  // 3rd level
  { name: 'Fireball', level: 3, school: 'Evocation', castingTime: '1 action', range: '150 ft', components: 'V, S, M', duration: 'Instantaneous', description: '20-ft radius. DEX save. 8d6 fire, half on save. +1d6 per slot above 3rd.' },
  { name: 'Counterspell', level: 3, school: 'Abjuration', castingTime: '1 reaction', range: '60 ft', components: 'S', duration: 'Instantaneous', description: 'Interrupt a spell being cast. Spells 3rd level or lower: automatic. Higher: ability check DC 10 + spell level.' },
  { name: 'Fly', level: 3, school: 'Transmutation', castingTime: '1 action', range: 'Touch', components: 'V, S, M', duration: 'Concentration, 10 minutes', description: 'Target gains fly speed of 60 ft. +1 target per slot above 3rd.', concentration: true },
  { name: 'Haste', level: 3, school: 'Transmutation', castingTime: '1 action', range: '30 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'Speed doubled, +2 AC, advantage on DEX saves, +1 additional action (limited). When ends, target can\'t move or take actions for 1 round.', concentration: true },
  { name: 'Lightning Bolt', level: 3, school: 'Evocation', castingTime: '1 action', range: 'Self (100-ft line)', components: 'V, S, M', duration: 'Instantaneous', description: 'DEX save. 8d6 lightning, half on save. +1d6 per slot above 3rd.' },
  // 4th level
  { name: 'Banishment', level: 4, school: 'Abjuration', castingTime: '1 action', range: '60 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'CHA save or banished. Native plane: returns when concentration ends. Different plane: permanent unless broken.', concentration: true },
  { name: 'Greater Invisibility', level: 4, school: 'Illusion', castingTime: '1 action', range: 'Touch', components: 'V, S', duration: 'Concentration, 1 minute', description: 'Target invisible even when attacking or casting.', concentration: true },
  { name: 'Ice Storm', level: 4, school: 'Evocation', castingTime: '1 action', range: '300 ft', components: 'V, S, M', duration: 'Instantaneous', description: '20-ft radius, 40-ft tall cylinder. DEX save. 2d8 bludgeoning + 4d6 cold, half on save. Difficult terrain.' },
  // 5th level
  { name: 'Cone of Cold', level: 5, school: 'Evocation', castingTime: '1 action', range: 'Self (60-ft cone)', components: 'V, S, M', duration: 'Instantaneous', description: 'CON save. 8d8 cold damage, half on save. +1d8 per slot above 5th.' },
  { name: 'Wall of Force', level: 5, school: 'Evocation', castingTime: '1 action', range: '120 ft', components: 'V, S, M', duration: 'Concentration, 10 minutes', description: 'Invisible wall immune to all damage, can\'t be dispelled. Up to ten 10×10-ft panels.', concentration: true },
  { name: 'Teleportation Circle', level: 5, school: 'Conjuration', castingTime: '1 minute', range: '10 ft', components: 'V, M', duration: '1 round', description: 'Create portal to a permanent teleportation circle you know.' },
];

const CLERIC_SPELLS: Spell[] = [
  { name: 'Sacred Flame', level: 0, school: 'Evocation', castingTime: '1 action', range: '60 ft', components: 'V, S', duration: 'Instantaneous', description: 'DEX save or 1d8 radiant damage. No benefit from cover. 2d8 at 5th, 3d8 at 11th, 4d8 at 17th.' },
  { name: 'Guidance', level: 0, school: 'Divination', castingTime: '1 action', range: 'Touch', components: 'V, S', duration: 'Concentration, 1 minute', description: 'Willing creature adds 1d4 to one ability check.', concentration: true },
  { name: 'Spare the Dying', level: 0, school: 'Necromancy', castingTime: '1 action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', description: 'Stabilize a creature at 0 HP (no death save rolls).' },
  { name: 'Toll the Dead', level: 0, school: 'Necromancy', castingTime: '1 action', range: '60 ft', components: 'V, S', duration: 'Instantaneous', description: 'WIS save or 1d8 necrotic (1d12 if missing HP). 2d8/2d12 at 5th.' },
  { name: 'Cure Wounds', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', description: 'Restore 1d8 + spellcasting modifier HP. +1d8 per slot above 1st.' },
  { name: 'Healing Word', level: 1, school: 'Evocation', castingTime: '1 bonus action', range: '60 ft', components: 'V', duration: 'Instantaneous', description: 'Restore 1d4 + spellcasting modifier HP. +1d4 per slot above 1st.' },
  { name: 'Bless', level: 1, school: 'Enchantment', castingTime: '1 action', range: '30 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'Up to 3 creatures add 1d4 to attack rolls and saving throws. +1 creature per slot above 1st.', concentration: true },
  { name: 'Guiding Bolt', level: 1, school: 'Evocation', castingTime: '1 action', range: '120 ft', components: 'V, S', duration: '1 round', description: 'Ranged spell attack. Hit: 4d6 radiant. Next attack against target has advantage. +1d6 per slot above 1st.' },
  { name: 'Shield of Faith', level: 1, school: 'Abjuration', castingTime: '1 bonus action', range: '60 ft', components: 'V, S, M', duration: 'Concentration, 10 minutes', description: 'Target gains +2 AC.', concentration: true },
  { name: 'Hold Person', level: 2, school: 'Enchantment', castingTime: '1 action', range: '60 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'WIS save or paralyzed. Repeat save each turn. +1 target per slot above 2nd.', concentration: true },
  { name: 'Spiritual Weapon', level: 2, school: 'Evocation', castingTime: '1 bonus action', range: '60 ft', components: 'V, S', duration: '1 minute', description: 'Summon weapon. Bonus action each turn: spell attack for 1d8 + spellcasting mod force. +1d8 per 2 slots above 2nd.' },
  { name: 'Prayer of Healing', level: 2, school: 'Evocation', castingTime: '10 minutes', range: '30 ft', components: 'V', duration: 'Instantaneous', description: 'Up to 6 creatures restore 2d8 + spellcasting mod HP. +1d8 per slot above 2nd.' },
  { name: 'Mass Cure Wounds', level: 5, school: 'Evocation', castingTime: '1 action', range: '60 ft', components: 'V, S', duration: 'Instantaneous', description: 'Up to 6 creatures restore 3d8 + spellcasting mod HP. +1d8 per slot above 5th.' },
  { name: 'Flame Strike', level: 5, school: 'Evocation', castingTime: '1 action', range: '60 ft', components: 'V, S, M', duration: 'Instantaneous', description: '10-ft radius, 40-ft tall. DEX save. 4d6 fire + 4d6 radiant, half on save. +1d6 each type per slot above 5th.' },
];

const BARD_SPELLS: Spell[] = [
  { name: 'Vicious Mockery', level: 0, school: 'Enchantment', castingTime: '1 action', range: '60 ft', components: 'V', duration: 'Instantaneous', description: 'WIS save or 1d4 psychic and disadvantage on next attack roll. 2d4 at 5th, 3d4 at 11th, 4d4 at 17th.' },
  { name: 'Friends', level: 0, school: 'Enchantment', castingTime: '1 action', range: 'Self', components: 'S, M', duration: 'Concentration, 1 minute', description: 'Advantage on CHA checks against one non-hostile creature. When spell ends, creature knows it was charmed.', concentration: true },
  { name: 'Healing Word', level: 1, school: 'Evocation', castingTime: '1 bonus action', range: '60 ft', components: 'V', duration: 'Instantaneous', description: 'Restore 1d4 + spellcasting modifier HP. +1d4 per slot above 1st.' },
  { name: 'Charm Person', level: 1, school: 'Enchantment', castingTime: '1 action', range: '30 ft', components: 'V, S', duration: 'Concentration, 1 hour', description: 'WIS save or charmed for 1 hour. +1 target per slot above 1st.', concentration: true },
  { name: 'Dissonant Whispers', level: 1, school: 'Enchantment', castingTime: '1 action', range: '60 ft', components: 'V', duration: 'Instantaneous', description: 'WIS save or 3d6 psychic + must use reaction to flee. Half on save, no fleeing. +1d6 per slot above 1st.' },
  { name: 'Faerie Fire', level: 1, school: 'Evocation', castingTime: '1 action', range: '60 ft', components: 'V', duration: 'Concentration, 1 minute', description: 'DEX save or outlined in light. Attacks against outlined creatures have advantage.', concentration: true },
  { name: 'Shatter', level: 2, school: 'Evocation', castingTime: '1 action', range: '60 ft', components: 'V, S, M', duration: 'Instantaneous', description: '10-ft radius sphere. CON save. 3d8 thunder, half on save. +1d8 per slot above 2nd.' },
  { name: 'Hypnotic Pattern', level: 3, school: 'Illusion', castingTime: '1 action', range: '120 ft', components: 'S, M', duration: 'Concentration, 1 minute', description: '30-ft cube. WIS save or charmed and incapacitated. Snapping out: ally uses action, takes damage, or creature shaken.', concentration: true },
  { name: 'Polymorph', level: 4, school: 'Transmutation', castingTime: '1 action', range: '60 ft', components: 'V, S, M', duration: 'Concentration, 1 hour', description: 'WIS save (unwilling). Target transforms into beast of CR ≤ target\'s CR or level.', concentration: true },
];

const DRUID_SPELLS: Spell[] = [
  { name: 'Shillelagh', level: 0, school: 'Transmutation', castingTime: '1 bonus action', range: 'Touch', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'Club or quarterstaff uses WIS for attacks, deals 1d8 (1d6 quarterstaf is 1d8).', concentration: true },
  { name: 'Druidcraft', level: 0, school: 'Transmutation', castingTime: '1 action', range: '30 ft', components: 'V, S', duration: 'Instantaneous', description: 'Minor nature effects: predict weather, cause plant to bloom, create sensory effects.' },
  { name: 'Entangle', level: 1, school: 'Conjuration', castingTime: '1 action', range: '90 ft', components: 'V, S', duration: 'Concentration, 1 minute', description: '20-ft square of grasping plants. STR save or restrained. Area is difficult terrain.', concentration: true },
  { name: 'Healing Word', level: 1, school: 'Evocation', castingTime: '1 bonus action', range: '60 ft', components: 'V', duration: 'Instantaneous', description: 'Restore 1d4 + spellcasting modifier HP. +1d4 per slot above 1st.' },
  { name: 'Thunderwave', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Self (15-ft cube)', components: 'V, S', duration: 'Instantaneous', description: 'CON save. 2d8 thunder + push 10 ft on fail, half on save. +1d8 per slot above 1st.' },
  { name: 'Moonbeam', level: 2, school: 'Evocation', castingTime: '1 action', range: '120 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: '5-ft radius, 40-ft cylinder of silver light. CON save. 2d10 radiant, half on save. Shapechangers have disadvantage.', concentration: true },
  { name: 'Speak with Animals', level: 1, school: 'Divination', castingTime: '1 action', range: 'Self', components: 'V, S', duration: '10 minutes', description: 'Comprehend and verbally communicate with beasts.', ritual: true },
  { name: 'Wild Shape', level: 0, school: 'Transmutation', castingTime: '1 bonus action', range: 'Self', components: '', duration: 'Special', description: 'Transform into beast (use class feature rules). CR ≤ 1/4 at 2nd, 1/2 at 4th, 1 at 8th.' },
  { name: 'Call Lightning', level: 3, school: 'Conjuration', castingTime: '1 action', range: '120 ft', components: 'V, S', duration: 'Concentration, 10 minutes', description: '100-ft tall storm cloud. Bonus action each turn: 3d10 lightning in 5-ft radius, DEX save half. +1d10 per slot above 3rd.', concentration: true },
];

const PALADIN_SPELLS: Spell[] = [
  { name: 'Bless', level: 1, school: 'Enchantment', castingTime: '1 action', range: '30 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'Up to 3 creatures add 1d4 to attack rolls and saving throws.', concentration: true },
  { name: 'Cure Wounds', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', description: 'Restore 1d8 + spellcasting modifier HP. +1d8 per slot above 1st.' },
  { name: 'Divine Smite', level: 0, school: 'Evocation', castingTime: 'Special', range: 'Self', components: '', duration: 'Instantaneous', description: 'Expend a spell slot on a hit: deal 2d8 radiant + 1d8 per slot level above 1st. +1d8 vs undead/fiends.' },
  { name: 'Shield of Faith', level: 1, school: 'Abjuration', castingTime: '1 bonus action', range: '60 ft', components: 'V, S, M', duration: 'Concentration, 10 minutes', description: 'Target gains +2 AC.', concentration: true },
  { name: 'Aid', level: 2, school: 'Abjuration', castingTime: '1 action', range: '30 ft', components: 'V, S, M', duration: '8 hours', description: 'Three creatures: HP max + current HP each +5. +5 per slot above 2nd.' },
  { name: 'Prayer of Healing', level: 2, school: 'Evocation', castingTime: '10 minutes', range: '30 ft', components: 'V', duration: 'Instantaneous', description: 'Up to 6 creatures restore 2d8 + spellcasting mod HP. +1d8 per slot above 2nd.' },
  { name: 'Aura of Protection', level: 0, school: 'Abjuration', castingTime: 'Special', range: 'Self (10 ft)', components: '', duration: 'Continuous', description: 'Class feature at 6th: you and allies within 10 ft add your CHA modifier (min +1) to saving throws.' },
];

const RANGER_SPELLS: Spell[] = [
  { name: 'Hunter\'s Mark', level: 1, school: 'Divination', castingTime: '1 bonus action', range: '90 ft', components: 'V', duration: 'Concentration, 1 hour', description: 'Mark a creature. +1d6 damage on weapon attacks against it. Bonus action to move mark on kill.', concentration: true },
  { name: 'Cure Wounds', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', description: 'Restore 1d8 + spellcasting modifier HP. +1d8 per slot above 1st.' },
  { name: 'Ensnaring Strike', level: 1, school: 'Conjuration', castingTime: '1 bonus action', range: 'Self', components: 'V', duration: 'Concentration, 1 minute', description: 'Next hit: STR save or restrained. Repeat save each turn. +1d6 piercing per slot above 1st.', concentration: true },
  { name: 'Fog Cloud', level: 1, school: 'Conjuration', castingTime: '1 action', range: '120 ft', components: 'V, S', duration: 'Concentration, 1 hour', description: '20-ft radius sphere of fog. Area heavily obscured. +20-ft radius per slot above 1st.', concentration: true },
  { name: 'Pass Without Trace', level: 2, school: 'Abjuration', castingTime: '1 action', range: 'Self', components: 'V, S, M', duration: 'Concentration, 1 hour', description: 'Veil of shadows. You and allies within 30 ft: +10 to Stealth, can\'t be tracked by non-magical means.', concentration: true },
  { name: 'Spike Growth', level: 2, school: 'Transmutation', castingTime: '1 action', range: '150 ft', components: 'V, S, M', duration: 'Concentration, 10 minutes', description: '20-ft radius spike field. Difficult terrain, 2d4 piercing per 5 ft moved through.', concentration: true },
];

const SORCERER_SPELLS: Spell[] = [
  ...WIZARD_SPELLS,
  { name: 'Metamagic: Twinned Spell', level: 0, school: 'Special', castingTime: 'Special', range: 'Self', components: '', duration: 'Special', description: 'Spend sorcery points = spell level (min 1). Target a second creature with a single-target spell.' },
  { name: 'Metamagic: Quickened Spell', level: 0, school: 'Special', castingTime: 'Special', range: 'Self', components: '', duration: 'Special', description: 'Spend 2 sorcery points. Change casting time from 1 action to 1 bonus action.' },
];

const WARLOCK_SPELLS: Spell[] = [
  { name: 'Eldritch Blast', level: 0, school: 'Evocation', castingTime: '1 action', range: '120 ft', components: 'V, S', duration: 'Instantaneous', description: 'Ranged spell attack per beam. Hit: 1d10 force. 2 beams at 5th, 3 at 11th, 4 at 17th.' },
  { name: 'Toll the Dead', level: 0, school: 'Necromancy', castingTime: '1 action', range: '60 ft', components: 'V, S', duration: 'Instantaneous', description: 'WIS save or 1d8 necrotic (1d12 if HP missing). 2d8/2d12 at 5th.' },
  { name: 'Hex', level: 1, school: 'Enchantment', castingTime: '1 bonus action', range: '90 ft', components: 'V, S, M', duration: 'Concentration, 1 hour', description: 'Curse a target. +1d6 necrotic on hits. Choose an ability: target has disadvantage on its checks. Move on kill.', concentration: true },
  { name: 'Arms of Hadar', level: 1, school: 'Conjuration', castingTime: '1 action', range: 'Self (10-ft radius)', components: 'V, S', duration: 'Instantaneous', description: 'STR save or 2d6 necrotic + can\'t take reactions. Half damage on save. +1d6 per slot above 1st.' },
  { name: 'Hunger of Hadar', level: 3, school: 'Conjuration', castingTime: '1 action', range: '150 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: '20-ft sphere of void. Heavily obscured. Start of turn: 2d6 cold damage. End of turn: DEX save or 2d6 acid.', concentration: true },
  { name: 'Banishment', level: 4, school: 'Abjuration', castingTime: '1 action', range: '60 ft', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'CHA save or banished. Same plane: harmless demi-plane, returns when concentration ends.', concentration: true },
];

const FIGHTER_SPELLS: Spell[] = [
  // Eldritch Knight only — 1/3 caster, uses Wizard list
  { name: 'Shield', level: 1, school: 'Abjuration', castingTime: '1 reaction', range: 'Self', components: 'V, S', duration: '1 round', description: '+5 AC until start of next turn, immune to Magic Missile.' },
  { name: 'Booming Blade', level: 0, school: 'Evocation', castingTime: '1 action', range: 'Self (5-ft radius)', components: 'S, M', duration: '1 round', description: 'Melee attack as part of casting. Hit: normal damage + target wrapped in booming energy. If moves: +1d8 thunder.' },
];

const ROGUE_SPELLS: Spell[] = [
  // Arcane Trickster only
  { name: 'Mage Hand', level: 0, school: 'Conjuration', castingTime: '1 action', range: '30 ft', components: 'V, S', duration: '1 minute', description: 'Spectral hand. Can use bonus action to control invisibly as Arcane Trickster.' },
  { name: 'Minor Illusion', level: 0, school: 'Illusion', castingTime: '1 action', range: '30 ft', components: 'S, M', duration: '1 minute', description: 'Create a sound or image. Investigation DC 14 to disbelieve.' },
  { name: 'Disguise Self', level: 1, school: 'Illusion', castingTime: '1 action', range: 'Self', components: 'V, S', duration: '1 hour', description: 'Change appearance (clothing, armor, weapons, body shape) but not physical nature.' },
  { name: 'Silent Image', level: 1, school: 'Illusion', castingTime: '1 action', range: '60 ft', components: 'V, S, M', duration: 'Concentration, 10 minutes', description: 'Create a visual image up to 15-ft cube.', concentration: true },
];

const MONK_SPELLS: Spell[] = []; // Monks use ki, not spells (unless Way of the Four Elements subclass)

const BARBARIAN_SPELLS: Spell[] = []; // No spellcasting

// ── CLASS DEFINITIONS ─────────────────────────────────────────────────────────

export const CLASSES: Record<ClassName, ClassDefinition> = {
  Barbarian: {
    name: 'Barbarian',
    hitDie: 12,
    savingThrows: ['str', 'con'],
    primaryAbility: 'str',
    spellcasting: 'none',
    spellSlots: null,
    armorProficiencies: ['Light', 'Medium', 'Shields'],
    weaponProficiencies: ['Simple', 'Martial'],
    skillChoices: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    numSkillChoices: 2,
    spellList: BARBARIAN_SPELLS,
  },
  Bard: {
    name: 'Bard',
    hitDie: 8,
    savingThrows: ['dex', 'cha'],
    primaryAbility: 'cha',
    spellcasting: 'full',
    spellcastingAbility: 'cha',
    spellSlots: FULL_CASTER,
    armorProficiencies: ['Light'],
    weaponProficiencies: ['Simple', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    skillChoices: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'],
    numSkillChoices: 3,
    cantripsKnown: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    spellsKnown: [4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
    spellList: BARD_SPELLS,
  },
  Cleric: {
    name: 'Cleric',
    hitDie: 8,
    savingThrows: ['wis', 'cha'],
    primaryAbility: 'wis',
    spellcasting: 'full',
    spellcastingAbility: 'wis',
    spellSlots: FULL_CASTER,
    armorProficiencies: ['Light', 'Medium', 'Shields'],
    weaponProficiencies: ['Simple'],
    skillChoices: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    numSkillChoices: 2,
    cantripsKnown: [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    spellList: CLERIC_SPELLS,
  },
  Druid: {
    name: 'Druid',
    hitDie: 8,
    savingThrows: ['int', 'wis'],
    primaryAbility: 'wis',
    spellcasting: 'full',
    spellcastingAbility: 'wis',
    spellSlots: FULL_CASTER,
    armorProficiencies: ['Light', 'Medium', 'Shields (non-metal)'],
    weaponProficiencies: ['Clubs', 'Daggers', 'Darts', 'Javelins', 'Maces', 'Quarterstaffs', 'Scimitars', 'Sickles', 'Slings', 'Spears'],
    skillChoices: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
    numSkillChoices: 2,
    cantripsKnown: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    spellList: DRUID_SPELLS,
  },
  Fighter: {
    name: 'Fighter',
    hitDie: 10,
    savingThrows: ['str', 'con'],
    primaryAbility: 'str',
    spellcasting: 'none', // Eldritch Knight is a subclass
    spellSlots: null,
    armorProficiencies: ['All armor', 'Shields'],
    weaponProficiencies: ['Simple', 'Martial'],
    skillChoices: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
    numSkillChoices: 2,
    spellList: FIGHTER_SPELLS,
  },
  Monk: {
    name: 'Monk',
    hitDie: 8,
    savingThrows: ['str', 'dex'],
    primaryAbility: 'dex',
    spellcasting: 'none',
    spellSlots: null,
    armorProficiencies: ['None'],
    weaponProficiencies: ['Simple', 'Shortswords'],
    skillChoices: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    numSkillChoices: 2,
    spellList: MONK_SPELLS,
  },
  Paladin: {
    name: 'Paladin',
    hitDie: 10,
    savingThrows: ['wis', 'cha'],
    primaryAbility: 'str',
    spellcasting: 'half',
    spellcastingAbility: 'cha',
    spellSlots: HALF_CASTER,
    armorProficiencies: ['All armor', 'Shields'],
    weaponProficiencies: ['Simple', 'Martial'],
    skillChoices: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
    numSkillChoices: 2,
    spellList: PALADIN_SPELLS,
  },
  Ranger: {
    name: 'Ranger',
    hitDie: 10,
    savingThrows: ['str', 'dex'],
    primaryAbility: 'dex',
    spellcasting: 'half',
    spellcastingAbility: 'wis',
    spellSlots: HALF_CASTER,
    armorProficiencies: ['Light', 'Medium', 'Shields'],
    weaponProficiencies: ['Simple', 'Martial'],
    skillChoices: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
    numSkillChoices: 3,
    spellsKnown: [0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11],
    spellList: RANGER_SPELLS,
  },
  Rogue: {
    name: 'Rogue',
    hitDie: 8,
    savingThrows: ['dex', 'int'],
    primaryAbility: 'dex',
    spellcasting: 'none', // Arcane Trickster is a subclass
    spellSlots: null,
    armorProficiencies: ['Light'],
    weaponProficiencies: ['Simple', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    skillChoices: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    numSkillChoices: 4,
    spellList: ROGUE_SPELLS,
  },
  Sorcerer: {
    name: 'Sorcerer',
    hitDie: 6,
    savingThrows: ['con', 'cha'],
    primaryAbility: 'cha',
    spellcasting: 'full',
    spellcastingAbility: 'cha',
    spellSlots: FULL_CASTER,
    armorProficiencies: ['None'],
    weaponProficiencies: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
    skillChoices: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    numSkillChoices: 2,
    cantripsKnown: [4,4,4,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
    spellsKnown: [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15],
    spellList: SORCERER_SPELLS,
  },
  Warlock: {
    name: 'Warlock',
    hitDie: 8,
    savingThrows: ['wis', 'cha'],
    primaryAbility: 'cha',
    spellcasting: 'warlock',
    spellcastingAbility: 'cha',
    spellSlots: null, // uses pact magic separately
    armorProficiencies: ['Light'],
    weaponProficiencies: ['Simple'],
    skillChoices: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
    numSkillChoices: 2,
    cantripsKnown: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    spellsKnown: [2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15],
    spellList: WARLOCK_SPELLS,
  },
  Wizard: {
    name: 'Wizard',
    hitDie: 6,
    savingThrows: ['int', 'wis'],
    primaryAbility: 'int',
    spellcasting: 'full',
    spellcastingAbility: 'int',
    spellSlots: FULL_CASTER,
    armorProficiencies: ['None'],
    weaponProficiencies: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
    skillChoices: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
    numSkillChoices: 2,
    cantripsKnown: [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    spellList: WIZARD_SPELLS,
  },
};

// ── SKILLS ────────────────────────────────────────────────────────────────────
export const SKILLS: Array<{ name: string; ability: AbilityKey }> = [
  { name: 'Acrobatics',     ability: 'dex' },
  { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana',         ability: 'int' },
  { name: 'Athletics',      ability: 'str' },
  { name: 'Deception',      ability: 'cha' },
  { name: 'History',        ability: 'int' },
  { name: 'Insight',        ability: 'wis' },
  { name: 'Intimidation',   ability: 'cha' },
  { name: 'Investigation',  ability: 'int' },
  { name: 'Medicine',       ability: 'wis' },
  { name: 'Nature',         ability: 'int' },
  { name: 'Perception',     ability: 'wis' },
  { name: 'Performance',    ability: 'cha' },
  { name: 'Persuasion',     ability: 'cha' },
  { name: 'Religion',       ability: 'int' },
  { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth',        ability: 'dex' },
  { name: 'Survival',       ability: 'wis' },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

export function getSpellSlots(cls: ClassName, level: number): [number,number,number,number,number,number,number,number,number] {
  if (cls === 'Warlock') return [0,0,0,0,0,0,0,0,0]; // handled separately
  const table = CLASSES[cls].spellSlots;
  if (!table) return [0,0,0,0,0,0,0,0,0];
  return table[Math.max(0, Math.min(19, level - 1))];
}

export function getWarlockSlots(level: number): WarlockSlots {
  return WARLOCK_PACT_SLOTS[Math.max(0, Math.min(19, level - 1))];
}

export function maxHpAtLevel(cls: ClassName, level: number, conMod: number): number {
  const hd = CLASSES[cls].hitDie;
  const firstLevel = hd + conMod;
  const otherLevels = (level - 1) * (Math.floor(hd / 2) + 1 + conMod);
  return Math.max(1, firstLevel + otherLevels);
}

export function maxHitDice(level: number): number {
  return level;
}

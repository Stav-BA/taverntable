/**
 * TavernTable — Character Sheet Types
 * D&D 5e 2024 compatible
 */

export interface Feature {
  id: string;
  name: string;
  source: 'class' | 'species' | 'background' | 'feat';
  description: string;
  level?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  description?: string;
  equipped?: boolean;
  isWeapon?: boolean;
  weaponData?: WeaponData;
  isArmor?: boolean;
  armorData?: ArmorData;
}

export interface WeaponData {
  attackBonus: number;
  damage: string;
  damageType: string;
  properties: string[];
  mastery?: string;
  finesse?: boolean;
  range?: string;
}

export interface ArmorData {
  baseAC: number;
  armorType: 'unarmored' | 'light' | 'medium' | 'heavy' | 'natural';
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = cantrip
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
  concentration?: boolean;
  ritual?: boolean;
}

export interface Character {
  id?: string;
  name: string;
  pronouns?: string;
  species: string;
  class: string;
  subclass?: string;
  background: string;
  level: number;
  xp: number;
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skillProficiencies: string[];
  skillExpertise: string[];
  savingThrowProficiencies: string[];
  features: Feature[];
  equipment: EquipmentItem[];
  spells: Spell[];
  portrait?: string;
  backstory?: string;
  notes?: string;
  alignment?: string;
  currentHP: number;
  tempHP: number;
  hitDiceUsed: number;
  spellSlotsUsed: Partial<Record<number, number>>;
  conditions: string[];
  exhaustionLevel: number;
  deathSaves: { successes: number; failures: number };
}

export const DEFAULT_CHARACTER: Character = {
  name: '',
  species: '',
  class: '',
  background: '',
  level: 1,
  xp: 0,
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  skillProficiencies: [],
  skillExpertise: [],
  savingThrowProficiencies: [],
  features: [],
  equipment: [],
  spells: [],
  currentHP: 0,
  tempHP: 0,
  hitDiceUsed: 0,
  spellSlotsUsed: {},
  conditions: [],
  exhaustionLevel: 0,
  deathSaves: { successes: 0, failures: 0 },
};

// ─── D&D 5e 2024 SRD Data ────────────────────────────────────────────────────

export const ALL_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
];

export interface SkillDef {
  name: string;
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
}

export const ALL_SKILLS: SkillDef[] = [
  { name: 'Acrobatics', ability: 'dex' },
  { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' },
  { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' },
  { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' },
  { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' },
  { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' },
  { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' },
  { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' },
  { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' },
  { name: 'Survival', ability: 'wis' },
];

export interface SpeciesData {
  name: string;
  emoji: string;
  speed: number;
  size: string;
  traits: string[];
  description: string;
}

export const SRD_SPECIES: SpeciesData[] = [
  {
    name: 'Dragonborn',
    emoji: '🐉',
    speed: 30,
    size: 'Medium',
    traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
    description: 'Born of dragons, Dragonborn walk proudly through a world that greets them with fearful incomprehension.',
  },
  {
    name: 'Dwarf',
    emoji: '⛏️',
    speed: 25,
    size: 'Medium',
    traits: ['Darkvision', 'Dwarven Resilience', 'Dwarven Toughness'],
    description: 'Bold and hardy, Dwarves are known as skilled warriors, miners, and workers of stone and metal.',
  },
  {
    name: 'Elf',
    emoji: '🌿',
    speed: 30,
    size: 'Medium',
    traits: ['Darkvision', 'Fey Ancestry', 'Trance'],
    description: 'Elves are a magical people of otherworldly grace, living in places of ethereal beauty.',
  },
  {
    name: 'Gnome',
    emoji: '🔮',
    speed: 25,
    size: 'Small',
    traits: ['Darkvision', 'Gnomish Cunning', 'Tinker'],
    description: 'A gnome\'s energy and enthusiasm for living shines through every inch of his or her tiny body.',
  },
  {
    name: 'Half-Elf',
    emoji: '🌟',
    speed: 30,
    size: 'Medium',
    traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility'],
    description: 'Walking in two worlds but truly belonging to neither, Half-Elves combine what some say are the best qualities of their elf and human parents.',
  },
  {
    name: 'Half-Orc',
    emoji: '💪',
    speed: 30,
    size: 'Medium',
    traits: ['Darkvision', 'Relentless Endurance', 'Savage Attacks'],
    description: 'Whether united under the leadership of a mighty warlock or having fought to a standstill after years of conflict, Half-Orcs stand fierce in a world that often proves unforgiving.',
  },
  {
    name: 'Halfling',
    emoji: '🍃',
    speed: 25,
    size: 'Small',
    traits: ['Lucky', 'Brave', 'Halfling Nimbleness'],
    description: 'The comforts of home are the goals of most halflings\' lives: a place to settle in peace and quiet, far from marauding monsters and clashing armies.',
  },
  {
    name: 'Human',
    emoji: '⚔️',
    speed: 30,
    size: 'Medium',
    traits: ['Resourceful', 'Skillful', 'Versatile'],
    description: 'In the reckonings of most worlds, Humans are the youngest of the common races, late to arrive on the world scene and short-lived in comparison to Dwarves, Elves, and Dragons.',
  },
  {
    name: 'Tiefling',
    emoji: '🔥',
    speed: 30,
    size: 'Medium',
    traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
    description: 'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the Tiefling.',
  },
];

export interface ClassData {
  name: string;
  emoji: string;
  hitDie: number;
  role: string;
  primaryAbility: string;
  savingThrows: string[];
  skillChoices: string[];
  numSkillChoices: number;
  subclassLevel: number;
  subclassName: string;
  description: string;
  startingEquipment: EquipmentItem[];
  isSpellcaster: boolean;
}

export const SRD_CLASSES: ClassData[] = [
  {
    name: 'Barbarian',
    emoji: '🪓',
    hitDie: 12,
    role: 'Melee Warrior',
    primaryAbility: 'Strength',
    savingThrows: ['Strength', 'Constitution'],
    skillChoices: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    numSkillChoices: 2,
    subclassLevel: 3,
    subclassName: 'Primal Path',
    description: 'A fierce warrior who channels primal rage to fuel superhuman feats of strength.',
    startingEquipment: [
      { id: 'greataxe', name: 'Greataxe', quantity: 1, weight: 7, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d12', damageType: 'slashing', properties: ['Heavy', 'Two-Handed'], mastery: 'Cleave' } },
      { id: 'handaxe', name: 'Handaxe', quantity: 2, weight: 2, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d6', damageType: 'slashing', properties: ['Light', 'Thrown'], mastery: 'Vex' } },
      { id: 'explorers-pack', name: "Explorer's Pack", quantity: 1, weight: 10 },
      { id: 'javelins', name: 'Javelins', quantity: 4, weight: 2 },
    ],
    isSpellcaster: false,
  },
  {
    name: 'Bard',
    emoji: '🎵',
    hitDie: 8,
    role: 'Support / Face',
    primaryAbility: 'Charisma',
    savingThrows: ['Dexterity', 'Charisma'],
    skillChoices: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'],
    numSkillChoices: 3,
    subclassLevel: 3,
    subclassName: 'Bard College',
    description: 'An inspiring magician whose power echoes the music of creation.',
    startingEquipment: [
      { id: 'rapier', name: 'Rapier', quantity: 1, weight: 2, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d8', damageType: 'piercing', properties: ['Finesse'], mastery: 'Vex', finesse: true } },
      { id: 'lute', name: 'Lute', quantity: 1, weight: 2 },
      { id: 'diplomats-pack', name: "Diplomat's Pack", quantity: 1, weight: 36 },
      { id: 'leather-armor', name: 'Leather Armor', quantity: 1, weight: 10, isArmor: true, equipped: true, armorData: { baseAC: 11, armorType: 'light' } },
    ],
    isSpellcaster: true,
  },
  {
    name: 'Cleric',
    emoji: '✨',
    hitDie: 8,
    role: 'Divine Healer',
    primaryAbility: 'Wisdom',
    savingThrows: ['Wisdom', 'Charisma'],
    skillChoices: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    numSkillChoices: 2,
    subclassLevel: 1,
    subclassName: 'Divine Domain',
    description: 'A priestly champion who wields divine magic in service of a higher power.',
    startingEquipment: [
      { id: 'mace', name: 'Mace', quantity: 1, weight: 4, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d6', damageType: 'bludgeoning', properties: [], mastery: 'Sap' } },
      { id: 'chain-mail', name: 'Chain Mail', quantity: 1, weight: 55, isArmor: true, equipped: true, armorData: { baseAC: 16, armorType: 'heavy' } },
      { id: 'shield', name: 'Shield', quantity: 1, weight: 6 },
      { id: 'holy-symbol', name: 'Holy Symbol', quantity: 1, weight: 1 },
      { id: 'priests-pack', name: "Priest's Pack", quantity: 1, weight: 33 },
    ],
    isSpellcaster: true,
  },
  {
    name: 'Druid',
    emoji: '🌳',
    hitDie: 8,
    role: 'Nature Caster',
    primaryAbility: 'Wisdom',
    savingThrows: ['Intelligence', 'Wisdom'],
    skillChoices: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
    numSkillChoices: 2,
    subclassLevel: 2,
    subclassName: 'Druid Circle',
    description: 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms.',
    startingEquipment: [
      { id: 'wooden-shield', name: 'Wooden Shield', quantity: 1, weight: 6 },
      { id: 'scimitar', name: 'Scimitar', quantity: 1, weight: 3, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d6', damageType: 'slashing', properties: ['Finesse', 'Light'], mastery: 'Nick', finesse: true } },
      { id: 'leather-armor-d', name: 'Leather Armor', quantity: 1, weight: 10, isArmor: true, equipped: true, armorData: { baseAC: 11, armorType: 'light' } },
      { id: 'explorers-pack-d', name: "Explorer's Pack", quantity: 1, weight: 10 },
      { id: 'druidic-focus', name: 'Druidic Focus', quantity: 1, weight: 1 },
    ],
    isSpellcaster: true,
  },
  {
    name: 'Fighter',
    emoji: '🛡️',
    hitDie: 10,
    role: 'Versatile Warrior',
    primaryAbility: 'Strength or Dexterity',
    savingThrows: ['Strength', 'Constitution'],
    skillChoices: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
    numSkillChoices: 2,
    subclassLevel: 3,
    subclassName: 'Martial Archetype',
    description: 'A master of martial combat, skilled with a variety of weapons and armor.',
    startingEquipment: [
      { id: 'longsword', name: 'Longsword', quantity: 1, weight: 3, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d8', damageType: 'slashing', properties: ['Versatile'], mastery: 'Sap' } },
      { id: 'chain-mail-f', name: 'Chain Mail', quantity: 1, weight: 55, isArmor: true, equipped: true, armorData: { baseAC: 16, armorType: 'heavy' } },
      { id: 'shield-f', name: 'Shield', quantity: 1, weight: 6 },
      { id: 'dungeoneer-pack', name: "Dungeoneer's Pack", quantity: 1, weight: 61 },
    ],
    isSpellcaster: false,
  },
  {
    name: 'Monk',
    emoji: '👊',
    hitDie: 8,
    role: 'Martial Artist',
    primaryAbility: 'Dexterity & Wisdom',
    savingThrows: ['Strength', 'Dexterity'],
    skillChoices: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    numSkillChoices: 2,
    subclassLevel: 3,
    subclassName: 'Monastic Tradition',
    description: 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.',
    startingEquipment: [
      { id: 'shortsword-m', name: 'Shortsword', quantity: 1, weight: 2, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d6', damageType: 'piercing', properties: ['Finesse', 'Light'], mastery: 'Vex', finesse: true } },
      { id: 'dungeoneer-pack-m', name: "Dungeoneer's Pack", quantity: 1, weight: 61 },
      { id: 'darts', name: 'Darts', quantity: 10, weight: 0.25 },
    ],
    isSpellcaster: false,
  },
  {
    name: 'Paladin',
    emoji: '⚜️',
    hitDie: 10,
    role: 'Divine Warrior',
    primaryAbility: 'Strength & Charisma',
    savingThrows: ['Wisdom', 'Charisma'],
    skillChoices: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
    numSkillChoices: 2,
    subclassLevel: 3,
    subclassName: 'Sacred Oath',
    description: 'A holy warrior bound by a sacred oath to fight for justice and righteousness.',
    startingEquipment: [
      { id: 'longsword-p', name: 'Longsword', quantity: 1, weight: 3, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d8', damageType: 'slashing', properties: ['Versatile'], mastery: 'Sap' } },
      { id: 'chain-mail-p', name: 'Chain Mail', quantity: 1, weight: 55, isArmor: true, equipped: true, armorData: { baseAC: 16, armorType: 'heavy' } },
      { id: 'shield-p', name: 'Shield', quantity: 1, weight: 6 },
      { id: 'holy-symbol-p', name: 'Holy Symbol', quantity: 1, weight: 1 },
      { id: 'priests-pack-p', name: "Priest's Pack", quantity: 1, weight: 33 },
    ],
    isSpellcaster: true,
  },
  {
    name: 'Ranger',
    emoji: '🏹',
    hitDie: 10,
    role: 'Skirmisher / Scout',
    primaryAbility: 'Dexterity & Wisdom',
    savingThrows: ['Strength', 'Dexterity'],
    skillChoices: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
    numSkillChoices: 3,
    subclassLevel: 3,
    subclassName: 'Ranger Conclave',
    description: 'A warrior who uses martial prowess and nature magic to combat threats at the edge of civilization.',
    startingEquipment: [
      { id: 'scale-mail', name: 'Scale Mail', quantity: 1, weight: 45, isArmor: true, equipped: true, armorData: { baseAC: 14, armorType: 'medium' } },
      { id: 'shortsword-r', name: 'Shortsword', quantity: 2, weight: 2, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d6', damageType: 'piercing', properties: ['Finesse', 'Light'], mastery: 'Vex', finesse: true } },
      { id: 'explorers-pack-r', name: "Explorer's Pack", quantity: 1, weight: 10 },
      { id: 'longbow', name: 'Longbow', quantity: 1, weight: 2, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d8', damageType: 'piercing', properties: ['Heavy', 'Two-Handed'], mastery: 'Slow', range: '150/600 ft.' } },
      { id: 'arrows', name: 'Arrows', quantity: 20, weight: 1 },
    ],
    isSpellcaster: true,
  },
  {
    name: 'Rogue',
    emoji: '🗡️',
    hitDie: 8,
    role: 'Stealthy Striker',
    primaryAbility: 'Dexterity',
    savingThrows: ['Dexterity', 'Intelligence'],
    skillChoices: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    numSkillChoices: 4,
    subclassLevel: 3,
    subclassName: 'Roguish Archetype',
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.',
    startingEquipment: [
      { id: 'rapier-r', name: 'Rapier', quantity: 1, weight: 2, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d8', damageType: 'piercing', properties: ['Finesse'], mastery: 'Vex', finesse: true } },
      { id: 'shortbow', name: 'Shortbow', quantity: 1, weight: 2, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d6', damageType: 'piercing', properties: ['Two-Handed'], mastery: 'Vex', range: '80/320 ft.' } },
      { id: 'arrows-r', name: 'Arrows', quantity: 20, weight: 1 },
      { id: 'leather-armor-r', name: 'Leather Armor', quantity: 1, weight: 10, isArmor: true, equipped: true, armorData: { baseAC: 11, armorType: 'light' } },
      { id: 'burglars-pack', name: "Burglar's Pack", quantity: 1, weight: 47 },
      { id: 'thieves-tools', name: "Thieves' Tools", quantity: 1, weight: 1 },
    ],
    isSpellcaster: false,
  },
  {
    name: 'Sorcerer',
    emoji: '🌀',
    hitDie: 6,
    role: 'Arcane Blaster',
    primaryAbility: 'Charisma',
    savingThrows: ['Constitution', 'Charisma'],
    skillChoices: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    numSkillChoices: 2,
    subclassLevel: 1,
    subclassName: 'Sorcerous Origin',
    description: 'A spellcaster who draws on inherent magic from a gift or bloodline.',
    startingEquipment: [
      { id: 'light-crossbow', name: 'Light Crossbow', quantity: 1, weight: 5, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d8', damageType: 'piercing', properties: ['Ammunition', 'Two-Handed'], mastery: 'Slow', range: '80/320 ft.' } },
      { id: 'bolts', name: 'Bolts', quantity: 20, weight: 1.5 },
      { id: 'component-pouch', name: 'Component Pouch', quantity: 1, weight: 2 },
      { id: 'dungeoneer-pack-s', name: "Dungeoneer's Pack", quantity: 1, weight: 61 },
      { id: 'dagger-s', name: 'Dagger', quantity: 2, weight: 1, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d4', damageType: 'piercing', properties: ['Finesse', 'Light', 'Thrown'], mastery: 'Nick', finesse: true } },
    ],
    isSpellcaster: true,
  },
  {
    name: 'Warlock',
    emoji: '👁️',
    hitDie: 8,
    role: 'Eldritch Invoker',
    primaryAbility: 'Charisma',
    savingThrows: ['Wisdom', 'Charisma'],
    skillChoices: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
    numSkillChoices: 2,
    subclassLevel: 1,
    subclassName: 'Otherworldly Patron',
    description: 'A wielder of magic that is derived from a bargain with an extraplanar entity.',
    startingEquipment: [
      { id: 'light-crossbow-w', name: 'Light Crossbow', quantity: 1, weight: 5, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d8', damageType: 'piercing', properties: ['Ammunition', 'Two-Handed'], mastery: 'Slow', range: '80/320 ft.' } },
      { id: 'bolts-w', name: 'Bolts', quantity: 20, weight: 1.5 },
      { id: 'component-pouch-w', name: 'Component Pouch', quantity: 1, weight: 2 },
      { id: 'scholars-pack', name: "Scholar's Pack", quantity: 1, weight: 11 },
      { id: 'leather-armor-w', name: 'Leather Armor', quantity: 1, weight: 10, isArmor: true, equipped: true, armorData: { baseAC: 11, armorType: 'light' } },
      { id: 'dagger-w', name: 'Dagger', quantity: 2, weight: 1, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d4', damageType: 'piercing', properties: ['Finesse', 'Light', 'Thrown'], mastery: 'Nick', finesse: true } },
    ],
    isSpellcaster: true,
  },
  {
    name: 'Wizard',
    emoji: '📚',
    hitDie: 6,
    role: 'Arcane Scholar',
    primaryAbility: 'Intelligence',
    savingThrows: ['Intelligence', 'Wisdom'],
    skillChoices: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
    numSkillChoices: 2,
    subclassLevel: 2,
    subclassName: 'Arcane Tradition',
    description: 'A scholarly magic-user capable of manipulating the structures of reality.',
    startingEquipment: [
      { id: 'quarterstaff', name: 'Quarterstaff', quantity: 1, weight: 4, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d6', damageType: 'bludgeoning', properties: ['Versatile'], mastery: 'Topple' } },
      { id: 'component-pouch-wz', name: 'Component Pouch', quantity: 1, weight: 2 },
      { id: 'scholars-pack-wz', name: "Scholar's Pack", quantity: 1, weight: 11 },
      { id: 'spellbook', name: 'Spellbook', quantity: 1, weight: 3 },
      { id: 'dagger-wz', name: 'Dagger', quantity: 1, weight: 1, isWeapon: true, weaponData: { attackBonus: 0, damage: '1d4', damageType: 'piercing', properties: ['Finesse', 'Light', 'Thrown'], mastery: 'Nick', finesse: true } },
    ],
    isSpellcaster: true,
  },
];

export interface BackgroundData {
  name: string;
  skillProficiencies: string[];
  toolProficiency?: string;
  languages: number;
  abilityScoreIncreases: { ability: string; amount: number }[];
  feat: string;
  equipment: string[];
  description: string;
}

export const SRD_BACKGROUNDS: BackgroundData[] = [
  {
    name: 'Acolyte',
    skillProficiencies: ['Insight', 'Religion'],
    languages: 2,
    abilityScoreIncreases: [{ ability: 'wis', amount: 2 }, { ability: 'int', amount: 1 }],
    feat: 'Magic Initiate (Cleric)',
    equipment: ['Holy Symbol', 'Prayer Book', '5 Sticks of Incense', 'Vestments', 'Common Clothes', "15 gp"],
    description: 'You have spent your life in the service of a temple to a specific god or pantheon of gods.',
  },
  {
    name: 'Criminal',
    skillProficiencies: ['Deception', 'Stealth'],
    toolProficiency: "Thieves' Tools",
    languages: 0,
    abilityScoreIncreases: [{ ability: 'dex', amount: 2 }, { ability: 'int', amount: 1 }],
    feat: 'Alert',
    equipment: ['Crowbar', 'Dark Common Clothes with Hood', "15 gp"],
    description: 'You are an experienced criminal with a history of breaking the law.',
  },
  {
    name: 'Entertainer',
    skillProficiencies: ['Acrobatics', 'Performance'],
    toolProficiency: 'Musical Instrument',
    languages: 0,
    abilityScoreIncreases: [{ ability: 'cha', amount: 2 }, { ability: 'dex', amount: 1 }],
    feat: 'Musician',
    equipment: ['Musical Instrument', "Costume", 'Entertainer\'s Pack', "15 gp"],
    description: 'You thrive in front of an audience. You know how to entrance them, entertain them, and even inspire them.',
  },
  {
    name: 'Hermit',
    skillProficiencies: ['Medicine', 'Religion'],
    toolProficiency: 'Herbalism Kit',
    languages: 1,
    abilityScoreIncreases: [{ ability: 'wis', amount: 2 }, { ability: 'con', amount: 1 }],
    feat: 'Healer',
    equipment: ['Scroll Case with Notes', "Winter Blanket", 'Common Clothes', 'Herbalism Kit', '5 gp'],
    description: 'You lived in seclusion — either in a sheltered community or entirely alone.',
  },
  {
    name: 'Noble',
    skillProficiencies: ['History', 'Persuasion'],
    toolProficiency: 'Gaming Set',
    languages: 1,
    abilityScoreIncreases: [{ ability: 'cha', amount: 2 }, { ability: 'int', amount: 1 }],
    feat: 'Skilled',
    equipment: ['Fine Clothes', 'Signet Ring', 'Scroll of Pedigree', '25 gp'],
    description: 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land.',
  },
  {
    name: 'Outlander',
    skillProficiencies: ['Athletics', 'Survival'],
    toolProficiency: 'Musical Instrument',
    languages: 1,
    abilityScoreIncreases: [{ ability: 'str', amount: 2 }, { ability: 'con', amount: 1 }],
    feat: 'Tough',
    equipment: ["Staff", "Hunting Trap", 'Trophy from Animal', 'Traveler\'s Clothes', '10 gp'],
    description: 'You grew up in the wilds, far from civilization and the comforts of town and technology.',
  },
  {
    name: 'Sage',
    skillProficiencies: ['Arcana', 'History'],
    languages: 2,
    abilityScoreIncreases: [{ ability: 'int', amount: 2 }, { ability: 'wis', amount: 1 }],
    feat: 'Magic Initiate (Wizard)',
    equipment: ['Bottle of Black Ink', 'Quill', 'Small Knife', 'Letter from Dead Colleague', 'Common Clothes', '10 gp'],
    description: 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts.',
  },
  {
    name: 'Soldier',
    skillProficiencies: ['Athletics', 'Intimidation'],
    toolProficiency: 'Gaming Set',
    languages: 0,
    abilityScoreIncreases: [{ ability: 'str', amount: 2 }, { ability: 'con', amount: 1 }],
    feat: 'Savage Attacker',
    equipment: ['Insignia of Rank', 'Trophy from Fallen Enemy', "Deck of Cards", 'Common Clothes', '10 gp'],
    description: 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, fought in the battles of your world.',
  },
];

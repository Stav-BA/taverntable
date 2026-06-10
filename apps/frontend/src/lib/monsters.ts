export interface MonsterAction {
  name: string;
  type: 'melee' | 'ranged' | 'spell' | 'special';
  attackBonus?: number;
  reach?: number;
  range?: string;
  damageDice?: string;
  damageType?: string;
  saveDC?: number;
  saveAbility?: string;
  description: string;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  cr: string;
  xp: number;
  size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
  type: 'humanoid' | 'beast' | 'undead' | 'fiend' | 'dragon' | 'elemental' | 'giant' | 'monstrosity' | 'construct' | 'fey' | 'celestial' | 'aberration' | 'ooze' | 'plant';
  alignment: string;
  biomes: Array<'cave' | 'dungeon' | 'forest' | 'tavern' | 'any' | 'arctic' | 'desert' | 'mountain' | 'swamp' | 'coastal' | 'underdark'>;
  ac: number;
  hp: number;
  hpDice: string;
  speed: number;
  str: number; dex: number; con: number; int: number; wis: number; cha: number;
  savingThrows?: Partial<{str: number; dex: number; con: number; int: number; wis: number; cha: number}>;
  skills?: Record<string, number>;
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];
  senses: string;
  languages: string;
  traits?: MonsterTrait[];
  actions: MonsterAction[];
  bonusActions?: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: MonsterAction[];
  colour: string;
}

export const MONSTERS: Monster[] = [
  // ── HUMANOIDS ──────────────────────────────────────────────────────────────
  {
    id: 'bandit', name: 'Bandit', emoji: '🗡️', cr: '1/8', xp: 25,
    size: 'Medium', type: 'humanoid', alignment: 'Neutral Evil',
    biomes: ['any', 'tavern'],
    ac: 12, hp: 11, hpDice: '2d8+2', speed: 30,
    str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10,
    senses: 'Passive Perception 10', languages: 'Common',
    actions: [
      { name: 'Scimitar', type: 'melee', attackBonus: 3, reach: 5, damageDice: '1d6+1', damageType: 'slashing', description: 'Melee Attack: +3 to hit, reach 5 ft. Hit: 4 (1d6+1) slashing damage.' },
      { name: 'Light Crossbow', type: 'ranged', attackBonus: 3, range: '80/320 ft', damageDice: '1d8+1', damageType: 'piercing', description: 'Ranged Attack: +3 to hit. Hit: 5 (1d8+1) piercing damage.' },
    ],
    colour: '#8B4513',
  },
  {
    id: 'bandit-captain', name: 'Bandit Captain', emoji: '👑', cr: '2', xp: 450,
    size: 'Medium', type: 'humanoid', alignment: 'Neutral Evil',
    biomes: ['any', 'tavern'],
    ac: 15, hp: 65, hpDice: '10d8+20', speed: 30,
    str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14,
    savingThrows: { str: 4, dex: 5, wis: 2 },
    senses: 'Passive Perception 10', languages: 'Common',
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 3 attacks: 2 scimitar and 1 dagger.' },
      { name: 'Scimitar', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d6+3', damageType: 'slashing', description: 'Melee Attack: +5 to hit. Hit: 6 (1d6+3) slashing damage.' },
      { name: 'Dagger', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d4+3', damageType: 'piercing', description: 'Melee or Ranged Attack: +5 to hit, reach 5 ft or range 20/60 ft. Hit: 5 (1d4+3) piercing damage.' },
    ],
    reactions: [{ name: 'Parry', type: 'special', description: '+2 AC against one melee attack that would hit the captain.' }],
    colour: '#8B0000',
  },
  {
    id: 'guard', name: 'Guard', emoji: '🛡️', cr: '1/8', xp: 25,
    size: 'Medium', type: 'humanoid', alignment: 'Lawful Neutral',
    biomes: ['any', 'tavern'],
    ac: 16, hp: 11, hpDice: '2d8+2', speed: 30,
    str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10,
    skills: { Perception: 2 },
    senses: 'Passive Perception 12', languages: 'Common',
    actions: [
      { name: 'Spear', type: 'melee', attackBonus: 3, reach: 5, damageDice: '1d6+1', damageType: 'piercing', description: 'Melee or Ranged Attack: +3 to hit, reach 5 ft or range 20/60 ft. Hit: 4 (1d6+1) piercing damage.' },
    ],
    colour: '#4169E1',
  },
  {
    id: 'knight', name: 'Knight', emoji: '⚔️', cr: '3', xp: 700,
    size: 'Medium', type: 'humanoid', alignment: 'Lawful Neutral',
    biomes: ['any'],
    ac: 18, hp: 52, hpDice: '8d8+16', speed: 30,
    str: 16, dex: 11, con: 14, int: 11, wis: 11, cha: 15,
    savingThrows: { con: 4, wis: 2 },
    senses: 'Passive Perception 10', languages: 'Common',
    traits: [{ name: 'Brave', description: 'Advantage on saving throws against being frightened.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 greatsword attacks.' },
      { name: 'Greatsword', type: 'melee', attackBonus: 5, reach: 5, damageDice: '2d6+3', damageType: 'slashing', description: 'Melee Attack: +5 to hit. Hit: 10 (2d6+3) slashing damage.' },
      { name: 'Heavy Crossbow', type: 'ranged', attackBonus: 2, range: '100/400 ft', damageDice: '1d10', damageType: 'piercing', description: 'Ranged Attack: +2 to hit. Hit: 5 (1d10) piercing damage.' },
    ],
    reactions: [{ name: 'Parry', type: 'special', description: '+2 AC against one melee attack that would hit the knight.' }],
    colour: '#C0C0C0',
  },
  {
    id: 'mage', name: 'Mage', emoji: '🔮', cr: '6', xp: 2300,
    size: 'Medium', type: 'humanoid', alignment: 'Neutral',
    biomes: ['any', 'dungeon'],
    ac: 12, hp: 40, hpDice: '9d8', speed: 30,
    str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11,
    savingThrows: { int: 6, wis: 4 },
    skills: { Arcana: 6, History: 6 },
    senses: 'Passive Perception 11', languages: 'Common, plus 3 others',
    traits: [{ name: 'Spellcasting', description: 'INT-based spellcaster. DC 14, +6 to hit. Cantrips: Fire Bolt, Light, Mage Hand, Prestidigitation. 1st (4 slots): Detect Magic, Mage Armor, Magic Missile, Shield. 2nd (3 slots): Misty Step, Suggestion. 3rd (3 slots): Counterspell, Fireball, Fly. 4th (3 slots): Greater Invisibility, Ice Storm. 5th (1 slot): Cone of Cold.' }],
    actions: [
      { name: 'Dagger', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d4+2', damageType: 'piercing', description: 'Melee or Ranged Attack: +5 to hit. Hit: 4 (1d4+2) piercing damage.' },
      { name: 'Fire Bolt', type: 'spell', attackBonus: 6, range: '120 ft', damageDice: '2d10', damageType: 'fire', description: 'Ranged Spell Attack: +6 to hit. Hit: 11 (2d10) fire damage.' },
      { name: 'Fireball', type: 'spell', saveDC: 14, saveAbility: 'DEX', range: '150 ft', damageDice: '8d6', damageType: 'fire', description: '3rd-level spell. 20-ft radius, DC 14 DEX save. 28 (8d6) fire damage, half on save.' },
    ],
    colour: '#800080',
  },
  {
    id: 'veteran', name: 'Veteran', emoji: '🪖', cr: '3', xp: 700,
    size: 'Medium', type: 'humanoid', alignment: 'Neutral',
    biomes: ['any'],
    ac: 17, hp: 58, hpDice: '9d8+18', speed: 30,
    str: 16, dex: 13, con: 14, int: 10, wis: 11, cha: 10,
    skills: { Athletics: 5, Perception: 2 },
    senses: 'Passive Perception 12', languages: 'Common',
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 longsword attacks. If offhand shortsword available, also attacks with it (no modifier).' },
      { name: 'Longsword', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d8+3', damageType: 'slashing', description: 'Melee Attack: +5 to hit. Hit: 7 (1d8+3) slashing damage.' },
      { name: 'Shortsword', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d6+3', damageType: 'piercing', description: 'Melee Attack: +5 to hit. Hit: 6 (1d6+3) piercing damage.' },
      { name: 'Heavy Crossbow', type: 'ranged', attackBonus: 3, range: '100/400 ft', damageDice: '1d10+1', damageType: 'piercing', description: 'Ranged Attack: +3 to hit. Hit: 6 (1d10+1) piercing damage.' },
    ],
    colour: '#556B2F',
  },
  {
    id: 'spy', name: 'Spy', emoji: '🕵️', cr: '1', xp: 200,
    size: 'Medium', type: 'humanoid', alignment: 'Neutral',
    biomes: ['any', 'tavern'],
    ac: 12, hp: 27, hpDice: '6d8', speed: 30,
    str: 10, dex: 15, con: 10, int: 12, wis: 14, cha: 16,
    skills: { Deception: 5, Insight: 4, Investigation: 5, Perception: 6, Persuasion: 5, Sleight_of_Hand: 4, Stealth: 4 },
    senses: 'Passive Perception 16', languages: 'Common, plus 2 others',
    traits: [{ name: 'Cunning Action', description: 'Bonus action: Dash, Disengage, or Hide.' }, { name: 'Sneak Attack', description: '+2d6 damage once per turn when advantage or ally adjacent to target.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 attacks.' },
      { name: 'Shortsword', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d6+2', damageType: 'piercing', description: 'Melee Attack: +4 to hit. Hit: 5 (1d6+2) piercing damage.' },
      { name: 'Hand Crossbow', type: 'ranged', attackBonus: 4, range: '30/120 ft', damageDice: '1d6+2', damageType: 'piercing', description: 'Ranged Attack: +4 to hit. Hit: 5 (1d6+2) piercing damage.' },
    ],
    colour: '#2F4F4F',
  },
  // ── CAVE / UNDERGROUND ─────────────────────────────────────────────────────
  {
    id: 'goblin', name: 'Goblin', emoji: '👺', cr: '1/4', xp: 50,
    size: 'Small', type: 'humanoid', alignment: 'Neutral Evil',
    biomes: ['cave', 'dungeon', 'forest'],
    ac: 15, hp: 7, hpDice: '2d6', speed: 30,
    str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
    skills: { Stealth: 6 },
    senses: 'Darkvision 60 ft., Passive Perception 9', languages: 'Common, Goblin',
    traits: [{ name: 'Nimble Escape', description: 'Bonus action: Disengage or Hide.' }],
    actions: [
      { name: 'Scimitar', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d6+2', damageType: 'slashing', description: 'Melee Attack: +4 to hit. Hit: 5 (1d6+2) slashing damage.' },
      { name: 'Shortbow', type: 'ranged', attackBonus: 4, range: '80/320 ft', damageDice: '1d6+2', damageType: 'piercing', description: 'Ranged Attack: +4 to hit. Hit: 5 (1d6+2) piercing damage.' },
    ],
    colour: '#228B22',
  },
  {
    id: 'goblin-boss', name: 'Goblin Boss', emoji: '👹', cr: '1', xp: 200,
    size: 'Small', type: 'humanoid', alignment: 'Neutral Evil',
    biomes: ['cave', 'dungeon'],
    ac: 17, hp: 21, hpDice: '6d6', speed: 30,
    str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 10,
    skills: { Stealth: 6 },
    senses: 'Darkvision 60 ft., Passive Perception 9', languages: 'Common, Goblin',
    traits: [{ name: 'Nimble Escape', description: 'Bonus action: Disengage or Hide.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 scimitar attacks.' },
      { name: 'Scimitar', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d6+2', damageType: 'slashing', description: 'Melee Attack: +4 to hit. Hit: 5 (1d6+2) slashing damage.' },
      { name: 'Javelin', type: 'ranged', attackBonus: 2, range: '30/120 ft', damageDice: '1d6', damageType: 'piercing', description: 'Ranged Attack: +2 to hit. Hit: 3 (1d6) piercing damage.' },
    ],
    reactions: [{ name: 'Redirect Attack', type: 'special', description: 'When targeted by attack, designate another goblin within 5 ft as the target instead.' }],
    colour: '#006400',
  },
  {
    id: 'hobgoblin', name: 'Hobgoblin', emoji: '🪖', cr: '1/2', xp: 100,
    size: 'Medium', type: 'humanoid', alignment: 'Lawful Evil',
    biomes: ['cave', 'dungeon', 'forest'],
    ac: 18, hp: 11, hpDice: '2d8+2', speed: 30,
    str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9,
    senses: 'Darkvision 60 ft., Passive Perception 10', languages: 'Common, Goblin',
    traits: [{ name: 'Martial Advantage', description: 'Once per turn, +2d6 damage if an ally is adjacent to the target.' }],
    actions: [
      { name: 'Longsword', type: 'melee', attackBonus: 3, reach: 5, damageDice: '1d8+1', damageType: 'slashing', description: 'Melee Attack: +3 to hit. Hit: 5 (1d8+1) slashing damage.' },
      { name: 'Longbow', type: 'ranged', attackBonus: 3, range: '150/600 ft', damageDice: '1d8+1', damageType: 'piercing', description: 'Ranged Attack: +3 to hit. Hit: 5 (1d8+1) piercing damage.' },
    ],
    colour: '#8B0000',
  },
  {
    id: 'bugbear', name: 'Bugbear', emoji: '🐻', cr: '1', xp: 200,
    size: 'Medium', type: 'humanoid', alignment: 'Chaotic Evil',
    biomes: ['cave', 'dungeon', 'forest'],
    ac: 16, hp: 27, hpDice: '5d8+5', speed: 30,
    str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9,
    skills: { Stealth: 6, Survival: 2 },
    senses: 'Darkvision 60 ft., Passive Perception 10', languages: 'Common, Goblin',
    traits: [
      { name: 'Brute', description: 'Deals +1 die of damage with melee weapons (already included).' },
      { name: 'Surprise Attack', description: 'If hits a surprised creature, +2d6 extra damage.' },
    ],
    actions: [
      { name: 'Morningstar', type: 'melee', attackBonus: 4, reach: 5, damageDice: '2d8+2', damageType: 'piercing', description: 'Melee Attack: +4 to hit. Hit: 11 (2d8+2) piercing damage.' },
      { name: 'Javelin', type: 'ranged', attackBonus: 4, range: '30/120 ft', damageDice: '2d6+2', damageType: 'piercing', description: 'Melee or Ranged Attack: +4 to hit. Hit: 9 (2d6+2) piercing damage.' },
    ],
    colour: '#8B4513',
  },
  {
    id: 'kobold', name: 'Kobold', emoji: '🦎', cr: '1/8', xp: 25,
    size: 'Small', type: 'humanoid', alignment: 'Lawful Evil',
    biomes: ['cave', 'dungeon'],
    ac: 12, hp: 5, hpDice: '2d6-2', speed: 30,
    str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8,
    senses: 'Darkvision 60 ft., Passive Perception 8', languages: 'Common, Draconic',
    traits: [
      { name: 'Pack Tactics', description: 'Advantage on attack rolls if an ally is adjacent to the target.' },
      { name: 'Sunlight Sensitivity', description: 'Disadvantage on attack rolls and Perception checks in sunlight.' },
    ],
    actions: [
      { name: 'Dagger', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d4+2', damageType: 'piercing', description: 'Melee Attack: +4 to hit. Hit: 4 (1d4+2) piercing damage.' },
      { name: 'Sling', type: 'ranged', attackBonus: 4, range: '30/120 ft', damageDice: '1d4+2', damageType: 'bludgeoning', description: 'Ranged Attack: +4 to hit. Hit: 4 (1d4+2) bludgeoning damage.' },
    ],
    colour: '#8B6914',
  },
  {
    id: 'orc', name: 'Orc', emoji: '🪓', cr: '1/2', xp: 100,
    size: 'Medium', type: 'humanoid', alignment: 'Chaotic Evil',
    biomes: ['cave', 'dungeon', 'forest', 'mountain'],
    ac: 13, hp: 15, hpDice: '2d8+6', speed: 30,
    str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10,
    skills: { Intimidation: 2 },
    senses: 'Darkvision 60 ft., Passive Perception 10', languages: 'Common, Orc',
    traits: [{ name: 'Aggressive', description: 'Bonus action: move up to speed toward a hostile creature.' }],
    actions: [
      { name: 'Greataxe', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d12+3', damageType: 'slashing', description: 'Melee Attack: +5 to hit. Hit: 9 (1d12+3) slashing damage.' },
      { name: 'Javelin', type: 'ranged', attackBonus: 5, range: '30/120 ft', damageDice: '1d6+3', damageType: 'piercing', description: 'Melee or Ranged Attack: +5 to hit. Hit: 6 (1d6+3) piercing damage.' },
    ],
    colour: '#556B2F',
  },
  {
    id: 'orc-war-chief', name: 'Orc War Chief', emoji: '👊', cr: '4', xp: 1100,
    size: 'Medium', type: 'humanoid', alignment: 'Chaotic Evil',
    biomes: ['cave', 'dungeon', 'mountain'],
    ac: 16, hp: 93, hpDice: '11d8+44', speed: 30,
    str: 18, dex: 12, con: 18, int: 11, wis: 11, cha: 16,
    savingThrows: { str: 6, con: 6, wis: 2 },
    skills: { Intimidation: 5 },
    senses: 'Darkvision 60 ft., Passive Perception 10', languages: 'Common, Orc',
    traits: [
      { name: 'Aggressive', description: 'Bonus action: move up to speed toward a hostile creature.' },
      { name: 'Gruumsh\'s Fury', description: 'Deals +1d8 extra damage on hit (included in stats).' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 3 attacks: greataxe or javelin.' },
      { name: 'Greataxe', type: 'melee', attackBonus: 6, reach: 5, damageDice: '1d12+4', damageType: 'slashing', description: 'Melee Attack: +6 to hit. Hit: 10 (1d12+4) slashing damage.' },
      { name: 'Javelin', type: 'ranged', attackBonus: 6, range: '30/120 ft', damageDice: '1d6+4', damageType: 'piercing', description: 'Melee or Ranged Attack: +6 to hit. Hit: 7 (1d6+4) piercing damage.' },
      { name: 'Battle Cry', type: 'special', saveDC: 0, description: 'Recharge 5-6. All allies within 30 ft have advantage on attack rolls until start of war chief\'s next turn.' },
    ],
    colour: '#2E8B57',
  },
  {
    id: 'giant-spider', name: 'Giant Spider', emoji: '🕷️', cr: '1', xp: 200,
    size: 'Large', type: 'beast', alignment: 'Unaligned',
    biomes: ['cave', 'dungeon', 'forest'],
    ac: 14, hp: 26, hpDice: '4d10+4', speed: 30,
    str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4,
    skills: { Stealth: 7 },
    senses: 'Blindsight 10 ft., Darkvision 60 ft., Passive Perception 10', languages: '—',
    traits: [
      { name: 'Spider Climb', description: 'Can climb difficult surfaces including ceilings without checks.' },
      { name: 'Web Sense', description: 'Knows the location of any creature in contact with its web.' },
    ],
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d8+3', damageType: 'piercing', saveDC: 11, saveAbility: 'CON', description: 'Melee Attack: +5 to hit. Hit: 7 (1d8+3) piercing damage + DC 11 CON save or 2d8 poison damage (half on save).' },
      { name: 'Web', type: 'ranged', attackBonus: 5, range: '30/60 ft', saveDC: 12, saveAbility: 'STR', description: 'Recharge 5-6. Ranged Attack: +5 to hit. Target is restrained. DC 12 STR to break free (action). Web is AC 10, 5 HP, vulnerable to fire.' },
    ],
    colour: '#1C1C1C',
  },
  {
    id: 'cave-bear', name: 'Cave Bear', emoji: '🐻', cr: '2', xp: 450,
    size: 'Large', type: 'beast', alignment: 'Unaligned',
    biomes: ['cave', 'dungeon'],
    ac: 12, hp: 42, hpDice: '5d10+15', speed: 40,
    str: 20, dex: 10, con: 16, int: 2, wis: 13, cha: 7,
    skills: { Perception: 3 },
    senses: 'Darkvision 60 ft., Passive Perception 13', languages: '—',
    traits: [{ name: 'Keen Smell', description: 'Advantage on Perception checks that rely on smell.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 attacks: one bite and one claws.' },
      { name: 'Bite', type: 'melee', attackBonus: 7, reach: 5, damageDice: '2d6+5', damageType: 'piercing', description: 'Melee Attack: +7 to hit. Hit: 12 (2d6+5) piercing damage.' },
      { name: 'Claws', type: 'melee', attackBonus: 7, reach: 5, damageDice: '2d6+5', damageType: 'slashing', description: 'Melee Attack: +7 to hit. Hit: 12 (2d6+5) slashing damage.' },
    ],
    colour: '#8B4513',
  },
  {
    id: 'minotaur', name: 'Minotaur', emoji: '🐂', cr: '3', xp: 700,
    size: 'Large', type: 'monstrosity', alignment: 'Chaotic Evil',
    biomes: ['cave', 'dungeon'],
    ac: 14, hp: 114, hpDice: '12d10+48', speed: 40,
    str: 18, dex: 11, con: 16, int: 6, wis: 16, cha: 9,
    skills: { Perception: 7 },
    senses: 'Darkvision 60 ft., Passive Perception 17', languages: 'Abyssal',
    traits: [
      { name: 'Charge', description: 'If moves 10 ft toward target then hits with gore, deals +2d8 piercing. DC 14 STR save or pushed 10 ft and knocked prone.' },
      { name: 'Labyrinthine Recall', description: 'Perfect memory for paths traveled.' },
      { name: 'Reckless', description: 'At the start of its turn, can gain advantage on all melee attacks until end of turn, but attacks against it have advantage until next turn.' },
    ],
    actions: [
      { name: 'Greataxe', type: 'melee', attackBonus: 6, reach: 5, damageDice: '2d12+4', damageType: 'slashing', description: 'Melee Attack: +6 to hit. Hit: 17 (2d12+4) slashing damage.' },
      { name: 'Gore', type: 'melee', attackBonus: 6, reach: 5, damageDice: '2d8+4', damageType: 'piercing', description: 'Melee Attack: +6 to hit. Hit: 13 (2d8+4) piercing damage.' },
    ],
    colour: '#8B4513',
  },
  {
    id: 'mind-flayer', name: 'Mind Flayer', emoji: '🧠', cr: '7', xp: 2900,
    size: 'Medium', type: 'aberration', alignment: 'Lawful Evil',
    biomes: ['underdark', 'dungeon'],
    ac: 15, hp: 71, hpDice: '13d8+13', speed: 30,
    str: 11, dex: 12, con: 12, int: 19, wis: 17, cha: 17,
    savingThrows: { int: 7, wis: 6, cha: 6 },
    skills: { Arcana: 7, Deception: 6, Insight: 6, Perception: 6, Persuasion: 6, Stealth: 4 },
    senses: 'Darkvision 120 ft., Passive Perception 16', languages: 'Telepathy 120 ft.',
    traits: [
      { name: 'Magic Resistance', description: 'Advantage on saving throws against spells and magical effects.' },
      { name: 'Innate Spellcasting', description: 'INT-based (DC 15). At will: Detect Thoughts, Levitate. 1/day each: Dominate Monster, Plane Shift (self only).' },
    ],
    actions: [
      { name: 'Tentacles', type: 'melee', attackBonus: 7, reach: 5, damageDice: '2d10+4', damageType: 'psychic', saveDC: 15, saveAbility: 'INT', description: 'Melee Attack: +7 to hit. Hit: 15 (2d10+4) psychic damage. DC 15 INT save or stunned until end of next turn.' },
      { name: 'Extract Brain', type: 'melee', attackBonus: 7, reach: 5, damageDice: '10d10', damageType: 'piercing', description: 'Melee Attack: +7 to hit. Only works on stunned Medium or smaller creature. On hit: DC 15 INT save or take 55 (10d10) piercing damage. 0 HP = brain extracted and creature dies.' },
      { name: 'Mind Blast', type: 'special', saveDC: 15, saveAbility: 'INT', description: 'Recharge 5-6. 60-ft cone. All creatures: DC 15 INT save or take 22 (4d8+4) psychic damage and be stunned for 1 minute. Repeat save at end of each turn.' },
    ],
    colour: '#9400D3',
  },
  {
    id: 'beholder', name: 'Beholder', emoji: '👁️', cr: '13', xp: 10000,
    size: 'Large', type: 'aberration', alignment: 'Lawful Evil',
    biomes: ['underdark', 'dungeon'],
    ac: 18, hp: 180, hpDice: '19d10+76', speed: 0,
    str: 10, dex: 14, con: 18, int: 17, wis: 15, cha: 17,
    savingThrows: { int: 8, wis: 7, cha: 8 },
    skills: { Perception: 12 },
    conditionImmunities: ['prone'],
    senses: 'Darkvision 120 ft., Passive Perception 22', languages: 'Deep Speech, Undercommon',
    traits: [{ name: 'Antimagic Cone', description: 'Central eye creates a 150-ft cone of antimagic in front of the beholder. Magic is suppressed in this area.' }],
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '4d6', damageType: 'piercing', description: 'Melee Attack: +5 to hit. Hit: 14 (4d6) piercing damage.' },
      { name: 'Eye Rays', type: 'special', description: 'Shoots 3 random eye rays at targets within 120 ft. Roll 1d10 per ray: 1=Charm Ray DC 16 WIS, 2=Paralyzing Ray DC 16 CON, 3=Fear Ray DC 16 WIS, 4=Slowing Ray DC 16 DEX, 5=Enervation Ray 36(8d8) necrotic, 6=Telekinetic Ray +8 STR DC 16, 7=Sleep Ray DC 16 WIS, 8=Petrification Ray DC 16 DEX, 9=Disintegration Ray DC 16 DEX 10d10+5, 10=Death Ray DC 16 DEX 10d10 necrotic instant death.' },
    ],
    legendaryActions: [
      { name: 'Eye Ray', type: 'special', description: 'Costs 1 action. Use one random eye ray.' },
    ],
    colour: '#4B0082',
  },
  {
    id: 'grick', name: 'Grick', emoji: '🪱', cr: '2', xp: 450,
    size: 'Medium', type: 'monstrosity', alignment: 'Neutral',
    biomes: ['cave', 'dungeon'],
    ac: 14, hp: 27, hpDice: '6d8', speed: 30,
    str: 14, dex: 14, con: 11, int: 3, wis: 14, cha: 5,
    damageResistances: ['bludgeoning', 'piercing', 'slashing from nonmagical attacks'],
    senses: 'Darkvision 60 ft., Passive Perception 12', languages: '—',
    traits: [{ name: 'Stone Camouflage', description: 'Advantage on Stealth checks in rocky terrain.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 attacks: tentacles and beak.' },
      { name: 'Tentacles', type: 'melee', attackBonus: 4, reach: 5, damageDice: '2d6+2', damageType: 'slashing', description: 'Melee Attack: +4 to hit. Hit: 9 (2d6+2) slashing damage.' },
      { name: 'Beak', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d6+2', damageType: 'piercing', description: 'Melee Attack: +4 to hit. Hit: 5 (1d6+2) piercing damage.' },
    ],
    colour: '#6B6B6B',
  },
  // ── FOREST ─────────────────────────────────────────────────────────────────
  {
    id: 'wolf', name: 'Wolf', emoji: '🐺', cr: '1/4', xp: 50,
    size: 'Medium', type: 'beast', alignment: 'Unaligned',
    biomes: ['forest', 'mountain'],
    ac: 13, hp: 11, hpDice: '2d8+2', speed: 40,
    str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6,
    skills: { Perception: 3, Stealth: 4 },
    senses: 'Passive Perception 13', languages: '—',
    traits: [
      { name: 'Keen Hearing and Smell', description: 'Advantage on Perception checks using hearing or smell.' },
      { name: 'Pack Tactics', description: 'Advantage on attack rolls if an ally is adjacent to the target.' },
    ],
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 4, reach: 5, damageDice: '2d4+2', damageType: 'piercing', saveDC: 11, saveAbility: 'STR', description: 'Melee Attack: +4 to hit. Hit: 7 (2d4+2) piercing damage. DC 11 STR save or knocked prone.' },
    ],
    colour: '#708090',
  },
  {
    id: 'dire-wolf', name: 'Dire Wolf', emoji: '🐺', cr: '1', xp: 200,
    size: 'Large', type: 'beast', alignment: 'Unaligned',
    biomes: ['forest', 'mountain', 'arctic'],
    ac: 14, hp: 37, hpDice: '5d10+10', speed: 50,
    str: 17, dex: 15, con: 15, int: 3, wis: 12, cha: 7,
    skills: { Perception: 3, Stealth: 4 },
    senses: 'Passive Perception 13', languages: '—',
    traits: [
      { name: 'Keen Hearing and Smell', description: 'Advantage on Perception checks using hearing or smell.' },
      { name: 'Pack Tactics', description: 'Advantage on attack rolls if an ally is adjacent to the target.' },
    ],
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '2d6+3', damageType: 'piercing', saveDC: 13, saveAbility: 'STR', description: 'Melee Attack: +5 to hit. Hit: 10 (2d6+3) piercing damage. DC 13 STR save or knocked prone.' },
    ],
    colour: '#2F4F4F',
  },
  {
    id: 'brown-bear', name: 'Brown Bear', emoji: '🐻', cr: '1', xp: 200,
    size: 'Large', type: 'beast', alignment: 'Unaligned',
    biomes: ['forest', 'mountain'],
    ac: 11, hp: 34, hpDice: '4d10+12', speed: 40,
    str: 19, dex: 10, con: 16, int: 2, wis: 13, cha: 7,
    skills: { Perception: 3 },
    senses: 'Passive Perception 13', languages: '—',
    traits: [{ name: 'Keen Smell', description: 'Advantage on Perception checks that rely on smell.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 attacks: bite and claws.' },
      { name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d8+4', damageType: 'piercing', description: 'Melee Attack: +5 to hit. Hit: 8 (1d8+4) piercing damage.' },
      { name: 'Claws', type: 'melee', attackBonus: 5, reach: 5, damageDice: '2d6+4', damageType: 'slashing', description: 'Melee Attack: +5 to hit. Hit: 11 (2d6+4) slashing damage.' },
    ],
    colour: '#8B4513',
  },
  {
    id: 'owlbear', name: 'Owlbear', emoji: '🦉', cr: '3', xp: 700,
    size: 'Large', type: 'monstrosity', alignment: 'Unaligned',
    biomes: ['forest'],
    ac: 13, hp: 59, hpDice: '7d10+21', speed: 40,
    str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7,
    skills: { Perception: 3 },
    senses: 'Darkvision 60 ft., Passive Perception 13', languages: '—',
    traits: [{ name: 'Keen Sight and Smell', description: 'Advantage on Perception checks using sight or smell.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 attacks: beak and claws.' },
      { name: 'Beak', type: 'melee', attackBonus: 7, reach: 5, damageDice: '1d10+5', damageType: 'piercing', description: 'Melee Attack: +7 to hit. Hit: 10 (1d10+5) piercing damage.' },
      { name: 'Claws', type: 'melee', attackBonus: 7, reach: 5, damageDice: '2d8+5', damageType: 'slashing', description: 'Melee Attack: +7 to hit. Hit: 14 (2d8+5) slashing damage.' },
    ],
    colour: '#8B6914',
  },
  {
    id: 'green-hag', name: 'Green Hag', emoji: '🧙‍♀️', cr: '3', xp: 700,
    size: 'Medium', type: 'fey', alignment: 'Neutral Evil',
    biomes: ['forest', 'swamp'],
    ac: 17, hp: 82, hpDice: '11d8+33', speed: 30,
    str: 18, dex: 13, con: 16, int: 13, wis: 14, cha: 14,
    skills: { Arcana: 3, Deception: 4, Perception: 4, Stealth: 3 },
    senses: 'Darkvision 60 ft., Passive Perception 14', languages: 'Common, Draconic, Sylvan',
    traits: [
      { name: 'Amphibious', description: 'Can breathe air and water.' },
      { name: 'Innate Spellcasting', description: 'CHA-based (DC 12). At will: Dancing Lights, Minor Illusion, Vicious Mockery.' },
      { name: 'Mimicry', description: 'Can mimic animal sounds and humanoid voices (DC 14 Insight to identify).' },
    ],
    actions: [
      { name: 'Claws', type: 'melee', attackBonus: 6, reach: 5, damageDice: '2d6+4', damageType: 'slashing', description: 'Melee Attack: +6 to hit. Hit: 11 (2d6+4) slashing damage.' },
      { name: 'Illusory Appearance', type: 'special', description: 'Changes appearance to look like any humanoid of similar size. Magical disguise (DC 20 Investigation to see through).' },
      { name: 'Invisible Passage', type: 'special', description: 'Becomes invisible until it attacks or casts a spell, or until concentration ends.' },
    ],
    colour: '#006400',
  },
  {
    id: 'displacer-beast', name: 'Displacer Beast', emoji: '🐆', cr: '3', xp: 700,
    size: 'Large', type: 'monstrosity', alignment: 'Lawful Evil',
    biomes: ['forest', 'dungeon'],
    ac: 13, hp: 85, hpDice: '10d10+30', speed: 40,
    str: 18, dex: 15, con: 16, int: 6, wis: 12, cha: 8,
    senses: 'Darkvision 60 ft., Passive Perception 11', languages: '—',
    traits: [
      { name: 'Displacement', description: 'When targeted by an attack, the attacker has disadvantage. If hit, this trait stops working until start of next turn.' },
      { name: 'Avoidance', description: 'When subjected to an effect that allows a DEX save for half damage, takes no damage on success, half on fail.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 tentacle attacks.' },
      { name: 'Tentacle', type: 'melee', attackBonus: 6, reach: 10, damageDice: '1d6+4', damageType: 'bludgeoning', description: 'Melee Attack: +6 to hit, reach 10 ft. Hit: 7 (1d6+4) bludgeoning + 3 (1d6) piercing damage.' },
    ],
    colour: '#4B0082',
  },
  {
    id: 'treant', name: 'Treant', emoji: '🌲', cr: '9', xp: 5000,
    size: 'Huge', type: 'plant', alignment: 'Chaotic Good',
    biomes: ['forest'],
    ac: 16, hp: 138, hpDice: '12d12+60', speed: 30,
    str: 23, dex: 8, con: 21, int: 12, wis: 16, cha: 12,
    damageResistances: ['bludgeoning', 'piercing'],
    damageImmunities: ['fire (vulnerability)'],
    senses: 'Passive Perception 13', languages: 'Common, Druidic, Elvish, Sylvan',
    traits: [
      { name: 'False Appearance', description: 'While motionless, indistinguishable from a normal tree.' },
      { name: 'Siege Monster', description: 'Deals double damage to objects and structures.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 slam attacks.' },
      { name: 'Slam', type: 'melee', attackBonus: 10, reach: 5, damageDice: '3d6+6', damageType: 'bludgeoning', description: 'Melee Attack: +10 to hit. Hit: 16 (3d6+6) bludgeoning damage.' },
      { name: 'Rock', type: 'ranged', attackBonus: 10, range: '60/180 ft', damageDice: '4d10+6', damageType: 'bludgeoning', description: 'Ranged Attack: +10 to hit. Hit: 28 (4d10+6) bludgeoning damage.' },
      { name: 'Animate Trees', type: 'special', description: 'Magically animates up to 2 trees within 60 ft. They act on the treant\'s initiative, obey its commands, and have the same stats but no Animate Trees.' },
    ],
    colour: '#2E8B57',
  },
  // ── UNDEAD ─────────────────────────────────────────────────────────────────
  {
    id: 'skeleton', name: 'Skeleton', emoji: '💀', cr: '1/4', xp: 50,
    size: 'Medium', type: 'undead', alignment: 'Lawful Evil',
    biomes: ['dungeon', 'any'],
    ac: 13, hp: 13, hpDice: '2d8+4', speed: 30,
    str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5,
    damageImmunities: ['poison'],
    conditionImmunities: ['exhaustion', 'poisoned'],
    senses: 'Darkvision 60 ft., Passive Perception 9', languages: 'understands Common but can\'t speak',
    actions: [
      { name: 'Shortsword', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d6+2', damageType: 'piercing', description: 'Melee Attack: +4 to hit. Hit: 5 (1d6+2) piercing damage.' },
      { name: 'Shortbow', type: 'ranged', attackBonus: 4, range: '80/320 ft', damageDice: '1d6+2', damageType: 'piercing', description: 'Ranged Attack: +4 to hit. Hit: 5 (1d6+2) piercing damage.' },
    ],
    colour: '#D3D3D3',
  },
  {
    id: 'zombie', name: 'Zombie', emoji: '🧟', cr: '1/4', xp: 50,
    size: 'Medium', type: 'undead', alignment: 'Neutral Evil',
    biomes: ['dungeon', 'any'],
    ac: 8, hp: 22, hpDice: '3d8+9', speed: 20,
    str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5,
    savingThrows: { wis: 0 },
    damageImmunities: ['poison'],
    conditionImmunities: ['poisoned'],
    senses: 'Darkvision 60 ft., Passive Perception 8', languages: 'understands Common but can\'t speak',
    traits: [{ name: 'Undead Fortitude', description: 'When reduced to 0 HP by damage other than radiant or a critical hit: DC 5 + damage taken CON save. On success, drop to 1 HP instead.' }],
    actions: [
      { name: 'Slam', type: 'melee', attackBonus: 3, reach: 5, damageDice: '1d6+1', damageType: 'bludgeoning', description: 'Melee Attack: +3 to hit. Hit: 4 (1d6+1) bludgeoning damage.' },
    ],
    colour: '#6B8E23',
  },
  {
    id: 'ghoul', name: 'Ghoul', emoji: '👻', cr: '1', xp: 200,
    size: 'Medium', type: 'undead', alignment: 'Chaotic Evil',
    biomes: ['dungeon', 'any'],
    ac: 12, hp: 22, hpDice: '5d8', speed: 30,
    str: 13, dex: 15, con: 10, int: 7, wis: 10, cha: 6,
    damageImmunities: ['poison'],
    conditionImmunities: ['charmed', 'exhaustion', 'poisoned'],
    senses: 'Darkvision 60 ft., Passive Perception 10', languages: 'Common',
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 2, reach: 5, damageDice: '2d6+2', damageType: 'piercing', description: 'Melee Attack: +2 to hit. Hit: 9 (2d6+2) piercing damage.' },
      { name: 'Claws', type: 'melee', attackBonus: 4, reach: 5, damageDice: '2d4+2', damageType: 'slashing', saveDC: 10, saveAbility: 'CON', description: 'Melee Attack: +4 to hit. Hit: 7 (2d4+2) slashing damage. DC 10 CON save or paralyzed for 1 minute. Repeat at end of each turn. Not elves or undead.' },
    ],
    colour: '#8B8B00',
  },
  {
    id: 'ghost', name: 'Ghost', emoji: '👻', cr: '4', xp: 1100,
    size: 'Medium', type: 'undead', alignment: 'Any',
    biomes: ['dungeon', 'any'],
    ac: 11, hp: 45, hpDice: '10d8', speed: 0,
    str: 7, dex: 13, con: 10, int: 10, wis: 12, cha: 17,
    damageResistances: ['acid', 'fire', 'lightning', 'thunder', 'bludgeoning', 'piercing', 'slashing from nonmagical attacks'],
    damageImmunities: ['cold', 'necrotic', 'poison'],
    conditionImmunities: ['charmed', 'exhaustion', 'frightened', 'grappled', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained'],
    senses: 'Darkvision 60 ft., Passive Perception 11', languages: 'Any languages it knew in life',
    traits: [
      { name: 'Ethereal Sight', description: 'Can see 60 ft into the Ethereal Plane while on the Material Plane.' },
      { name: 'Incorporeal Movement', description: 'Can move through other creatures and objects. Takes 5 (1d10) force damage if ending turn inside an object.' },
    ],
    actions: [
      { name: 'Withering Touch', type: 'melee', attackBonus: 5, reach: 5, damageDice: '4d6+2', damageType: 'necrotic', description: 'Melee Attack: +5 to hit. Hit: 17 (4d6+2) necrotic damage.' },
      { name: 'Etherealness', type: 'special', description: 'Enters the Ethereal Plane. Visible as a ghostly form on the Material Plane.' },
      { name: 'Horrifying Visage', type: 'special', saveDC: 13, saveAbility: 'WIS', description: 'Each non-undead within 60 ft: DC 13 WIS save or frightened for 1 minute. On critical fail, ages 1d4 × 10 years. Repeat at end of each turn.' },
      { name: 'Possession', type: 'special', saveDC: 13, saveAbility: 'CHA', description: 'Recharge 6. One humanoid within 5 ft: DC 13 CHA save or possessed. Ghost disappears into target body. Lasts until 0 HP, banished, or target succeeds on repeated DC 13 CHA save (end of each turn).' },
    ],
    colour: '#E0E0E0',
  },
  {
    id: 'wight', name: 'Wight', emoji: '⚔️', cr: '3', xp: 700,
    size: 'Medium', type: 'undead', alignment: 'Neutral Evil',
    biomes: ['dungeon', 'any'],
    ac: 14, hp: 45, hpDice: '6d8+18', speed: 30,
    str: 15, dex: 14, con: 16, int: 10, wis: 13, cha: 15,
    skills: { Perception: 3, Stealth: 4 },
    damageResistances: ['necrotic', 'bludgeoning', 'piercing', 'slashing from nonmagical weapons'],
    damageImmunities: ['poison'],
    conditionImmunities: ['exhaustion', 'poisoned'],
    senses: 'Darkvision 60 ft., Passive Perception 13', languages: 'Common plus languages known in life',
    traits: [{ name: 'Sunlight Sensitivity', description: 'Disadvantage on attacks and Perception checks in sunlight.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 longsword attacks or 2 longbow attacks. Can replace one with Life Drain.' },
      { name: 'Life Drain', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d6+2', damageType: 'necrotic', saveDC: 13, saveAbility: 'CON', description: 'Melee Attack: +4 to hit. Hit: 5 (1d6+2) necrotic damage. DC 13 CON save or HP maximum reduced by the damage dealt. Reduction lasts until long rest. 0 HP max = dies.' },
      { name: 'Longsword', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d8+2', damageType: 'slashing', description: 'Melee Attack: +4 to hit. Hit: 6 (1d8+2) slashing damage.' },
      { name: 'Longbow', type: 'ranged', attackBonus: 4, range: '150/600 ft', damageDice: '1d8+2', damageType: 'piercing', description: 'Ranged Attack: +4 to hit. Hit: 6 (1d8+2) piercing damage.' },
    ],
    colour: '#2F4F4F',
  },
  {
    id: 'wraith', name: 'Wraith', emoji: '🌑', cr: '5', xp: 1800,
    size: 'Medium', type: 'undead', alignment: 'Neutral Evil',
    biomes: ['dungeon', 'any'],
    ac: 13, hp: 67, hpDice: '9d8+27', speed: 0,
    str: 6, dex: 16, con: 16, int: 12, wis: 14, cha: 15,
    damageResistances: ['acid', 'fire', 'lightning', 'thunder', 'bludgeoning', 'piercing', 'slashing from nonmagical attacks'],
    damageImmunities: ['cold', 'necrotic', 'poison'],
    conditionImmunities: ['charmed', 'exhaustion', 'grappled', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained'],
    senses: 'Darkvision 60 ft., Passive Perception 12', languages: 'Common plus any known in life',
    traits: [
      { name: 'Incorporeal Movement', description: 'Move through creatures/objects. 5 (1d10) force damage if ending turn inside object.' },
      { name: 'Sunlight Sensitivity', description: 'Disadvantage on attacks and Perception checks in sunlight.' },
    ],
    actions: [
      { name: 'Life Drain', type: 'melee', attackBonus: 6, reach: 5, damageDice: '4d8+3', damageType: 'necrotic', saveDC: 14, saveAbility: 'CON', description: 'Melee Attack: +6 to hit. Hit: 21 (4d8+3) necrotic damage. DC 14 CON save or HP max reduced by damage. Dies if max reaches 0.' },
      { name: 'Create Specter', type: 'special', description: 'Target: humanoid killed by wraith in last minute. That humanoid rises as a specter under wraith\'s control (max 7 specters).' },
    ],
    colour: '#191970',
  },
  {
    id: 'mummy', name: 'Mummy', emoji: '🪦', cr: '3', xp: 700,
    size: 'Medium', type: 'undead', alignment: 'Lawful Evil',
    biomes: ['dungeon', 'desert'],
    ac: 11, hp: 58, hpDice: '9d8+18', speed: 20,
    str: 16, dex: 8, con: 15, int: 6, wis: 10, cha: 12,
    savingThrows: { wis: 2 },
    damageImmunities: ['necrotic', 'poison', 'bludgeoning/piercing/slashing from nonmagical weapons'],
    conditionImmunities: ['charmed', 'exhaustion', 'frightened', 'paralyzed', 'poisoned'],
    senses: 'Darkvision 60 ft., Passive Perception 10', languages: 'Common plus languages known in life',
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 1 Dreadful Glare and 1 Rotting Fist.' },
      { name: 'Rotting Fist', type: 'melee', attackBonus: 5, reach: 5, damageDice: '2d6+3', damageType: 'bludgeoning', saveDC: 12, saveAbility: 'CON', description: 'Melee Attack: +5 to hit. Hit: 10 (2d6+3) bludgeoning damage + 10 (3d6) necrotic damage. DC 12 CON save or cursed with Mummy Rot (can\'t regain HP, STR reduced 1d4/day, dies at 0 STR, body turns to dust).' },
      { name: 'Dreadful Glare', type: 'special', saveDC: 11, saveAbility: 'WIS', description: '60 ft range. DC 11 WIS save or frightened until end of next turn. On critical fail, paralyzed instead.' },
    ],
    colour: '#C8A96E',
  },
  {
    id: 'vampire-spawn', name: 'Vampire Spawn', emoji: '🧛', cr: '5', xp: 1800,
    size: 'Medium', type: 'undead', alignment: 'Neutral Evil',
    biomes: ['dungeon', 'any'],
    ac: 15, hp: 82, hpDice: '11d8+33', speed: 30,
    str: 16, dex: 16, con: 16, int: 11, wis: 10, cha: 12,
    savingThrows: { dex: 6, wis: 3 },
    skills: { Perception: 3, Stealth: 6 },
    damageResistances: ['necrotic', 'bludgeoning/piercing/slashing from nonmagical weapons'],
    senses: 'Darkvision 60 ft., Passive Perception 13', languages: 'Common plus languages known in life',
    traits: [
      { name: 'Regeneration', description: 'Regains 10 HP at start of turn if it has at least 1 HP and isn\'t in sunlight or running water. If damaged by radiant or holy water, no regeneration this turn.' },
      { name: 'Spider Climb', description: 'Can climb difficult surfaces including ceilings without checks.' },
      { name: 'Sunlight Hypersensitivity', description: 'Takes 20 radiant damage at start of turn in sunlight. In sunlight: disadvantage on attacks and ability checks.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 attacks, only one of which can be Bite.' },
      { name: 'Claws', type: 'melee', attackBonus: 6, reach: 5, damageDice: '2d4+3', damageType: 'slashing', description: 'Melee Attack: +6 to hit. Hit: 8 (2d4+3) slashing damage. Grapple instead of dealing damage (escape DC 13).' },
      { name: 'Bite', type: 'melee', attackBonus: 6, reach: 5, damageDice: '1d6+3', damageType: 'piercing', description: 'Melee Attack: +6 to hit, only against willing, grappled, incapacitated, or restrained. Hit: 6 (1d6+3) piercing + 7 (2d6) necrotic damage. Vampire regains HP equal to necrotic dealt.' },
    ],
    colour: '#8B0000',
  },
  {
    id: 'vampire', name: 'Vampire', emoji: '🧛', cr: '13', xp: 10000,
    size: 'Medium', type: 'undead', alignment: 'Lawful Evil',
    biomes: ['dungeon', 'any'],
    ac: 16, hp: 144, hpDice: '17d8+68', speed: 30,
    str: 18, dex: 18, con: 18, int: 17, wis: 15, cha: 18,
    savingThrows: { dex: 9, wis: 7, cha: 9 },
    skills: { Perception: 7, Stealth: 9 },
    damageResistances: ['necrotic', 'bludgeoning/piercing/slashing from nonmagical weapons'],
    senses: 'Darkvision 120 ft., Passive Perception 17', languages: 'Common plus any 3 languages',
    traits: [
      { name: 'Legendary Resistance (3/day)', description: 'If fails a saving throw, can choose to succeed instead.' },
      { name: 'Regeneration', description: 'Regains 20 HP at start of turn if at 1+ HP, not in sunlight, and not in running water.' },
      { name: 'Spider Climb', description: 'Can climb difficult surfaces including ceilings.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 attacks, only one of which can be Bite.' },
      { name: 'Unarmed Strike', type: 'melee', attackBonus: 9, reach: 5, damageDice: '1d8+4', damageType: 'bludgeoning', description: 'Melee Attack: +9 to hit. Hit: 8 (1d8+4) bludgeoning. Grapple (DC 18) instead of damage.' },
      { name: 'Bite', type: 'melee', attackBonus: 9, reach: 5, damageDice: '1d6+4', damageType: 'piercing', description: 'Only vs willing/grappled/incapacitated/restrained. Hit: 7 (1d6+4) piercing + 10 (3d6) necrotic. Regains HP equal to necrotic dealt. HP max reduced by necrotic until long rest.' },
      { name: 'Charm', type: 'special', saveDC: 17, saveAbility: 'WIS', description: 'One humanoid within 30 ft that can see vampire: DC 17 WIS save or charmed for 24 hours or until damaged. Charmed target regards vampire as trusted friend. Vampire can\'t use this if it has acted hostilely.' },
    ],
    legendaryActions: [
      { name: 'Move', type: 'special', description: 'Costs 1 action. Move up to speed without provoking opportunity attacks.' },
      { name: 'Unarmed Strike', type: 'melee', attackBonus: 9, description: 'Costs 1 action. Make one Unarmed Strike.' },
      { name: 'Bite (Costs 2)', type: 'melee', attackBonus: 9, description: 'Costs 2 actions. Make one Bite attack.' },
    ],
    colour: '#4B0082',
  },
  // ── FIENDS ─────────────────────────────────────────────────────────────────
  {
    id: 'imp', name: 'Imp', emoji: '😈', cr: '1', xp: 200,
    size: 'Tiny', type: 'fiend', alignment: 'Lawful Evil',
    biomes: ['dungeon', 'any'],
    ac: 13, hp: 10, hpDice: '3d4+3', speed: 20,
    str: 6, dex: 17, con: 13, int: 11, wis: 12, cha: 14,
    skills: { Deception: 4, Insight: 3, Persuasion: 4, Stealth: 5 },
    damageResistances: ['cold', 'bludgeoning/piercing/slashing from nonmagical weapons not silver'],
    damageImmunities: ['fire', 'poison'],
    conditionImmunities: ['poisoned'],
    senses: 'Darkvision 120 ft., Passive Perception 11', languages: 'Infernal, Common',
    traits: [
      { name: 'Devil\'s Sight', description: 'Magical darkness doesn\'t impede the imp\'s darkvision.' },
      { name: 'Magic Resistance', description: 'Advantage on saving throws against spells and magical effects.' },
      { name: 'Shapechanger', description: 'Can polymorph into rat, raven, or spider, or back to its true form.' },
    ],
    actions: [
      { name: 'Sting (Bite in beast form)', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d4+3', damageType: 'piercing', saveDC: 11, saveAbility: 'CON', description: 'Melee Attack: +5 to hit. Hit: 5 (1d4+3) piercing damage + DC 11 CON save or 10 (3d6) poison damage (half on save).' },
      { name: 'Invisibility', type: 'special', description: 'Magically turns invisible until it attacks or its concentration ends.' },
    ],
    colour: '#8B0000',
  },
  {
    id: 'hell-hound', name: 'Hell Hound', emoji: '🔥', cr: '3', xp: 700,
    size: 'Medium', type: 'fiend', alignment: 'Lawful Evil',
    biomes: ['dungeon', 'any'],
    ac: 15, hp: 45, hpDice: '7d8+14', speed: 50,
    str: 17, dex: 12, con: 14, int: 6, wis: 13, cha: 6,
    skills: { Perception: 5 },
    damageImmunities: ['fire'],
    senses: 'Darkvision 60 ft., Passive Perception 15', languages: 'understands Infernal but can\'t speak',
    traits: [
      { name: 'Keen Hearing and Smell', description: 'Advantage on Perception checks using hearing or smell.' },
      { name: 'Pack Tactics', description: 'Advantage on attack rolls if an ally is adjacent to the target.' },
    ],
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d8+3', damageType: 'piercing', description: 'Melee Attack: +5 to hit. Hit: 7 (1d8+3) piercing + 7 (2d6) fire damage.' },
      { name: 'Fire Breath', type: 'special', saveDC: 12, saveAbility: 'DEX', description: 'Recharge 5-6. 15-ft cone. DC 12 DEX save: 21 (6d6) fire damage on fail, half on success.' },
    ],
    colour: '#FF4500',
  },
  {
    id: 'shadow-demon', name: 'Shadow Demon', emoji: '🌑', cr: '4', xp: 1100,
    size: 'Medium', type: 'fiend', alignment: 'Chaotic Evil',
    biomes: ['dungeon', 'any'],
    ac: 13, hp: 66, hpDice: '12d8+12', speed: 30,
    str: 1, dex: 17, con: 12, int: 14, wis: 13, cha: 14,
    skills: { Stealth: 7 },
    damageResistances: ['acid', 'fire', 'necrotic', 'thunder', 'bludgeoning/piercing/slashing from nonmagical weapons'],
    damageImmunities: ['cold', 'lightning', 'poison'],
    conditionImmunities: ['exhaustion', 'grappled', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained'],
    senses: 'Darkvision 120 ft., Passive Perception 11', languages: 'Abyssal, telepathy 120 ft.',
    traits: [
      { name: 'Incorporeal Movement', description: 'Move through other creatures and objects.' },
      { name: 'Shadow Stealth', description: 'While in dim light or darkness, can Hide as bonus action.' },
      { name: 'Sunlight Weakness', description: 'In sunlight: disadvantage on attacks and ability checks.' },
      { name: 'Vulnerability', description: 'Vulnerable to radiant damage.' },
    ],
    actions: [
      { name: 'Claws', type: 'melee', attackBonus: 5, reach: 5, damageDice: '2d6+3', damageType: 'psychic', description: 'Melee Attack: +5 to hit (disadvantage in bright light). Hit: 10 (2d6+3) psychic damage.' },
    ],
    colour: '#1C1C1C',
  },
  {
    id: 'pit-fiend', name: 'Pit Fiend', emoji: '👿', cr: '20', xp: 25000,
    size: 'Large', type: 'fiend', alignment: 'Lawful Evil',
    biomes: ['dungeon', 'any'],
    ac: 19, hp: 300, hpDice: '24d10+168', speed: 30,
    str: 26, dex: 14, con: 24, int: 22, wis: 18, cha: 24,
    savingThrows: { dex: 8, con: 13, wis: 10 },
    skills: { Perception: 10 },
    damageResistances: ['cold', 'bludgeoning/piercing/slashing from nonmagical weapons not silver'],
    damageImmunities: ['fire', 'poison'],
    conditionImmunities: ['poisoned'],
    senses: 'Truesight 120 ft., Passive Perception 20', languages: 'Infernal, telepathy 120 ft.',
    traits: [
      { name: 'Fear Aura', description: 'Creatures within 20 ft: DC 21 WIS save at start of turn or frightened until start of next turn.' },
      { name: 'Magic Resistance', description: 'Advantage on saves against spells and magical effects.' },
      { name: 'Magic Weapons', description: 'Weapon attacks are magical.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 4 attacks: bite, claw, claw, tail.' },
      { name: 'Bite', type: 'melee', attackBonus: 14, reach: 5, damageDice: '4d6+8', damageType: 'piercing', saveDC: 21, saveAbility: 'CON', description: 'Melee Attack: +14 to hit. Hit: 22 (4d6+8) piercing + 21 (6d6) fire damage. DC 21 CON save or poisoned.' },
      { name: 'Claw', type: 'melee', attackBonus: 14, reach: 10, damageDice: '2d8+8', damageType: 'slashing', description: 'Melee Attack: +14 to hit. Hit: 17 (2d8+8) slashing damage.' },
      { name: 'Tail', type: 'melee', attackBonus: 14, reach: 10, damageDice: '3d8+8', damageType: 'bludgeoning', description: 'Melee Attack: +14 to hit. Hit: 21 (3d8+8) bludgeoning damage.' },
    ],
    legendaryActions: [
      { name: 'Fireball', type: 'spell', description: 'Costs 1 action. Casts Fireball (DC 21, 8th-level: 12d6).' },
    ],
    colour: '#8B0000',
  },
  // ── DRAGONS ────────────────────────────────────────────────────────────────
  {
    id: 'red-dragon-wyrmling', name: 'Red Dragon Wyrmling', emoji: '🐉', cr: '4', xp: 1100,
    size: 'Medium', type: 'dragon', alignment: 'Chaotic Evil',
    biomes: ['cave', 'mountain'],
    ac: 17, hp: 75, hpDice: '10d8+30', speed: 30,
    str: 19, dex: 10, con: 17, int: 12, wis: 11, cha: 15,
    savingThrows: { dex: 2, con: 5, wis: 2, cha: 4 },
    skills: { Perception: 4, Stealth: 2 },
    damageImmunities: ['fire'],
    senses: 'Blindsight 10 ft., Darkvision 60 ft., Passive Perception 14', languages: 'Draconic',
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 6, reach: 5, damageDice: '1d10+4', damageType: 'piercing', description: 'Melee Attack: +6 to hit. Hit: 9 (1d10+4) piercing + 3 (1d6) fire damage.' },
      { name: 'Fire Breath', type: 'special', saveDC: 13, saveAbility: 'DEX', description: 'Recharge 5-6. 15-ft cone. DC 13 DEX save: 24 (7d6) fire damage, half on success.' },
    ],
    colour: '#FF4500',
  },
  {
    id: 'young-red-dragon', name: 'Young Red Dragon', emoji: '🐲', cr: '10', xp: 5900,
    size: 'Large', type: 'dragon', alignment: 'Chaotic Evil',
    biomes: ['cave', 'mountain'],
    ac: 18, hp: 178, hpDice: '17d10+85', speed: 40,
    str: 23, dex: 10, con: 21, int: 14, wis: 11, cha: 19,
    savingThrows: { dex: 4, con: 9, wis: 4, cha: 8 },
    skills: { Perception: 8, Stealth: 4 },
    damageImmunities: ['fire'],
    senses: 'Blindsight 30 ft., Darkvision 120 ft., Passive Perception 18', languages: 'Common, Draconic',
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 3 attacks: one bite and two claws.' },
      { name: 'Bite', type: 'melee', attackBonus: 10, reach: 10, damageDice: '2d10+6', damageType: 'piercing', description: 'Melee Attack: +10 to hit. Hit: 17 (2d10+6) piercing + 3 (1d6) fire damage.' },
      { name: 'Claw', type: 'melee', attackBonus: 10, reach: 5, damageDice: '2d6+6', damageType: 'slashing', description: 'Melee Attack: +10 to hit. Hit: 13 (2d6+6) slashing damage.' },
      { name: 'Fire Breath', type: 'special', saveDC: 17, saveAbility: 'DEX', description: 'Recharge 5-6. 30-ft cone. DC 17 DEX save: 56 (16d6) fire damage, half on success.' },
    ],
    colour: '#FF0000',
  },
  {
    id: 'young-green-dragon', name: 'Young Green Dragon', emoji: '🐲', cr: '8', xp: 3900,
    size: 'Large', type: 'dragon', alignment: 'Lawful Evil',
    biomes: ['forest', 'cave'],
    ac: 18, hp: 136, hpDice: '16d10+48', speed: 40,
    str: 19, dex: 12, con: 17, int: 16, wis: 13, cha: 15,
    savingThrows: { dex: 4, con: 6, wis: 4, cha: 5 },
    skills: { Deception: 5, Perception: 7, Persuasion: 5, Stealth: 4 },
    damageImmunities: ['poison'],
    conditionImmunities: ['poisoned'],
    senses: 'Blindsight 30 ft., Darkvision 120 ft., Passive Perception 17', languages: 'Common, Draconic',
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 3 attacks: one bite and two claws.' },
      { name: 'Bite', type: 'melee', attackBonus: 7, reach: 10, damageDice: '2d10+4', damageType: 'piercing', description: 'Melee Attack: +7 to hit. Hit: 15 (2d10+4) piercing + 7 (2d6) poison damage.' },
      { name: 'Claw', type: 'melee', attackBonus: 7, reach: 5, damageDice: '2d6+4', damageType: 'slashing', description: 'Melee Attack: +7 to hit. Hit: 11 (2d6+4) slashing damage.' },
      { name: 'Poison Breath', type: 'special', saveDC: 14, saveAbility: 'CON', description: 'Recharge 5-6. 30-ft cone. DC 14 CON save: 42 (12d6) poison damage, half on success.' },
    ],
    colour: '#228B22',
  },
  // ── BEASTS ─────────────────────────────────────────────────────────────────
  {
    id: 'rat', name: 'Rat', emoji: '🐀', cr: '0', xp: 10,
    size: 'Tiny', type: 'beast', alignment: 'Unaligned',
    biomes: ['any', 'tavern', 'dungeon'],
    ac: 10, hp: 1, hpDice: '1d4-1', speed: 20,
    str: 2, dex: 11, con: 9, int: 2, wis: 10, cha: 4,
    senses: 'Darkvision 30 ft., Passive Perception 10', languages: '—',
    traits: [{ name: 'Keen Smell', description: 'Advantage on Perception checks using smell.' }],
    actions: [{ name: 'Bite', type: 'melee', attackBonus: 0, reach: 5, damageDice: '1', damageType: 'piercing', description: 'Melee Attack: +0 to hit. Hit: 1 piercing damage.' }],
    colour: '#808080',
  },
  {
    id: 'poisonous-snake', name: 'Poisonous Snake', emoji: '🐍', cr: '1/8', xp: 25,
    size: 'Tiny', type: 'beast', alignment: 'Unaligned',
    biomes: ['forest', 'swamp', 'dungeon'],
    ac: 13, hp: 2, hpDice: '1d4', speed: 30,
    str: 2, dex: 16, con: 11, int: 1, wis: 10, cha: 3,
    senses: 'Blindsight 10 ft., Passive Perception 10', languages: '—',
    actions: [{ name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d4+3', damageType: 'piercing', saveDC: 10, saveAbility: 'CON', description: 'Melee Attack: +5 to hit. Hit: 5 (1d4+3) piercing. DC 10 CON save or 5 (2d4) poison damage.' }],
    colour: '#228B22',
  },
  {
    id: 'lion', name: 'Lion', emoji: '🦁', cr: '1', xp: 200,
    size: 'Large', type: 'beast', alignment: 'Unaligned',
    biomes: ['forest', 'desert', 'any'],
    ac: 12, hp: 26, hpDice: '4d10+4', speed: 50,
    str: 17, dex: 15, con: 13, int: 3, wis: 12, cha: 8,
    skills: { Perception: 3, Stealth: 4 },
    senses: 'Passive Perception 13', languages: '—',
    traits: [
      { name: 'Keen Smell', description: 'Advantage on Perception checks using smell.' },
      { name: 'Pack Tactics', description: 'Advantage on attacks if an ally is adjacent.' },
      { name: 'Pounce', description: 'If moves 20+ ft toward creature and hits with claws, DC 13 STR save or knocked prone. Bonus action: Bite attack against prone creature.' },
      { name: 'Running Leap', description: 'With 10-ft running start, can long jump up to 25 ft.' },
    ],
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d8+3', damageType: 'piercing', description: 'Melee Attack: +5 to hit. Hit: 7 (1d8+3) piercing damage.' },
      { name: 'Claws', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d6+3', damageType: 'slashing', description: 'Melee Attack: +5 to hit. Hit: 6 (1d6+3) slashing damage.' },
    ],
    colour: '#DAA520',
  },
  {
    id: 'giant-crocodile', name: 'Giant Crocodile', emoji: '🐊', cr: '5', xp: 1800,
    size: 'Huge', type: 'beast', alignment: 'Unaligned',
    biomes: ['swamp', 'coastal'],
    ac: 14, hp: 114, hpDice: '12d12+36', speed: 30,
    str: 21, dex: 9, con: 17, int: 2, wis: 10, cha: 7,
    skills: { Stealth: 5 },
    senses: 'Passive Perception 10', languages: '—',
    traits: [{ name: 'Hold Breath', description: 'Can hold its breath for 30 minutes.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 attacks: bite and tail. Can\'t use both on same target.' },
      { name: 'Bite', type: 'melee', attackBonus: 8, reach: 5, damageDice: '3d10+5', damageType: 'piercing', description: 'Melee Attack: +8 to hit. Hit: 21 (3d10+5) piercing. Grappled (DC 16 escape). Restrained while grappled.' },
      { name: 'Tail', type: 'melee', attackBonus: 8, reach: 10, damageDice: '2d8+5', damageType: 'bludgeoning', saveDC: 16, saveAbility: 'STR', description: 'Melee Attack: +8 to hit (not grappled targets). Hit: 14 (2d8+5) bludgeoning. DC 16 STR save or knocked prone.' },
    ],
    colour: '#2E8B57',
  },
  // ── GIANTS ─────────────────────────────────────────────────────────────────
  {
    id: 'hill-giant', name: 'Hill Giant', emoji: '🏔️', cr: '5', xp: 1800,
    size: 'Huge', type: 'giant', alignment: 'Chaotic Evil',
    biomes: ['mountain', 'cave', 'forest'],
    ac: 13, hp: 105, hpDice: '10d12+40', speed: 40,
    str: 21, dex: 8, con: 19, int: 5, wis: 9, cha: 6,
    skills: { Perception: 2 },
    senses: 'Passive Perception 12', languages: 'Giant',
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 greatclub attacks.' },
      { name: 'Greatclub', type: 'melee', attackBonus: 8, reach: 10, damageDice: '3d8+5', damageType: 'bludgeoning', description: 'Melee Attack: +8 to hit. Hit: 18 (3d8+5) bludgeoning damage.' },
      { name: 'Rock', type: 'ranged', attackBonus: 8, range: '60/240 ft', damageDice: '3d10+5', damageType: 'bludgeoning', description: 'Ranged Attack: +8 to hit. Hit: 21 (3d10+5) bludgeoning damage.' },
    ],
    colour: '#8B6914',
  },
  {
    id: 'stone-giant', name: 'Stone Giant', emoji: '🪨', cr: '7', xp: 2900,
    size: 'Huge', type: 'giant', alignment: 'Neutral',
    biomes: ['mountain', 'cave'],
    ac: 17, hp: 126, hpDice: '11d12+55', speed: 40,
    str: 23, dex: 15, con: 20, int: 10, wis: 12, cha: 9,
    savingThrows: { dex: 5, con: 8, wis: 4 },
    skills: { Athletics: 12, Perception: 4 },
    senses: 'Darkvision 60 ft., Passive Perception 14', languages: 'Giant',
    traits: [{ name: 'Stone Camouflage', description: 'Advantage on Stealth checks in rocky terrain.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 greatclub attacks.' },
      { name: 'Greatclub', type: 'melee', attackBonus: 9, reach: 15, damageDice: '3d8+6', damageType: 'bludgeoning', description: 'Melee Attack: +9 to hit. Hit: 19 (3d8+6) bludgeoning damage.' },
      { name: 'Rock', type: 'ranged', attackBonus: 9, range: '60/240 ft', damageDice: '4d10+6', damageType: 'bludgeoning', saveDC: 17, saveAbility: 'DEX', description: 'Ranged Attack: +9 to hit. Hit: 28 (4d10+6) bludgeoning. DC 17 DEX save or knocked prone.' },
    ],
    reactions: [{ name: 'Rock Catching', type: 'special', description: 'If a rock or similar object is hurled at the giant, DC 10 DEX save to catch it, taking no damage.' }],
    colour: '#708090',
  },
  {
    id: 'frost-giant', name: 'Frost Giant', emoji: '❄️', cr: '8', xp: 3900,
    size: 'Huge', type: 'giant', alignment: 'Neutral Evil',
    biomes: ['mountain', 'arctic'],
    ac: 15, hp: 138, hpDice: '12d12+60', speed: 40,
    str: 23, dex: 9, con: 21, int: 9, wis: 10, cha: 12,
    savingThrows: { con: 8, str: 9, wis: 3 },
    skills: { Athletics: 9, Perception: 3 },
    damageImmunities: ['cold'],
    senses: 'Passive Perception 13', languages: 'Giant',
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 greataxe attacks.' },
      { name: 'Greataxe', type: 'melee', attackBonus: 9, reach: 10, damageDice: '3d12+6', damageType: 'slashing', description: 'Melee Attack: +9 to hit. Hit: 25 (3d12+6) slashing damage.' },
      { name: 'Rock', type: 'ranged', attackBonus: 9, range: '60/240 ft', damageDice: '4d10+6', damageType: 'bludgeoning', description: 'Ranged Attack: +9 to hit. Hit: 28 (4d10+6) bludgeoning damage.' },
    ],
    colour: '#87CEEB',
  },
  // ── ELEMENTALS ─────────────────────────────────────────────────────────────
  {
    id: 'fire-elemental', name: 'Fire Elemental', emoji: '🔥', cr: '5', xp: 1800,
    size: 'Large', type: 'elemental', alignment: 'Neutral',
    biomes: ['dungeon', 'any'],
    ac: 13, hp: 102, hpDice: '12d10+36', speed: 50,
    str: 10, dex: 17, con: 16, int: 6, wis: 10, cha: 7,
    damageResistances: ['bludgeoning', 'piercing', 'slashing from nonmagical attacks'],
    damageImmunities: ['fire', 'poison'],
    conditionImmunities: ['exhaustion', 'grappled', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'unconscious'],
    senses: 'Darkvision 60 ft., Passive Perception 10', languages: 'Ignan',
    traits: [
      { name: 'Fire Form', description: 'Can move through 1-inch space. Creature that touches or hits with melee: 5 (1d10) fire damage. Also ignites flammable objects.' },
      { name: 'Illumination', description: 'Sheds bright light 30 ft, dim light additional 30 ft.' },
      { name: 'Water Susceptibility', description: 'Takes 1 cold damage per gallon of water thrown on it.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 touch attacks.' },
      { name: 'Touch', type: 'melee', attackBonus: 6, reach: 5, damageDice: '2d6+3', damageType: 'fire', description: 'Melee Attack: +6 to hit. Hit: 10 (2d6+3) fire damage. Flammable target ignites (1d10 fire per turn until doused).' },
    ],
    colour: '#FF4500',
  },
  {
    id: 'earth-elemental', name: 'Earth Elemental', emoji: '🪨', cr: '5', xp: 1800,
    size: 'Large', type: 'elemental', alignment: 'Neutral',
    biomes: ['dungeon', 'cave'],
    ac: 17, hp: 126, hpDice: '12d10+60', speed: 30,
    str: 20, dex: 8, con: 20, int: 5, wis: 10, cha: 5,
    damageResistances: ['bludgeoning', 'piercing', 'slashing from nonmagical attacks'],
    damageImmunities: ['poison'],
    conditionImmunities: ['exhaustion', 'paralyzed', 'petrified', 'poisoned', 'unconscious'],
    senses: 'Darkvision 60 ft., Tremorsense 60 ft., Passive Perception 10', languages: 'Terran',
    traits: [
      { name: 'Earth Glide', description: 'Can burrow through nonmagical earth/stone without disturbing it.' },
      { name: 'Siege Monster', description: 'Double damage to objects and structures.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 slam attacks.' },
      { name: 'Slam', type: 'melee', attackBonus: 8, reach: 10, damageDice: '2d8+5', damageType: 'bludgeoning', description: 'Melee Attack: +8 to hit. Hit: 14 (2d8+5) bludgeoning damage.' },
    ],
    colour: '#8B6914',
  },
  {
    id: 'air-elemental', name: 'Air Elemental', emoji: '🌪️', cr: '5', xp: 1800,
    size: 'Large', type: 'elemental', alignment: 'Neutral',
    biomes: ['dungeon', 'any'],
    ac: 15, hp: 90, hpDice: '12d10+24', speed: 0,
    str: 14, dex: 20, con: 14, int: 6, wis: 10, cha: 6,
    damageResistances: ['lightning', 'thunder', 'bludgeoning', 'piercing', 'slashing from nonmagical attacks'],
    damageImmunities: ['poison'],
    conditionImmunities: ['exhaustion', 'grappled', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'unconscious'],
    senses: 'Darkvision 60 ft., Passive Perception 10', languages: 'Auran',
    traits: [{ name: 'Air Form', description: 'Can enter hostile creature\'s space and stop there. Can move through 1-inch opening.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 slam attacks.' },
      { name: 'Slam', type: 'melee', attackBonus: 8, reach: 5, damageDice: '2d8+5', damageType: 'bludgeoning', description: 'Melee Attack: +8 to hit. Hit: 14 (2d8+5) bludgeoning damage.' },
      { name: 'Whirlwind', type: 'special', saveDC: 13, saveAbility: 'STR', description: 'Recharge 4-6. Each creature in elemental\'s space: DC 13 STR save or take 13 (2d8+5) bludgeoning damage and be flung 20 ft away, falling prone.' },
    ],
    colour: '#87CEEB',
  },
  // ── CONSTRUCTS ─────────────────────────────────────────────────────────────
  {
    id: 'animated-armor', name: 'Animated Armor', emoji: '🛡️', cr: '1', xp: 200,
    size: 'Medium', type: 'construct', alignment: 'Unaligned',
    biomes: ['dungeon'],
    ac: 18, hp: 33, hpDice: '6d8+6', speed: 25,
    str: 14, dex: 11, con: 13, int: 1, wis: 3, cha: 1,
    damageImmunities: ['lightning', 'poison'],
    conditionImmunities: ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'paralyzed', 'petrified', 'poisoned'],
    senses: 'Blindsight 60 ft. (blind beyond this), Passive Perception 6', languages: '—',
    traits: [
      { name: 'Antimagic Susceptibility', description: 'Incapacitated in antimagic field. DC 10 CON save if targeted by dispel magic or takes magical damage.' },
      { name: 'False Appearance', description: 'While motionless, indistinguishable from normal suit of armor.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 slam attacks.' },
      { name: 'Slam', type: 'melee', attackBonus: 4, reach: 5, damageDice: '1d6+2', damageType: 'bludgeoning', description: 'Melee Attack: +4 to hit. Hit: 5 (1d6+2) bludgeoning damage.' },
    ],
    colour: '#C0C0C0',
  },
  {
    id: 'stone-golem', name: 'Stone Golem', emoji: '🗿', cr: '10', xp: 5900,
    size: 'Large', type: 'construct', alignment: 'Unaligned',
    biomes: ['dungeon'],
    ac: 17, hp: 178, hpDice: '17d10+85', speed: 30,
    str: 22, dex: 9, con: 20, int: 3, wis: 11, cha: 1,
    damageImmunities: ['poison', 'psychic', 'bludgeoning/piercing/slashing from nonmagical attacks not adamantine'],
    conditionImmunities: ['charmed', 'exhaustion', 'frightened', 'paralyzed', 'petrified', 'poisoned'],
    senses: 'Darkvision 120 ft., Passive Perception 10', languages: 'understands languages of creator but can\'t speak',
    traits: [
      { name: 'Immutable Form', description: 'Immune to spells or effects that would alter its form.' },
      { name: 'Magic Resistance', description: 'Advantage on saves against spells and magical effects.' },
      { name: 'Magic Weapons', description: 'Weapon attacks are magical.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 2 slam attacks.' },
      { name: 'Slam', type: 'melee', attackBonus: 10, reach: 5, damageDice: '3d8+6', damageType: 'bludgeoning', description: 'Melee Attack: +10 to hit. Hit: 19 (3d8+6) bludgeoning damage.' },
      { name: 'Slow', type: 'special', saveDC: 17, saveAbility: 'WIS', description: 'Recharge 5-6. 10-ft radius. DC 17 WIS save or slowed for 1 minute: speed halved, can\'t take reactions, Action or Bonus Action but not both on their turn.' },
    ],
    colour: '#708090',
  },
  // ── MONSTROSITIES ──────────────────────────────────────────────────────────
  {
    id: 'manticore', name: 'Manticore', emoji: '🦁', cr: '3', xp: 700,
    size: 'Large', type: 'monstrosity', alignment: 'Lawful Evil',
    biomes: ['mountain', 'cave', 'desert'],
    ac: 14, hp: 68, hpDice: '8d10+24', speed: 30,
    str: 17, dex: 16, con: 17, int: 7, wis: 12, cha: 8,
    senses: 'Darkvision 60 ft., Passive Perception 11', languages: 'Common',
    traits: [{ name: 'Tail Spike Regrowth', description: 'Has 24 tail spikes. Used tail spikes grow back after a long rest.' }],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 3 attacks: bite, claw, claw. Or 3 tail spike attacks.' },
      { name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d8+3', damageType: 'piercing', description: 'Melee Attack: +5 to hit. Hit: 7 (1d8+3) piercing damage.' },
      { name: 'Claw', type: 'melee', attackBonus: 5, reach: 5, damageDice: '1d4+3', damageType: 'slashing', description: 'Melee Attack: +5 to hit. Hit: 5 (1d4+3) slashing damage.' },
      { name: 'Tail Spike', type: 'ranged', attackBonus: 5, range: '100/200 ft', damageDice: '2d6+3', damageType: 'piercing', description: 'Ranged Attack: +5 to hit. Hit: 10 (2d6+3) piercing damage.' },
    ],
    colour: '#8B4513',
  },
  {
    id: 'basilisk', name: 'Basilisk', emoji: '🦎', cr: '3', xp: 700,
    size: 'Medium', type: 'monstrosity', alignment: 'Unaligned',
    biomes: ['cave', 'dungeon', 'forest'],
    ac: 15, hp: 52, hpDice: '8d8+16', speed: 20,
    str: 16, dex: 8, con: 15, int: 2, wis: 8, cha: 7,
    senses: 'Darkvision 60 ft., Passive Perception 9', languages: '—',
    traits: [{ name: 'Petrifying Gaze', description: 'When a creature starts its turn within 30 ft and can see the basilisk\'s eyes: DC 12 CON save. Fail: restrained. Second fail while restrained: petrified. Repeat save each turn. Success while restrained: no longer restrained.' }],
    actions: [
      { name: 'Bite', type: 'melee', attackBonus: 5, reach: 5, damageDice: '2d6+3', damageType: 'piercing', saveDC: 12, saveAbility: 'CON', description: 'Melee Attack: +5 to hit. Hit: 10 (2d6+3) piercing damage + 7 (2d6) poison damage on fail of DC 12 CON save.' },
    ],
    colour: '#6B8E23',
  },
  {
    id: 'hydra', name: 'Hydra', emoji: '🐍', cr: '8', xp: 3900,
    size: 'Huge', type: 'monstrosity', alignment: 'Unaligned',
    biomes: ['swamp', 'coastal'],
    ac: 15, hp: 172, hpDice: '15d12+75', speed: 30,
    str: 20, dex: 12, con: 20, int: 2, wis: 10, cha: 7,
    senses: 'Darkvision 60 ft., Passive Perception 16', languages: '—',
    traits: [
      { name: 'Hold Breath', description: 'Can hold breath for 1 hour.' },
      { name: 'Multiple Heads (5)', description: 'Has 5 heads. While at least 2 heads functional: advantage on saves against blinded, charmed, deafened, frightened, stunned, unconscious. If takes 25+ damage in single turn: one head dies. Grows 2 back at start of next turn (max 20 heads total).' },
      { name: 'Reactive Heads', description: 'For each head beyond the first, gains extra reaction (used only for opportunity attacks).' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes attacks equal to number of heads.' },
      { name: 'Bite', type: 'melee', attackBonus: 8, reach: 10, damageDice: '1d10+5', damageType: 'piercing', description: 'Melee Attack: +8 to hit. Hit: 10 (1d10+5) piercing damage. (One per head)' },
    ],
    colour: '#2E8B57',
  },
  {
    id: 'roper', name: 'Roper', emoji: '🪨', cr: '5', xp: 1800,
    size: 'Large', type: 'monstrosity', alignment: 'Neutral Evil',
    biomes: ['cave', 'underdark'],
    ac: 20, hp: 93, hpDice: '11d10+33', speed: 10,
    str: 18, dex: 8, con: 17, int: 7, wis: 16, cha: 6,
    skills: { Perception: 6, Stealth: 5 },
    senses: 'Darkvision 60 ft., Passive Perception 16', languages: '—',
    traits: [
      { name: 'False Appearance', description: 'While motionless, indistinguishable from a normal stalactite.' },
      { name: 'Grasping Tendrils', description: 'Has 6 tendrils, each DC 15 STR to break (10 HP, AC 20, immune to poison/psychic). Can use each tendril once per turn.' },
      { name: 'Spider Climb', description: 'Can climb difficult surfaces.' },
    ],
    actions: [
      { name: 'Multiattack', type: 'special', description: 'Makes 4 attacks: 1 bite and 3 tendrils.' },
      { name: 'Bite', type: 'melee', attackBonus: 7, reach: 5, damageDice: '4d8+4', damageType: 'piercing', description: 'Melee Attack: +7 to hit. Hit: 22 (4d8+4) piercing damage.' },
      { name: 'Tendril', type: 'melee', attackBonus: 7, reach: 50, description: 'Melee Attack: +7 to hit. Target grappled (escape DC 15) and restrained.' },
      { name: 'Reel', type: 'special', description: 'Pulls up to 2 restrained creatures 25 ft closer.' },
    ],
    colour: '#808080',
  },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

export function crToNumber(cr: string): number {
  if (cr === '0') return 0;
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr);
}

export function getMonstersByBiome(biome: string): Monster[] {
  return MONSTERS.filter((m) => m.biomes.includes(biome as Monster['biomes'][0]) || m.biomes.includes('any'));
}

export function getMonstersByCR(maxCR: number): Monster[] {
  return MONSTERS.filter((m) => crToNumber(m.cr) <= maxCR);
}

export function getAppropriateMonsters(partyLevel: number, biome: string): Monster[] {
  let maxCR: number;
  if (partyLevel <= 4) maxCR = 1;
  else if (partyLevel <= 8) maxCR = 4;
  else if (partyLevel <= 12) maxCR = 8;
  else if (partyLevel <= 16) maxCR = 13;
  else maxCR = 30;

  const biomeMonsters = getMonstersByBiome(biome);
  return biomeMonsters.filter((m) => crToNumber(m.cr) <= maxCR);
}

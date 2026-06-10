// ── CURRENCY ─────────────────────────────────────────────────────────────────

export interface Currency {
  cp: number; // copper pieces
  sp: number; // silver pieces
  ep: number; // electrum pieces
  gp: number; // gold pieces
  pp: number; // platinum pieces
}

export const EMPTY_CURRENCY: Currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

/** Returns total value in gold pieces. 1pp=10gp, 1ep=0.5gp, 1sp=0.1gp, 1cp=0.01gp */
export function toGoldValue(c: Currency): number {
  return c.pp * 10 + c.gp + c.ep * 0.5 + c.sp * 0.1 + c.cp * 0.01;
}

/**
 * Attempt to subtract costGp from wallet.
 * Returns updated Currency on success, null if the wallet cannot afford it.
 * Drains cp → sp → ep → gp → pp in ascending denomination order, converting
 * change back to copper when the highest denomination overpays.
 */
export function subtractCost(wallet: Currency, costGp: number): Currency | null {
  if (toGoldValue(wallet) < costGp) return null;

  // Work in copper pieces to avoid floating-point drift.
  let remainingCp = Math.round(costGp * 100);
  let { cp, sp, ep, gp, pp } = { ...wallet };

  // Drain copper first
  const drainCp = Math.min(cp, remainingCp);
  cp -= drainCp;
  remainingCp -= drainCp;

  // Drain silver (1 sp = 10 cp)
  const drainSp = Math.min(sp, Math.ceil(remainingCp / 10));
  sp -= drainSp;
  remainingCp -= drainSp * 10;

  // Drain electrum (1 ep = 50 cp)
  const drainEp = Math.min(ep, Math.ceil(remainingCp / 50));
  ep -= drainEp;
  remainingCp -= drainEp * 50;

  // Drain gold (1 gp = 100 cp)
  const drainGp = Math.min(gp, Math.ceil(remainingCp / 100));
  gp -= drainGp;
  remainingCp -= drainGp * 100;

  // Drain platinum (1 pp = 1000 cp)
  const drainPp = Math.min(pp, Math.ceil(remainingCp / 1000));
  pp -= drainPp;
  remainingCp -= drainPp * 1000;

  // remainingCp will be <= 0; give back overpayment as copper change
  if (remainingCp < 0) {
    cp += Math.abs(remainingCp);
  }

  return { cp, sp, ep, gp, pp };
}

// ── WEAPONS ───────────────────────────────────────────────────────────────────

export type WeaponProperty =
  | 'Ammunition'
  | 'Finesse'
  | 'Heavy'
  | 'Light'
  | 'Loading'
  | 'Range'
  | 'Reach'
  | 'Special'
  | 'Thrown'
  | 'Two-Handed'
  | 'Versatile';

export type DamageType =
  | 'slashing'
  | 'piercing'
  | 'bludgeoning'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'acid'
  | 'poison'
  | 'necrotic'
  | 'radiant'
  | 'force'
  | 'thunder'
  | 'psychic';

export interface Weapon {
  id: string;
  name: string;
  category: 'Simple Melee' | 'Simple Ranged' | 'Martial Melee' | 'Martial Ranged';
  damageDice: string;       // e.g. "1d6"
  versatileDice?: string;   // two-handed damage when Versatile property applies
  damageType: DamageType;
  properties: WeaponProperty[];
  range?: string;           // e.g. "80/320 ft" for ranged weapons
  weight: number;           // lbs
  costGp: number;
  throwRange?: string;      // e.g. "20/60 ft" for thrown weapons
}

export const WEAPONS: Weapon[] = [
  // ── Simple Melee ──────────────────────────────────────────────────────────
  {
    id: 'club', name: 'Club', category: 'Simple Melee',
    damageDice: '1d4', damageType: 'bludgeoning',
    properties: ['Light'], weight: 2, costGp: 0.1,
  },
  {
    id: 'dagger', name: 'Dagger', category: 'Simple Melee',
    damageDice: '1d4', damageType: 'piercing',
    properties: ['Finesse', 'Light', 'Thrown'],
    throwRange: '20/60 ft', weight: 1, costGp: 2,
  },
  {
    id: 'greatclub', name: 'Greatclub', category: 'Simple Melee',
    damageDice: '1d8', damageType: 'bludgeoning',
    properties: ['Two-Handed'], weight: 10, costGp: 0.2,
  },
  {
    id: 'handaxe', name: 'Handaxe', category: 'Simple Melee',
    damageDice: '1d6', damageType: 'slashing',
    properties: ['Light', 'Thrown'],
    throwRange: '20/60 ft', weight: 2, costGp: 5,
  },
  {
    id: 'javelin', name: 'Javelin', category: 'Simple Melee',
    damageDice: '1d6', damageType: 'piercing',
    properties: ['Thrown'],
    throwRange: '30/120 ft', weight: 2, costGp: 0.5,
  },
  {
    id: 'light-hammer', name: 'Light Hammer', category: 'Simple Melee',
    damageDice: '1d4', damageType: 'bludgeoning',
    properties: ['Light', 'Thrown'],
    throwRange: '20/60 ft', weight: 2, costGp: 2,
  },
  {
    id: 'mace', name: 'Mace', category: 'Simple Melee',
    damageDice: '1d6', damageType: 'bludgeoning',
    properties: [], weight: 4, costGp: 5,
  },
  {
    id: 'quarterstaff', name: 'Quarterstaff', category: 'Simple Melee',
    damageDice: '1d6', versatileDice: '1d8', damageType: 'bludgeoning',
    properties: ['Versatile'], weight: 4, costGp: 0.2,
  },
  {
    id: 'sickle', name: 'Sickle', category: 'Simple Melee',
    damageDice: '1d4', damageType: 'slashing',
    properties: ['Light'], weight: 2, costGp: 1,
  },
  {
    id: 'spear', name: 'Spear', category: 'Simple Melee',
    damageDice: '1d6', versatileDice: '1d8', damageType: 'piercing',
    properties: ['Thrown', 'Versatile'],
    throwRange: '20/60 ft', weight: 3, costGp: 1,
  },
  // ── Simple Ranged ─────────────────────────────────────────────────────────
  {
    id: 'crossbow-light', name: 'Crossbow, Light', category: 'Simple Ranged',
    damageDice: '1d8', damageType: 'piercing',
    properties: ['Ammunition', 'Loading', 'Range', 'Two-Handed'],
    range: '80/320 ft', weight: 5, costGp: 25,
  },
  {
    id: 'dart', name: 'Dart', category: 'Simple Ranged',
    damageDice: '1d4', damageType: 'piercing',
    properties: ['Finesse', 'Thrown'],
    throwRange: '20/60 ft', weight: 0.25, costGp: 0.05,
  },
  {
    id: 'shortbow', name: 'Shortbow', category: 'Simple Ranged',
    damageDice: '1d6', damageType: 'piercing',
    properties: ['Ammunition', 'Range', 'Two-Handed'],
    range: '80/320 ft', weight: 2, costGp: 25,
  },
  {
    id: 'sling', name: 'Sling', category: 'Simple Ranged',
    damageDice: '1d4', damageType: 'bludgeoning',
    properties: ['Ammunition', 'Range'],
    range: '30/120 ft', weight: 0, costGp: 0.1,
  },
  // ── Martial Melee ─────────────────────────────────────────────────────────
  {
    id: 'battleaxe', name: 'Battleaxe', category: 'Martial Melee',
    damageDice: '1d8', versatileDice: '1d10', damageType: 'slashing',
    properties: ['Versatile'], weight: 4, costGp: 10,
  },
  {
    id: 'flail', name: 'Flail', category: 'Martial Melee',
    damageDice: '1d8', damageType: 'bludgeoning',
    properties: [], weight: 2, costGp: 10,
  },
  {
    id: 'glaive', name: 'Glaive', category: 'Martial Melee',
    damageDice: '1d10', damageType: 'slashing',
    properties: ['Heavy', 'Reach', 'Two-Handed'], weight: 6, costGp: 20,
  },
  {
    id: 'greataxe', name: 'Greataxe', category: 'Martial Melee',
    damageDice: '1d12', damageType: 'slashing',
    properties: ['Heavy', 'Two-Handed'], weight: 7, costGp: 30,
  },
  {
    id: 'greatsword', name: 'Greatsword', category: 'Martial Melee',
    damageDice: '2d6', damageType: 'slashing',
    properties: ['Heavy', 'Two-Handed'], weight: 6, costGp: 50,
  },
  {
    id: 'halberd', name: 'Halberd', category: 'Martial Melee',
    damageDice: '1d10', damageType: 'slashing',
    properties: ['Heavy', 'Reach', 'Two-Handed'], weight: 6, costGp: 20,
  },
  {
    id: 'lance', name: 'Lance', category: 'Martial Melee',
    damageDice: '1d12', damageType: 'piercing',
    properties: ['Reach', 'Special'], weight: 6, costGp: 10,
  },
  {
    id: 'longsword', name: 'Longsword', category: 'Martial Melee',
    damageDice: '1d8', versatileDice: '1d10', damageType: 'slashing',
    properties: ['Versatile'], weight: 3, costGp: 15,
  },
  {
    id: 'maul', name: 'Maul', category: 'Martial Melee',
    damageDice: '2d6', damageType: 'bludgeoning',
    properties: ['Heavy', 'Two-Handed'], weight: 10, costGp: 10,
  },
  {
    id: 'morningstar', name: 'Morningstar', category: 'Martial Melee',
    damageDice: '1d8', damageType: 'piercing',
    properties: [], weight: 4, costGp: 15,
  },
  {
    id: 'pike', name: 'Pike', category: 'Martial Melee',
    damageDice: '1d10', damageType: 'piercing',
    properties: ['Heavy', 'Reach', 'Two-Handed'], weight: 18, costGp: 5,
  },
  {
    id: 'rapier', name: 'Rapier', category: 'Martial Melee',
    damageDice: '1d8', damageType: 'piercing',
    properties: ['Finesse'], weight: 2, costGp: 25,
  },
  {
    id: 'scimitar', name: 'Scimitar', category: 'Martial Melee',
    damageDice: '1d6', damageType: 'slashing',
    properties: ['Finesse', 'Light'], weight: 3, costGp: 25,
  },
  {
    id: 'shortsword', name: 'Shortsword', category: 'Martial Melee',
    damageDice: '1d6', damageType: 'piercing',
    properties: ['Finesse', 'Light'], weight: 2, costGp: 10,
  },
  {
    id: 'trident', name: 'Trident', category: 'Martial Melee',
    damageDice: '1d6', versatileDice: '1d8', damageType: 'piercing',
    properties: ['Thrown', 'Versatile'],
    throwRange: '20/60 ft', weight: 4, costGp: 5,
  },
  {
    id: 'war-pick', name: 'War Pick', category: 'Martial Melee',
    damageDice: '1d8', damageType: 'piercing',
    properties: [], weight: 2, costGp: 5,
  },
  {
    id: 'warhammer', name: 'Warhammer', category: 'Martial Melee',
    damageDice: '1d8', versatileDice: '1d10', damageType: 'bludgeoning',
    properties: ['Versatile'], weight: 2, costGp: 15,
  },
  {
    id: 'whip', name: 'Whip', category: 'Martial Melee',
    damageDice: '1d4', damageType: 'slashing',
    properties: ['Finesse', 'Reach'], weight: 3, costGp: 2,
  },
  // ── Martial Ranged ────────────────────────────────────────────────────────
  {
    id: 'blowgun', name: 'Blowgun', category: 'Martial Ranged',
    damageDice: '1d1', damageType: 'piercing',
    properties: ['Ammunition', 'Loading', 'Range'],
    range: '25/100 ft', weight: 1, costGp: 10,
  },
  {
    id: 'crossbow-hand', name: 'Crossbow, Hand', category: 'Martial Ranged',
    damageDice: '1d6', damageType: 'piercing',
    properties: ['Ammunition', 'Light', 'Loading', 'Range'],
    range: '30/120 ft', weight: 3, costGp: 75,
  },
  {
    id: 'crossbow-heavy', name: 'Crossbow, Heavy', category: 'Martial Ranged',
    damageDice: '1d10', damageType: 'piercing',
    properties: ['Ammunition', 'Heavy', 'Loading', 'Range', 'Two-Handed'],
    range: '100/400 ft', weight: 18, costGp: 50,
  },
  {
    id: 'longbow', name: 'Longbow', category: 'Martial Ranged',
    damageDice: '1d8', damageType: 'piercing',
    properties: ['Ammunition', 'Heavy', 'Range', 'Two-Handed'],
    range: '150/600 ft', weight: 2, costGp: 50,
  },
  {
    id: 'net', name: 'Net', category: 'Martial Ranged',
    damageDice: '0d6', damageType: 'bludgeoning',
    properties: ['Special', 'Thrown'],
    throwRange: '5/15 ft', weight: 3, costGp: 1,
  },
];

// ── ARMOR ─────────────────────────────────────────────────────────────────────

export type ArmorCategory = 'Light' | 'Medium' | 'Heavy' | 'Shield';

export interface Armor {
  id: string;
  name: string;
  category: ArmorCategory;
  baseAC: number;
  addDexMod: boolean;       // whether DEX modifier is added to AC
  maxDexBonus?: number;     // cap on DEX mod: Medium=2, Heavy=0, Light=undefined (no cap)
  strengthReq?: number;     // STR score required to wear without speed penalty
  stealthDisadvantage: boolean;
  weight: number;           // lbs
  costGp: number;
}

export const ARMORS: Armor[] = [
  // Light Armor
  { id: 'padded',          name: 'Padded',          category: 'Light',  baseAC: 11, addDexMod: true,  stealthDisadvantage: true,  weight: 8,  costGp: 5    },
  { id: 'leather',         name: 'Leather',         category: 'Light',  baseAC: 11, addDexMod: true,  stealthDisadvantage: false, weight: 10, costGp: 10   },
  { id: 'studded-leather', name: 'Studded Leather', category: 'Light',  baseAC: 12, addDexMod: true,  stealthDisadvantage: false, weight: 13, costGp: 45   },
  // Medium Armor
  { id: 'hide',        name: 'Hide',        category: 'Medium', baseAC: 12, addDexMod: true, maxDexBonus: 2, stealthDisadvantage: false, weight: 12, costGp: 10  },
  { id: 'chain-shirt', name: 'Chain Shirt', category: 'Medium', baseAC: 13, addDexMod: true, maxDexBonus: 2, stealthDisadvantage: false, weight: 20, costGp: 50  },
  { id: 'scale-mail',  name: 'Scale Mail',  category: 'Medium', baseAC: 14, addDexMod: true, maxDexBonus: 2, stealthDisadvantage: true,  weight: 45, costGp: 50  },
  { id: 'breastplate', name: 'Breastplate', category: 'Medium', baseAC: 14, addDexMod: true, maxDexBonus: 2, stealthDisadvantage: false, weight: 20, costGp: 400 },
  { id: 'half-plate',  name: 'Half Plate',  category: 'Medium', baseAC: 15, addDexMod: true, maxDexBonus: 2, stealthDisadvantage: true,  weight: 40, costGp: 750 },
  // Heavy Armor
  { id: 'ring-mail',  name: 'Ring Mail',  category: 'Heavy', baseAC: 14, addDexMod: false, maxDexBonus: 0,                    stealthDisadvantage: true, weight: 40, costGp: 30   },
  { id: 'chain-mail', name: 'Chain Mail', category: 'Heavy', baseAC: 16, addDexMod: false, maxDexBonus: 0, strengthReq: 13, stealthDisadvantage: true, weight: 55, costGp: 75   },
  { id: 'splint',     name: 'Splint',     category: 'Heavy', baseAC: 17, addDexMod: false, maxDexBonus: 0, strengthReq: 15, stealthDisadvantage: true, weight: 60, costGp: 200  },
  { id: 'plate',      name: 'Plate',      category: 'Heavy', baseAC: 18, addDexMod: false, maxDexBonus: 0, strengthReq: 15, stealthDisadvantage: true, weight: 65, costGp: 1500 },
  // Shield
  { id: 'shield', name: 'Shield', category: 'Shield', baseAC: 2, addDexMod: false, stealthDisadvantage: false, weight: 6, costGp: 10 },
];

// ── MAGIC ITEMS ───────────────────────────────────────────────────────────────

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';

export interface MagicItem {
  id: string;
  name: string;
  rarity: Rarity;
  type: 'Weapon' | 'Armor' | 'Wondrous Item' | 'Potion' | 'Scroll' | 'Ring' | 'Staff' | 'Wand' | 'Rod';
  requiresAttunement: boolean;
  description: string;
  healingDice?: string;
  costGp: number;
}

export const MAGIC_ITEMS: MagicItem[] = [
  // ── Potions ───────────────────────────────────────────────────────────────
  {
    id: 'potion-healing', name: 'Potion of Healing', rarity: 'Common', type: 'Potion',
    requiresAttunement: false, healingDice: '2d4+2', costGp: 50,
    description: 'You regain 2d4+2 hit points when you drink this potion.',
  },
  {
    id: 'potion-greater-healing', name: 'Potion of Greater Healing', rarity: 'Uncommon', type: 'Potion',
    requiresAttunement: false, healingDice: '4d4+4', costGp: 100,
    description: 'You regain 4d4+4 hit points when you drink this potion.',
  },
  {
    id: 'potion-superior-healing', name: 'Potion of Superior Healing', rarity: 'Rare', type: 'Potion',
    requiresAttunement: false, healingDice: '8d4+8', costGp: 500,
    description: 'You regain 8d4+8 hit points when you drink this potion.',
  },
  {
    id: 'potion-supreme-healing', name: 'Potion of Supreme Healing', rarity: 'Very Rare', type: 'Potion',
    requiresAttunement: false, healingDice: '10d4+20', costGp: 5000,
    description: 'You regain 10d4+20 hit points when you drink this potion.',
  },
  {
    id: 'potion-invisibility', name: 'Potion of Invisibility', rarity: 'Very Rare', type: 'Potion',
    requiresAttunement: false, costGp: 180,
    description: 'When you drink this potion, you become invisible for 1 hour. Anything you wear or carry is invisible with you. The effect ends early if you attack or cast a spell.',
  },
  {
    id: 'potion-speed', name: 'Potion of Speed', rarity: 'Very Rare', type: 'Potion',
    requiresAttunement: false, costGp: 400,
    description: 'When you drink this potion, you gain the effect of the haste spell for 1 minute (no concentration required).',
  },
  {
    id: 'potion-flying', name: 'Potion of Flying', rarity: 'Very Rare', type: 'Potion',
    requiresAttunement: false, costGp: 500,
    description: 'When you drink this potion, you gain a flying speed equal to your walking speed for 1 hour and can hover.',
  },
  // ── Scrolls ───────────────────────────────────────────────────────────────
  {
    id: 'scroll-fireball', name: 'Scroll of Fireball', rarity: 'Uncommon', type: 'Scroll',
    requiresAttunement: false, costGp: 200,
    description: 'A spell scroll bearing the words of the fireball spell (3rd level, DC 15). You can cast the spell from the scroll, which is then destroyed.',
  },
  {
    id: 'scroll-lightning-bolt', name: 'Scroll of Lightning Bolt', rarity: 'Uncommon', type: 'Scroll',
    requiresAttunement: false, costGp: 200,
    description: 'A spell scroll bearing the words of the lightning bolt spell (3rd level, DC 15). You can cast the spell from the scroll, which is then destroyed.',
  },
  {
    id: 'scroll-cure-wounds', name: 'Scroll of Cure Wounds', rarity: 'Common', type: 'Scroll',
    requiresAttunement: false, costGp: 50,
    description: 'A spell scroll bearing the words of the cure wounds spell (1st level). You can cast the spell from the scroll, which is then destroyed.',
  },
  // ── Wondrous Items ────────────────────────────────────────────────────────
  {
    id: 'bag-of-holding', name: 'Bag of Holding', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: false, costGp: 4000,
    description: 'This bag has an interior space considerably larger than its outside dimensions. The bag can hold up to 500 pounds, not exceeding a volume of 64 cubic feet.',
  },
  {
    id: 'cloak-of-protection', name: 'Cloak of Protection', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 3500,
    description: 'You gain a +1 bonus to AC and saving throws while you wear this cloak.',
  },
  {
    id: 'boots-of-speed', name: 'Boots of Speed', rarity: 'Rare', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 4000,
    description: "While you wear these boots, you can use a bonus action and click the boots' heels together to double your walking speed. You can dismiss this effect as a bonus action.",
  },
  {
    id: 'boots-of-elvenkind', name: 'Boots of Elvenkind', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: false, costGp: 2500,
    description: 'While you wear these boots, your steps make no sound, regardless of the surface you are moving across. You also have advantage on Dexterity (Stealth) checks.',
  },
  {
    id: 'gauntlets-of-ogre-power', name: 'Gauntlets of Ogre Power', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 8000,
    description: 'Your Strength score is 19 while you wear these gauntlets. They have no effect on you if your Strength is already 19 or higher.',
  },
  {
    id: 'belt-of-giant-strength', name: 'Belt of Giant Strength (Hill)', rarity: 'Rare', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 12000,
    description: 'While wearing this belt, your Strength score changes to 21. The belt has no effect if your Strength is equal to or greater than 21.',
  },
  {
    id: 'amulet-of-health', name: 'Amulet of Health', rarity: 'Rare', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 8000,
    description: 'Your Constitution score is 19 while you wear this amulet. It has no effect on you if your Constitution is already 19 or higher.',
  },
  {
    id: 'helm-of-telepathy', name: 'Helm of Telepathy', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 4000,
    description: 'While wearing this helm, you can use an action to cast the detect thoughts spell (save DC 13) from it.',
  },
  {
    id: 'necklace-of-adaptation', name: 'Necklace of Adaptation', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 1500,
    description: 'While wearing this necklace, you can breathe normally in any environment, and you have advantage on saving throws made against harmful gases and vapors.',
  },
  {
    id: 'periapt-of-wound-closure', name: 'Periapt of Wound Closure', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 5000,
    description: 'While you wear this pendant, you stabilize whenever you are dying at the start of your turn. In addition, whenever you roll a Hit Die to regain hit points, double the number of hit points it restores.',
  },
  {
    id: 'bracers-of-archery', name: 'Bracers of Archery', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 1500,
    description: 'While wearing these bracers, you have proficiency with the longbow and shortbow, and you gain a +2 bonus to damage rolls on ranged attacks made with such weapons.',
  },
  {
    id: 'gloves-of-missile-snaring', name: 'Gloves of Missile Snaring', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 3000,
    description: "These gloves seem to almost meld into your hands when you don them. When a ranged weapon attack hits you while you're wearing them, you can use your reaction to reduce the damage by 1d10 + your Dexterity modifier.",
  },
  {
    id: 'cape-of-the-mountebank', name: 'Cape of the Mountebank', rarity: 'Rare', type: 'Wondrous Item',
    requiresAttunement: false, costGp: 8000,
    description: "This cape smells faintly of brimstone. While wearing it, you can use it to cast the dimension door spell as an action. This property recharges at dawn.",
  },
  {
    id: 'cloak-of-displacement', name: 'Cloak of Displacement', rarity: 'Rare', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 60000,
    description: 'While you wear this cloak, it projects an illusion that makes you appear to be standing in a place near your actual location. As a result, any creature has disadvantage on attack rolls against you.',
  },
  {
    id: 'cloak-of-elvenkind', name: 'Cloak of Elvenkind', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 5000,
    description: 'While you wear this cloak with its hood up, Wisdom (Perception) checks made to see you have disadvantage, and you have advantage on Dexterity (Stealth) checks.',
  },
  {
    id: 'cloak-of-the-bat', name: 'Cloak of the Bat', rarity: 'Rare', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 6000,
    description: 'While wearing this cloak, you have advantage on Dexterity (Stealth) checks. In an area of dim light or darkness, you can grip the edges of the cloak with both hands and use it to fly at a speed of 40 feet.',
  },
  {
    id: 'eyes-of-the-eagle', name: 'Eyes of the Eagle', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 2500,
    description: 'These crystal lenses fit over the eyes. While wearing them, you have advantage on Wisdom (Perception) checks that rely on sight.',
  },
  {
    id: 'goggles-of-night', name: 'Goggles of Night', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: false, costGp: 1500,
    description: 'While wearing these dark lenses, you have darkvision out to a range of 60 feet. If you already have darkvision, wearing the goggles increases its range by 60 feet.',
  },
  {
    id: 'headband-of-intellect', name: 'Headband of Intellect', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 8000,
    description: 'Your Intelligence score is 19 while you wear this headband. It has no effect on you if your Intelligence is already 19 or higher.',
  },
  {
    id: 'stone-of-good-luck', name: 'Stone of Good Luck (Luckstone)', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 4200,
    description: 'While this polished agate is on your person, you gain a +1 bonus to ability checks and saving throws.',
  },
  {
    id: 'pipes-of-haunting', name: 'Pipes of Haunting', rarity: 'Uncommon', type: 'Wondrous Item',
    requiresAttunement: false, costGp: 2000,
    description: 'You must be proficient with wind instruments to use these pipes. They have 3 charges. You can use an action to play them and expend 1 charge to create an eerie, spellbinding tune. Each creature within 30 feet that hears you play must succeed on a DC 15 Wisdom saving throw or become frightened of you for 1 minute.',
  },
  {
    id: 'robe-of-eyes', name: 'Robe of Eyes', rarity: 'Rare', type: 'Wondrous Item',
    requiresAttunement: true, costGp: 30000,
    description: 'This robe is adorned with eyelike patterns. While you wear the robe, you gain darkvision out to a range of 120 feet and a +5 bonus to Wisdom (Perception) checks that rely on sight.',
  },
  // ── Rings ─────────────────────────────────────────────────────────────────
  {
    id: 'ring-of-protection', name: 'Ring of Protection', rarity: 'Rare', type: 'Ring',
    requiresAttunement: true, costGp: 3500,
    description: 'You gain a +1 bonus to AC and saving throws while wearing this ring.',
  },
  {
    id: 'ring-of-spell-storing', name: 'Ring of Spell Storing', rarity: 'Rare', type: 'Ring',
    requiresAttunement: true, costGp: 24000,
    description: 'This ring stores spells cast into it, holding them until the attuned wearer uses them. The ring can store up to 5 levels worth of spells at a time.',
  },
  // ── Wands ─────────────────────────────────────────────────────────────────
  {
    id: 'wand-of-magic-missiles', name: 'Wand of Magic Missiles', rarity: 'Uncommon', type: 'Wand',
    requiresAttunement: false, costGp: 2000,
    description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 to 3 of its charges. For each charge you expend, you launch a dart of magical force (magic missile).',
  },
  {
    id: 'wand-of-fireballs', name: 'Wand of Fireballs', rarity: 'Rare', type: 'Wand',
    requiresAttunement: true, costGp: 18000,
    description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 or more of its charges to cast the fireball spell (save DC 15) from it.',
  },
  {
    id: 'wand-of-lightning-bolts', name: 'Wand of Lightning Bolts', rarity: 'Rare', type: 'Wand',
    requiresAttunement: true, costGp: 18000,
    description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 or more of its charges to cast the lightning bolt spell (save DC 15) from it.',
  },
  // ── Staves ────────────────────────────────────────────────────────────────
  {
    id: 'staff-of-healing', name: 'Staff of Healing', rarity: 'Rare', type: 'Staff',
    requiresAttunement: true, costGp: 16000,
    description: 'This staff has 10 charges. While holding it, you can use an action to expend 1 or more of its charges to cast one of the following spells: cure wounds (1 charge per spell level, up to 4th), lesser restoration (2 charges), or mass cure wounds (5 charges).',
  },
  {
    id: 'staff-of-swarming-insects', name: 'Staff of Swarming Insects', rarity: 'Rare', type: 'Staff',
    requiresAttunement: true, costGp: 10000,
    description: 'This staff has 10 charges. It allows the caster to use insect-related spells, including giant insect (4 charges) and insect plague (5 charges).',
  },
  // ── Rods ──────────────────────────────────────────────────────────────────
  {
    id: 'rod-of-the-pact-keeper', name: 'Rod of the Pact Keeper (+1)', rarity: 'Uncommon', type: 'Rod',
    requiresAttunement: true, costGp: 6000,
    description: 'While holding this rod, you gain a +1 bonus to spell attack rolls and to the saving throw DCs of your warlock spells. In addition, you can regain one warlock spell slot as an action while holding the rod.',
  },
  // ── Generic magical weapons ───────────────────────────────────────────────
  {
    id: 'weapon-plus-1', name: '+1 Weapon', rarity: 'Uncommon', type: 'Weapon',
    requiresAttunement: false, costGp: 1000,
    description: 'You have a +1 bonus to attack and damage rolls made with this magic weapon.',
  },
  {
    id: 'weapon-plus-2', name: '+2 Weapon', rarity: 'Rare', type: 'Weapon',
    requiresAttunement: false, costGp: 4000,
    description: 'You have a +2 bonus to attack and damage rolls made with this magic weapon.',
  },
  {
    id: 'weapon-plus-3', name: '+3 Weapon', rarity: 'Very Rare', type: 'Weapon',
    requiresAttunement: false, costGp: 16000,
    description: 'You have a +3 bonus to attack and damage rolls made with this magic weapon.',
  },
  // ── Generic magical armor ─────────────────────────────────────────────────
  {
    id: 'armor-plus-1', name: '+1 Armor', rarity: 'Rare', type: 'Armor',
    requiresAttunement: false, costGp: 1500,
    description: 'You have a +1 bonus to AC while wearing this armor.',
  },
  {
    id: 'armor-plus-2', name: '+2 Armor', rarity: 'Very Rare', type: 'Armor',
    requiresAttunement: false, costGp: 6000,
    description: 'You have a +2 bonus to AC while wearing this armor.',
  },
  {
    id: 'armor-plus-3', name: '+3 Armor', rarity: 'Legendary', type: 'Armor',
    requiresAttunement: false, costGp: 24000,
    description: 'You have a +3 bonus to AC while wearing this armor.',
  },
  // ── Named rare / legendary weapons ───────────────────────────────────────
  {
    id: 'flame-tongue', name: 'Flame Tongue', rarity: 'Rare', type: 'Weapon',
    requiresAttunement: true, costGp: 5000,
    description: "You can use a bonus action to speak this magic sword's command word, causing flames to erupt from the blade. These flames shed bright light in a 40-foot radius. While the sword is ablaze, it deals an extra 2d6 fire damage to any target it hits.",
  },
  {
    id: 'frost-brand', name: 'Frost Brand', rarity: 'Very Rare', type: 'Weapon',
    requiresAttunement: true, costGp: 20000,
    description: 'When you hit with an attack using this magic sword, the target takes an extra 1d6 cold damage. In addition, while you hold the sword, you have resistance to fire damage.',
  },
  {
    id: 'vorpal-sword', name: 'Vorpal Sword', rarity: 'Legendary', type: 'Weapon',
    requiresAttunement: true, costGp: 50000,
    description: 'You gain a +3 bonus to attack and damage rolls made with this magic weapon. The weapon ignores resistance to slashing damage. When you roll a 20 on the attack roll against a creature that has at least one head, you cut off one of its heads.',
  },
  {
    id: 'holy-avenger', name: 'Holy Avenger', rarity: 'Legendary', type: 'Weapon',
    requiresAttunement: true, costGp: 50000,
    description: 'You gain a +3 bonus to attack and damage rolls made with this holy weapon. When you hit a fiend or an undead, it takes an extra 2d10 radiant damage. While you hold the drawn sword, it creates an aura in a 10-foot radius around you.',
  },
  {
    id: 'luck-blade', name: 'Luck Blade', rarity: 'Legendary', type: 'Weapon',
    requiresAttunement: true, costGp: 50000,
    description: 'You gain a +1 bonus to attack and damage rolls and a +1 bonus to saving throws. Once per day you can call on its luck to reroll one attack roll, ability check, or saving throw.',
  },
  {
    id: 'dragon-slayer', name: 'Dragon Slayer', rarity: 'Rare', type: 'Weapon',
    requiresAttunement: false, costGp: 5000,
    description: 'You gain a +1 bonus to attack and damage rolls. When you hit a dragon with this weapon, the dragon takes an extra 3d6 damage of the weapon\'s type.',
  },
  {
    id: 'giant-slayer', name: 'Giant Slayer', rarity: 'Rare', type: 'Weapon',
    requiresAttunement: false, costGp: 5000,
    description: 'You gain a +1 bonus to attack and damage rolls. When you hit a giant with it, the giant takes an extra 2d6 damage of the weapon\'s type.',
  },
  {
    id: 'sword-of-wounding', name: 'Sword of Wounding', rarity: 'Rare', type: 'Weapon',
    requiresAttunement: true, costGp: 5000,
    description: 'Once per turn, when you hit a creature with this magic weapon, you can wound the target. At the start of each of the wounded creature\'s turns, it takes 1d4 necrotic damage for each time you\'ve wounded it, and it can then make a DC 15 Constitution saving throw to end the effect.',
  },
  {
    id: 'dagger-of-venom', name: 'Dagger of Venom', rarity: 'Rare', type: 'Weapon',
    requiresAttunement: false, costGp: 5000,
    description: 'You gain a +1 bonus to attack and damage rolls. You can use an action to coat the blade with thick, black poison that remains for 1 minute or until an attack using this weapon hits a creature.',
  },
];

// ── SHOP TEMPLATES ────────────────────────────────────────────────────────────

export interface ShopItem {
  item: Weapon | Armor | MagicItem;
  quantity: number;
  customPrice?: number;
}

export interface ShopTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  inventory: ShopItem[];
}

function shopWeapon(id: string, qty = 10, customPrice?: number): ShopItem {
  const item = getWeaponById(id);
  if (!item) throw new Error(`Weapon not found: ${id}`);
  return { item, quantity: qty, customPrice };
}

function shopArmor(id: string, qty = 5, customPrice?: number): ShopItem {
  const item = getArmorById(id);
  if (!item) throw new Error(`Armor not found: ${id}`);
  return { item, quantity: qty, customPrice };
}

function shopMagic(id: string, qty = 3, customPrice?: number): ShopItem {
  const item = getMagicItemById(id);
  if (!item) throw new Error(`MagicItem not found: ${id}`);
  return { item, quantity: qty, customPrice };
}

export const SHOP_TEMPLATES: ShopTemplate[] = [
  {
    id: 'general-store',
    name: "Birin's Goods",
    emoji: '🏪',
    description: 'A well-stocked general store with basic adventuring supplies, simple weapons, and light armor.',
    inventory: [
      shopWeapon('club'),
      shopWeapon('dagger'),
      shopWeapon('handaxe', 5),
      shopWeapon('quarterstaff', 5),
      shopWeapon('shortbow', 3),
      shopArmor('padded', 3),
      shopArmor('leather', 5),
      shopMagic('potion-healing', 5),
      shopMagic('scroll-cure-wounds', 2),
    ],
  },
  {
    id: 'blacksmith',
    name: 'The Iron Anvil',
    emoji: '⚒️',
    description: 'A master smith offering martial weapons and heavy armor. Prices are slightly above market (+20%).',
    inventory: [
      shopWeapon('battleaxe', 5, 12),
      shopWeapon('flail', 5, 12),
      shopWeapon('glaive', 3, 24),
      shopWeapon('greataxe', 3, 36),
      shopWeapon('greatsword', 3, 60),
      shopWeapon('longsword', 5, 18),
      shopWeapon('maul', 3, 12),
      shopWeapon('rapier', 5, 30),
      shopWeapon('shortsword', 5, 12),
      shopWeapon('warhammer', 5, 18),
      shopWeapon('crossbow-heavy', 3, 60),
      shopWeapon('longbow', 5, 60),
      shopArmor('chain-mail', 3, 90),
      shopArmor('plate', 1, 1800),
      shopArmor('breastplate', 3, 480),
      shopArmor('scale-mail', 5, 60),
      shopArmor('shield', 10, 12),
    ],
  },
  {
    id: 'alchemist',
    name: "Mirabel's Potions",
    emoji: '🧪',
    description: 'A colourful alchemist shop overflowing with potions and magical consumables.',
    inventory: [
      shopMagic('potion-healing', 10),
      shopMagic('potion-greater-healing', 5),
      shopMagic('potion-superior-healing', 2),
      shopMagic('potion-supreme-healing', 1),
      shopMagic('potion-invisibility', 2),
      shopMagic('potion-speed', 2),
      shopMagic('potion-flying', 1),
      shopMagic('scroll-cure-wounds', 5),
      shopMagic('scroll-fireball', 2),
      shopMagic('scroll-lightning-bolt', 2),
    ],
  },
  {
    id: 'magic-shop',
    name: 'The Arcane Emporium',
    emoji: '🔮',
    description: 'A prestigious shop dealing in uncommon and rare magic items at premium prices (x1.5 market).',
    inventory: [
      shopMagic('bag-of-holding', 2, 6000),
      shopMagic('cloak-of-protection', 2, 5250),
      shopMagic('ring-of-protection', 1, 5250),
      shopMagic('boots-of-elvenkind', 2, 3750),
      shopMagic('goggles-of-night', 3, 2250),
      shopMagic('headband-of-intellect', 1, 12000),
      shopMagic('stone-of-good-luck', 2, 6300),
      shopMagic('bracers-of-archery', 2, 2250),
      shopMagic('wand-of-magic-missiles', 3, 3000),
      shopMagic('wand-of-fireballs', 1, 27000),
      shopMagic('staff-of-healing', 1, 24000),
      shopMagic('rod-of-the-pact-keeper', 1, 9000),
      shopMagic('ring-of-spell-storing', 1, 36000),
      shopMagic('cloak-of-elvenkind', 1, 7500),
      shopMagic('weapon-plus-1', 5, 1500),
      shopMagic('weapon-plus-2', 2, 6000),
      shopMagic('armor-plus-1', 3, 2250),
      shopMagic('scroll-fireball', 3, 300),
    ],
  },
];

// ── LOOKUP HELPERS ────────────────────────────────────────────────────────────

export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS.find((w) => w.id === id);
}

export function getArmorById(id: string): Armor | undefined {
  return ARMORS.find((a) => a.id === id);
}

export function getMagicItemById(id: string): MagicItem | undefined {
  return MAGIC_ITEMS.find((m) => m.id === id);
}

// ── CALCULATION HELPERS ───────────────────────────────────────────────────────

/**
 * Calculate the total attack bonus for a weapon given the wielder's modifiers.
 * Finesse weapons use the higher of STR/DEX. Pure ranged weapons use DEX.
 */
export function calcWeaponAttackBonus(
  weapon: Weapon,
  strMod: number,
  dexMod: number,
  profBonus: number,
): number {
  const isRanged =
    weapon.category === 'Simple Ranged' || weapon.category === 'Martial Ranged';
  let abilMod: number;
  if (weapon.properties.includes('Finesse')) {
    abilMod = Math.max(strMod, dexMod);
  } else if (isRanged) {
    abilMod = dexMod;
  } else {
    abilMod = strMod;
  }
  return abilMod + profBonus;
}

/**
 * Calculate AC granted by a piece of armor given the wearer's DEX modifier.
 * Shield: always returns baseAC (the +2 bonus); combine with worn armor separately.
 */
export function calcArmorAC(armor: Armor, dexMod: number): number {
  if (!armor.addDexMod) return armor.baseAC;
  const effectiveDex =
    armor.maxDexBonus !== undefined
      ? Math.min(dexMod, armor.maxDexBonus)
      : dexMod;
  return armor.baseAC + effectiveDex;
}

/** Returns the flat AC bonus granted by wielding a shield (+2), or 0. */
export function calcShieldAC(hasShield: boolean): number {
  return hasShield ? 2 : 0;
}

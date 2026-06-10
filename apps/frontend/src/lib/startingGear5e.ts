/**
 * D&D 5e Starting Equipment — Choice-Based System
 * Per class, presents choice groups (radio selection) + guaranteed items.
 * Follows PHB 2014 rules adapted for the TavernTable EquipmentItem shape.
 */

import type { EquipmentItem } from '../components/CharacterSheet/types';

// ── Gear option / choice types ─────────────────────────────────────────────────

export interface GearOption {
  id: string;         // unique within the choice
  label: string;      // display label, e.g. "(a) Rapier"
  items: EquipmentItem[];
}

export interface GearChoice {
  id: string;         // e.g. "weapon-primary"
  prompt: string;     // e.g. "Choose a primary weapon"
  options: GearOption[];
}

export interface ClassStartingGear {
  className: string;
  choices: GearChoice[];
  guaranteed: EquipmentItem[];
}

// ── Re-usable item templates ───────────────────────────────────────────────────

const item = (id: string, name: string, qty: number, weight: number, extra: Partial<EquipmentItem> = {}): EquipmentItem => ({
  id, name, quantity: qty, weight, ...extra,
});

const weapon = (id: string, name: string, weight: number, damage: string, damageType: string, props: string[] = [], mastery?: string, finesse?: boolean, range?: string): EquipmentItem => ({
  id, name, quantity: 1, weight, isWeapon: true,
  weaponData: { attackBonus: 0, damage, damageType, properties: props, mastery, finesse, range },
});

const armor = (id: string, name: string, weight: number, baseAC: number, armorType: 'light' | 'medium' | 'heavy', stealthDisadv?: boolean): EquipmentItem => ({
  id, name, quantity: 1, weight, isArmor: true, equipped: true,
  armorData: { baseAC, armorType, stealthDisadvantage: stealthDisadv },
});

// ── Common re-usable items ─────────────────────────────────────────────────────

const ITEMS = {
  // Weapons — simple
  dagger: (uid = 'dagger') => weapon(uid, 'Dagger', 1, '1d4', 'piercing', ['Finesse', 'Light', 'Thrown'], 'Nick', true, '20/60 ft.'),
  handaxe: (uid = 'handaxe') => weapon(uid, 'Handaxe', 2, '1d6', 'slashing', ['Light', 'Thrown'], 'Vex', undefined, '20/60 ft.'),
  quarterstaff: (uid = 'quarterstaff') => weapon(uid, 'Quarterstaff', 4, '1d6', 'bludgeoning', ['Versatile'], 'Topple'),
  spear: (uid = 'spear') => weapon(uid, 'Spear', 3, '1d6', 'piercing', ['Thrown', 'Versatile'], 'Sap', undefined, '20/60 ft.'),
  lightCrossbow: (uid = 'lt-xbow') => weapon(uid, 'Light Crossbow', 5, '1d8', 'piercing', ['Ammunition', 'Two-Handed', 'Loading'], 'Slow', undefined, '80/320 ft.'),
  shortbow: (uid = 'shortbow') => weapon(uid, 'Shortbow', 2, '1d6', 'piercing', ['Ammunition', 'Two-Handed'], 'Vex', undefined, '80/320 ft.'),
  mace: (uid = 'mace') => weapon(uid, 'Mace', 4, '1d6', 'bludgeoning', [], 'Sap'),
  sickle: (uid = 'sickle') => weapon(uid, 'Sickle', 2, '1d4', 'slashing', ['Light'], 'Nick'),
  club: (uid = 'club') => weapon(uid, 'Club', 2, '1d4', 'bludgeoning', ['Light'], 'Slow'),

  // Weapons — martial
  longsword: (uid = 'longsword') => weapon(uid, 'Longsword', 3, '1d8', 'slashing', ['Versatile'], 'Sap'),
  shortsword: (uid = 'shortsword') => weapon(uid, 'Shortsword', 2, '1d6', 'piercing', ['Finesse', 'Light'], 'Vex', true),
  rapier: (uid = 'rapier') => weapon(uid, 'Rapier', 2, '1d8', 'piercing', ['Finesse'], 'Vex', true),
  scimitar: (uid = 'scimitar') => weapon(uid, 'Scimitar', 3, '1d6', 'slashing', ['Finesse', 'Light'], 'Nick', true),
  greataxe: (uid = 'greataxe') => weapon(uid, 'Greataxe', 7, '1d12', 'slashing', ['Heavy', 'Two-Handed'], 'Cleave'),
  greatclub: (uid = 'greatclub') => weapon(uid, 'Greatclub', 10, '1d8', 'bludgeoning', ['Two-Handed'], 'Push'),
  battleaxe: (uid = 'battleaxe') => weapon(uid, 'Battleaxe', 4, '1d8', 'slashing', ['Versatile'], 'Topple'),
  warhammer: (uid = 'warhammer') => weapon(uid, 'Warhammer', 2, '1d8', 'bludgeoning', ['Versatile'], 'Push'),
  morningstar: (uid = 'morningstar') => weapon(uid, 'Morningstar', 4, '1d8', 'piercing', [], 'Sap'),
  longbow: (uid = 'longbow') => weapon(uid, 'Longbow', 2, '1d8', 'piercing', ['Heavy', 'Ammunition', 'Two-Handed'], 'Slow', undefined, '150/600 ft.'),
  handaxe2: (uid = 'handaxe-2') => ({ ...weapon('handaxe-2', 'Handaxe', 2, '1d6', 'slashing', ['Light', 'Thrown'], 'Vex', undefined, '20/60 ft.'), id: uid }),

  // Armor
  chainMail: (uid = 'chain-mail') => armor(uid, 'Chain Mail', 55, 16, 'heavy', true),
  scaleMail: (uid = 'scale-mail') => armor(uid, 'Scale Mail', 45, 14, 'medium', true),
  leatherArmor: (uid = 'leather-armor') => armor(uid, 'Leather Armor', 10, 11, 'light'),
  ringMail: (uid = 'ring-mail') => armor(uid, 'Ring Mail', 40, 14, 'heavy', true),

  // Shields / Off-hand
  shield: (uid = 'shield') => item(uid, 'Shield (+2 AC)', 1, 6, { equipped: true }),
  woodenShield: (uid = 'wooden-shield') => item(uid, 'Wooden Shield (+2 AC)', 1, 6, { equipped: true }),

  // Ammunition
  arrows20: (uid = 'arrows') => item(uid, 'Arrows', 20, 1),
  bolts20: (uid = 'bolts') => item(uid, 'Bolts', 20, 1.5),
  javelins: (qty: number, uid = 'javelins') => item(uid, 'Javelins', qty, 2),
  darts10: (uid = 'darts') => item(uid, 'Darts', 10, 0.25),

  // Packs
  explorersPack: (uid = 'explorers-pack') => item(uid, "Explorer's Pack", 1, 10),
  dungeoneersPack: (uid = 'dungeoneers-pack') => item(uid, "Dungeoneer's Pack", 1, 12),
  priestsPack: (uid = 'priests-pack') => item(uid, "Priest's Pack", 1, 33),
  scholarsPack: (uid = 'scholars-pack') => item(uid, "Scholar's Pack", 1, 11),
  diplomatsPack: (uid = 'diplomats-pack') => item(uid, "Diplomat's Pack", 1, 36),
  entertainers: (uid = 'entertainers-pack') => item(uid, "Entertainer's Pack", 1, 38),
  burglarsPack: (uid = 'burglars-pack') => item(uid, "Burglar's Pack", 1, 47),

  // Spell / Focus
  componentPouch: (uid = 'component-pouch') => item(uid, 'Component Pouch', 1, 2),
  arcaneFocus: (uid = 'arcane-focus') => item(uid, 'Arcane Focus (orb)', 1, 3),
  druidicFocus: (uid = 'druidic-focus') => item(uid, 'Druidic Focus (sprig)', 1, 1),
  holySymbol: (uid = 'holy-symbol') => item(uid, 'Holy Symbol', 1, 1),
  spellbook: (uid = 'spellbook') => item(uid, 'Spellbook', 1, 3),
  lute: (uid = 'lute') => item(uid, 'Lute', 1, 2),
  musicalInstrument: (uid = 'instrument') => item(uid, 'Musical Instrument (any)', 1, 2),
  thievesTools: (uid = 'thieves-tools') => item(uid, "Thieves' Tools", 1, 1),
  herbalism: (uid = 'herbalism-kit') => item(uid, 'Herbalism Kit', 1, 3),
};

// ── Simple weapon selector options ────────────────────────────────────────────

const SIMPLE_WEAPON_OPTIONS: GearOption[] = [
  { id: 'sw-dagger',      label: 'Dagger (1d4 piercing)',      items: [ITEMS.dagger('sw-dagger')] },
  { id: 'sw-handaxe',     label: 'Handaxe (1d6 slashing)',     items: [ITEMS.handaxe('sw-handaxe')] },
  { id: 'sw-quarterstaff',label: 'Quarterstaff (1d6 bludg.)',  items: [ITEMS.quarterstaff('sw-qstaff')] },
  { id: 'sw-spear',       label: 'Spear (1d6 piercing)',       items: [ITEMS.spear('sw-spear')] },
  { id: 'sw-mace',        label: 'Mace (1d6 bludgeoning)',     items: [ITEMS.mace('sw-mace')] },
  { id: 'sw-sickle',      label: 'Sickle (1d4 slashing)',      items: [ITEMS.sickle('sw-sickle')] },
];

const MARTIAL_WEAPON_OPTIONS: GearOption[] = [
  { id: 'mw-longsword',   label: 'Longsword (1d8 slashing)',   items: [ITEMS.longsword('mw-ls')] },
  { id: 'mw-battleaxe',   label: 'Battleaxe (1d8 slashing)',   items: [ITEMS.battleaxe('mw-ba')] },
  { id: 'mw-warhammer',   label: 'Warhammer (1d8 bludg.)',     items: [ITEMS.warhammer('mw-wh')] },
  { id: 'mw-rapier',      label: 'Rapier (1d8 piercing)',      items: [ITEMS.rapier('mw-rp')] },
  { id: 'mw-morningstar', label: 'Morningstar (1d8 piercing)', items: [ITEMS.morningstar('mw-ms')] },
  { id: 'mw-shortsword',  label: 'Shortsword (1d6 piercing)',  items: [ITEMS.shortsword('mw-ss')] },
];

// ── Class starting gear definitions ───────────────────────────────────────────

export const CLASS_STARTING_GEAR: ClassStartingGear[] = [

  // ── BARBARIAN ───────────────────────────────────────────────────────────────
  {
    className: 'Barbarian',
    choices: [
      {
        id: 'primary-weapon',
        prompt: 'Choose a primary weapon',
        options: [
          { id: 'greataxe', label: '(a) Greataxe — 1d12 slashing, Heavy, Two-Handed', items: [ITEMS.greataxe('bb-greataxe')] },
          ...MARTIAL_WEAPON_OPTIONS.map(o => ({ ...o, id: `bb-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `bb-${it.id}` })) })),
        ],
      },
      {
        id: 'secondary-weapon',
        prompt: 'Choose secondary weapons',
        options: [
          { id: 'two-handaxes', label: '(a) Two Handaxes', items: [{ ...ITEMS.handaxe('bb-hx1') }, { ...ITEMS.handaxe('bb-hx2'), id: 'bb-hx2' }] },
          ...SIMPLE_WEAPON_OPTIONS.map(o => ({ ...o, id: `bb2-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `bb2-${it.id}` })) })),
        ],
      },
    ],
    guaranteed: [
      ITEMS.explorersPack('bb-pack'),
      ITEMS.javelins(4, 'bb-javs'),
    ],
  },

  // ── BARD ────────────────────────────────────────────────────────────────────
  {
    className: 'Bard',
    choices: [
      {
        id: 'weapon',
        prompt: 'Choose a weapon',
        options: [
          { id: 'rapier',    label: '(a) Rapier — 1d8 piercing, Finesse',      items: [ITEMS.rapier('bd-rapier')] },
          { id: 'longsword', label: '(b) Longsword — 1d8 slashing, Versatile', items: [ITEMS.longsword('bd-ls')] },
          ...SIMPLE_WEAPON_OPTIONS.map(o => ({ ...o, id: `bd-${o.id}`, label: `(c) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `bd-${it.id}` })) })),
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'diplomats',   label: "(a) Diplomat's Pack",   items: [ITEMS.diplomatsPack('bd-pack-d')] },
          { id: 'entertainers',label: "(b) Entertainer's Pack", items: [ITEMS.entertainers('bd-pack-e')] },
        ],
      },
      {
        id: 'instrument',
        prompt: 'Choose an instrument',
        options: [
          { id: 'lute',      label: '(a) Lute',                       items: [ITEMS.lute('bd-lute')] },
          { id: 'instrument',label: '(b) Other musical instrument',   items: [ITEMS.musicalInstrument('bd-inst')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.leatherArmor('bd-armor'),
      ITEMS.dagger('bd-dagger'),
    ],
  },

  // ── CLERIC ──────────────────────────────────────────────────────────────────
  {
    className: 'Cleric',
    choices: [
      {
        id: 'weapon',
        prompt: 'Choose a weapon',
        options: [
          { id: 'mace',     label: '(a) Mace — 1d6 bludgeoning',      items: [ITEMS.mace('cl-mace')] },
          { id: 'warhammer',label: '(b) Warhammer — 1d8 bludgeoning', items: [ITEMS.warhammer('cl-wh')] },
        ],
      },
      {
        id: 'armor',
        prompt: 'Choose armor',
        options: [
          { id: 'scale',   label: '(a) Scale Mail — AC 14, Medium',           items: [ITEMS.scaleMail('cl-scale')] },
          { id: 'leather', label: '(b) Leather Armor — AC 11, Light',         items: [ITEMS.leatherArmor('cl-leather')] },
          { id: 'chain',   label: '(c) Chain Mail — AC 16, Heavy (if prof.)', items: [ITEMS.chainMail('cl-chain')] },
        ],
      },
      {
        id: 'secondary',
        prompt: 'Choose a secondary option',
        options: [
          { id: 'crossbow', label: '(a) Light Crossbow + 20 Bolts', items: [ITEMS.lightCrossbow('cl-xbow'), ITEMS.bolts20('cl-bolts')] },
          ...SIMPLE_WEAPON_OPTIONS.map(o => ({ ...o, id: `cl-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `cl-${it.id}` })) })),
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'priests',  label: "(a) Priest's Pack",   items: [ITEMS.priestsPack('cl-pack-p')] },
          { id: 'explorers',label: "(b) Explorer's Pack", items: [ITEMS.explorersPack('cl-pack-e')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.shield('cl-shield'),
      ITEMS.holySymbol('cl-symbol'),
    ],
  },

  // ── DRUID ───────────────────────────────────────────────────────────────────
  {
    className: 'Druid',
    choices: [
      {
        id: 'shield-or-weapon',
        prompt: 'Choose shield or simple weapon',
        options: [
          { id: 'wooden-shield', label: '(a) Wooden Shield (+2 AC)',              items: [ITEMS.woodenShield('dr-shield')] },
          ...SIMPLE_WEAPON_OPTIONS.map(o => ({ ...o, id: `dr-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `dr-${it.id}` })) })),
        ],
      },
      {
        id: 'weapon',
        prompt: 'Choose a weapon',
        options: [
          { id: 'scimitar', label: '(a) Scimitar — 1d6 slashing, Finesse, Light', items: [ITEMS.scimitar('dr-scim')] },
          ...SIMPLE_WEAPON_OPTIONS.filter(o => !o.id.includes('shortbow')).map(o => ({ ...o, id: `dr2-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `dr2-${it.id}` })) })),
        ],
      },
    ],
    guaranteed: [
      ITEMS.leatherArmor('dr-armor'),
      ITEMS.explorersPack('dr-pack'),
      ITEMS.druidicFocus('dr-focus'),
    ],
  },

  // ── FIGHTER ─────────────────────────────────────────────────────────────────
  {
    className: 'Fighter',
    choices: [
      {
        id: 'armor',
        prompt: 'Choose armor style',
        options: [
          { id: 'chain', label: '(a) Chain Mail — AC 16, Heavy',                    items: [ITEMS.chainMail('ft-chain')] },
          { id: 'light', label: '(b) Leather Armor + Longbow + 20 Arrows (ranged)', items: [ITEMS.leatherArmor('ft-leather'), ITEMS.longbow('ft-bow'), ITEMS.arrows20('ft-arrows')] },
        ],
      },
      {
        id: 'weapon-style',
        prompt: 'Choose weapon style',
        options: [
          { id: 'weapon-shield', label: '(a) Martial Weapon + Shield',   items: [] }, // populated per weapon sub-choice
          { id: 'two-weapons',   label: '(b) Two Martial Weapons',        items: [] },
        ],
      },
      {
        id: 'weapon-primary',
        prompt: 'Choose primary martial weapon',
        options: MARTIAL_WEAPON_OPTIONS.map(o => ({ ...o, id: `ft-${o.id}`, items: o.items.map(it => ({ ...it, id: `ft-${it.id}` })) })),
      },
      {
        id: 'ranged-or-handaxes',
        prompt: 'Choose ranged backup',
        options: [
          { id: 'crossbow', label: '(a) Light Crossbow + 20 Bolts', items: [ITEMS.lightCrossbow('ft-xbow'), ITEMS.bolts20('ft-bolts')] },
          { id: 'handaxes', label: '(b) Two Handaxes',              items: [ITEMS.handaxe('ft-hx1'), { ...ITEMS.handaxe('ft-hx2'), id: 'ft-hx2' }] },
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'dungeoneers', label: "(a) Dungeoneer's Pack", items: [ITEMS.dungeoneersPack('ft-pack-d')] },
          { id: 'explorers',   label: "(b) Explorer's Pack",  items: [ITEMS.explorersPack('ft-pack-e')] },
        ],
      },
    ],
    guaranteed: [],
  },

  // ── MONK ────────────────────────────────────────────────────────────────────
  {
    className: 'Monk',
    choices: [
      {
        id: 'weapon',
        prompt: 'Choose a weapon',
        options: [
          { id: 'shortsword', label: '(a) Shortsword — 1d6 piercing, Finesse', items: [ITEMS.shortsword('mk-ss')] },
          ...SIMPLE_WEAPON_OPTIONS.map(o => ({ ...o, id: `mk-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `mk-${it.id}` })) })),
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'dungeoneers', label: "(a) Dungeoneer's Pack", items: [ITEMS.dungeoneersPack('mk-pack-d')] },
          { id: 'explorers',   label: "(b) Explorer's Pack",  items: [ITEMS.explorersPack('mk-pack-e')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.darts10('mk-darts'),
    ],
  },

  // ── PALADIN ─────────────────────────────────────────────────────────────────
  {
    className: 'Paladin',
    choices: [
      {
        id: 'weapon-style',
        prompt: 'Choose weapon style',
        options: [
          { id: 'weapon-shield', label: '(a) Martial Weapon + Shield', items: [ITEMS.shield('pl-shield')] },
          { id: 'two-weapons',   label: '(b) Two Martial Weapons',     items: [] },
        ],
      },
      {
        id: 'weapon-primary',
        prompt: 'Choose your primary weapon',
        options: MARTIAL_WEAPON_OPTIONS.map(o => ({ ...o, id: `pl-${o.id}`, items: o.items.map(it => ({ ...it, id: `pl-${it.id}` })) })),
      },
      {
        id: 'secondary',
        prompt: 'Choose secondary option',
        options: [
          { id: 'javelins', label: '(a) 5 Javelins', items: [ITEMS.javelins(5, 'pl-javs')] },
          ...SIMPLE_WEAPON_OPTIONS.filter(o => !o.id.includes('shortbow')).map(o => ({ ...o, id: `pl2-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `pl2-${it.id}` })) })),
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'priests',  label: "(a) Priest's Pack",   items: [ITEMS.priestsPack('pl-pack-p')] },
          { id: 'explorers',label: "(b) Explorer's Pack", items: [ITEMS.explorersPack('pl-pack-e')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.chainMail('pl-chain'),
      ITEMS.holySymbol('pl-symbol'),
    ],
  },

  // ── RANGER ──────────────────────────────────────────────────────────────────
  {
    className: 'Ranger',
    choices: [
      {
        id: 'armor',
        prompt: 'Choose armor',
        options: [
          { id: 'scale',   label: '(a) Scale Mail — AC 14, Medium', items: [ITEMS.scaleMail('rg-scale')] },
          { id: 'leather', label: '(b) Leather Armor — AC 11, Light',items: [ITEMS.leatherArmor('rg-leather')] },
        ],
      },
      {
        id: 'weapons',
        prompt: 'Choose melee weapons',
        options: [
          { id: 'two-shortswords', label: '(a) Two Shortswords — 1d6 piercing, Finesse', items: [ITEMS.shortsword('rg-ss1'), { ...ITEMS.shortsword('rg-ss2'), id: 'rg-ss2' }] },
          ...SIMPLE_WEAPON_OPTIONS.filter(o => !o.id.includes('shortbow')).map(o => ({ ...o, id: `rg-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `rg-${it.id}` })) })),
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'dungeoneers', label: "(a) Dungeoneer's Pack", items: [ITEMS.dungeoneersPack('rg-pack-d')] },
          { id: 'explorers',   label: "(b) Explorer's Pack",  items: [ITEMS.explorersPack('rg-pack-e')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.longbow('rg-bow'),
      ITEMS.arrows20('rg-arrows'),
    ],
  },

  // ── ROGUE ───────────────────────────────────────────────────────────────────
  {
    className: 'Rogue',
    choices: [
      {
        id: 'weapon',
        prompt: 'Choose a primary weapon',
        options: [
          { id: 'rapier',     label: '(a) Rapier — 1d8 piercing, Finesse',      items: [ITEMS.rapier('rg2-rapier')] },
          { id: 'shortsword', label: '(b) Shortsword — 1d6 piercing, Finesse', items: [ITEMS.shortsword('rg2-ss')] },
        ],
      },
      {
        id: 'secondary',
        prompt: 'Choose secondary option',
        options: [
          { id: 'shortbow',   label: '(a) Shortbow + 20 Arrows',               items: [ITEMS.shortbow('rg2-sbow'), ITEMS.arrows20('rg2-arrows')] },
          { id: 'shortsword2',label: '(b) Shortsword (off-hand)',               items: [ITEMS.shortsword('rg2-ss2')] },
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'burglars',   label: "(a) Burglar's Pack",   items: [ITEMS.burglarsPack('rg2-pack-b')] },
          { id: 'dungeoneers',label: "(b) Dungeoneer's Pack", items: [ITEMS.dungeoneersPack('rg2-pack-d')] },
          { id: 'explorers',  label: "(c) Explorer's Pack",  items: [ITEMS.explorersPack('rg2-pack-e')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.leatherArmor('rg2-armor'),
      ITEMS.dagger('rg2-dagger1'),
      { ...ITEMS.dagger('rg2-dagger2'), id: 'rg2-dagger2' },
      ITEMS.thievesTools('rg2-tools'),
    ],
  },

  // ── SORCERER ────────────────────────────────────────────────────────────────
  {
    className: 'Sorcerer',
    choices: [
      {
        id: 'weapon',
        prompt: 'Choose a weapon',
        options: [
          { id: 'crossbow', label: '(a) Light Crossbow + 20 Bolts — 1d8 piercing', items: [ITEMS.lightCrossbow('sc-xbow'), ITEMS.bolts20('sc-bolts')] },
          ...SIMPLE_WEAPON_OPTIONS.map(o => ({ ...o, id: `sc-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `sc-${it.id}` })) })),
        ],
      },
      {
        id: 'focus',
        prompt: 'Choose an arcane focus',
        options: [
          { id: 'component-pouch', label: '(a) Component Pouch',    items: [ITEMS.componentPouch('sc-focus-p')] },
          { id: 'arcane-focus',    label: '(b) Arcane Focus (orb)', items: [ITEMS.arcaneFocus('sc-focus-o')] },
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'dungeoneers', label: "(a) Dungeoneer's Pack", items: [ITEMS.dungeoneersPack('sc-pack-d')] },
          { id: 'explorers',   label: "(b) Explorer's Pack",  items: [ITEMS.explorersPack('sc-pack-e')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.dagger('sc-dagger1'),
      { ...ITEMS.dagger('sc-dagger2'), id: 'sc-dagger2' },
    ],
  },

  // ── WARLOCK ─────────────────────────────────────────────────────────────────
  {
    className: 'Warlock',
    choices: [
      {
        id: 'weapon',
        prompt: 'Choose a weapon',
        options: [
          { id: 'crossbow', label: '(a) Light Crossbow + 20 Bolts — 1d8 piercing', items: [ITEMS.lightCrossbow('wl-xbow'), ITEMS.bolts20('wl-bolts')] },
          ...SIMPLE_WEAPON_OPTIONS.map(o => ({ ...o, id: `wl-${o.id}`, label: `(b) ${o.label.replace(/\(.*\) /, '')}`, items: o.items.map(it => ({ ...it, id: `wl-${it.id}` })) })),
        ],
      },
      {
        id: 'focus',
        prompt: 'Choose an arcane focus',
        options: [
          { id: 'component-pouch', label: '(a) Component Pouch',    items: [ITEMS.componentPouch('wl-focus-p')] },
          { id: 'arcane-focus',    label: '(b) Arcane Focus (orb)', items: [ITEMS.arcaneFocus('wl-focus-o')] },
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'scholars',    label: "(a) Scholar's Pack",    items: [ITEMS.scholarsPack('wl-pack-s')] },
          { id: 'dungeoneers', label: "(b) Dungeoneer's Pack", items: [ITEMS.dungeoneersPack('wl-pack-d')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.leatherArmor('wl-armor'),
      ITEMS.dagger('wl-dagger1'),
      { ...ITEMS.dagger('wl-dagger2'), id: 'wl-dagger2' },
    ],
  },

  // ── WIZARD ──────────────────────────────────────────────────────────────────
  {
    className: 'Wizard',
    choices: [
      {
        id: 'weapon',
        prompt: 'Choose a weapon',
        options: [
          { id: 'quarterstaff', label: '(a) Quarterstaff — 1d6 bludgeoning, Versatile', items: [ITEMS.quarterstaff('wz-qstaff')] },
          { id: 'dagger',       label: '(b) Dagger — 1d4 piercing, Finesse, Thrown',   items: [ITEMS.dagger('wz-dagger')] },
        ],
      },
      {
        id: 'focus',
        prompt: 'Choose an arcane focus',
        options: [
          { id: 'component-pouch', label: '(a) Component Pouch',    items: [ITEMS.componentPouch('wz-focus-p')] },
          { id: 'arcane-focus',    label: '(b) Arcane Focus (orb)', items: [ITEMS.arcaneFocus('wz-focus-o')] },
        ],
      },
      {
        id: 'pack',
        prompt: 'Choose a pack',
        options: [
          { id: 'scholars', label: "(a) Scholar's Pack",   items: [ITEMS.scholarsPack('wz-pack-s')] },
          { id: 'explorers',label: "(b) Explorer's Pack",  items: [ITEMS.explorersPack('wz-pack-e')] },
        ],
      },
    ],
    guaranteed: [
      ITEMS.spellbook('wz-spellbook'),
    ],
  },
];

/** Returns the starting gear config for a class name, or null if not found. */
export function getClassGear(className: string): ClassStartingGear | null {
  return CLASS_STARTING_GEAR.find(g => g.className === className) ?? null;
}

/** Builds a flat EquipmentItem[] from a map of choiceId → optionId selections + guaranteed items. */
export function buildEquipmentList(
  gear: ClassStartingGear,
  selections: Record<string, string>,
  // For Fighter: weapon-style choice drives whether shield is added
): EquipmentItem[] {
  const items: EquipmentItem[] = [];

  for (const choice of gear.choices) {
    const selectedOptionId = selections[choice.id];
    if (!selectedOptionId) continue;
    const option = choice.options.find(o => o.id === selectedOptionId);
    if (option) items.push(...option.items);
  }

  // Fighter special: if they chose weapon+shield style, add a shield
  if (gear.className === 'Fighter' && selections['weapon-style'] === 'weapon-shield') {
    items.push({ id: 'ft-shield', name: 'Shield (+2 AC)', quantity: 1, weight: 6, equipped: true });
  }
  // Paladin special: shield already in options items

  items.push(...gear.guaranteed);
  return items;
}

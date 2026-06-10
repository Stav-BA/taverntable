import { useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { useCharacterStore } from '@/stores/characterStore';
import { socketEmit } from '@/lib/socket';
import type { ClassName } from '@/lib/classes5e';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_COLOURS = [
  '#DC143C', '#4169E1', '#50C878', '#FFD700',
  '#8A2BE2', '#FF8C00', '#008B8B', '#F5F5F5',
];

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// ─── Race Data ─────────────────────────────────────────────────────────────────

interface RaceData {
  name: string;
  icon: string;
  description: string;
  bonuses: Partial<Record<AbilityKey, number>>;
  flexBonusCount?: number; // half-elf gets +1 to 2 of choice
  traits: string[];
  speed: number;
}

type AbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

const RACES: RaceData[] = [
  {
    name: 'Human',
    icon: '👤',
    description: 'Versatile and ambitious, humans adapt to any role.',
    bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
    traits: ['+1 to ALL ability scores', 'Extra skill proficiency', 'Extra feat at level 1'],
    speed: 30,
  },
  {
    name: 'High Elf',
    icon: '🧝',
    description: 'Ancient, graceful, and attuned to magic and nature.',
    bonuses: { DEX: 2, INT: 1 },
    traits: ['Darkvision 60 ft', 'Fey Ancestry — advantage vs charm', 'Keen Senses (Perception proficiency)', 'Trance — no sleep needed', 'Cantrip from Wizard list'],
    speed: 30,
  },
  {
    name: 'Hill Dwarf',
    icon: '⛏️',
    description: 'Stout, resilient, and fierce defenders of stone and kin.',
    bonuses: { CON: 2, WIS: 1 },
    traits: ['Darkvision 60 ft', 'Dwarven Resilience — advantage vs poison', 'Stonecunning', 'Tool Proficiency', '+1 HP per level'],
    speed: 25,
  },
  {
    name: 'Lightfoot Halfling',
    icon: '🦶',
    description: 'Small but lucky, halflings slip through trouble with a grin.',
    bonuses: { DEX: 2, CHA: 1 },
    traits: ['Lucky — reroll any 1 on attacks/checks/saves', 'Brave — advantage vs frightened', 'Halfling Nimbleness — move through larger creatures'],
    speed: 25,
  },
  {
    name: 'Half-Elf',
    icon: '🌙',
    description: 'Walking between two worlds, half-elves charm and endure.',
    bonuses: { CHA: 2 },
    flexBonusCount: 2,
    traits: ['+2 CHA, +1 to two ability scores of choice', 'Darkvision 60 ft', 'Fey Ancestry', 'Skill Versatility — 2 extra skill proficiencies'],
    speed: 30,
  },
  {
    name: 'Forest Gnome',
    icon: '🍄',
    description: 'Curious tinkerers and illusionists hidden among the trees.',
    bonuses: { INT: 2, DEX: 1 },
    traits: ['Darkvision 60 ft', 'Gnome Cunning — advantage vs magic INT/WIS/CHA saves', 'Natural Illusionist — Minor Illusion cantrip', 'Speak with Small Beasts'],
    speed: 25,
  },
  {
    name: 'Tiefling',
    icon: '😈',
    description: 'Touched by infernal power, tieflings burn with inner fire.',
    bonuses: { CHA: 2, INT: 1 },
    traits: ['Darkvision 60 ft', 'Hellish Resistance — fire resistance', 'Infernal Legacy — Thaumaturgy cantrip', 'Darkness & Hellish Rebuke spells at higher levels'],
    speed: 30,
  },
  {
    name: 'Dragonborn',
    icon: '🐉',
    description: 'Proud scions of dragon kind, born to breathe destruction.',
    bonuses: { STR: 2, CHA: 1 },
    traits: ['Draconic Ancestry — choose damage type', 'Breath Weapon — cone or line attack', 'Damage Resistance — chosen element', 'Draconic presence'],
    speed: 30,
  },
];

// ─── Class Data ────────────────────────────────────────────────────────────────

interface ClassData {
  name: string;
  icon: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: AbilityKey[];
  description: string;
  features: string[];
  armorClass: string;
}

const CLASSES: ClassData[] = [
  {
    name: 'Barbarian', icon: '⚔️', hitDie: 12, primaryAbility: 'STR',
    savingThrows: ['STR', 'CON'],
    description: 'Primal warrior channeling rage into devastating might.',
    features: ['Rage — bonus damage + resistance to physical damage', 'Unarmored Defense — AC = 10 + CON + DEX', 'Reckless Attack', 'Danger Sense'],
    armorClass: '10 + DEX + CON (unarmored)',
  },
  {
    name: 'Bard', icon: '🎸', hitDie: 8, primaryAbility: 'CHA',
    savingThrows: ['DEX', 'CHA'],
    description: 'Weaver of magic through music, words, and performance.',
    features: ['Spellcasting (CHA)', 'Bardic Inspiration — grant d6 bonus to allies', 'Jack of All Trades', 'Song of Rest'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Cleric', icon: '✝️', hitDie: 8, primaryAbility: 'WIS',
    savingThrows: ['WIS', 'CHA'],
    description: 'Divine champion channeling the power of their deity.',
    features: ['Spellcasting (WIS)', 'Divine Domain — specialized divine power', 'Turn Undead', 'Channel Divinity'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Druid', icon: '🌿', hitDie: 8, primaryAbility: 'WIS',
    savingThrows: ['INT', 'WIS'],
    description: 'Guardian of nature who shapeshifts and commands the wild.',
    features: ['Spellcasting (WIS)', 'Wild Shape — transform into beasts', 'Druidic language', 'Timeless Body at higher levels'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Fighter', icon: '🛡️', hitDie: 10, primaryAbility: 'STR or DEX',
    savingThrows: ['STR', 'CON'],
    description: 'Master of arms, tactics, and disciplined combat.',
    features: ['Fighting Style — choose specialization', 'Second Wind — bonus action self-heal', 'Action Surge — extra action once per rest', 'Extra Attack at level 5'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Monk', icon: '👊', hitDie: 8, primaryAbility: 'DEX + WIS',
    savingThrows: ['STR', 'DEX'],
    description: 'Disciplined martial artist harnessing inner ki energy.',
    features: ['Martial Arts — unarmed strikes scale with level', 'Ki Points — fuel special abilities', 'Unarmored Defense — AC = 10 + DEX + WIS', 'Flurry of Blows'],
    armorClass: '10 + DEX + WIS',
  },
  {
    name: 'Paladin', icon: '⚜️', hitDie: 10, primaryAbility: 'STR + CHA',
    savingThrows: ['WIS', 'CHA'],
    description: 'Holy warrior bound by sacred oaths to fight for righteousness.',
    features: ['Divine Smite — expend spell slots for extra damage', 'Lay on Hands — healing pool of 5 HP/level', 'Spellcasting (CHA)', 'Aura of Protection'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Ranger', icon: '🏹', hitDie: 10, primaryAbility: 'DEX + WIS',
    savingThrows: ['STR', 'DEX'],
    description: 'Hunter and tracker supreme, at home in the wilderness.',
    features: ['Favored Enemy — expertise vs chosen creature type', 'Natural Explorer — mastery of terrain', 'Spellcasting (WIS)', 'Primeval Awareness'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Rogue', icon: '🗡️', hitDie: 8, primaryAbility: 'DEX',
    savingThrows: ['DEX', 'INT'],
    description: 'Cunning trickster who strikes from the shadows for massive damage.',
    features: ["Sneak Attack — 1d6 extra damage when you have advantage", "Thieves' Cant — secret rogue language", 'Expertise — double proficiency in two skills', 'Uncanny Dodge'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Sorcerer', icon: '✨', hitDie: 6, primaryAbility: 'CHA',
    savingThrows: ['CON', 'CHA'],
    description: 'Born with innate magical power flowing through their bloodline.',
    features: ['Spellcasting (CHA)', 'Sorcery Points — flexible spell resource', 'Metamagic — modify spells in powerful ways', 'Font of Magic'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Warlock', icon: '🕯️', hitDie: 8, primaryAbility: 'CHA',
    savingThrows: ['WIS', 'CHA'],
    description: 'Wielder of eldritch power granted by an otherworldly patron.',
    features: ['Pact Magic — powerful but limited spell slots (recover on short rest)', 'Eldritch Invocations — customize your power', 'Patron — choose Fiend, Archfey, or Great Old One', 'Eldritch Blast cantrip'],
    armorClass: '10 + DEX',
  },
  {
    name: 'Wizard', icon: '📖', hitDie: 6, primaryAbility: 'INT',
    savingThrows: ['INT', 'WIS'],
    description: 'Scholar of arcane magic with the widest spell selection in the game.',
    features: ['Spellcasting (INT)', 'Spellbook — learn new spells from scrolls', 'Arcane Recovery — recover spell slots on short rest', 'Arcane Tradition at level 2'],
    armorClass: '10 + DEX',
  },
];

// ─── Background Data ────────────────────────────────────────────────────────────

interface BackgroundData {
  name: string;
  icon: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  feature: string;
}

const BACKGROUNDS: BackgroundData[] = [
  {
    name: 'Acolyte', icon: '⛪',
    description: 'You spent your life in service to a temple.',
    skillProficiencies: ['Insight', 'Religion'],
    toolProficiencies: ['2 extra languages'],
    feature: 'Shelter of the Faithful — free lodging and healing at temples',
  },
  {
    name: 'Criminal', icon: '🔓',
    description: 'You have a history with the criminal underworld.',
    skillProficiencies: ['Deception', 'Stealth'],
    toolProficiencies: ["Thieves' Tools", 'Gaming set'],
    feature: "Criminal Contact — a reliable criminal contact network",
  },
  {
    name: 'Folk Hero', icon: '🌾',
    description: 'You rose from humble origins to become a hero of the people.',
    skillProficiencies: ['Animal Handling', 'Survival'],
    toolProficiencies: ["Artisan's Tools", 'Vehicles (land)'],
    feature: 'Rustic Hospitality — common folk will shelter and feed you',
  },
  {
    name: 'Noble', icon: '👑',
    description: 'You were born to wealth and privilege.',
    skillProficiencies: ['History', 'Persuasion'],
    toolProficiencies: ['Gaming set', '1 extra language'],
    feature: 'Position of Privilege — welcomed in high society',
  },
  {
    name: 'Outlander', icon: '🏔️',
    description: 'You grew up in the wilds, far from civilization.',
    skillProficiencies: ['Athletics', 'Survival'],
    toolProficiencies: ['Musical instrument', '1 extra language'],
    feature: 'Wanderer — always know where to find food and shelter in the wild',
  },
  {
    name: 'Sage', icon: '📚',
    description: 'You spent years studying ancient lore.',
    skillProficiencies: ['Arcana', 'History'],
    toolProficiencies: ['2 extra languages'],
    feature: 'Researcher — can always find someone who knows what you need to know',
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

interface RolledScore {
  dice: number[];
  total: number;
  assignedTo: AbilityKey | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatMod(score: number): string {
  const m = modifier(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function roll4d6DropLowest(): { dice: number[]; total: number } {
  const dice = [rollD6(), rollD6(), rollD6(), rollD6()];
  const sorted = [...dice].sort((a, b) => a - b);
  const total = sorted[1] + sorted[2] + sorted[3];
  return { dice, total };
}

function getDroppedIndex(dice: number[]): number {
  let minVal = 7;
  let minIdx = 0;
  dice.forEach((d, i) => {
    if (d < minVal) { minVal = d; minIdx = i; }
  });
  return minIdx;
}

// ─── Shared Styles ─────────────────────────────────────────────────────────────

const S = {
  gold: '#c9a227',
  goldDim: 'rgba(201,162,39,0.4)',
  cream: '#f4e4bc',
  creamDim: 'rgba(244,228,188,0.6)',
  bg: 'rgba(45,27,0,0.7)',
  bgDark: '#1a0f00',
  border: '1px solid rgba(201,162,39,0.3)',
  borderHover: '1px solid #c9a227',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'Cinzel, serif',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: S.gold,
  display: 'block',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: S.bg,
  border: S.border,
  color: S.cream,
  padding: '0.5rem 0.75rem',
  fontFamily: 'Crimson Text, serif',
  fontSize: '1.05rem',
  outline: 'none',
  boxSizing: 'border-box',
};

function CardButton({
  selected, onClick, children, style,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? 'rgba(201,162,39,0.15)' : 'rgba(45,27,0,0.5)',
        border: selected ? `2px solid ${S.gold}` : '2px solid rgba(201,162,39,0.2)',
        borderRadius: 4,
        color: S.cream,
        cursor: 'pointer',
        textAlign: 'left',
        padding: '0.75rem',
        transition: 'all 0.15s ease',
        boxShadow: selected ? `0 0 12px rgba(201,162,39,0.3)` : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Step 1: Race ──────────────────────────────────────────────────────────────

function StepRace({
  selected, onSelect,
}: { selected: string; onSelect: (r: string) => void }) {
  return (
    <div>
      <StepHeader title="Choose Your Race" subtitle="Your heritage shapes your abilities and traits." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
        {RACES.map((r) => (
          <CardButton key={r.name} selected={selected === r.name} onClick={() => onSelect(r.name)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '1.3rem' }}>{r.icon}</span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: S.gold, fontWeight: 700 }}>{r.name}</span>
            </div>
            <p style={{ fontFamily: 'Crimson Text, serif', fontSize: '0.8rem', color: S.creamDim, margin: 0, lineHeight: 1.3 }}>
              {r.description}
            </p>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(r.bonuses).map(([ab, val]) => (
                <span key={ab} style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', color: S.gold, borderRadius: 2, padding: '1px 5px' }}>
                  {ab} +{val}
                </span>
              ))}
              {r.flexBonusCount && (
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', color: S.gold, borderRadius: 2, padding: '1px 5px' }}>
                  +1 × 2 (choice)
                </span>
              )}
            </div>
          </CardButton>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: '0.75rem', background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: 4, padding: '0.6rem 0.75rem' }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: S.gold, marginBottom: 4 }}>RACIAL TRAITS</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontFamily: 'Crimson Text, serif', fontSize: '0.85rem', color: S.creamDim, lineHeight: 1.6 }}>
            {RACES.find(r => r.name === selected)?.traits.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Class ─────────────────────────────────────────────────────────────

function StepClass({
  selected, onSelect,
}: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div>
      <StepHeader title="Choose Your Class" subtitle="Your calling defines how you face adventure." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
        {CLASSES.map((c) => (
          <CardButton key={c.name} selected={selected === c.name} onClick={() => onSelect(c.name)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: S.gold, fontWeight: 700 }}>{c.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', background: 'rgba(220,50,50,0.2)', border: '1px solid rgba(220,50,50,0.4)', color: '#ff9999', borderRadius: 2, padding: '1px 5px' }}>
                d{c.hitDie} HP
              </span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', background: 'rgba(100,150,255,0.15)', border: '1px solid rgba(100,150,255,0.3)', color: '#aac4ff', borderRadius: 2, padding: '1px 5px' }}>
                {c.primaryAbility}
              </span>
            </div>
            <p style={{ fontFamily: 'Crimson Text, serif', fontSize: '0.8rem', color: S.creamDim, margin: 0, lineHeight: 1.3 }}>
              {c.description}
            </p>
          </CardButton>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: '0.75rem', background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: 4, padding: '0.6rem 0.75rem' }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: S.gold, marginBottom: 4 }}>CLASS FEATURES AT LEVEL 1</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontFamily: 'Crimson Text, serif', fontSize: '0.85rem', color: S.creamDim, lineHeight: 1.6 }}>
            {CLASSES.find(c => c.name === selected)?.features.map(f => <li key={f}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Ability Scores ────────────────────────────────────────────────────

const ABILITY_KEYS: AbilityKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const ABILITY_NAMES: Record<AbilityKey, string> = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
  INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};

interface DieState {
  value: number;
  spinning: boolean;
  face: string;
}

function SingleDie({ dieState, isDropped }: { dieState: DieState; isDropped: boolean }) {
  return (
    <div style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      fontFamily: 'serif',
      background: isDropped ? 'rgba(80,40,0,0.4)' : 'rgba(201,162,39,0.15)',
      border: isDropped ? '1px solid rgba(201,162,39,0.15)' : '1px solid rgba(201,162,39,0.5)',
      borderRadius: 4,
      color: isDropped ? 'rgba(201,162,39,0.25)' : S.gold,
      opacity: dieState.spinning ? 0.7 : 1,
      transition: 'all 0.2s ease',
      position: 'relative',
      animation: dieState.spinning ? 'dieSpin 0.1s linear infinite' : 'none',
      textDecoration: isDropped ? 'line-through' : 'none',
      userSelect: 'none',
    }}>
      {dieState.face}
    </div>
  );
}

function StepAbilityScores({
  raceName,
  rolledScores,
  setRolledScores,
  assignments,
  setAssignments,
}: {
  raceName: string;
  rolledScores: RolledScore[];
  setRolledScores: (s: RolledScore[]) => void;
  assignments: Partial<Record<AbilityKey, number>>;
  setAssignments: (a: Partial<Record<AbilityKey, number>>) => void;
}) {
  const [diceStates, setDiceStates] = useState<DieState[][]>(() =>
    Array.from({ length: 6 }, () =>
      Array.from({ length: 4 }, (_, i) => ({
        value: i + 1,
        spinning: false,
        face: DICE_FACES[i],
      }))
    )
  );
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(rolledScores.length > 0);

  const race = RACES.find(r => r.name === raceName);

  const getRacialBonus = useCallback((ab: AbilityKey): number => {
    return race?.bonuses[ab] ?? 0;
  }, [race]);

  const getBaseScore = (ab: AbilityKey): number | null => {
    const idx = assignments[ab];
    if (idx === undefined) return null;
    return rolledScores[idx]?.total ?? null;
  };

  const getFinalScore = (ab: AbilityKey): number | null => {
    const base = getBaseScore(ab);
    if (base === null) return null;
    return base + getRacialBonus(ab);
  };

  const rollAll = useCallback(async () => {
    if (rolling) return;
    setRolling(true);
    setAssignments({});

    // Start spinning all dice
    setDiceStates(prev => prev.map(group =>
      group.map(d => ({ ...d, spinning: true, face: DICE_FACES[Math.floor(Math.random() * 6)] }))
    ));

    // Animate for 900ms with face changes every 80ms
    const intervalId = setInterval(() => {
      setDiceStates(prev => prev.map(group =>
        group.map(d => d.spinning ? { ...d, face: DICE_FACES[Math.floor(Math.random() * 6)] } : d)
      ));
    }, 80);

    await new Promise(res => setTimeout(res, 900));
    clearInterval(intervalId);

    // Compute final results
    const results: RolledScore[] = Array.from({ length: 6 }, () => {
      const { dice, total } = roll4d6DropLowest();
      return { dice, total, assignedTo: null };
    });

    setRolledScores(results);
    setDiceStates(results.map(r =>
      r.dice.map(v => ({ value: v, spinning: false, face: DICE_FACES[v - 1] }))
    ));
    setHasRolled(true);
    setRolling(false);
  }, [rolling, setAssignments, setRolledScores]);

  const assignScore = (scoreIndex: number, ability: AbilityKey | '') => {
    const newAssignments = { ...assignments };
    // Remove any existing assignment to this ability
    (Object.keys(newAssignments) as AbilityKey[]).forEach(k => {
      if (newAssignments[k] === scoreIndex) delete newAssignments[k];
    });
    if (ability) {
      // Remove previous assignment of this ability
      delete newAssignments[ability];
      newAssignments[ability] = scoreIndex;
    }
    setAssignments(newAssignments);
  };

  const allAssigned = ABILITY_KEYS.every(ab => assignments[ab] !== undefined);

  return (
    <div>
      <style>{`
        @keyframes dieSpin {
          0%   { transform: rotate(0deg) scale(1.1); }
          25%  { transform: rotate(90deg) scale(0.95); }
          50%  { transform: rotate(180deg) scale(1.1); }
          75%  { transform: rotate(270deg) scale(0.95); }
          100% { transform: rotate(360deg) scale(1.1); }
        }
        @keyframes scoreReveal {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <StepHeader title="Roll Ability Scores" subtitle="4d6, drop the lowest — fate decides your potential." />

      <button
        type="button"
        onClick={rollAll}
        disabled={rolling}
        style={{
          width: '100%',
          padding: '0.7rem',
          background: rolling
            ? 'rgba(201,162,39,0.1)'
            : 'linear-gradient(135deg, rgba(201,162,39,0.3), rgba(201,162,39,0.15))',
          border: `2px solid ${rolling ? S.goldDim : S.gold}`,
          borderRadius: 4,
          color: rolling ? S.goldDim : S.gold,
          fontFamily: 'Cinzel, serif',
          fontSize: '1rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          cursor: rolling ? 'not-allowed' : 'pointer',
          marginBottom: '0.75rem',
          transition: 'all 0.2s ease',
          textTransform: 'uppercase',
        }}
      >
        {rolling ? 'Rolling...' : hasRolled ? 'Re-Roll All' : 'Roll the Dice!'}
      </button>

      {/* Dice groups */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {Array.from({ length: 6 }, (_, i) => {
          const score = rolledScores[i];
          const droppedIdx = score ? getDroppedIndex(score.dice) : -1;
          const isAssigned = Object.values(assignments).includes(i);
          const assignedTo = (Object.keys(assignments) as AbilityKey[]).find(k => assignments[k] === i);

          return (
            <div
              key={i}
              style={{
                background: isAssigned ? 'rgba(201,162,39,0.12)' : 'rgba(45,27,0,0.5)',
                border: isAssigned ? `1px solid ${S.gold}` : '1px solid rgba(201,162,39,0.2)',
                borderRadius: 4,
                padding: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 4 }}>
                {diceStates[i].map((d, di) => (
                  <SingleDie key={di} dieState={d} isDropped={di === droppedIdx && !rolling} />
                ))}
              </div>
              <div style={{
                textAlign: 'center',
                fontFamily: 'Cinzel, serif',
                fontSize: score ? '1.3rem' : '1rem',
                fontWeight: 700,
                color: score ? S.gold : S.goldDim,
                animation: score && !rolling ? 'scoreReveal 0.4s ease' : 'none',
              }}>
                {score ? score.total : '—'}
              </div>
              {hasRolled && score && (
                <select
                  value={assignedTo ?? ''}
                  onChange={e => assignScore(i, e.target.value as AbilityKey | '')}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    background: '#1a0f00',
                    border: '1px solid rgba(201,162,39,0.3)',
                    color: assignedTo ? S.gold : S.creamDim,
                    fontFamily: 'Cinzel, serif',
                    fontSize: '0.65rem',
                    padding: '2px 4px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Assign to...</option>
                  {ABILITY_KEYS.map(ab => (
                    <option
                      key={ab}
                      value={ab}
                      disabled={assignments[ab] !== undefined && assignments[ab] !== i}
                    >
                      {ab}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>

      {/* Final scores table */}
      {allAssigned && (
        <div style={{ background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.25)', borderRadius: 4, padding: '0.6rem' }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: S.gold, margin: '0 0 6px 0', textAlign: 'center' }}>FINAL ABILITY SCORES</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {ABILITY_KEYS.map(ab => {
              const base = getBaseScore(ab) ?? 0;
              const bonus = getRacialBonus(ab);
              const final = getFinalScore(ab) ?? 0;
              return (
                <div key={ab} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: S.goldDim, marginBottom: 2 }}>{ab}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 700, color: S.cream }}>{final}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: '#88cc88' }}>{formatMod(final)}</div>
                  {bonus > 0 && (
                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: S.goldDim }}>
                      {base}+{bonus}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Background ────────────────────────────────────────────────────────

function StepBackground({
  selected, onSelect,
}: { selected: string; onSelect: (b: string) => void }) {
  return (
    <div>
      <StepHeader title="Choose Your Background" subtitle="Your life before adventuring grants skills and stories." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
        {BACKGROUNDS.map((b) => (
          <CardButton key={b.name} selected={selected === b.name} onClick={() => onSelect(b.name)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '1.2rem' }}>{b.icon}</span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: S.gold, fontWeight: 700 }}>{b.name}</span>
            </div>
            <p style={{ fontFamily: 'Crimson Text, serif', fontSize: '0.8rem', color: S.creamDim, margin: '0 0 6px 0', lineHeight: 1.3 }}>
              {b.description}
            </p>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: S.creamDim }}>
              Skills: <span style={{ color: S.gold }}>{b.skillProficiencies.join(', ')}</span>
            </div>
          </CardButton>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: '0.75rem', background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: 4, padding: '0.6rem 0.75rem' }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: S.gold, marginBottom: 4 }}>BACKGROUND FEATURE</p>
          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: '0.85rem', color: S.creamDim, margin: 0 }}>
            {BACKGROUNDS.find(b => b.name === selected)?.feature}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Finalize ──────────────────────────────────────────────────────────

function StepFinalize({
  name, setName,
  colour, setColour,
  description, setDescription,
  raceName, className, backgroundName,
  assignments, rolledScores,
}: {
  name: string; setName: (n: string) => void;
  colour: string; setColour: (c: string) => void;
  description: string; setDescription: (d: string) => void;
  raceName: string; className: string; backgroundName: string;
  assignments: Partial<Record<AbilityKey, number>>;
  rolledScores: RolledScore[];
}) {
  const race = RACES.find(r => r.name === raceName)!;
  const cls = CLASSES.find(c => c.name === className)!;
  const bg = BACKGROUNDS.find(b => b.name === backgroundName)!;

  const getBase = (ab: AbilityKey) => {
    const idx = assignments[ab];
    return idx !== undefined ? (rolledScores[idx]?.total ?? 10) : 10;
  };
  const getFinal = (ab: AbilityKey) => getBase(ab) + (race?.bonuses[ab] ?? 0);
  const dexMod = modifier(getFinal('DEX'));
  const conMod = modifier(getFinal('CON'));
  const wisMod = modifier(getFinal('WIS'));
  const hp = cls.hitDie + conMod;
  const ac = className === 'Barbarian'
    ? 10 + dexMod + modifier(getFinal('CON'))
    : className === 'Monk'
    ? 10 + dexMod + wisMod
    : 10 + dexMod;

  const allSkills = [
    ...bg.skillProficiencies,
    ...cls.savingThrows.map(s => `${ABILITY_NAMES[s]} saving throw`),
  ];

  return (
    <div>
      <StepHeader title="Finalize Your Hero" subtitle="One last look before you enter the adventure." />

      {/* Name */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>Character Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your hero's name..."
          maxLength={40}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = S.gold; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.3)'; }}
        />
      </div>

      {/* Character Description */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>Character Description <span style={{ color: 'rgba(201,162,39,0.5)', fontWeight: 400 }}>(optional)</span></label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={`Describe your ${raceName} ${className}... What do they look like? What drives them? What dark secret do they carry? What quirk makes them unforgettable at the table?`}
          maxLength={400}
          rows={4}
          style={{
            ...inputStyle,
            resize: 'vertical',
            minHeight: 90,
            lineHeight: '1.5',
            fontFamily: 'Crimson Text, Georgia, serif',
            fontSize: '0.95rem',
          } as React.CSSProperties}
          onFocus={e => { e.target.style.borderColor = S.gold; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.3)'; }}
        />
        <p style={{ fontFamily: 'Crimson Text, serif', fontSize: '0.78rem', color: 'rgba(201,162,39,0.4)', marginTop: '0.25rem', textAlign: 'right' }}>
          {description.length}/400
        </p>
      </div>

      {/* Token colour */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>Token Colour</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {TOKEN_COLOURS.map(c => (
            <button
              key={c} type="button" onClick={() => setColour(c)}
              style={{
                width: 30, height: 30, borderRadius: '50%', background: c,
                border: colour === c ? `3px solid ${S.gold}` : '3px solid rgba(201,162,39,0.2)',
                boxShadow: colour === c ? `0 0 10px ${c}88` : 'none',
                cursor: 'pointer',
                transform: colour === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Summary card */}
      <div style={{ background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.25)', borderRadius: 4, padding: '0.75rem', maxHeight: 280, overflowY: 'auto' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: colour,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#fff', fontSize: '0.85rem',
            boxShadow: `0 0 14px ${colour}66`, flexShrink: 0,
          }}>
            {name.slice(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <p style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: S.cream, fontSize: '1rem', margin: 0 }}>
              {name || 'Hero Name'}
            </p>
            <p style={{ fontFamily: 'Crimson Text, serif', color: S.creamDim, fontSize: '0.85rem', margin: 0 }}>
              Level 1 {raceName} {className} · {backgroundName}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: '0.6rem' }}>
          {[
            { label: 'HP', value: Math.max(1, hp) },
            { label: 'AC', value: ac },
            { label: 'INIT', value: formatMod(getFinal('DEX')) },
            { label: 'SPEED', value: `${race?.speed ?? 30}ft` },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', background: 'rgba(45,27,0,0.5)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: 3, padding: '4px 2px' }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 700, color: S.cream }}>{stat.value}</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: S.goldDim }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Ability scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginBottom: '0.6rem' }}>
          {ABILITY_KEYS.map(ab => {
            const final = getFinal(ab);
            return (
              <div key={ab} style={{ textAlign: 'center', background: 'rgba(45,27,0,0.5)', border: '1px solid rgba(201,162,39,0.15)', borderRadius: 3, padding: '3px 1px' }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', fontWeight: 700, color: S.cream }}>{final}</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: S.goldDim }}>{ab}</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: '#88cc88' }}>{formatMod(final)}</div>
              </div>
            );
          })}
        </div>

        {/* Proficiencies */}
        <div>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: S.gold, marginBottom: 3 }}>PROFICIENCIES</p>
          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: '0.8rem', color: S.creamDim, margin: 0, lineHeight: 1.5 }}>
            {allSkills.join(' · ')}
          </p>
        </div>

        {/* Description preview */}
        {description.trim() && (
          <div style={{ borderTop: '1px solid rgba(201,162,39,0.2)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: S.gold, marginBottom: 3 }}>BACKSTORY</p>
            <p style={{ fontFamily: 'Crimson Text, serif', fontSize: '0.85rem', color: S.creamDim, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
              "{description.trim()}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared StepHeader ─────────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: S.gold, fontSize: '1.15rem', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <p style={{ fontFamily: 'Crimson Text, serif', fontSize: '0.9rem', color: S.creamDim, margin: 0, fontStyle: 'italic' }}>
        {subtitle}
      </p>
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const labels = ['Race', 'Class', 'Scores', 'Background', 'Finalize'];
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        {labels.map((label, i) => (
          <div key={label} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', margin: '0 auto 3px',
              background: i < step ? S.gold : i === step ? 'rgba(201,162,39,0.3)' : 'rgba(201,162,39,0.1)',
              border: `2px solid ${i <= step ? S.gold : S.goldDim}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cinzel, serif', fontSize: '0.65rem', fontWeight: 700,
              color: i < step ? S.bgDark : i === step ? S.gold : S.goldDim,
              transition: 'all 0.3s ease',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: i === step ? S.gold : S.goldDim, display: 'none' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 2, background: 'rgba(201,162,39,0.15)', borderRadius: 1, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${(step / (total - 1)) * 100}%`,
          background: `linear-gradient(90deg, ${S.gold}, rgba(201,162,39,0.5))`,
          borderRadius: 1,
          transition: 'width 0.3s ease',
          boxShadow: `0 0 8px rgba(201,162,39,0.4)`,
        }} />
      </div>
      <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: S.goldDim, textAlign: 'center', marginTop: 4 }}>
        Step {step + 1} of {total} — {labels[step]}
      </p>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────

export default function CharacterCreationModal({ onClose, onComplete }: { onClose?: () => void; onComplete?: () => void }) {
  const player = useSessionStore((s) => s.player);
  const addToken = useGameStore((s) => s.addToken);
  const initSheet = useCharacterStore((s) => s.initSheet);

  const TOTAL_STEPS = 5;
  const [step, setStep] = useState(0);

  // Step 1
  const [raceName, setRaceName] = useState('Human');
  // Step 2
  const [className, setClassName] = useState('Fighter');
  // Step 3
  const [rolledScores, setRolledScores] = useState<RolledScore[]>([]);
  const [assignments, setAssignments] = useState<Partial<Record<AbilityKey, number>>>({});
  // Step 4
  const [backgroundName, setBackgroundName] = useState('Folk Hero');
  // Step 5
  const [name, setName] = useState(player?.characterName || player?.name || '');
  const [colour, setColour] = useState(player?.colour || TOKEN_COLOURS[1]);
  const [description, setDescription] = useState('');

  const canAdvance = useCallback((): boolean => {
    if (step === 0) return !!raceName;
    if (step === 1) return !!className;
    if (step === 2) return ABILITY_KEYS.every(ab => assignments[ab] !== undefined) && rolledScores.length === 6;
    if (step === 3) return !!backgroundName;
    if (step === 4) return !!name.trim();
    return false;
  }, [step, raceName, className, assignments, rolledScores, backgroundName, name]);

  const handleSubmit = () => {
    if (!player || !name.trim()) return;

    const race = RACES.find(r => r.name === raceName)!;
    const cls = CLASSES.find(c => c.name === className)!;

    const getBase = (ab: AbilityKey) => {
      const idx = assignments[ab];
      return idx !== undefined ? (rolledScores[idx]?.total ?? 10) : 10;
    };
    const getFinal = (ab: AbilityKey) => getBase(ab) + (race?.bonuses[ab] ?? 0);

    const dexMod = modifier(getFinal('DEX'));
    const conMod = modifier(getFinal('CON'));
    const wisMod = modifier(getFinal('WIS'));

    const hp = Math.max(1, cls.hitDie + conMod);
    const ac = className === 'Barbarian'
      ? 10 + dexMod + modifier(getFinal('CON'))
      : className === 'Monk'
      ? 10 + dexMod + wisMod
      : 10 + dexMod;

    const token = {
      id: `player-${player.id}`,
      name: name.trim(),
      x: 2,
      y: 2,
      colour,
      hp,
      maxHp: hp,
      ac,
      isPlayer: true,
      isNpc: false,
      playerId: player.id,
      conditions: [] as [],
      isVisible: true,
      description: description.trim(),
      race: raceName,
      class: className,
      background: backgroundName,
    };

    addToken(token);
    socketEmit.tokenAdd(token as unknown as Record<string, unknown>);

    // Initialize character sheet in the store so CharacterSheetModal has data
    initSheet(player.id, name.trim(), player.name, className as ClassName);

    onClose?.();
    onComplete?.();
  };

  const nextLabel = step === TOTAL_STEPS - 1 ? 'Enter the Adventure' : 'Next';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #2d1b00 0%, #1a0f00 100%)',
        border: '2px solid rgba(201,162,39,0.45)',
        boxShadow: '0 0 50px rgba(201,162,39,0.2), inset 0 0 60px rgba(0,0,0,0.5)',
        borderRadius: 6,
        padding: '1.75rem',
        width: '100%',
        maxWidth: 560,
        position: 'relative',
        maxHeight: '95vh',
        overflowY: 'auto',
      }}>
        {/* Corner ornaments */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map(pos => (
          <span key={pos} className={`absolute ${pos}`}
            style={{ fontFamily: 'Cinzel, serif', color: S.gold, opacity: 0.35, fontSize: 13, position: 'absolute',
              ...(pos.includes('top') ? { top: 6 } : { bottom: 6 }),
              ...(pos.includes('left') ? { left: 8 } : { right: 8 }),
            }}>
            ✦
          </span>
        ))}

        <h2 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, textAlign: 'center', color: S.gold, fontSize: '1.35rem', letterSpacing: '0.05em', marginBottom: 2 }}>
          Create Your Character
        </h2>
        <p style={{ textAlign: 'center', fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: 'rgba(244,228,188,0.45)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Your legend begins here...
        </p>

        <ProgressBar step={step} total={TOTAL_STEPS} />

        {/* Step content */}
        <div style={{ minHeight: 320 }}>
          {step === 0 && <StepRace selected={raceName} onSelect={setRaceName} />}
          {step === 1 && <StepClass selected={className} onSelect={setClassName} />}
          {step === 2 && (
            <StepAbilityScores
              raceName={raceName}
              rolledScores={rolledScores}
              setRolledScores={setRolledScores}
              assignments={assignments}
              setAssignments={setAssignments}
            />
          )}
          {step === 3 && <StepBackground selected={backgroundName} onSelect={setBackgroundName} />}
          {step === 4 && (
            <StepFinalize
              name={name} setName={setName}
              colour={colour} setColour={setColour}
              description={description} setDescription={setDescription}
              raceName={raceName} className={className} backgroundName={backgroundName}
              assignments={assignments} rolledScores={rolledScores}
            />
          )}
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: '0.65rem',
                background: 'rgba(45,27,0,0.6)',
                border: '1px solid rgba(201,162,39,0.3)',
                borderRadius: 4, color: S.creamDim,
                fontFamily: 'Cinzel, serif', fontSize: '0.85rem',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = S.gold; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(201,162,39,0.3)'; }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!canAdvance()) return;
              if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
              else handleSubmit();
            }}
            disabled={!canAdvance()}
            style={{
              flex: 2, padding: '0.65rem',
              background: canAdvance()
                ? 'linear-gradient(135deg, rgba(201,162,39,0.35), rgba(201,162,39,0.2))'
                : 'rgba(45,27,0,0.4)',
              border: `2px solid ${canAdvance() ? S.gold : S.goldDim}`,
              borderRadius: 4,
              color: canAdvance() ? S.gold : S.goldDim,
              fontFamily: 'Cinzel, serif', fontSize: '0.9rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: canAdvance() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            {step === TOTAL_STEPS - 1 ? 'Enter the Adventure' : `Next: ${['Class', 'Scores', 'Background', 'Finalize', ''][step]}`}
          </button>
        </div>
      </div>
    </div>
  );
}

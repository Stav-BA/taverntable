import React, { useState, useMemo } from 'react';
import { Monster, useDMStore } from '@/stores/dmStore';
import { useSessionStore } from '@/stores/sessionStore';
import { MonsterCard } from './MonsterCard';
import {
  ENCOUNTER_XP_BUDGET,
  crToXP,
  getEncounterDifficulty,
} from '@taverntable/dnd-rules';

export const QUICK_MONSTERS: Monster[] = [
  { slug: 'goblin',         name: 'Goblin',            cr: 0.25,  hp: 7,   ac: 15, type: 'humanoid',    xp: 50    },
  { slug: 'kobold',         name: 'Kobold',             cr: 0.125, hp: 5,   ac: 12, type: 'humanoid',    xp: 25    },
  { slug: 'skeleton',       name: 'Skeleton',           cr: 0.25,  hp: 13,  ac: 13, type: 'undead',      xp: 50    },
  { slug: 'zombie',         name: 'Zombie',             cr: 0.25,  hp: 22,  ac: 8,  type: 'undead',      xp: 50    },
  { slug: 'wolf',           name: 'Wolf',               cr: 0.25,  hp: 11,  ac: 13, type: 'beast',       xp: 50    },
  { slug: 'giant-spider',   name: 'Giant Spider',       cr: 1,     hp: 26,  ac: 14, type: 'beast',       xp: 200   },
  { slug: 'orc',            name: 'Orc',                cr: 0.5,   hp: 15,  ac: 13, type: 'humanoid',    xp: 100   },
  { slug: 'hobgoblin',      name: 'Hobgoblin',          cr: 0.5,   hp: 11,  ac: 18, type: 'humanoid',    xp: 100   },
  { slug: 'bugbear',        name: 'Bugbear',            cr: 1,     hp: 27,  ac: 16, type: 'humanoid',    xp: 200   },
  { slug: 'gnoll',          name: 'Gnoll',              cr: 0.5,   hp: 22,  ac: 15, type: 'humanoid',    xp: 100   },
  { slug: 'ghoul',          name: 'Ghoul',              cr: 1,     hp: 22,  ac: 12, type: 'undead',      xp: 200   },
  { slug: 'shadow',         name: 'Shadow',             cr: 0.5,   hp: 16,  ac: 12, type: 'undead',      xp: 100   },
  { slug: 'wight',          name: 'Wight',              cr: 3,     hp: 45,  ac: 14, type: 'undead',      xp: 700   },
  { slug: 'bandit',         name: 'Bandit',             cr: 0.125, hp: 11,  ac: 12, type: 'humanoid',    xp: 25    },
  { slug: 'bandit-captain', name: 'Bandit Captain',     cr: 2,     hp: 65,  ac: 15, type: 'humanoid',    xp: 450   },
  { slug: 'cultist',        name: 'Cultist',            cr: 0.125, hp: 9,   ac: 12, type: 'humanoid',    xp: 25    },
  { slug: 'cult-fanatic',   name: 'Cult Fanatic',       cr: 2,     hp: 33,  ac: 13, type: 'humanoid',    xp: 450   },
  { slug: 'ogre',           name: 'Ogre',               cr: 2,     hp: 59,  ac: 11, type: 'giant',       xp: 450   },
  { slug: 'troll',          name: 'Troll',              cr: 5,     hp: 84,  ac: 15, type: 'giant',       xp: 1800  },
  { slug: 'hill-giant',     name: 'Hill Giant',         cr: 5,     hp: 105, ac: 13, type: 'giant',       xp: 1800  },
  { slug: 'owlbear',        name: 'Owlbear',            cr: 3,     hp: 59,  ac: 13, type: 'monstrosity', xp: 700   },
  { slug: 'manticore',      name: 'Manticore',          cr: 3,     hp: 68,  ac: 14, type: 'monstrosity', xp: 700   },
  { slug: 'basilisk',       name: 'Basilisk',           cr: 3,     hp: 52,  ac: 15, type: 'monstrosity', xp: 700   },
  { slug: 'medusa',         name: 'Medusa',             cr: 6,     hp: 127, ac: 15, type: 'monstrosity', xp: 2300  },
  { slug: 'vampire-spawn',  name: 'Vampire Spawn',      cr: 5,     hp: 82,  ac: 15, type: 'undead',      xp: 1800  },
  { slug: 'vampire',        name: 'Vampire',            cr: 13,    hp: 144, ac: 16, type: 'undead',      xp: 10000 },
  { slug: 'young-dragon',   name: 'Young Red Dragon',   cr: 10,    hp: 178, ac: 18, type: 'dragon',      xp: 5900  },
  { slug: 'adult-dragon',   name: 'Adult Red Dragon',   cr: 17,    hp: 256, ac: 19, type: 'dragon',      xp: 18000 },
  { slug: 'beholder',       name: 'Beholder',           cr: 13,    hp: 180, ac: 18, type: 'aberration',  xp: 10000 },
  { slug: 'mind-flayer',    name: 'Mind Flayer',        cr: 7,     hp: 71,  ac: 15, type: 'aberration',  xp: 2900  },
];

const ALL_TYPES = Array.from(new Set(QUICK_MONSTERS.map((m) => m.type))).sort();

/** Difficulty colour for the 2024 system */
function difficultyColour(label: string): string {
  switch (label) {
    case 'Low':        return '#2d8a2d';
    case 'Moderate':   return '#c9a227';
    case 'High':       return '#e67e22';
    case 'Above High': return '#8b1a1a';
    default:           return '#555';
  }
}

/** Width percentage for the difficulty bar (0-100) */
function difficultyPct(
  totalXP: number,
  low: number,
  moderate: number,
  high: number,
): number {
  if (totalXP <= 0)         return 0;
  if (totalXP < low)        return (totalXP / low) * 25;
  if (totalXP < moderate)   return 25 + ((totalXP - low) / (moderate - low)) * 25;
  if (totalXP < high)       return 50 + ((totalXP - moderate) / (high - moderate)) * 25;
  return Math.min(100, 75 + ((totalXP - high) / high) * 25);
}

export function EncounterBuilder() {
  const {
    encounterMonsters,
    addToEncounter,
    removeFromEncounter,
    setCount,
    clearEncounter,
    addJournalEntry,
    currentSession,
  } = useDMStore();

  const connectedPlayers = useSessionStore((s) => s.connectedPlayers);

  const [search,     setSearch]     = useState('');
  const [crMax,      setCrMax]      = useState(30);
  const [filterType, setFilterType] = useState('all');

  // 2024 party config — independent of connected players for planning
  const [partySize,  setPartySize]  = useState(Math.max(1, connectedPlayers.length) || 4);
  const [partyLevel, setPartyLevel] = useState(1);

  // Budget per character, then scaled to full party
  const budget = useMemo(() => {
    const level = Math.max(1, Math.min(20, partyLevel));
    const b = ENCOUNTER_XP_BUDGET[level];
    return {
      low:      b.low      * partySize,
      moderate: b.moderate * partySize,
      high:     b.high     * partySize,
    };
  }, [partyLevel, partySize]);

  const filteredMonsters = QUICK_MONSTERS.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (m.cr > crMax) return false;
    if (filterType !== 'all' && m.type !== filterType) return false;
    return true;
  });

  const totalXP = encounterMonsters.reduce(
    (sum, e) => sum + (e.monster.xp ?? crToXP(e.monster.cr)) * e.count,
    0,
  );
  const totalCount = encounterMonsters.reduce((sum, e) => sum + e.count, 0);

  const diffLabel  = totalXP === 0 ? 'None' : getEncounterDifficulty(partyLevel, partySize, totalXP);
  const diffColour = difficultyColour(diffLabel);
  const barPct     = difficultyPct(totalXP, budget.low, budget.moderate, budget.high);

  const overwhelmWarning = totalCount > partySize * 2 && partyLevel <= 5;

  const handleLaunch = () => {
    const monsterList = encounterMonsters.map((e) => `${e.count}x ${e.monster.name}`).join(', ');
    addJournalEntry({
      sessionNumber: currentSession,
      title: 'Encounter Launched',
      body: `Encounter started: ${monsterList}. Total XP: ${totalXP}. Difficulty: ${diffLabel}.`,
      tags: ['combat'],
      characterTags: [],
    });
    console.log('[Encounter] Launched:', encounterMonsters);
  };

  const handleSave = () => {
    const monsterList = encounterMonsters.map((e) => `${e.count}x ${e.monster.name}`).join(', ');
    addJournalEntry({
      sessionNumber: currentSession,
      title: 'Encounter Saved',
      body: `Saved encounter: ${monsterList}. Total XP: ${totalXP}. Difficulty: ${diffLabel}.`,
      tags: ['combat'],
      characterTags: [],
    });
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">

      {/* ── Party Config (2024) ───────────────────────────────────────────── */}
      <div className="rounded p-3" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}>
        <p className="font-cinzel text-xs uppercase tracking-wider mb-2" style={{ color: '#c9a227' }}>
          Party Config — 2024 DMG
        </p>
        <div className="flex gap-4 items-end">
          <div>
            <label className="font-cinzel text-xs block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>
              Party Size
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 text-center font-cinzel text-xs rounded px-1 py-1"
              style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
            />
          </div>
          <div>
            <label className="font-cinzel text-xs block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>
              Party Level
            </label>
            <select
              value={partyLevel}
              onChange={(e) => setPartyLevel(parseInt(e.target.value))}
              className="font-cinzel text-xs rounded px-2 py-1"
              style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* XP Budget display */}
        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
          {(['low', 'moderate', 'high'] as const).map((tier) => (
            <div key={tier} className="rounded px-1 py-1" style={{ background: 'rgba(20,10,0,0.3)', border: '1px solid rgba(201,162,39,0.15)' }}>
              <div className="font-cinzel text-xs capitalize" style={{ color: difficultyColour(tier === 'low' ? 'Low' : tier === 'moderate' ? 'Moderate' : 'High') }}>
                {tier}
              </div>
              <div className="font-crimson text-xs" style={{ color: '#f4e4bc' }}>
                {budget[tier].toLocaleString()} XP
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Monster search ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search monsters..."
          className="w-full font-crimson text-sm px-3 py-1.5 rounded"
          style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
        />
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>
              CR max: {crMax === 30 ? '30' : crMax}
            </label>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={crMax}
              onChange={(e) => setCrMax(parseInt(e.target.value))}
              className="w-full h-1"
              style={{ accentColor: '#c9a227' }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="font-cinzel text-xs px-2 py-1 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          >
            <option value="all">All Types</option>
            {ALL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* ── Monster results ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-1 overflow-y-auto rounded p-2"
        style={{ maxHeight: 200, background: 'rgba(20,10,0,0.4)', border: '1px solid rgba(201,162,39,0.15)' }}
      >
        {filteredMonsters.length === 0 ? (
          <p className="text-center font-crimson italic text-xs py-2" style={{ color: 'rgba(244,228,188,0.4)' }}>
            No monsters match
          </p>
        ) : (
          filteredMonsters.map((m) => (
            <MonsterCard key={m.slug} monster={m} onAdd={addToEncounter} compact />
          ))
        )}
      </div>

      {/* ── Active Encounter ─────────────────────────────────────────────── */}
      {encounterMonsters.length > 0 && (
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}>
          <div className="flex items-center justify-between">
            <p className="font-cinzel text-xs uppercase tracking-wider" style={{ color: '#c9a227' }}>
              Active Encounter
            </p>
            <button
              onClick={clearEncounter}
              className="font-cinzel text-xs px-2 py-0.5 rounded"
              style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(139,26,26,0.4)', color: '#c0392b', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>

          {/* Monster list */}
          {encounterMonsters.map(({ monster, count }) => {
            const monXP = monster.xp ?? crToXP(monster.cr);
            const crLabel = monster.cr < 1
              ? (monster.cr === 0.125 ? '1/8' : monster.cr === 0.25 ? '1/4' : '1/2')
              : String(monster.cr);
            return (
              <div key={monster.slug} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-crimson text-sm truncate block" style={{ color: '#f4e4bc' }}>
                    {monster.name}
                  </span>
                  <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.4)' }}>
                    CR {crLabel} — {monXP} XP each
                  </span>
                </div>
                <span className="font-cinzel text-xs flex-shrink-0" style={{ color: 'rgba(244,228,188,0.5)' }}>
                  {(monXP * count).toLocaleString()} XP
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setCount(monster.slug, count - 1)}
                    className="w-5 h-5 rounded font-cinzel text-xs"
                    style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc', cursor: 'pointer' }}
                  >
                    −
                  </button>
                  <span className="font-cinzel text-xs w-4 text-center" style={{ color: '#c9a227' }}>
                    {count}
                  </span>
                  <button
                    onClick={() => setCount(monster.slug, count + 1)}
                    className="w-5 h-5 rounded font-cinzel text-xs"
                    style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeFromEncounter(monster.slug)}
                  className="font-cinzel text-xs w-5 h-5 rounded flex-shrink-0"
                  style={{ color: 'rgba(139,26,26,0.8)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Total XP */}
          <div
            className="flex justify-between items-baseline pt-2"
            style={{ borderTop: '1px solid rgba(201,162,39,0.2)' }}
          >
            <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>
              Total XP (no multiplier — 2024 rules)
            </span>
            <span className="font-cinzel text-sm font-bold" style={{ color: '#c9a227' }}>
              {totalXP.toLocaleString()}
            </span>
          </div>

          {/* Overwhelming warning */}
          {overwhelmWarning && (
            <div
              className="rounded px-2 py-1 font-crimson text-xs"
              style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.4)', color: '#c9a227' }}
            >
              Warning: More than 2 monsters per player can be overwhelming at low levels.
            </div>
          )}

          {/* Difficulty bar (2024 Low/Moderate/High/Above High) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span
                className="font-cinzel text-sm uppercase tracking-wider font-bold"
                style={{ color: diffColour }}
              >
                {diffLabel === 'None' ? '—' : diffLabel}
              </span>
              <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.4)' }}>
                {totalXP.toLocaleString()} / {budget.high.toLocaleString()} XP (High)
              </span>
            </div>
            {/* Track */}
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ background: 'rgba(20,10,0,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${barPct}%`,
                  background: `linear-gradient(90deg, #2d8a2d, ${diffColour})`,
                  boxShadow: `0 0 8px ${diffColour}`,
                }}
              />
            </div>
            {/* Labels */}
            <div className="flex justify-between mt-0.5">
              {['Low', 'Moderate', 'High', 'Above High'].map((l) => (
                <span
                  key={l}
                  className="font-cinzel"
                  style={{ color: 'rgba(244,228,188,0.3)', fontSize: 9 }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleLaunch}
              className="flex-1 font-cinzel text-xs py-2 rounded transition-all"
              style={{ background: 'rgba(139,26,26,0.4)', border: '1px solid rgba(139,26,26,0.7)', color: '#ff6b6b', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,26,26,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,26,26,0.4)'; }}
            >
              Launch Encounter
            </button>
            <button
              onClick={handleSave}
              className="flex-1 font-cinzel text-xs py-2 rounded transition-all"
              style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227', cursor: 'pointer' }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

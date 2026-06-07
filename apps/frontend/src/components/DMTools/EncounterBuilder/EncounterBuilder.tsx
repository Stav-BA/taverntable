import React, { useState, useMemo } from 'react';
import { Monster, useDMStore } from '@/stores/dmStore';
import { useSessionStore } from '@/stores/sessionStore';
import { MonsterCard } from './MonsterCard';

export const QUICK_MONSTERS: Monster[] = [
  { slug: 'goblin', name: 'Goblin', cr: 0.25, hp: 7, ac: 15, type: 'humanoid', xp: 50 },
  { slug: 'kobold', name: 'Kobold', cr: 0.125, hp: 5, ac: 12, type: 'humanoid', xp: 25 },
  { slug: 'skeleton', name: 'Skeleton', cr: 0.25, hp: 13, ac: 13, type: 'undead', xp: 50 },
  { slug: 'zombie', name: 'Zombie', cr: 0.25, hp: 22, ac: 8, type: 'undead', xp: 50 },
  { slug: 'wolf', name: 'Wolf', cr: 0.25, hp: 11, ac: 13, type: 'beast', xp: 50 },
  { slug: 'giant-spider', name: 'Giant Spider', cr: 1, hp: 26, ac: 14, type: 'beast', xp: 200 },
  { slug: 'orc', name: 'Orc', cr: 0.5, hp: 15, ac: 13, type: 'humanoid', xp: 100 },
  { slug: 'hobgoblin', name: 'Hobgoblin', cr: 0.5, hp: 11, ac: 18, type: 'humanoid', xp: 100 },
  { slug: 'bugbear', name: 'Bugbear', cr: 1, hp: 27, ac: 16, type: 'humanoid', xp: 200 },
  { slug: 'gnoll', name: 'Gnoll', cr: 0.5, hp: 22, ac: 15, type: 'humanoid', xp: 100 },
  { slug: 'ghoul', name: 'Ghoul', cr: 1, hp: 22, ac: 12, type: 'undead', xp: 200 },
  { slug: 'shadow', name: 'Shadow', cr: 0.5, hp: 16, ac: 12, type: 'undead', xp: 100 },
  { slug: 'wight', name: 'Wight', cr: 3, hp: 45, ac: 14, type: 'undead', xp: 700 },
  { slug: 'bandit', name: 'Bandit', cr: 0.125, hp: 11, ac: 12, type: 'humanoid', xp: 25 },
  { slug: 'bandit-captain', name: 'Bandit Captain', cr: 2, hp: 65, ac: 15, type: 'humanoid', xp: 450 },
  { slug: 'cultist', name: 'Cultist', cr: 0.125, hp: 9, ac: 12, type: 'humanoid', xp: 25 },
  { slug: 'cult-fanatic', name: 'Cult Fanatic', cr: 2, hp: 33, ac: 13, type: 'humanoid', xp: 450 },
  { slug: 'ogre', name: 'Ogre', cr: 2, hp: 59, ac: 11, type: 'giant', xp: 450 },
  { slug: 'troll', name: 'Troll', cr: 5, hp: 84, ac: 15, type: 'giant', xp: 1800 },
  { slug: 'hill-giant', name: 'Hill Giant', cr: 5, hp: 105, ac: 13, type: 'giant', xp: 1800 },
  { slug: 'owlbear', name: 'Owlbear', cr: 3, hp: 59, ac: 13, type: 'monstrosity', xp: 700 },
  { slug: 'manticore', name: 'Manticore', cr: 3, hp: 68, ac: 14, type: 'monstrosity', xp: 700 },
  { slug: 'basilisk', name: 'Basilisk', cr: 3, hp: 52, ac: 15, type: 'monstrosity', xp: 700 },
  { slug: 'medusa', name: 'Medusa', cr: 6, hp: 127, ac: 15, type: 'monstrosity', xp: 2300 },
  { slug: 'vampire-spawn', name: 'Vampire Spawn', cr: 5, hp: 82, ac: 15, type: 'undead', xp: 1800 },
  { slug: 'vampire', name: 'Vampire', cr: 13, hp: 144, ac: 16, type: 'undead', xp: 10000 },
  { slug: 'young-dragon', name: 'Young Red Dragon', cr: 10, hp: 178, ac: 18, type: 'dragon', xp: 5900 },
  { slug: 'adult-dragon', name: 'Adult Red Dragon', cr: 17, hp: 256, ac: 19, type: 'dragon', xp: 18000 },
  { slug: 'beholder', name: 'Beholder', cr: 13, hp: 180, ac: 18, type: 'aberration', xp: 10000 },
  { slug: 'mind-flayer', name: 'Mind Flayer', cr: 7, hp: 71, ac: 15, type: 'aberration', xp: 2900 },
];

const XP_THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1:  { easy: 25,   medium: 50,   hard: 75,   deadly: 100 },
  2:  { easy: 50,   medium: 100,  hard: 150,  deadly: 200 },
  3:  { easy: 75,   medium: 150,  hard: 225,  deadly: 400 },
  4:  { easy: 125,  medium: 250,  hard: 375,  deadly: 500 },
  5:  { easy: 250,  medium: 500,  hard: 750,  deadly: 1100 },
  6:  { easy: 300,  medium: 600,  hard: 900,  deadly: 1400 },
  7:  { easy: 350,  medium: 750,  hard: 1100, deadly: 1700 },
  8:  { easy: 450,  medium: 900,  hard: 1400, deadly: 2100 },
  9:  { easy: 550,  medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600,  medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800,  medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

const ALL_TYPES = Array.from(new Set(QUICK_MONSTERS.map((m) => m.type))).sort();

function getDifficulty(totalXP: number, partyThresholds: { easy: number; medium: number; hard: number; deadly: number }) {
  if (totalXP === 0) return { label: 'None', colour: '#555', pct: 0 };
  if (totalXP < partyThresholds.easy) return { label: 'Trivial', colour: '#27ae60', pct: (totalXP / partyThresholds.easy) * 20 };
  if (totalXP < partyThresholds.medium) return { label: 'Easy', colour: '#2ecc71', pct: 20 + ((totalXP - partyThresholds.easy) / (partyThresholds.medium - partyThresholds.easy)) * 20 };
  if (totalXP < partyThresholds.hard) return { label: 'Medium', colour: '#f39c12', pct: 40 + ((totalXP - partyThresholds.medium) / (partyThresholds.hard - partyThresholds.medium)) * 20 };
  if (totalXP < partyThresholds.deadly) return { label: 'Hard', colour: '#e67e22', pct: 60 + ((totalXP - partyThresholds.hard) / (partyThresholds.deadly - partyThresholds.hard)) * 20 };
  return { label: 'Deadly', colour: '#e74c3c', pct: Math.min(100, 80 + ((totalXP - partyThresholds.deadly) / partyThresholds.deadly) * 20) };
}

export function EncounterBuilder() {
  const { encounterMonsters, addToEncounter, removeFromEncounter, setCount, clearEncounter, addJournalEntry, currentSession } = useDMStore();
  const connectedPlayers = useSessionStore((s) => s.connectedPlayers);

  const [search, setSearch] = useState('');
  const [crMax, setCrMax] = useState(30);
  const [filterType, setFilterType] = useState('all');
  const [partyLevels, setPartyLevels] = useState<Record<string, number>>({});

  const partyMembers = connectedPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    level: partyLevels[p.id] ?? 1,
  }));

  const partyThresholds = useMemo(() => {
    const totals = { easy: 0, medium: 0, hard: 0, deadly: 0 };
    partyMembers.forEach(({ level }) => {
      const l = Math.max(1, Math.min(20, level));
      const t = XP_THRESHOLDS[l];
      totals.easy += t.easy;
      totals.medium += t.medium;
      totals.hard += t.hard;
      totals.deadly += t.deadly;
    });
    return totals;
  }, [partyMembers]);

  const filteredMonsters = QUICK_MONSTERS.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (m.cr > crMax) return false;
    if (filterType !== 'all' && m.type !== filterType) return false;
    return true;
  });

  const totalXP = encounterMonsters.reduce((sum, e) => sum + e.monster.xp * e.count, 0);
  const totalCount = encounterMonsters.reduce((sum, e) => sum + e.count, 0);

  // Multiplier per D&D 5e rules
  const multiplier = totalCount <= 1 ? 1 : totalCount <= 2 ? 1.5 : totalCount <= 6 ? 2 : totalCount <= 10 ? 2.5 : totalCount <= 14 ? 3 : 4;
  const adjustedXP = Math.round(totalXP * multiplier);

  const difficulty = getDifficulty(adjustedXP, partyThresholds);

  const handleLaunch = () => {
    const monsterList = encounterMonsters.map((e) => `${e.count}x ${e.monster.name}`).join(', ');
    addJournalEntry({
      sessionNumber: currentSession,
      title: 'Encounter Launched',
      body: `Encounter started: ${monsterList}. Total XP: ${totalXP} (adjusted: ${adjustedXP}). Difficulty: ${difficulty.label}.`,
      tags: ['combat'],
      characterTags: [],
    });
    // Would emit encounter:launch socket event in real implementation
    console.log('[Encounter] Launched:', encounterMonsters);
  };

  const handleSave = () => {
    const monsterList = encounterMonsters.map((e) => `${e.count}x ${e.monster.name}`).join(', ');
    addJournalEntry({
      sessionNumber: currentSession,
      title: 'Encounter Saved',
      body: `Saved encounter: ${monsterList}. Total XP: ${totalXP} (adjusted: ${adjustedXP}). Difficulty: ${difficulty.label}.`,
      tags: ['combat'],
      characterTags: [],
    });
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Party section */}
      <div className="rounded p-3" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.2)' }}>
        <p className="font-cinzel text-xs uppercase tracking-wider mb-2" style={{ color: '#c9a227' }}>Party</p>
        {partyMembers.length === 0 ? (
          <p className="font-crimson text-xs italic" style={{ color: 'rgba(244,228,188,0.4)' }}>No players connected</p>
        ) : (
          <div className="flex flex-col gap-1">
            {partyMembers.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="font-crimson text-sm" style={{ color: '#f4e4bc' }}>{p.name}</span>
                <div className="flex items-center gap-1">
                  <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>Lv.</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={p.level}
                    onChange={(e) => setPartyLevels((prev) => ({ ...prev, [p.id]: parseInt(e.target.value) || 1 }))}
                    className="w-10 text-center font-cinzel text-xs rounded px-1 py-0.5"
                    style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monster search */}
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
            <label className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>CR max: {crMax === 30 ? '30' : crMax}</label>
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

      {/* Monster results */}
      <div
        className="flex flex-col gap-1 overflow-y-auto rounded p-2"
        style={{ maxHeight: 200, background: 'rgba(20,10,0,0.4)', border: '1px solid rgba(201,162,39,0.15)' }}
      >
        {filteredMonsters.length === 0 ? (
          <p className="text-center font-crimson italic text-xs py-2" style={{ color: 'rgba(244,228,188,0.4)' }}>No monsters match</p>
        ) : (
          filteredMonsters.map((m) => (
            <MonsterCard key={m.slug} monster={m} onAdd={addToEncounter} compact />
          ))
        )}
      </div>

      {/* Active encounter */}
      {encounterMonsters.length > 0 && (
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}>
          <div className="flex items-center justify-between">
            <p className="font-cinzel text-xs uppercase tracking-wider" style={{ color: '#c9a227' }}>Active Encounter</p>
            <button
              onClick={clearEncounter}
              className="font-cinzel text-xs px-2 py-0.5 rounded"
              style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(139,26,26,0.4)', color: '#c0392b', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>

          {encounterMonsters.map(({ monster, count }) => (
            <div key={monster.slug} className="flex items-center gap-2">
              <span className="font-crimson text-sm flex-1 truncate" style={{ color: '#f4e4bc' }}>{monster.name}</span>
              <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.4)' }}>{monster.xp * count} XP</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCount(monster.slug, count - 1)}
                  className="w-5 h-5 rounded font-cinzel text-xs"
                  style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc', cursor: 'pointer' }}
                >−</button>
                <span className="font-cinzel text-xs w-4 text-center" style={{ color: '#c9a227' }}>{count}</span>
                <button
                  onClick={() => setCount(monster.slug, count + 1)}
                  className="w-5 h-5 rounded font-cinzel text-xs"
                  style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc', cursor: 'pointer' }}
                >+</button>
              </div>
              <button
                onClick={() => removeFromEncounter(monster.slug)}
                className="font-cinzel text-xs w-5 h-5 rounded"
                style={{ color: 'rgba(139,26,26,0.8)', cursor: 'pointer' }}
              >✕</button>
            </div>
          ))}

          <div className="flex justify-between items-baseline mt-1 pt-2" style={{ borderTop: '1px solid rgba(201,162,39,0.2)' }}>
            <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>
              Base: {totalXP} XP (×{multiplier} = {adjustedXP})
            </span>
          </div>

          {/* Difficulty bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-cinzel text-xs uppercase tracking-wider" style={{ color: difficulty.colour }}>
                {difficulty.label}
              </span>
              <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.4)' }}>
                {adjustedXP.toLocaleString()} XP
              </span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden relative"
              style={{
                background: 'linear-gradient(90deg, #27ae60 0%, #2ecc71 20%, #f39c12 40%, #e67e22 60%, #e74c3c 80%, #8b0000 100%)',
                opacity: 0.4,
              }}
            />
            <div
              className="h-3 rounded-full overflow-hidden relative -mt-3"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${difficulty.pct}%`,
                  background: `linear-gradient(90deg, #27ae60, ${difficulty.colour})`,
                  boxShadow: `0 0 8px ${difficulty.colour}`,
                }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              {['Trivial', 'Easy', 'Medium', 'Hard', 'Deadly'].map((l) => (
                <span key={l} className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.3)', fontSize: 9 }}>{l}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={handleLaunch}
              className="flex-1 font-cinzel text-xs py-2 rounded transition-all"
              style={{ background: 'rgba(139,26,26,0.4)', border: '1px solid rgba(139,26,26,0.7)', color: '#ff6b6b', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,26,26,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,26,26,0.4)'; }}
            >
              ⚔️ Launch Encounter
            </button>
            <button
              onClick={handleSave}
              className="flex-1 font-cinzel text-xs py-2 rounded transition-all"
              style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227', cursor: 'pointer' }}
            >
              💾 Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

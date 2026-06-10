import React, { useState, useMemo } from 'react';
import { MONSTERS, Monster, getAppropriateMonsters, crToNumber } from '@/lib/monsters';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSocket } from '@/hooks/useSocket';

const BIOME_OPTIONS = [
  { value: 'any',       label: 'Any' },
  { value: 'tavern',    label: 'Tavern' },
  { value: 'dungeon',   label: 'Dungeon' },
  { value: 'cave',      label: 'Cave' },
  { value: 'forest',    label: 'Forest' },
  { value: 'mountain',  label: 'Mountain' },
  { value: 'swamp',     label: 'Swamp' },
  { value: 'underdark', label: 'Underdark' },
  { value: 'arctic',    label: 'Arctic' },
  { value: 'desert',    label: 'Desert' },
  { value: 'coastal',   label: 'Coastal' },
];

function crLabel(cr: string): string {
  return `CR ${cr}`;
}

interface Props {
  partyLevel?: number;
}

export function MonsterSpawner({ partyLevel = 1 }: Props) {
  const socket = useSocket();
  const sessionId = useSessionStore((s) => s.sessionId);
  const tokens = useGameStore((s) => s.tokens);
  const currentMap = useGameStore((s) => s.currentMap);

  const [search, setSearch] = useState('');
  const [biomeFilter, setBiomeFilter] = useState('any');
  const [crFilter, setCrFilter] = useState('all');
  const [appropriateOnly, setAppropriateOnly] = useState(false);
  const [selected, setSelected] = useState<Monster | null>(null);

  // Random encounter state
  const [encounterEnabled, setEncounterEnabled] = useState(false);
  const [encounterBiome, setEncounterBiome] = useState('forest');

  function toggleRandomEncounter(enabled: boolean) {
    if (!socket || !sessionId) return;
    setEncounterEnabled(enabled);
    socket.emit('random:encounter:toggle', { sessionId, enabled, biome: encounterBiome, partyLevel });
  }

  function triggerRandomEncounter() {
    if (!socket || !sessionId) return;
    const { x, y } = findEmptyCell();
    socket.emit('random:encounter:trigger', { sessionId, x, y });
  }

  const filtered = useMemo(() => {
    let list = appropriateOnly ? getAppropriateMonsters(partyLevel, biomeFilter) : MONSTERS;

    if (biomeFilter !== 'any' && !appropriateOnly) {
      list = list.filter((m) => m.biomes.includes(biomeFilter as Monster['biomes'][0]) || m.biomes.includes('any'));
    }

    if (crFilter !== 'all') {
      const maxCR = parseFloat(crFilter);
      list = list.filter((m) => crToNumber(m.cr) <= maxCR);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.type.includes(q));
    }

    return list;
  }, [search, biomeFilter, crFilter, appropriateOnly, partyLevel]);

  function findEmptyCell(): { x: number; y: number } {
    const cols = currentMap?.gridCols ?? 20;
    const rows = currentMap?.gridRows ?? 16;
    const used = new Set(tokens.map((t) => `${t.x},${t.y}`));
    let x = Math.floor(Math.random() * cols);
    let y = Math.floor(Math.random() * rows);
    for (let i = 0; i < 30; i++) {
      if (!used.has(`${x},${y}`)) break;
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
    }
    return { x, y };
  }

  function spawnMonster(monster: Monster) {
    if (!socket || !sessionId) return;
    const { x, y } = findEmptyCell();
    const tokenId = `monster-${monster.id}-${Date.now()}`;
    socket.emit('monster:spawn', {
      sessionId,
      monster: {
        id: monster.id,
        tokenId,
        name: monster.name,
        emoji: monster.emoji,
        imageUrl: `emoji:${monster.emoji}`,
        hp: monster.hp,
        maxHp: monster.hp,
        ac: monster.ac,
        speed: monster.speed,
        cr: monster.cr,
        colour: monster.colour,
        x,
        y,
      },
    });
  }

  const gold = '#c9a227';
  const bg = 'rgba(10,8,5,0.95)';
  const surface = 'rgba(255,255,255,0.04)';
  const border = 'rgba(201,162,39,0.2)';

  return (
    <div className="flex flex-col gap-3" style={{ color: '#f4e4bc' }}>
      {/* Controls */}
      <div className="flex flex-col gap-2">
        <input
          placeholder="Search monsters…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: surface, border: `1px solid ${border}`, borderRadius: 6,
            padding: '5px 8px', color: '#f4e4bc', fontSize: 12, outline: 'none', width: '100%',
          }}
        />
        <div className="flex gap-2">
          <select
            value={biomeFilter}
            onChange={(e) => setBiomeFilter(e.target.value)}
            style={{
              flex: 1, background: '#1a1408', border: `1px solid ${border}`, borderRadius: 6,
              padding: '4px 6px', color: '#f4e4bc', fontSize: 11,
            }}
          >
            {BIOME_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <select
            value={crFilter}
            onChange={(e) => setCrFilter(e.target.value)}
            style={{
              flex: 1, background: '#1a1408', border: `1px solid ${border}`, borderRadius: 6,
              padding: '4px 6px', color: '#f4e4bc', fontSize: 11,
            }}
          >
            <option value="all">All CR</option>
            <option value="0.125">≤ 1/8</option>
            <option value="0.25">≤ 1/4</option>
            <option value="0.5">≤ 1/2</option>
            <option value="1">≤ 1</option>
            <option value="2">≤ 2</option>
            <option value="4">≤ 4</option>
            <option value="8">≤ 8</option>
            <option value="13">≤ 13</option>
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={appropriateOnly}
            onChange={(e) => setAppropriateOnly(e.target.checked)}
            style={{ accentColor: gold }}
          />
          Party-appropriate only (lvl {partyLevel})
        </label>
      </div>

      {/* Monster list */}
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <p style={{ fontSize: 11, color: 'rgba(244,228,188,0.4)', textAlign: 'center', padding: '1rem' }}>
            No monsters match filters
          </p>
        )}
        {filtered.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(selected?.id === m.id ? null : m)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
              background: selected?.id === m.id ? 'rgba(201,162,39,0.12)' : 'transparent',
              border: `1px solid ${selected?.id === m.id ? gold : 'transparent'}`,
              borderRadius: 6, padding: '5px 8px', cursor: 'pointer', marginBottom: 2,
              color: '#f4e4bc', fontSize: 12,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{m.emoji}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{m.name}</span>
            <span style={{ fontSize: 10, color: gold, opacity: 0.8 }}>{crLabel(m.cr)}</span>
            <span style={{ fontSize: 10, color: 'rgba(244,228,188,0.5)', textTransform: 'capitalize' }}>{m.type}</span>
          </button>
        ))}
      </div>

      {/* Selected monster detail + spawn */}
      {selected && (
        <div style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{selected.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: gold }}>{selected.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(244,228,188,0.6)' }}>
                {selected.size} {selected.type} · {crLabel(selected.cr)} · {selected.xp} XP
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 12px', fontSize: 11, marginBottom: 8 }}>
            <StatPill label="AC" value={selected.ac} />
            <StatPill label="HP" value={selected.hp} />
            <StatPill label="Speed" value={`${selected.speed}ft`} />
            <StatPill label="STR" value={selected.str} />
            <StatPill label="DEX" value={selected.dex} />
            <StatPill label="CON" value={selected.con} />
            <StatPill label="INT" value={selected.int} />
            <StatPill label="WIS" value={selected.wis} />
            <StatPill label="CHA" value={selected.cha} />
          </div>

          {/* Actions summary */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: gold, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>Actions</div>
            {selected.actions.map((a) => (
              <div key={a.name} style={{ fontSize: 10, color: 'rgba(244,228,188,0.75)', marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: '#f4e4bc' }}>{a.name}.</span> {a.description}
              </div>
            ))}
          </div>

          {/* Traits summary */}
          {selected.traits && selected.traits.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: gold, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>Traits</div>
              {selected.traits.map((t) => (
                <div key={t.name} style={{ fontSize: 10, color: 'rgba(244,228,188,0.75)', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, color: '#f4e4bc', fontStyle: 'italic' }}>{t.name}.</span> {t.description}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => spawnMonster(selected)}
            style={{
              width: '100%', padding: '7px 0', background: 'linear-gradient(135deg, #8B0000, #c9a227)',
              border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', letterSpacing: 1,
            }}
          >
            ⚔️ Spawn on Map
          </button>
        </div>
      )}

      <RandomEncounterSection
        encounterEnabled={encounterEnabled}
        encounterBiome={encounterBiome}
        setEncounterBiome={setEncounterBiome}
        toggleRandomEncounter={toggleRandomEncounter}
        triggerRandomEncounter={triggerRandomEncounter}
      />
    </div>
  );
}

function RandomEncounterSection({ encounterEnabled, encounterBiome, setEncounterBiome, toggleRandomEncounter, triggerRandomEncounter }: {
  encounterEnabled: boolean;
  encounterBiome: string;
  setEncounterBiome: (b: string) => void;
  toggleRandomEncounter: (e: boolean) => void;
  triggerRandomEncounter: () => void;
}) {
  const gold = '#c9a227';
  const border = 'rgba(201,162,39,0.2)';

  return (
    <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10, marginTop: 4 }}>
      <div style={{ fontSize: 10, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        🎲 Random Encounters
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <select
          value={encounterBiome}
          onChange={(e) => {
            setEncounterBiome(e.target.value);
            if (encounterEnabled) toggleRandomEncounter(true);
          }}
          style={{
            flex: 1, background: '#1a1408', border: `1px solid ${border}`, borderRadius: 6,
            padding: '4px 6px', color: '#f4e4bc', fontSize: 11,
          }}
        >
          {[
            ['forest','Forest'],['cave','Cave'],['dungeon','Dungeon'],
            ['mountain','Mountain'],['swamp','Swamp'],['underdark','Underdark'],
            ['arctic','Arctic'],['desert','Desert'],['coastal','Coastal'],
          ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11 }}>
          <input
            type="checkbox"
            checked={encounterEnabled}
            onChange={(e) => toggleRandomEncounter(e.target.checked)}
            style={{ accentColor: gold, width: 14, height: 14 }}
          />
          Auto
        </label>
      </div>

      <button
        onClick={triggerRandomEncounter}
        style={{
          width: '100%', padding: '6px 0', background: encounterEnabled ? 'rgba(139,0,0,0.7)' : 'rgba(201,162,39,0.15)',
          border: `1px solid ${encounterEnabled ? '#8B0000' : border}`,
          borderRadius: 6, color: '#f4e4bc', fontWeight: 600, fontSize: 11,
          cursor: 'pointer', letterSpacing: 0.5,
        }}
      >
        ⚡ Trigger Random Encounter Now
      </button>

      {encounterEnabled && (
        <p style={{ fontSize: 9, color: 'rgba(244,228,188,0.45)', marginTop: 4, textAlign: 'center' }}>
          Auto-spawns biome-appropriate monsters when fog is revealed
        </p>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(201,162,39,0.1)', paddingBottom: 2 }}>
      <span style={{ color: 'rgba(244,228,188,0.5)', fontSize: 10 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 11 }}>{value}</span>
    </div>
  );
}

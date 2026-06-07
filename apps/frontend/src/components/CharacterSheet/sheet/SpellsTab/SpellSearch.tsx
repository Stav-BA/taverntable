/**
 * SpellSearch — Search SRD spells by name/level/school and add to sheet
 */

import React, { useState, useMemo } from 'react';
import type { Spell } from '../../types';

interface SpellSearchProps {
  onAdd: (spell: Spell) => void;
  knownSpellIds: string[];
}

// Compact SRD spell list for the picker
const SRD_SPELLS: Spell[] = [
  // Cantrips (level 0)
  { id: 'fire-bolt', name: 'Fire Bolt', level: 0, school: 'Evocation', castingTime: '1 Action', range: '120 ft.', components: 'V, S', duration: 'Instantaneous', description: 'Hurl a mote of fire at a creature or object. Make a ranged spell attack. On a hit, the target takes 1d10 fire damage.', prepared: true },
  { id: 'prestidigitation', name: 'Prestidigitation', level: 0, school: 'Transmutation', castingTime: '1 Action', range: '10 ft.', components: 'V, S', duration: 'Up to 1 hour', description: 'A minor magical trick that novice spellcasters use for practice.', prepared: true },
  { id: 'sacred-flame', name: 'Sacred Flame', level: 0, school: 'Evocation', castingTime: '1 Action', range: '60 ft.', components: 'V, S', duration: 'Instantaneous', description: 'Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dex saving throw or take 1d8 radiant damage.', prepared: true },
  { id: 'eldritch-blast', name: 'Eldritch Blast', level: 0, school: 'Evocation', castingTime: '1 Action', range: '120 ft.', components: 'V, S', duration: 'Instantaneous', description: 'A beam of crackling energy streaks toward a creature. Make a ranged spell attack. On a hit, the target takes 1d10 force damage.', prepared: true },
  { id: 'vicious-mockery', name: 'Vicious Mockery', level: 0, school: 'Enchantment', castingTime: '1 Action', range: '60 ft.', components: 'V', duration: 'Instantaneous', description: 'You unleash a string of insults laced with subtle enchantments. The creature must succeed on a Wisdom saving throw or take 1d4 psychic damage and have disadvantage on the next attack roll.', prepared: true },
  { id: 'minor-illusion', name: 'Minor Illusion', level: 0, school: 'Illusion', castingTime: '1 Action', range: '30 ft.', components: 'S, M', duration: '1 minute', description: 'Create a sound or an image of an object within range that lasts for the duration.', prepared: true },
  { id: 'guidance', name: 'Guidance', level: 0, school: 'Divination', castingTime: '1 Action', range: 'Touch', components: 'V, S', duration: 'Concentration, 1 minute', description: 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check.', prepared: true, concentration: true },
  // Level 1
  { id: 'magic-missile', name: 'Magic Missile', level: 1, school: 'Evocation', castingTime: '1 Action', range: '120 ft.', components: 'V, S', duration: 'Instantaneous', description: 'Three glowing darts of magical force. Each dart hits a creature of your choice within range for 1d4+1 force damage.', prepared: false },
  { id: 'cure-wounds', name: 'Cure Wounds', level: 1, school: 'Evocation', castingTime: '1 Action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.', prepared: false },
  { id: 'shield', name: 'Shield', level: 1, school: 'Abjuration', castingTime: '1 Reaction', range: 'Self', components: 'V, S', duration: '1 round', description: 'An invisible barrier of magical force appears and protects you. +5 bonus to AC until the start of your next turn, including against the triggering attack.', prepared: false },
  { id: 'burning-hands', name: 'Burning Hands', level: 1, school: 'Evocation', castingTime: '1 Action', range: 'Self (15-ft cone)', components: 'V, S', duration: 'Instantaneous', description: 'Each creature in a 15-foot cone must make a Dex saving throw, taking 3d6 fire damage on a failed save, or half on a success.', prepared: false },
  { id: 'sleep', name: 'Sleep', level: 1, school: 'Enchantment', castingTime: '1 Action', range: '90 ft.', components: 'V, S, M', duration: '1 minute', description: 'Roll 5d8; the total is how many hit points of creatures this spell can affect. Starting with the creature with the lowest current HP, each creature falls unconscious.', prepared: false },
  { id: 'thunderwave', name: 'Thunderwave', level: 1, school: 'Evocation', castingTime: '1 Action', range: 'Self (15-ft cube)', components: 'V, S', duration: 'Instantaneous', description: 'Each creature in a 15-foot cube emanating from you must make a Constitution saving throw, taking 2d8 thunder damage on a failed save.', prepared: false },
  { id: 'healing-word', name: 'Healing Word', level: 1, school: 'Evocation', castingTime: '1 Bonus Action', range: '60 ft.', components: 'V', duration: 'Instantaneous', description: 'A creature of your choice regains hit points equal to 1d4 + your spellcasting ability modifier.', prepared: false },
  { id: 'hex', name: 'Hex', level: 1, school: 'Enchantment', castingTime: '1 Bonus Action', range: '90 ft.', components: 'V, S, M', duration: 'Concentration, 1 hour', description: 'Place a curse on a creature. Until the spell ends, you deal an extra 1d6 necrotic damage whenever you hit the cursed target.', prepared: false, concentration: true },
  // Level 2
  { id: 'misty-step', name: 'Misty Step', level: 2, school: 'Conjuration', castingTime: '1 Bonus Action', range: 'Self', components: 'V', duration: 'Instantaneous', description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.', prepared: false },
  { id: 'hold-person', name: 'Hold Person', level: 2, school: 'Enchantment', castingTime: '1 Action', range: '60 ft.', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'Choose a humanoid. The target must succeed on a Wisdom saving throw or be paralyzed for the duration.', prepared: false, concentration: true },
  { id: 'scorching-ray', name: 'Scorching Ray', level: 2, school: 'Evocation', castingTime: '1 Action', range: '120 ft.', components: 'V, S', duration: 'Instantaneous', description: 'Create three rays of fire and hurl them at targets. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage.', prepared: false },
  { id: 'invisibility', name: 'Invisibility', level: 2, school: 'Illusion', castingTime: '1 Action', range: 'Touch', components: 'V, S, M', duration: 'Concentration, 1 hour', description: 'A creature you touch becomes invisible until the spell ends.', prepared: false, concentration: true },
  // Level 3
  { id: 'fireball', name: 'Fireball', level: 3, school: 'Evocation', castingTime: '1 Action', range: '150 ft.', components: 'V, S, M', duration: 'Instantaneous', description: 'A bright streak of light explodes with a low roar into an explosion of flame. Each creature in a 20-foot radius sphere must make a Dex save. On a failed save, a creature takes 8d6 fire damage.', prepared: false },
  { id: 'counterspell', name: 'Counterspell', level: 3, school: 'Abjuration', castingTime: '1 Reaction', range: '60 ft.', components: 'S', duration: 'Instantaneous', description: 'Attempt to interrupt a creature in the process of casting a spell. If the spell is 3rd level or lower, it fails automatically.', prepared: false },
  { id: 'fly', name: 'Fly', level: 3, school: 'Transmutation', castingTime: '1 Action', range: 'Touch', components: 'V, S, M', duration: 'Concentration, 10 minutes', description: 'A willing creature you touch gains a flying speed of 60 feet for the duration.', prepared: false, concentration: true },
  // Level 4
  { id: 'banishment', name: 'Banishment', level: 4, school: 'Abjuration', castingTime: '1 Action', range: '60 ft.', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'Attempt to send one creature you can see within range to another plane of existence.', prepared: false, concentration: true },
  { id: 'polymorph', name: 'Polymorph', level: 4, school: 'Transmutation', castingTime: '1 Action', range: '60 ft.', components: 'V, S, M', duration: 'Concentration, 1 hour', description: 'Transform a creature into a new form. The creature must make a Wisdom saving throw or be transformed into a beast.', prepared: false, concentration: true },
  // Level 5
  { id: 'hold-monster', name: 'Hold Monster', level: 5, school: 'Enchantment', castingTime: '1 Action', range: '90 ft.', components: 'V, S, M', duration: 'Concentration, 1 minute', description: 'Choose a creature you can see and attempt to freeze it in place. The target must succeed on a Wisdom saving throw or be paralyzed.', prepared: false, concentration: true },
  { id: 'mass-cure-wounds', name: 'Mass Cure Wounds', level: 5, school: 'Evocation', castingTime: '1 Action', range: '60 ft.', components: 'V, S', duration: 'Instantaneous', description: 'A wave of healing energy washes out from a point of your choice. Choose up to six creatures in a 30-foot radius sphere. Each target regains 3d8 + spellcasting ability modifier hit points.', prepared: false },
];

const SCHOOL_OPTIONS = ['All', 'Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

export default function SpellSearch({ onAdd, knownSpellIds }: SpellSearchProps) {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [schoolFilter, setSchoolFilter] = useState('All');

  const results = useMemo(() => {
    return SRD_SPELLS.filter(spell => {
      const matchesQuery = spell.name.toLowerCase().includes(query.toLowerCase());
      const matchesLevel = levelFilter === 'all' || spell.level === levelFilter;
      const matchesSchool = schoolFilter === 'All' || spell.school === schoolFilter;
      return matchesQuery && matchesLevel && matchesSchool;
    });
  }, [query, levelFilter, schoolFilter]);

  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 10 }}>
        ADD SPELLS
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name..."
          style={{
            flex: '1 1 140px', padding: '6px 10px',
            border: '2px solid #2D1B00', borderRadius: 4,
            fontFamily: "'Crimson Text', serif", fontSize: 14,
            background: '#FFF8E7', color: '#2D1B00',
          }}
        />
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          style={{
            padding: '6px 8px', border: '2px solid #2D1B00', borderRadius: 4,
            background: '#FFF8E7', color: '#2D1B00',
            fontFamily: "'Cinzel', serif", fontSize: 12,
          }}
        >
          <option value="all">All Levels</option>
          {[0,1,2,3,4,5,6,7,8,9].map(l => (
            <option key={l} value={l}>{l === 0 ? 'Cantrip' : `Level ${l}`}</option>
          ))}
        </select>
        <select
          value={schoolFilter}
          onChange={e => setSchoolFilter(e.target.value)}
          style={{
            padding: '6px 8px', border: '2px solid #2D1B00', borderRadius: 4,
            background: '#FFF8E7', color: '#2D1B00',
            fontFamily: "'Cinzel', serif", fontSize: 12,
          }}
        >
          {SCHOOL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {results.slice(0, 20).map(spell => {
          const isKnown = knownSpellIds.includes(spell.id);
          return (
            <div
              key={spell.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px', background: '#F4E4BC',
                border: '1px solid #2D1B0033', borderRadius: 4,
                opacity: isKnown ? 0.5 : 1,
              }}
            >
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, flex: 1, color: '#2D1B00' }}>
                {spell.name}
              </span>
              <span style={{ fontSize: 11, color: '#5A3E1B', minWidth: 60 }}>
                {spell.level === 0 ? 'Cantrip' : `Lvl ${spell.level}`} · {spell.school}
              </span>
              {spell.concentration && <span style={{ fontSize: 10, color: '#1A3A6B' }}>C</span>}
              {spell.ritual && <span style={{ fontSize: 10, color: '#4A148C' }}>R</span>}
              <button
                onClick={() => !isKnown && onAdd({ ...spell })}
                disabled={isKnown}
                style={{
                  background: isKnown ? '#EDD9A3' : '#C9A227',
                  color: isKnown ? '#8B6914' : '#2D1B00',
                  border: '1px solid #2D1B00', borderRadius: 4,
                  padding: '3px 10px', cursor: isKnown ? 'default' : 'pointer',
                  fontSize: 12, fontFamily: "'Cinzel', serif",
                }}
              >
                {isKnown ? '✓ Known' : '+ Add'}
              </button>
            </div>
          );
        })}
        {results.length === 0 && (
          <div style={{ color: '#8B6914', fontStyle: 'italic', textAlign: 'center', padding: 12 }}>
            No spells found
          </div>
        )}
      </div>
    </div>
  );
}

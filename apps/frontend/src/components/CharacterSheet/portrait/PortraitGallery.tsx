/**
 * PortraitGallery — Grid of illustrated portraits by species/class
 */

import React, { useState } from 'react';

interface PortraitGalleryProps {
  species?: string;
  className?: string;
  onSelect: (url: string) => void;
  selected?: string;
}

interface PortraitEntry {
  id: string;
  emoji: string;
  label: string;
  species: string[];
  classes: string[];
  placeholder: string; // colour for placeholder box
}

const PORTRAITS: PortraitEntry[] = [
  { id: 'human-fighter-1', emoji: '⚔️', label: 'Grizzled Warrior', species: ['Human'], classes: ['Fighter', 'Paladin'], placeholder: '#5A3E1B' },
  { id: 'elf-wizard-1', emoji: '🧙', label: 'Elven Sage', species: ['Elf', 'Half-Elf'], classes: ['Wizard', 'Sorcerer'], placeholder: '#1A3A6B' },
  { id: 'halfling-rogue-1', emoji: '🗡️', label: 'Nimble Trickster', species: ['Halfling'], classes: ['Rogue', 'Bard'], placeholder: '#2D5016' },
  { id: 'dwarf-cleric-1', emoji: '✨', label: 'Dwarven Priest', species: ['Dwarf'], classes: ['Cleric', 'Paladin'], placeholder: '#8B4513' },
  { id: 'half-orc-barbarian-1', emoji: '🪓', label: 'Orcish Berserker', species: ['Half-Orc'], classes: ['Barbarian', 'Fighter'], placeholder: '#4A6741' },
  { id: 'tiefling-warlock-1', emoji: '👁️', label: 'Infernal Patron', species: ['Tiefling'], classes: ['Warlock', 'Sorcerer'], placeholder: '#6B1A1A' },
  { id: 'gnome-bard-1', emoji: '🎵', label: 'Gnomish Troubadour', species: ['Gnome'], classes: ['Bard', 'Wizard'], placeholder: '#4A3A6B' },
  { id: 'dragonborn-paladin-1', emoji: '🐉', label: 'Draconic Knight', species: ['Dragonborn'], classes: ['Paladin', 'Fighter', 'Barbarian'], placeholder: '#8B4513' },
  { id: 'half-elf-ranger-1', emoji: '🏹', label: 'Forest Wanderer', species: ['Half-Elf', 'Elf'], classes: ['Ranger', 'Druid'], placeholder: '#2D4A1A' },
  { id: 'human-monk-1', emoji: '👊', label: 'Ascetic Warrior', species: ['Human'], classes: ['Monk'], placeholder: '#5A4A2D' },
  { id: 'druid-nature-1', emoji: '🌳', label: 'Nature Caller', species: ['Human', 'Elf', 'Halfling'], classes: ['Druid'], placeholder: '#2D5016' },
  { id: 'generic-adventurer-1', emoji: '🌟', label: 'The Adventurer', species: [], classes: [], placeholder: '#2D1B00' },
];

export default function PortraitGallery({ species, className, onSelect, selected }: PortraitGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'matching'>('matching');

  const matches = PORTRAITS.filter(p => {
    if (filter === 'all') return true;
    const speciesMatch = !species || p.species.length === 0 || p.species.includes(species);
    const classMatch = !className || p.classes.length === 0 || p.classes.includes(className);
    return speciesMatch || classMatch;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['matching', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? '#2D1B00' : '#EDD9A3',
              color: filter === f ? '#C9A227' : '#5A3E1B',
              border: '2px solid #2D1B00', borderRadius: 6,
              padding: '5px 14px', cursor: 'pointer',
              fontFamily: "'Cinzel', serif", fontSize: 12,
            }}
          >
            {f === 'matching' ? `Matching ${species || ''}` : 'All Portraits'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {matches.map(portrait => {
          const isSelected = selected === portrait.id;
          return (
            <div
              key={portrait.id}
              onClick={() => onSelect(portrait.id)}
              style={{
                border: `3px solid ${isSelected ? '#C9A227' : '#2D1B00'}`,
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
                background: portrait.placeholder,
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: isSelected ? '0 0 0 2px #C9A227' : 'none',
                transform: isSelected ? 'scale(1.04)' : 'none',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 40 }}>{portrait.emoji}</div>
              <div style={{
                fontSize: 11, color: '#F4E4BC',
                fontFamily: "'Cinzel', serif",
                textAlign: 'center', padding: '0 4px',
              }}>
                {portrait.label}
              </div>
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  background: '#C9A227', color: '#2D1B00',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>✓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

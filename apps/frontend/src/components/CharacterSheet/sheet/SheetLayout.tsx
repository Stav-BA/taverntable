/**
 * SheetLayout — Tab layout for the live character sheet
 * Tabs: Core / Spells / Equipment / Features / Notes
 */

import React, { useState } from 'react';
import type { Character } from '../types';
import { useCharacter } from '../hooks/useCharacter';
import { useCharacterCalcs } from '../hooks/useCharacterCalcs';
import CoreTab from './CoreTab/CoreTab';
import SpellsTab from './SpellsTab/SpellsTab';
import EquipmentTab from './EquipmentTab/EquipmentTab';
import FeaturesTab from './FeaturesTab/FeaturesTab';
import NotesTab from './NotesTab/NotesTab';

interface SheetLayoutProps {
  initialCharacter: Character;
  onSave?: (character: Character) => void;
}

type Tab = 'core' | 'spells' | 'equipment' | 'features' | 'notes';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'core', label: 'Core', emoji: '⚔' },
  { id: 'spells', label: 'Spells', emoji: '✨' },
  { id: 'equipment', label: 'Equipment', emoji: '🛡' },
  { id: 'features', label: 'Features', emoji: '📜' },
  { id: 'notes', label: 'Notes', emoji: '📝' },
];

export default function SheetLayout({ initialCharacter, onSave }: SheetLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('core');
  const charHook = useCharacter(initialCharacter);
  const { character } = charHook;
  const calcs = useCharacterCalcs(character);

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#F4E4BC' : '#2D1B00',
    color: active ? '#2D1B00' : '#C9A227',
    border: active ? '2px solid #2D1B00' : '2px solid #5A3E1B',
    borderBottom: active ? '2px solid #F4E4BC' : '2px solid #5A3E1B',
    borderRadius: '6px 6px 0 0',
    padding: '10px 18px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 13,
    letterSpacing: '0.04em',
    position: 'relative',
    zIndex: active ? 2 : 1,
    transition: 'all 0.15s',
    marginRight: 2,
  });

  return (
    <div style={{
      fontFamily: "'Crimson Text', Georgia, serif",
      background: '#F4E4BC',
      minHeight: '100vh',
    }}>
      {/* Character Header */}
      <div style={{
        background: '#2D1B00',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        borderBottom: '3px solid #C9A227',
      }}>
        {/* Portrait placeholder */}
        <div style={{
          width: 60, height: 60,
          background: '#5A3E1B',
          borderRadius: 6,
          border: '2px solid #C9A227',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          {character.species === 'Dragonborn' ? '🐉' :
           character.species === 'Dwarf' ? '⛏️' :
           character.species === 'Elf' ? '🌿' :
           character.species === 'Gnome' ? '🔮' :
           character.species === 'Half-Elf' ? '🌟' :
           character.species === 'Half-Orc' ? '💪' :
           character.species === 'Halfling' ? '🍃' :
           character.species === 'Tiefling' ? '🔥' : '⚔️'}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            color: '#C9A227',
            fontSize: 22, margin: '0 0 4px',
            letterSpacing: '0.04em',
          }}>
            {character.name || 'Unnamed Adventurer'}
          </h1>
          <div style={{ color: '#EDD9A3', fontSize: 14 }}>
            {[character.species, character.class, `Level ${character.level}`].filter(Boolean).join(' · ')}
            {character.background && ` · ${character.background}`}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'HP', value: `${character.currentHP}/${calcs.maxHP}`, color: character.currentHP / calcs.maxHP > 0.5 ? '#4CAF50' : character.currentHP / calcs.maxHP > 0.25 ? '#FF9800' : '#F44336' },
            { label: 'AC', value: String(calcs.ac), color: '#C9A227' },
            { label: 'INIT', value: calcs.initiative >= 0 ? `+${calcs.initiative}` : String(calcs.initiative), color: '#C9A227' },
            { label: 'PROF', value: `+${calcs.profBonus}`, color: '#C9A227' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#8B6914', fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {onSave && (
          <button
            onClick={() => onSave(character)}
            style={{
              background: '#C9A227', color: '#2D1B00',
              border: '2px solid #2D1B00',
              borderRadius: 4, padding: '8px 20px',
              cursor: 'pointer', fontFamily: "'Cinzel', serif",
              fontSize: 13, fontWeight: 700,
            }}
          >
            💾 Save
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #2D1B00', paddingLeft: 16, paddingTop: 8, background: '#EDD9A3', display: 'flex' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={tabBtnStyle(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px 28px' }}>
        {activeTab === 'core' && <CoreTab character={character} calcs={calcs} hooks={charHook} />}
        {activeTab === 'spells' && <SpellsTab character={character} calcs={calcs} hooks={charHook} />}
        {activeTab === 'equipment' && <EquipmentTab character={character} calcs={calcs} hooks={charHook} />}
        {activeTab === 'features' && <FeaturesTab character={character} />}
        {activeTab === 'notes' && <NotesTab character={character} hooks={charHook} />}
      </div>
    </div>
  );
}

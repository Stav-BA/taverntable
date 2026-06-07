/**
 * SpellsTab — Spell slots, spell list, spell search
 */

import React from 'react';
import type { Character } from '../../types';
import SpellSlotTracker from './SpellSlotTracker';
import SpellList from './SpellList';
import SpellSearch from './SpellSearch';

interface SpellsTabProps {
  character: Character;
  calcs: {
    spellSlots: { slots: [0, ...number[]]; className: string; level: number } | null;
    spellAttackBonus: number;
    spellSaveDC: number;
    spellcastingAbility: string | null;
  };
  hooks: {
    expendSpellSlot: (level: number) => void;
    restoreSpellSlot: (level: number) => void;
    restoreAllSpellSlots: () => void;
    addSpell: (spell: any) => void;
    removeSpell: (id: string) => void;
    toggleSpellPrepared: (id: string) => void;
  };
}

export default function SpellsTab({ character, calcs, hooks }: SpellsTabProps) {
  const NON_CASTER_CLASSES = ['Barbarian', 'Fighter', 'Monk', 'Rogue'];
  const isNonCaster = NON_CASTER_CLASSES.includes(character.class) &&
    !character.subclass?.toLowerCase().includes('arcane') &&
    !character.subclass?.toLowerCase().includes('eldritch');

  if (isNonCaster && character.spells.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 40px',
        background: '#EDD9A3', border: '2px solid #2D1B00',
        borderRadius: 8,
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⚔️</div>
        <h3 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 18, margin: '0 0 8px' }}>
          {character.class || 'This class'} doesn't cast spells
        </h3>
        <p style={{ color: '#5A3E1B', fontSize: 14 }}>
          Your power comes from martial training, not arcane knowledge.
          Some subclasses grant spellcasting — if you pick one, spells will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 260px' }}>
        {/* Spellcasting Info */}
        {calcs.spellcastingAbility && (
          <div style={{
            background: '#2D1B00', color: '#C9A227',
            borderRadius: 8, padding: 16, marginBottom: 16,
          }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.06em', marginBottom: 10 }}>
              SPELLCASTING
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              {[
                { label: 'Ability', value: calcs.spellcastingAbility.toUpperCase() },
                { label: 'Atk Bonus', value: `+${calcs.spellAttackBonus}` },
                { label: 'Save DC', value: String(calcs.spellSaveDC) },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Cinzel', serif" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#8B6914', letterSpacing: '0.04em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <SpellSlotTracker
          spellSlots={calcs.spellSlots}
          spellSlotsUsed={character.spellSlotsUsed}
          onExpend={hooks.expendSpellSlot}
          onRestore={hooks.restoreSpellSlot}
          onRestoreAll={hooks.restoreAllSpellSlots}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SpellSearch onAdd={hooks.addSpell} knownSpellIds={character.spells.map(s => s.id)} />
        <SpellList
          spells={character.spells}
          onRemove={hooks.removeSpell}
          onTogglePrepared={hooks.toggleSpellPrepared}
        />
      </div>
    </div>
  );
}

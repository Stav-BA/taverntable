/**
 * AbilityBlock — 6 ability scores with modifiers, inline edit
 */

import React, { useState } from 'react';
import { getAbilityModifier } from '@taverntable/dnd-rules';
import type { Character } from '../../types';

interface AbilityBlockProps {
  character: Character;
  calcs: { mods: Record<string, number> };
  hooks: { updateAbilityScore: (ability: keyof Character['abilityScores'], value: number) => void };
}

const ABILITIES: { key: keyof Character['abilityScores']; abbr: string; label: string }[] = [
  { key: 'str', abbr: 'STR', label: 'Strength' },
  { key: 'dex', abbr: 'DEX', label: 'Dexterity' },
  { key: 'con', abbr: 'CON', label: 'Constitution' },
  { key: 'int', abbr: 'INT', label: 'Intelligence' },
  { key: 'wis', abbr: 'WIS', label: 'Wisdom' },
  { key: 'cha', abbr: 'CHA', label: 'Charisma' },
];

function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

export default function AbilityBlock({ character, calcs, hooks }: AbilityBlockProps) {
  const [editing, setEditing] = useState<keyof Character['abilityScores'] | null>(null);
  const [editVal, setEditVal] = useState('');

  const startEdit = (key: keyof Character['abilityScores']) => {
    setEditing(key);
    setEditVal(String(character.abilityScores[key]));
  };

  const commitEdit = () => {
    if (!editing) return;
    const num = parseInt(editVal, 10);
    if (!isNaN(num) && num >= 1 && num <= 30) {
      hooks.updateAbilityScore(editing, num);
    }
    setEditing(null);
  };

  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 12, textAlign: 'center' }}>
        ABILITY SCORES
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ABILITIES.map(({ key, abbr, label }) => {
          const score = character.abilityScores[key];
          const mod = getAbilityModifier(score);
          const isEditing = editing === key;

          return (
            <div
              key={key}
              style={{
                background: '#F4E4BC',
                border: '2px solid #2D1B00',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
              onClick={() => !isEditing && startEdit(key)}
              title={`Click to edit ${label}`}
            >
              {/* Modifier badge */}
              <div style={{
                background: '#2D1B00',
                color: '#C9A227',
                borderRadius: 4,
                minWidth: 36,
                height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Cinzel', serif",
                fontSize: 16, fontWeight: 700,
              }}>
                {modStr(mod)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#5A3E1B', fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>
                  {abbr}
                </div>
                {isEditing ? (
                  <input
                    autoFocus
                    type="number"
                    value={editVal}
                    min={1} max={30}
                    onChange={e => setEditVal(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => e.key === 'Enter' && commitEdit()}
                    style={{
                      width: 56, fontFamily: "'Cinzel', serif", fontSize: 20,
                      fontWeight: 700, color: '#2D1B00',
                      border: '2px solid #C9A227', borderRadius: 4,
                      background: '#FFF8E7', padding: '2px 4px',
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color: '#2D1B00' }}>
                    {score}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 11, color: '#8B6914' }}>✏</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

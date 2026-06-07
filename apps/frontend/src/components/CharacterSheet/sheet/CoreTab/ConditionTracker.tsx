/**
 * ConditionTracker — Active conditions with icons and exhaustion level
 */

import React, { useState } from 'react';
import { ALL_CONDITIONS } from '../../types';

interface ConditionTrackerProps {
  conditions: string[];
  onAdd: (condition: string) => void;
  onRemove: (condition: string) => void;
  exhaustionLevel: number;
  onExhaustionChange: (level: number) => void;
}

const CONDITION_ICONS: Record<string, string> = {
  Blinded: '👁️', Charmed: '💖', Deafened: '🔇', Exhaustion: '😓',
  Frightened: '😱', Grappled: '🤝', Incapacitated: '🚫', Invisible: '👻',
  Paralyzed: '⚡', Petrified: '🗿', Poisoned: '🤢', Prone: '⬇️',
  Restrained: '⛓️', Stunned: '💫', Unconscious: '💤',
};

const CONDITION_COLORS: Record<string, string> = {
  Blinded: '#333', Charmed: '#E91E63', Deafened: '#795548', Exhaustion: '#FF5722',
  Frightened: '#9C27B0', Grappled: '#607D8B', Incapacitated: '#F44336',
  Invisible: '#90A4AE', Paralyzed: '#FF9800', Petrified: '#78909C',
  Poisoned: '#4CAF50', Prone: '#8D6E63', Restrained: '#546E7A',
  Stunned: '#FFC107', Unconscious: '#212121',
};

export default function ConditionTracker({
  conditions, onAdd, onRemove,
  exhaustionLevel, onExhaustionChange,
}: ConditionTrackerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em' }}>
          CONDITIONS
        </div>
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: '#2D1B00', color: '#C9A227',
            border: 'none', borderRadius: 4,
            padding: '3px 10px', cursor: 'pointer',
            fontSize: 11, fontFamily: "'Cinzel', serif",
          }}
        >
          + Add
        </button>
      </div>

      {/* Active Conditions */}
      {conditions.length === 0 ? (
        <div style={{ fontSize: 13, color: '#8B6914', fontStyle: 'italic' }}>No active conditions</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {conditions.map(cond => (
            <div
              key={cond}
              style={{
                background: CONDITION_COLORS[cond] || '#5A3E1B',
                color: '#FFF',
                borderRadius: 12,
                padding: '3px 10px 3px 8px',
                fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: "'Cinzel', serif",
              }}
            >
              <span>{CONDITION_ICONS[cond] || '⚠'}</span>
              <span>{cond}</span>
              <button
                onClick={() => onRemove(cond)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  fontSize: 14, padding: '0 0 0 4px', lineHeight: 1,
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Condition Picker */}
      {open && (
        <div style={{
          marginTop: 10, background: '#F4E4BC',
          border: '1px solid #2D1B00', borderRadius: 4, padding: 10,
        }}>
          <div style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
            ADD CONDITION
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ALL_CONDITIONS.filter(c => !conditions.includes(c)).map(cond => (
              <button
                key={cond}
                onClick={() => { onAdd(cond); setOpen(false); }}
                style={{
                  background: CONDITION_COLORS[cond] || '#5A3E1B',
                  color: '#FFF', border: 'none', borderRadius: 10,
                  padding: '3px 8px', cursor: 'pointer',
                  fontSize: 11, fontFamily: "'Cinzel', serif",
                }}
              >
                {CONDITION_ICONS[cond]} {cond}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exhaustion */}
      <div style={{ marginTop: 12, borderTop: '1px solid #2D1B0066', paddingTop: 10 }}>
        <div style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
          EXHAUSTION LEVEL
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(level => (
            <button
              key={level}
              onClick={() => onExhaustionChange(level)}
              style={{
                width: 28, height: 28,
                borderRadius: 4,
                border: '2px solid #2D1B00',
                background: exhaustionLevel >= level && level > 0 ? '#8B1A1A' : exhaustionLevel === level && level === 0 ? '#2D5016' : '#F4E4BC',
                color: (exhaustionLevel >= level && level > 0) || (level === 0 && exhaustionLevel === 0) ? '#FFF' : '#2D1B00',
                cursor: 'pointer',
                fontSize: 12, fontFamily: "'Cinzel', serif",
                fontWeight: 700,
              }}
            >
              {level}
            </button>
          ))}
        </div>
        {exhaustionLevel > 0 && (
          <div style={{ fontSize: 12, color: '#8B1A1A', marginTop: 6, fontStyle: 'italic' }}>
            {exhaustionLevel === 1 && 'Disadvantage on Ability Checks'}
            {exhaustionLevel === 2 && 'Speed halved'}
            {exhaustionLevel === 3 && 'Disadvantage on Attack Rolls and Saving Throws'}
            {exhaustionLevel === 4 && 'Hit Point Maximum halved'}
            {exhaustionLevel === 5 && 'Speed reduced to 0'}
            {exhaustionLevel === 6 && '☠ Death'}
          </div>
        )}
      </div>
    </div>
  );
}

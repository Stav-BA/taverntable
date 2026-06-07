/**
 * SpellList — Prepared spells with expandable details
 */

import React, { useState } from 'react';
import type { Spell } from '../../types';

interface SpellListProps {
  spells: Spell[];
  onRemove: (id: string) => void;
  onTogglePrepared: (id: string) => void;
}

const SCHOOL_COLORS: Record<string, string> = {
  abjuration: '#1A3A6B', conjuration: '#4A148C', divination: '#006064',
  enchantment: '#880E4F', evocation: '#B71C1C', illusion: '#2E7D32',
  necromancy: '#212121', transmutation: '#E65100',
};

export default function SpellList({ spells, onRemove, onTogglePrepared }: SpellListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const byLevel = spells.reduce<Record<number, Spell[]>>((acc, spell) => {
    (acc[spell.level] ??= []).push(spell);
    return acc;
  }, {});

  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

  if (spells.length === 0) {
    return (
      <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
        <div style={{ color: '#8B6914', fontStyle: 'italic' }}>
          No spells added yet. Use the search above to add spells to your sheet.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {levels.map(level => (
        <div key={level} style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            background: '#2D1B00', color: '#C9A227',
            padding: '8px 16px',
            fontFamily: "'Cinzel', serif", fontSize: 13,
            letterSpacing: '0.06em',
          }}>
            {level === 0 ? 'Cantrips (At Will)' : `Level ${level} Spells`}
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byLevel[level].map(spell => {
              const isExpanded = expanded.has(spell.id);
              const schoolColor = SCHOOL_COLORS[spell.school?.toLowerCase()] ?? '#5A3E1B';

              return (
                <div key={spell.id} style={{
                  background: '#F4E4BC',
                  border: `1px solid ${spell.prepared ? '#C9A227' : '#2D1B0055'}`,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', cursor: 'pointer',
                    }}
                    onClick={() => toggle(spell.id)}
                  >
                    {/* Prepare toggle (cantrips are always prepared) */}
                    {level > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); onTogglePrepared(spell.id); }}
                        title={spell.prepared ? 'Unprepare' : 'Prepare'}
                        style={{
                          width: 18, height: 18,
                          borderRadius: '50%',
                          border: '2px solid #2D1B00',
                          background: spell.prepared ? '#C9A227' : 'transparent',
                          cursor: 'pointer',
                          flexShrink: 0,
                          padding: 0,
                        }}
                      />
                    )}
                    {level === 0 && (
                      <span style={{ fontSize: 14 }}>✨</span>
                    )}

                    <span style={{ flex: 1, fontFamily: "'Cinzel', serif", fontSize: 14, color: '#2D1B00' }}>
                      {spell.name}
                    </span>

                    {spell.concentration && (
                      <span style={{ fontSize: 10, background: '#1A3A6B', color: '#C9D8FF', borderRadius: 10, padding: '1px 6px' }}>C</span>
                    )}
                    {spell.ritual && (
                      <span style={{ fontSize: 10, background: '#4A148C', color: '#E1BEE7', borderRadius: 10, padding: '1px 6px' }}>R</span>
                    )}

                    <span style={{
                      background: schoolColor, color: '#FFF',
                      borderRadius: 10, padding: '1px 8px',
                      fontSize: 11, fontFamily: "'Cinzel', serif",
                    }}>
                      {spell.school}
                    </span>

                    <span style={{ fontSize: 12, color: '#5A3E1B' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>

                    <button
                      onClick={e => { e.stopPropagation(); onRemove(spell.id); }}
                      style={{
                        background: 'none', border: 'none',
                        color: '#8B1A1A', cursor: 'pointer',
                        fontSize: 14, padding: '0 4px', lineHeight: 1,
                      }}
                    >×</button>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '0 12px 12px', fontSize: 13, color: '#2D1B00', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, color: '#5A3E1B', flexWrap: 'wrap' }}>
                        <span>⏱ {spell.castingTime}</span>
                        <span>📏 {spell.range}</span>
                        <span>🧪 {spell.components}</span>
                        <span>⏳ {spell.duration}</span>
                      </div>
                      <p style={{ margin: 0 }}>{spell.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

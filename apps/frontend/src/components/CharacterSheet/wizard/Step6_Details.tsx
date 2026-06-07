/**
 * Step 6 — Character Details
 * Name, pronouns, appearance, backstory, alignment
 */

import React, { useEffect, useState } from 'react';
import type { Character } from '../types';

interface Step6Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  onReady: (ready: boolean) => void;
}

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

const ALIGNMENT_COLORS: Record<string, string> = {
  'Lawful Good': '#2D5016', 'Neutral Good': '#2D5016', 'Chaotic Good': '#2D5016',
  'Lawful Neutral': '#5A3E1B', 'True Neutral': '#5A3E1B', 'Chaotic Neutral': '#5A3E1B',
  'Lawful Evil': '#8B1A1A', 'Neutral Evil': '#8B1A1A', 'Chaotic Evil': '#8B1A1A',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#FFF8E7',
  border: '2px solid #2D1B00',
  borderRadius: 4,
  padding: '8px 12px',
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: 16,
  color: '#2D1B00',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontSize: 12,
  color: '#5A3E1B',
  letterSpacing: '0.05em',
  marginBottom: 6,
  display: 'block',
};

export default function Step6_Details({ character, updateCharacter, onReady }: Step6Props) {
  const [name, setName] = useState(character.name);

  useEffect(() => {
    onReady(name.trim().length > 0);
  }, [name, onReady]);

  const handleName = (v: string) => {
    setName(v);
    updateCharacter({ name: v });
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 24, marginBottom: 4, textAlign: 'center' }}>
        Character Details
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
        Give your character a name and tell us their story.
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Left Column */}
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>CHARACTER NAME *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={e => handleName(e.target.value)}
              placeholder="e.g. Aldric Stormforge"
            />
          </div>

          <div>
            <label style={labelStyle}>PRONOUNS</label>
            <input
              style={inputStyle}
              value={character.pronouns ?? ''}
              onChange={e => updateCharacter({ pronouns: e.target.value })}
              placeholder="e.g. he/him, she/her, they/them"
            />
          </div>

          <div>
            <label style={labelStyle}>ALIGNMENT</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {ALIGNMENTS.map(al => {
                const isSelected = character.alignment === al;
                return (
                  <button
                    key={al}
                    onClick={() => updateCharacter({ alignment: al })}
                    style={{
                      background: isSelected ? ALIGNMENT_COLORS[al] : '#EDD9A3',
                      color: isSelected ? '#F4E4BC' : '#2D1B00',
                      border: `2px solid ${isSelected ? ALIGNMENT_COLORS[al] : '#2D1B00'}`,
                      borderRadius: 4,
                      padding: '6px 4px',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: "'Cinzel', serif",
                      letterSpacing: '0.02em',
                      transition: 'all 0.15s',
                    }}
                  >
                    {al}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>APPEARANCE</label>
            <textarea
              style={{ ...inputStyle, height: 80, resize: 'vertical' }}
              value={''}
              onChange={e => {/* stored in notes for now */}}
              placeholder="Height, build, eye colour, distinguishing features..."
            />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>BACKSTORY</label>
            <textarea
              style={{ ...inputStyle, height: 160, resize: 'vertical' }}
              value={character.backstory ?? ''}
              onChange={e => updateCharacter({ backstory: e.target.value })}
              placeholder="Where did your character come from? What drives them? What haunts their past?&#10;&#10;Write as much or as little as you like — this is your character's story."
            />
          </div>

          <div>
            <label style={labelStyle}>PERSONALITY & NOTES</label>
            <textarea
              style={{ ...inputStyle, height: 100, resize: 'vertical' }}
              value={character.notes ?? ''}
              onChange={e => updateCharacter({ notes: e.target.value })}
              placeholder="Personality traits, ideals, bonds, flaws, quirks..."
            />
          </div>

          {/* Summary Box */}
          <div style={{
            background: '#2D1B00', color: '#C9A227',
            borderRadius: 6, padding: '14px 16px',
          }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.06em', marginBottom: 10 }}>
              CHARACTER SUMMARY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 14, color: '#F4E4BC' }}>
              <div><span style={{ color: '#C9A227' }}>Name:</span> {name || '—'}</div>
              <div><span style={{ color: '#C9A227' }}>Species:</span> {character.species || '—'}</div>
              <div><span style={{ color: '#C9A227' }}>Class:</span> {character.class || '—'}</div>
              <div><span style={{ color: '#C9A227' }}>Background:</span> {character.background || '—'}</div>
              <div><span style={{ color: '#C9A227' }}>Alignment:</span> {character.alignment || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

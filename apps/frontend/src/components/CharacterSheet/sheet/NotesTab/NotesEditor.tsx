/**
 * NotesEditor — Backstory + free-form notes
 */

import React, { useState } from 'react';
import type { Character } from '../../types';

interface NotesEditorProps {
  character: Character;
  onUpdate: <K extends keyof Character>(key: K, value: Character[K]) => void;
}

type Section = 'backstory' | 'notes' | 'appearance';

const SECTION_LABELS: Record<Section, { label: string; placeholder: string; emoji: string }> = {
  backstory: {
    label: 'Backstory',
    emoji: '📖',
    placeholder: "Where did your character come from? What events shaped who they are today? What do they fear, desire, regret? Write your character's history here — from humble origins to the call to adventure.",
  },
  notes: {
    label: 'Campaign Notes',
    emoji: '📝',
    placeholder: 'NPCs met, locations discovered, quest hooks, party decisions, loot to remember, session summaries...',
  },
  appearance: {
    label: 'Appearance & Personality',
    emoji: '🪞',
    placeholder: 'Physical description: height, build, eye colour, hair, distinguishing marks, typical attire.\n\nPersonality traits, ideals, bonds, flaws...',
  },
};

export default function NotesEditor({ character, onUpdate }: NotesEditorProps) {
  const [active, setActive] = useState<Section>('backstory');
  const [autosaveMsg, setAutosaveMsg] = useState('');

  const getValue = (): string => {
    if (active === 'backstory') return character.backstory ?? '';
    if (active === 'notes') return character.notes ?? '';
    if (active === 'appearance') return character.pronouns ?? ''; // reuse for now
    return '';
  };

  const handleChange = (value: string) => {
    if (active === 'backstory') onUpdate('backstory', value);
    if (active === 'notes') onUpdate('notes', value);
    if (active === 'appearance') onUpdate('pronouns', value); // repurpose field
    setAutosaveMsg('✓ Saved');
    setTimeout(() => setAutosaveMsg(''), 2000);
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Section nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
        {(Object.keys(SECTION_LABELS) as Section[]).map(section => {
          const { label, emoji } = SECTION_LABELS[section];
          const isActive = active === section;
          return (
            <button
              key={section}
              onClick={() => setActive(section)}
              style={{
                background: isActive ? '#2D1B00' : '#EDD9A3',
                color: isActive ? '#C9A227' : '#5A3E1B',
                border: `2px solid ${isActive ? '#C9A227' : '#2D1B00'}`,
                borderRadius: 6,
                padding: '12px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Cinzel', serif",
                fontSize: 13,
                letterSpacing: '0.03em',
              }}
            >
              {emoji} {label}
            </button>
          );
        })}

        {/* Character summary */}
        <div style={{
          marginTop: 12,
          background: '#EDD9A3',
          border: '2px solid #2D1B00',
          borderRadius: 8, padding: 14,
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#5A3E1B', letterSpacing: '0.05em', marginBottom: 8 }}>
            CHARACTER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#2D1B00' }}>
            <div><strong style={{ color: '#C9A227' }}>{character.name || '—'}</strong></div>
            <div>{character.species} {character.class}</div>
            <div>Level {character.level}</div>
            {character.background && <div>{character.background}</div>}
            {character.alignment && <div style={{ color: '#5A3E1B', fontStyle: 'italic' }}>{character.alignment}</div>}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10,
        }}>
          <h3 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 18, margin: 0 }}>
            {SECTION_LABELS[active].emoji} {SECTION_LABELS[active].label}
          </h3>
          {autosaveMsg && (
            <span style={{ fontSize: 13, color: '#2D5016', fontStyle: 'italic' }}>
              {autosaveMsg}
            </span>
          )}
        </div>
        <textarea
          value={getValue()}
          onChange={e => handleChange(e.target.value)}
          placeholder={SECTION_LABELS[active].placeholder}
          style={{
            width: '100%',
            minHeight: 420,
            background: '#FFF8E7',
            border: '2px solid #2D1B00',
            borderRadius: 8,
            padding: '16px 20px',
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: 16,
            color: '#2D1B00',
            lineHeight: 1.8,
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#8B6914', textAlign: 'right' }}>
          {getValue().length} characters · {getValue().split(/\s+/).filter(Boolean).length} words
        </div>
      </div>
    </div>
  );
}

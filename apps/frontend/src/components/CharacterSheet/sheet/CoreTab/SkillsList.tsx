/**
 * SkillsList — 18 skills with proficiency dots and expertise stars
 */

import React, { useState } from 'react';
import type { Character } from '../../types';

interface SkillEntry {
  name: string;
  ability: string;
  bonus: number;
  isProficient: boolean;
  isExpert: boolean;
  profLevel: string;
}

interface SkillsListProps {
  character: Character;
  calcs: { skills: SkillEntry[] };
  onToggleProficiency: (skill: string) => void;
  onToggleExpertise: (skill: string) => void;
}

function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

export default function SkillsList({ character, calcs, onToggleProficiency, onToggleExpertise }: SkillsListProps) {
  const [filter, setFilter] = useState('');
  const [showProfsOnly, setShowProfsOnly] = useState(false);

  const filtered = calcs.skills.filter(s => {
    const matchesFilter = s.name.toLowerCase().includes(filter.toLowerCase());
    const matchesProf = !showProfsOnly || s.isProficient;
    return matchesFilter && matchesProf;
  });

  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 10 }}>
        SKILLS
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter skills..."
          style={{
            flex: 1, padding: '5px 8px',
            border: '1px solid #2D1B00', borderRadius: 4,
            fontFamily: "'Crimson Text', serif", fontSize: 14,
            background: '#FFF8E7', color: '#2D1B00',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: '#5A3E1B' }}>
          <input
            type="checkbox"
            checked={showProfsOnly}
            onChange={e => setShowProfsOnly(e.target.checked)}
            style={{ accentColor: '#C9A227' }}
          />
          Prof. only
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 420, overflowY: 'auto' }}>
        {filtered.map(skill => (
          <div
            key={skill.name}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 4px',
              borderRadius: 4,
              background: skill.isExpert ? '#FFF8E7' : skill.isProficient ? '#F4EDD0' : 'transparent',
              cursor: 'default',
            }}
          >
            {/* Proficiency dot — click to toggle */}
            <button
              onClick={() => onToggleProficiency(skill.name)}
              title={skill.isProficient ? 'Remove proficiency' : 'Add proficiency'}
              style={{
                width: 14, height: 14,
                borderRadius: '50%',
                border: '2px solid #2D1B00',
                background: skill.isProficient ? '#2D1B00' : 'transparent',
                cursor: 'pointer',
                flexShrink: 0,
                padding: 0,
              }}
            />

            {/* Expertise star — click to toggle (only if proficient) */}
            <button
              onClick={() => onToggleExpertise(skill.name)}
              title={skill.isExpert ? 'Remove expertise' : 'Add expertise (requires proficiency)'}
              disabled={!skill.isProficient}
              style={{
                background: 'none', border: 'none',
                cursor: skill.isProficient ? 'pointer' : 'default',
                color: skill.isExpert ? '#C9A227' : '#C9A22733',
                fontSize: 12, padding: 0, lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ★
            </button>

            <span style={{
              flex: 1, fontSize: 13, color: '#2D1B00',
              fontWeight: skill.isProficient ? 600 : 400,
            }}>
              {skill.name}
            </span>

            <span style={{
              fontSize: 10, color: '#8B6914',
              textTransform: 'uppercase', minWidth: 26,
              textAlign: 'center',
            }}>
              {skill.ability}
            </span>

            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 13, fontWeight: 700,
              color: skill.isExpert ? '#C9A227' : skill.isProficient ? '#2D5016' : '#5A3E1B',
              minWidth: 28, textAlign: 'right',
            }}>
              {modStr(skill.bonus)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: '#8B6914', fontStyle: 'italic' }}>
        Click ● to toggle proficiency · Click ★ for expertise
      </div>
    </div>
  );
}

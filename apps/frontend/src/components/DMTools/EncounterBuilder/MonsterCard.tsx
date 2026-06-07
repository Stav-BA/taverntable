import React from 'react';
import { Monster } from '@/stores/dmStore';

const TYPE_COLOURS: Record<string, string> = {
  humanoid:    '#7a6000',
  beast:       '#2d6e2d',
  undead:      '#4a1a6e',
  giant:       '#5a2d0e',
  monstrosity: '#1a4a5a',
  aberration:  '#2e0a5e',
  dragon:      '#8b1a1a',
};

function crLabel(cr: number): string {
  if (cr === 0.125) return '1/8';
  if (cr === 0.25) return '1/4';
  if (cr === 0.5) return '1/2';
  return String(cr);
}

interface Props {
  monster: Monster;
  onAdd: (monster: Monster) => void;
  compact?: boolean;
}

export function MonsterCard({ monster, onAdd, compact = false }: Props) {
  const typeColour = TYPE_COLOURS[monster.type] ?? '#3a3a3a';

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded"
        style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.15)' }}
      >
        <div className="flex-1 min-w-0">
          <span className="font-cinzel text-xs font-bold truncate block" style={{ color: '#f4e4bc' }}>{monster.name}</span>
          <span className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>CR {crLabel(monster.cr)} • {monster.xp} XP</span>
        </div>
        <span
          className="font-cinzel text-xs px-1.5 py-0.5 rounded-full capitalize flex-shrink-0"
          style={{ background: typeColour + '55', border: `1px solid ${typeColour}aa`, color: '#f4e4bc' }}
        >
          {monster.type}
        </span>
        <button
          onClick={() => onAdd(monster)}
          className="font-cinzel text-xs px-2 py-0.5 rounded flex-shrink-0"
          style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', color: '#c9a227', cursor: 'pointer' }}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded flex flex-col gap-2"
      style={{
        background: 'rgba(45,27,0,0.5)',
        border: '1px solid rgba(201,162,39,0.2)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-cinzel font-bold text-sm" style={{ color: '#f4e4bc' }}>{monster.name}</p>
          <p className="font-crimson text-xs capitalize" style={{ color: 'rgba(244,228,188,0.5)' }}>{monster.type}</p>
        </div>
        <span
          className="font-cinzel text-xs px-1.5 py-0.5 rounded-full"
          style={{ background: typeColour + '55', border: `1px solid ${typeColour}aa`, color: '#f4e4bc' }}
        >
          {monster.type}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'CR', value: crLabel(monster.cr) },
          { label: 'HP', value: monster.hp },
          { label: 'AC', value: monster.ac },
          { label: 'XP', value: monster.xp },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center py-1 rounded-sm"
            style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.15)' }}
          >
            <span className="font-cinzel font-black text-sm leading-none" style={{ color: '#f4e4bc' }}>{value}</span>
            <span className="font-cinzel text-xs uppercase tracking-wider mt-0.5" style={{ color: 'rgba(244,228,188,0.4)' }}>{label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAdd(monster)}
        className="w-full font-cinzel text-xs py-1.5 rounded transition-all"
        style={{
          background: 'rgba(201,162,39,0.2)',
          border: '1px solid rgba(201,162,39,0.5)',
          color: '#c9a227',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.35)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.2)'; }}
      >
        + Add to Encounter
      </button>
    </div>
  );
}

import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { socketEmit } from '@/lib/socket';
import type { Combatant } from '@/stores/gameStore';

interface Props {
  combatant: Combatant;
  isCurrentTurn: boolean;
  index: number;
}

const CONDITION_ICONS: Record<string, string> = {
  blinded: '👁️',
  charmed: '💕',
  deafened: '👂',
  frightened: '😱',
  grappled: '🤜',
  incapacitated: '💤',
  invisible: '👻',
  paralyzed: '⚡',
  petrified: '🪨',
  poisoned: '☠️',
  prone: '⬇️',
  restrained: '⛓️',
  stunned: '💫',
  unconscious: '💀',
};

function HpPill({ hp, maxHp, isDM, onUpdate }: {
  hp: number;
  maxHp: number;
  isDM: boolean;
  onUpdate: (delta: number) => void;
}) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const colour = pct > 0.6 ? '#2d8a2d' : pct > 0.3 ? '#c9a227' : '#8b1a1a';

  return (
    <div className="flex items-center gap-1">
      {isDM && (
        <button
          onClick={() => onUpdate(-1)}
          className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded-sm transition-all"
          style={{ background: '#8b1a1a', color: '#f4e4bc', border: 'none', cursor: 'pointer' }}
        >
          -
        </button>
      )}
      <div
        className="font-cinzel text-xs font-bold px-2 py-0.5 rounded-sm"
        style={{
          background: `${colour}22`,
          border: `1px solid ${colour}`,
          color: colour,
          minWidth: 48,
          textAlign: 'center',
        }}
      >
        {hp}/{maxHp}
      </div>
      {isDM && (
        <button
          onClick={() => onUpdate(1)}
          className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded-sm transition-all"
          style={{ background: '#2d5016', color: '#f4e4bc', border: 'none', cursor: 'pointer' }}
        >
          +
        </button>
      )}
    </div>
  );
}

export default function CombatantRow({ combatant, isCurrentTurn, index }: Props) {
  const isDM = useSessionStore((s) => s.isDM);
  const updateCombatant = useGameStore((s) => s.updateCombatant);

  const handleHpChange = (delta: number) => {
    const newHp = Math.max(0, Math.min(combatant.maxHp, combatant.hp + delta));
    updateCombatant(combatant.id, { hp: newHp });
    socketEmit.initiativeUpdate(combatant.id, { hp: newHp });
  };

  const colourHex = combatant.colour;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 transition-all ${
        isCurrentTurn ? 'current-turn' : ''
      }`}
      style={{
        background: isCurrentTurn
          ? 'rgba(201,162,39,0.1)'
          : index % 2 === 0
          ? 'rgba(45,27,0,0.2)'
          : 'transparent',
        borderLeft: isCurrentTurn ? `3px solid ${colourHex}` : '3px solid transparent',
      }}
    >
      {/* Turn indicator */}
      <div className="flex-shrink-0 w-5 text-center">
        {isCurrentTurn ? (
          <span className="text-gold font-cinzel text-sm">▶</span>
        ) : (
          <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.3)' }}>
            {index + 1}
          </span>
        )}
      </div>

      {/* Colour dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{
          background: colourHex,
          boxShadow: isCurrentTurn ? `0 0 8px ${colourHex}` : undefined,
        }}
      />

      {/* Name + conditions */}
      <div className="flex-1 min-w-0">
        <p
          className="font-cinzel text-xs font-semibold truncate"
          style={{ color: isCurrentTurn ? '#f4e4bc' : 'rgba(244,228,188,0.8)' }}
        >
          {combatant.name}
        </p>
        {combatant.conditions.length > 0 && (
          <div className="flex gap-0.5 flex-wrap mt-0.5">
            {combatant.conditions.slice(0, 4).map((c) => (
              <span key={c} title={c} className="text-xs" style={{ lineHeight: 1 }}>
                {CONDITION_ICONS[c] ?? '?'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AC */}
      <div
        className="font-cinzel text-xs text-center flex-shrink-0"
        style={{ color: 'rgba(244,228,188,0.6)', minWidth: 28 }}
        title="Armour Class"
      >
        🛡{combatant.ac}
      </div>

      {/* HP */}
      <div className="flex-shrink-0">
        <HpPill
          hp={combatant.hp}
          maxHp={combatant.maxHp}
          isDM={isDM}
          onUpdate={handleHpChange}
        />
      </div>
    </div>
  );
}

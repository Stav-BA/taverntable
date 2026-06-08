import React, { useState } from 'react';
import { socketEmit } from '@/lib/socket';
import { REST_RULES } from '@taverntable/dnd-rules';

/**
 * RestManager — Short Rest and Long Rest buttons.
 * Emits rest:short / rest:long socket events to the backend.
 * Backend broadcasts rest:taken to all players.
 */
export function RestManager() {
  const [lastRest, setLastRest] = useState<'short' | 'long' | null>(null);

  function takeShortRest() {
    socketEmit.restShort();
    setLastRest('short');
  }

  function takeLongRest() {
    socketEmit.restLong();
    setLastRest('long');
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-cinzel text-xs uppercase tracking-wider" style={{ color: '#c9a227' }}>
        Rests — 2024 PHB
      </p>

      {/* Short Rest */}
      <div className="rounded p-3" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-cinzel text-sm font-bold" style={{ color: '#f4e4bc' }}>Short Rest</p>
            <p className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>
              {REST_RULES.short.duration}
            </p>
          </div>
          <button
            onClick={takeShortRest}
            className="flex-shrink-0 font-cinzel text-xs px-3 py-1.5 rounded transition-all"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.5)', color: '#c9a227', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(45,27,0,0.6)'; }}
          >
            Take Short Rest
          </button>
        </div>
        <ul className="flex flex-col gap-0.5">
          {REST_RULES.short.benefits.map((b, i) => (
            <li key={i} className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.6)', paddingLeft: '0.75rem', textIndent: '-0.75rem' }}>
              • {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Long Rest */}
      <div className="rounded p-3" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-cinzel text-sm font-bold" style={{ color: '#f4e4bc' }}>Long Rest</p>
            <p className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>
              {REST_RULES.long.duration}
            </p>
          </div>
          <button
            onClick={takeLongRest}
            className="flex-shrink-0 font-cinzel text-xs px-3 py-1.5 rounded transition-all"
            style={{ background: 'rgba(20,50,20,0.5)', border: '1px solid rgba(45,138,45,0.5)', color: '#2d8a2d', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45,138,45,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(20,50,20,0.5)'; }}
          >
            Take Long Rest
          </button>
        </div>
        <ul className="flex flex-col gap-0.5">
          {REST_RULES.long.benefits.map((b, i) => (
            <li key={i} className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.6)', paddingLeft: '0.75rem', textIndent: '-0.75rem' }}>
              • {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation message */}
      {lastRest && (
        <div
          className="rounded px-3 py-2 font-crimson text-xs"
          style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227' }}
        >
          {lastRest === 'short'
            ? 'Short Rest broadcast to all players. Players may spend Hit Dice.'
            : 'Long Rest broadcast to all players. All HP, spell slots, and Hit Dice restored.'}
        </div>
      )}
    </div>
  );
}

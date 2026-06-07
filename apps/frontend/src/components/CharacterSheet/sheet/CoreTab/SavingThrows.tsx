/**
 * SavingThrows — 6 saves with proficiency checkmarks
 */

import React from 'react';

interface SavingThrow {
  ability: string;
  label: string;
  bonus: number;
  isProficient: boolean;
}

interface SavingThrowsProps {
  calcs: { savingThrows: SavingThrow[] };
}

function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

export default function SavingThrows({ calcs }: SavingThrowsProps) {
  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 10 }}>
        SAVING THROWS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {calcs.savingThrows.map(save => (
          <div
            key={save.ability}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 0',
              borderBottom: '1px solid #C9A22733',
            }}
          >
            {/* Proficiency bubble */}
            <div style={{
              width: 14, height: 14,
              borderRadius: '50%',
              border: '2px solid #2D1B00',
              background: save.isProficient ? '#2D1B00' : 'transparent',
              flexShrink: 0,
            }} />
            <span style={{ flex: 1, fontSize: 14, color: '#2D1B00' }}>
              {save.label}
            </span>
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 14, fontWeight: 700,
              color: save.isProficient ? '#C9A227' : '#5A3E1B',
              minWidth: 32, textAlign: 'right',
            }}>
              {modStr(save.bonus)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SpellSlotTracker — Slot bubbles per level, click to use/restore
 */

import React from 'react';

interface SpellSlotTrackerProps {
  spellSlots: { slots: [0, ...number[]] } | null;
  spellSlotsUsed: Partial<Record<number, number>>;
  onExpend: (level: number) => void;
  onRestore: (level: number) => void;
  onRestoreAll: () => void;
}

export default function SpellSlotTracker({
  spellSlots, spellSlotsUsed, onExpend, onRestore, onRestoreAll,
}: SpellSlotTrackerProps) {
  if (!spellSlots) {
    return (
      <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, color: '#8B6914', fontStyle: 'italic', textAlign: 'center' }}>
          No spell slots available
        </div>
      </div>
    );
  }

  const spellLevels = spellSlots.slots
    .slice(1)
    .map((total, i) => ({ level: i + 1, total, used: spellSlotsUsed[i + 1] ?? 0 }))
    .filter(l => l.total > 0);

  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em' }}>
          SPELL SLOTS
        </div>
        <button
          onClick={onRestoreAll}
          style={{
            background: '#2D5016', color: '#F4E4BC',
            border: 'none', borderRadius: 4,
            padding: '3px 10px', cursor: 'pointer',
            fontSize: 11, fontFamily: "'Cinzel', serif",
          }}
        >
          Long Rest
        </button>
      </div>

      {/* Cantrip row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #2D1B0033' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', minWidth: 50 }}>
          Cantrips
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: '#2D1B00', marginLeft: 'auto' }}>∞</div>
      </div>

      {/* Spell level rows */}
      {spellLevels.map(({ level, total, used }) => {
        const available = total - used;
        return (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B',
              minWidth: 50,
            }}>
              Level {level}
            </div>
            <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
              {Array.from({ length: total }).map((_, i) => {
                const isUsed = i >= available;
                return (
                  <div
                    key={i}
                    onClick={() => isUsed ? onRestore(level) : onExpend(level)}
                    onContextMenu={e => { e.preventDefault(); onRestore(level); }}
                    title={isUsed ? 'Right-click or click to restore' : 'Click to expend'}
                    style={{
                      width: 20, height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${isUsed ? '#8B6914' : '#2D1B00'}`,
                      background: isUsed ? 'transparent' : '#2D1B00',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: '#5A3E1B', minWidth: 28, textAlign: 'right', fontFamily: "'Cinzel', serif" }}>
              {available}/{total}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 10, fontSize: 11, color: '#8B6914', fontStyle: 'italic' }}>
        Click to expend · Right-click or click empty to restore
      </div>
    </div>
  );
}

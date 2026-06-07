/**
 * DeathSaves — 3 success / 3 failure bubbles
 */

import React from 'react';

interface DeathSavesProps {
  deathSaves: { successes: number; failures: number };
  onAdd: (type: 'success' | 'failure') => void;
  onReset: () => void;
}

function Bubbles({
  count, filled, color, onClick,
}: {
  count: number; filled: number; color: string; onClick: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          onClick={onClick}
          style={{
            width: 22, height: 22,
            borderRadius: '50%',
            border: `3px solid ${color}`,
            background: i < filled ? color : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        />
      ))}
    </div>
  );
}

export default function DeathSaves({ deathSaves, onAdd, onReset }: DeathSavesProps) {
  const isDead = deathSaves.failures >= 3;
  const isStabilized = deathSaves.successes >= 3;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 13,
        color: '#8B1A1A', letterSpacing: '0.06em', marginBottom: 10,
      }}>
        💀 DEATH SAVING THROWS
      </div>

      {isDead && (
        <div style={{ color: '#8B1A1A', fontWeight: 700, marginBottom: 8 }}>
          ☠ Character is Dead
        </div>
      )}
      {isStabilized && !isDead && (
        <div style={{ color: '#2D5016', fontWeight: 700, marginBottom: 8 }}>
          💚 Stabilized
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#2D5016', fontFamily: "'Cinzel', serif", minWidth: 70, textAlign: 'right' }}>
            Successes
          </span>
          <Bubbles
            count={3}
            filled={deathSaves.successes}
            color="#2D5016"
            onClick={() => onAdd('success')}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#8B1A1A', fontFamily: "'Cinzel', serif", minWidth: 70, textAlign: 'right' }}>
            Failures
          </span>
          <Bubbles
            count={3}
            filled={deathSaves.failures}
            color="#8B1A1A"
            onClick={() => onAdd('failure')}
          />
        </div>
      </div>

      <button
        onClick={onReset}
        style={{
          marginTop: 10,
          background: 'none', border: '1px solid #8B6914',
          color: '#8B6914', borderRadius: 4,
          padding: '4px 14px', cursor: 'pointer',
          fontSize: 12, fontFamily: "'Cinzel', serif",
        }}
      >
        Reset
      </button>
    </div>
  );
}

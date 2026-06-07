/**
 * HPTracker — Current/Max/Temp HP with damage/heal controls
 */

import React, { useState } from 'react';
import DeathSaves from './DeathSaves';

interface HPTrackerProps {
  maxHP: number;
  currentHP: number;
  tempHP: number;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onTempHP: (amount: number) => void;
  isDying: boolean;
  deathSaves: { successes: number; failures: number };
  onDeathSave: (type: 'success' | 'failure') => void;
  onResetDeathSaves: () => void;
}

export default function HPTracker({
  maxHP, currentHP, tempHP,
  onDamage, onHeal, onTempHP,
  isDying, deathSaves, onDeathSave, onResetDeathSaves,
}: HPTrackerProps) {
  const [inputVal, setInputVal] = useState('');
  const [tempInputVal, setTempInputVal] = useState('');

  const hpPercent = maxHP > 0 ? currentHP / maxHP : 0;
  const barColor = hpPercent > 0.5 ? '#2D5016' : hpPercent > 0.25 ? '#C9A227' : '#8B1A1A';

  const apply = (fn: (n: number) => void) => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n > 0) {
      fn(n);
      setInputVal('');
    }
  };

  const applyTemp = () => {
    const n = parseInt(tempInputVal, 10);
    if (!isNaN(n) && n > 0) {
      onTempHP(n);
      setTempInputVal('');
    }
  };

  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 12 }}>
        HIT POINTS
      </div>

      {/* Temp HP */}
      {tempHP > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{
            background: '#1A3A6B', color: '#C9D8FF',
            borderRadius: 12, padding: '2px 12px',
            fontSize: 13, fontFamily: "'Cinzel', serif",
          }}>
            +{tempHP} Temporary HP
          </span>
        </div>
      )}

      {/* Main HP Display */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 52, fontWeight: 700,
          color: isDying ? '#8B1A1A' : '#2D1B00',
          lineHeight: 1,
        }}>
          {isDying ? '💀' : currentHP}
        </div>
        <div style={{ fontSize: 16, color: '#5A3E1B', marginTop: 4 }}>
          / {maxHP} HP
          {isDying && <span style={{ color: '#8B1A1A', marginLeft: 8, fontWeight: 700 }}>DYING</span>}
        </div>
      </div>

      {/* HP Bar */}
      <div style={{
        height: 10, background: '#2D1B00', borderRadius: 5,
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          height: '100%',
          width: `${Math.max(0, hpPercent * 100)}%`,
          background: barColor,
          borderRadius: 5,
          transition: 'width 0.4s ease, background 0.3s',
        }} />
      </div>

      {/* Damage / Heal input */}
      {!isDying && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Amount"
              min={1}
              style={{
                flex: 1, padding: '8px 12px',
                border: '2px solid #2D1B00', borderRadius: 4,
                fontFamily: "'Cinzel', serif", fontSize: 16,
                background: '#FFF8E7', color: '#2D1B00',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => apply(onDamage)}
              style={{
                flex: 1, background: '#8B1A1A', color: '#F4E4BC',
                border: '2px solid #2D1B00', borderRadius: 4,
                padding: '8px', cursor: 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: 13,
              }}
            >
              ⚔ Damage
            </button>
            <button
              onClick={() => apply(onHeal)}
              style={{
                flex: 1, background: '#2D5016', color: '#F4E4BC',
                border: '2px solid #2D1B00', borderRadius: 4,
                padding: '8px', cursor: 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: 13,
              }}
            >
              💚 Heal
            </button>
          </div>

          {/* Quick damage/heal buttons */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {[1, 5, 10, 20].map(n => (
              <button
                key={n}
                onClick={() => { setInputVal(String(n)); }}
                style={{
                  flex: 1, background: '#F4E4BC', color: '#2D1B00',
                  border: '1px solid #2D1B00', borderRadius: 4,
                  padding: '4px 2px', cursor: 'pointer',
                  fontSize: 12, fontFamily: "'Cinzel', serif",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Temp HP input */}
      <div style={{ borderTop: '1px solid #2D1B00', paddingTop: 10 }}>
        <div style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
          TEMPORARY HP
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            value={tempInputVal}
            onChange={e => setTempInputVal(e.target.value)}
            placeholder="Set temp HP"
            min={0}
            style={{
              flex: 1, padding: '6px 10px',
              border: '2px solid #1A3A6B', borderRadius: 4,
              fontFamily: "'Cinzel', serif", fontSize: 14,
              background: '#EEF2FF', color: '#2D1B00',
            }}
          />
          <button
            onClick={applyTemp}
            style={{
              background: '#1A3A6B', color: '#C9D8FF',
              border: '2px solid #1A3A6B', borderRadius: 4,
              padding: '6px 12px', cursor: 'pointer',
              fontFamily: "'Cinzel', serif", fontSize: 13,
            }}
          >
            Set
          </button>
        </div>
      </div>

      {/* Death Saves */}
      {isDying && (
        <div style={{ marginTop: 12, borderTop: '2px solid #8B1A1A', paddingTop: 12 }}>
          <DeathSaves
            deathSaves={deathSaves}
            onAdd={onDeathSave}
            onReset={onResetDeathSaves}
          />
        </div>
      )}
    </div>
  );
}

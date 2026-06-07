/**
 * CombatStats — AC, Initiative, Speed, Proficiency Bonus
 */

import React from 'react';

interface CombatStatsProps {
  calcs: {
    ac: number;
    initiative: number;
    speed: number;
    profBonus: number;
    passivePerception: number;
    hitDie: number;
  };
}

function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

export default function CombatStats({ calcs }: CombatStatsProps) {
  const stats = [
    { label: 'Armour Class', value: String(calcs.ac), icon: '🛡' },
    { label: 'Initiative', value: modStr(calcs.initiative), icon: '⚡' },
    { label: 'Speed', value: `${calcs.speed} ft.`, icon: '💨' },
    { label: 'Proficiency Bonus', value: `+${calcs.profBonus}`, icon: '⭐' },
    { label: 'Passive Perception', value: String(calcs.passivePerception), icon: '👁' },
    { label: 'Hit Dice', value: `1d${calcs.hitDie}`, icon: '🎲' },
  ];

  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 12 }}>
        COMBAT STATISTICS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {stats.map(stat => (
          <div
            key={stat.label}
            style={{
              background: '#F4E4BC',
              border: '1px solid #2D1B00',
              borderRadius: 6,
              padding: '10px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 20, fontWeight: 700, color: '#2D1B00',
              marginBottom: 4,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: '#5A3E1B', fontFamily: "'Cinzel', serif", letterSpacing: '0.03em' }}>
              {stat.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

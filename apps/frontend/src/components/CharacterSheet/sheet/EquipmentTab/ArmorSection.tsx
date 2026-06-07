/**
 * ArmorSection — Equipped armour with AC calc
 */

import React from 'react';
import { calculateAC } from '@taverntable/dnd-rules';
import type { EquipmentItem } from '../../types';

interface ArmorSectionProps {
  armors: EquipmentItem[];
  dexMod: number;
  onEquip: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function ArmorSection({ armors, dexMod, onEquip, onRemove }: ArmorSectionProps) {
  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 12 }}>
        ARMOUR
      </div>

      {armors.length === 0 ? (
        <div style={{ color: '#8B6914', fontStyle: 'italic', fontSize: 13 }}>
          No armour — Unarmored AC: {10 + dexMod}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {armors.map(armor => {
            const data = armor.armorData!;
            const ac = calculateAC(data.baseAC, dexMod, data.armorType);

            return (
              <div
                key={armor.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: armor.equipped ? '#FFF8E7' : '#F4E4BC',
                  border: `2px solid ${armor.equipped ? '#C9A227' : '#2D1B0033'}`,
                  borderRadius: 6, padding: '10px 12px',
                }}
              >
                <div style={{
                  fontSize: 28,
                  filter: armor.equipped ? 'none' : 'grayscale(0.6)',
                }}>
                  🛡️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: '#2D1B00' }}>
                    {armor.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#5A3E1B', marginTop: 2 }}>
                    Base AC: {data.baseAC} · {data.armorType}
                    {data.stealthDisadvantage && ' · Stealth Disadv.'}
                    {data.strengthRequirement && ` · STR ${data.strengthRequirement}+`}
                  </div>
                </div>
                <div style={{
                  background: '#2D1B00', color: armor.equipped ? '#C9A227' : '#5A3E1B',
                  borderRadius: 6, padding: '8px 12px',
                  textAlign: 'center', minWidth: 60,
                }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700 }}>
                    {ac}
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: '0.04em' }}>AC</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => onEquip(armor.id)}
                    style={{
                      background: armor.equipped ? '#C9A227' : '#EDD9A3',
                      color: '#2D1B00',
                      border: '1px solid #2D1B00', borderRadius: 4,
                      padding: '3px 8px', cursor: 'pointer',
                      fontSize: 11, fontFamily: "'Cinzel', serif",
                    }}
                  >
                    {armor.equipped ? '✓ Worn' : 'Equip'}
                  </button>
                  <button
                    onClick={() => onRemove(armor.id)}
                    style={{
                      background: 'none', border: '1px solid #8B1A1A',
                      color: '#8B1A1A', borderRadius: 4,
                      padding: '3px 8px', cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

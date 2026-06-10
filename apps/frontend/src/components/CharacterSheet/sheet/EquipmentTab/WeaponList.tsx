/**
 * WeaponList — Weapons with attack bonus, damage, mastery
 */

import React from 'react';
import { getAbilityModifier } from '@taverntable/dnd-rules';
import type { EquipmentItem } from '../../types';

interface WeaponListProps {
  weapons: EquipmentItem[];
  profBonus: number;
  strMod: number;
  dexMod: number;
  onRemove: (id: string) => void;
  onEquip?: (id: string) => void;
}

function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

export default function WeaponList({ weapons, profBonus, strMod, dexMod, onRemove, onEquip }: WeaponListProps) {
  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 12 }}>
        WEAPONS
      </div>

      {weapons.length === 0 ? (
        <div style={{ color: '#8B6914', fontStyle: 'italic', fontSize: 13 }}>No weapons equipped.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#5A3E1B', fontFamily: "'Cinzel', serif", letterSpacing: '0.04em', borderBottom: '1px solid #2D1B0033', paddingBottom: 4 }}>
            <span style={{ flex: 2 }}>WEAPON</span>
            <span style={{ minWidth: 60, textAlign: 'center' }}>ATK BONUS</span>
            <span style={{ minWidth: 80, textAlign: 'center' }}>DAMAGE</span>
            <span style={{ minWidth: 60, textAlign: 'center' }}>MASTERY</span>
            <span style={{ minWidth: 24 }}></span>
          </div>

          {weapons.map(weapon => {
            const data = weapon.weaponData!;
            const isFinesse = data.finesse;
            const abilityMod = isFinesse ? Math.max(strMod, dexMod) : strMod;
            const atkBonus = profBonus + abilityMod + data.attackBonus;
            const isRanged = !!data.range;
            const rangedMod = isRanged ? dexMod : abilityMod;
            const finalAtk = isRanged ? profBonus + rangedMod + data.attackBonus : atkBonus;

            return (
              <div
                key={weapon.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#F4E4BC', borderRadius: 4,
                  padding: '8px 10px', border: '1px solid #2D1B0033',
                }}
              >
                <div style={{ flex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#2D1B00' }}>
                      {weapon.name}
                    </div>
                    {weapon.equipped && (
                      <span style={{
                        background: '#C9A227', color: '#2D1B00',
                        borderRadius: 10, padding: '1px 7px',
                        fontSize: 10, fontFamily: "'Cinzel', serif", fontWeight: 700,
                      }}>
                        ⚔ Equipped
                      </span>
                    )}
                  </div>
                  {data.range && (
                    <div style={{ fontSize: 11, color: '#5A3E1B' }}>Range: {data.range}</div>
                  )}
                  {data.properties.length > 0 && (
                    <div style={{ fontSize: 10, color: '#8B6914' }}>{data.properties.join(', ')}</div>
                  )}
                </div>
                <div style={{ minWidth: 60, textAlign: 'center', fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: '#2D5016' }}>
                  {modStr(finalAtk)}
                </div>
                <div style={{ minWidth: 80, textAlign: 'center', fontSize: 14, color: '#2D1B00', fontFamily: "'Cinzel', serif" }}>
                  {data.damage}
                  <span style={{ fontSize: 11, color: '#5A3E1B', marginLeft: 3 }}>{data.damageType.slice(0, 5)}</span>
                </div>
                <div style={{ minWidth: 60, textAlign: 'center' }}>
                  {data.mastery && (
                    <span style={{
                      background: '#2D1B00', color: '#C9A227',
                      borderRadius: 10, padding: '1px 8px',
                      fontSize: 11, fontFamily: "'Cinzel', serif",
                    }}>
                      {data.mastery}
                    </span>
                  )}
                </div>
                {onEquip && (
                  <button
                    onClick={() => onEquip(weapon.id)}
                    style={{
                      background: weapon.equipped ? '#C9A227' : '#EDD9A3',
                      color: '#2D1B00',
                      border: '1px solid #2D1B00', borderRadius: 4,
                      padding: '3px 8px', cursor: 'pointer',
                      fontSize: 11, fontFamily: "'Cinzel', serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {weapon.equipped ? '✓ Equipped' : 'Equip'}
                  </button>
                )}
                <button
                  onClick={() => onRemove(weapon.id)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#8B1A1A', cursor: 'pointer',
                    fontSize: 14, padding: '0 4px',
                  }}
                >×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Step 7 — Starting Equipment
 * Class starting equipment with ability to add/remove items.
 */

import React, { useEffect } from 'react';
import type { Character, EquipmentItem } from '../types';
import { SRD_CLASSES } from '../types';

interface Step7Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  onReady: (ready: boolean) => void;
}

const ITEM_ICON: Record<string, string> = {
  weapon: '⚔️', armor: '🛡️', pack: '🎒', tool: '🔧', focus: '🔮', default: '📦',
};

function itemIcon(item: EquipmentItem): string {
  if (item.isWeapon) return ITEM_ICON.weapon;
  if (item.isArmor) return ITEM_ICON.armor;
  const name = item.name.toLowerCase();
  if (name.includes('pack')) return ITEM_ICON.pack;
  if (name.includes('tool')) return ITEM_ICON.tool;
  if (name.includes('focus') || name.includes('symbol') || name.includes('orb')) return ITEM_ICON.focus;
  return ITEM_ICON.default;
}

export default function Step7_Equipment({ character, updateCharacter, onReady }: Step7Props) {
  const classData = SRD_CLASSES.find(c => c.name === character.class);

  useEffect(() => {
    onReady(true); // Equipment is pre-filled from class
  }, [onReady]);

  const totalWeight = character.equipment.reduce((sum, item) => sum + item.weight * item.quantity, 0);

  const toggleItem = (id: string, include: boolean) => {
    if (include) {
      const original = classData?.startingEquipment.find(e => e.id === id);
      if (original) {
        updateCharacter({ equipment: [...character.equipment, original] });
      }
    } else {
      updateCharacter({ equipment: character.equipment.filter(e => e.id !== id) });
    }
  };

  const allStartingItems = classData?.startingEquipment ?? [];
  const currentIds = new Set(character.equipment.map(e => e.id));

  return (
    <div>
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 24, marginBottom: 4, textAlign: 'center' }}>
        Starting Equipment
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
        Your starting gear as a <strong>{character.class || 'adventurer'}</strong>. Toggle items to include or exclude them.
      </p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Item list */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allStartingItems.length === 0 ? (
            <div style={{ color: '#8B6914', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>
              No class selected. Please go back and pick a class.
            </div>
          ) : (
            allStartingItems.map(item => {
              const included = currentIds.has(item.id);
              return (
                <div
                  key={item.id}
                  style={{
                    background: included ? '#FFF8E7' : '#EDD9A3',
                    border: `2px solid ${included ? '#C9A227' : '#2D1B00'}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    opacity: included ? 1 : 0.5,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{itemIcon(item)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, color: '#2D1B00' }}>
                      {item.name}
                      {item.quantity > 1 && <span style={{ color: '#8B6914', marginLeft: 8 }}>×{item.quantity}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#5A3E1B', marginTop: 2 }}>
                      {item.isWeapon && item.weaponData && (
                        <>Attack: +{item.weaponData.attackBonus} · {item.weaponData.damage} {item.weaponData.damageType}
                          {item.weaponData.mastery && ` · Mastery: ${item.weaponData.mastery}`}</>
                      )}
                      {item.isArmor && item.armorData && (
                        <>Base AC: {item.armorData.baseAC} · {item.armorData.armorType}</>
                      )}
                      {!item.isWeapon && !item.isArmor && `Weight: ${item.weight} lb`}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#5A3E1B', minWidth: 60, textAlign: 'right' }}>
                    {item.weight * item.quantity} lb
                  </div>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={e => toggleItem(item.id, e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#C9A227' }}
                    />
                    <span style={{ fontSize: 12, color: '#5A3E1B' }}>Include</span>
                  </label>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        <div style={{
          flex: 1, minWidth: 200,
          background: '#EDD9A3',
          border: '2px solid #2D1B00',
          borderRadius: 8,
          padding: 20,
          alignSelf: 'flex-start',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#5A3E1B', marginBottom: 12, letterSpacing: '0.05em' }}>
            INVENTORY SUMMARY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: '#F4E4BC', borderRadius: 4, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: '#5A3E1B' }}>ITEMS</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: '#2D1B00', fontWeight: 700 }}>
                {character.equipment.length}
              </div>
            </div>
            <div style={{ background: '#F4E4BC', borderRadius: 4, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: '#5A3E1B' }}>TOTAL WEIGHT</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: '#2D1B00', fontWeight: 700 }}>
                {totalWeight.toFixed(1)} lb
              </div>
            </div>
            <div style={{ background: '#F4E4BC', borderRadius: 4, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: '#5A3E1B' }}>CARRY CAPACITY</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: '#2D1B00', fontWeight: 700 }}>
                {character.abilityScores.str * 15} lb
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: '#5A3E1B', fontStyle: 'italic', lineHeight: 1.6 }}>
            You can manage your inventory in detail from the Equipment tab of your character sheet after creation.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * EquipmentTab — Weapons, Armor, full Inventory
 */

import React from 'react';
import type { Character } from '../../types';
import WeaponList from './WeaponList';
import ArmorSection from './ArmorSection';
import Inventory from './Inventory';

interface EquipmentTabProps {
  character: Character;
  calcs: { dexMod: number; strMod: number; profBonus: number };
  hooks: {
    addEquipment: (item: any) => void;
    removeEquipment: (id: string) => void;
    updateEquipment: (id: string, changes: any) => void;
  };
}

export default function EquipmentTab({ character, calcs, hooks }: EquipmentTabProps) {
  const weapons = character.equipment.filter(e => e.isWeapon);
  const armors = character.equipment.filter(e => e.isArmor);
  const otherItems = character.equipment.filter(e => !e.isWeapon && !e.isArmor);

  const totalWeight = character.equipment.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const carryCapacity = character.abilityScores.str * 15;

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <WeaponList
          weapons={weapons}
          profBonus={calcs.profBonus}
          strMod={calcs.strMod}
          dexMod={calcs.dexMod}
          onRemove={hooks.removeEquipment}
          onEquip={(id) => {
            // Only one weapon equipped at a time — toggle selected, unequip others
            weapons.forEach((w) => hooks.updateEquipment(w.id, { equipped: w.id === id ? !w.equipped : false }));
          }}
        />
        <ArmorSection
          armors={armors}
          dexMod={calcs.dexMod}
          onEquip={(id) => {
            // Unequip all first, then equip selected
            armors.forEach(a => hooks.updateEquipment(a.id, { equipped: a.id === id }));
          }}
          onRemove={hooks.removeEquipment}
        />
      </div>

      <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Carry weight */}
        <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em', marginBottom: 10 }}>
            ENCUMBRANCE
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#2D1B00', marginBottom: 4 }}>
              <span>{totalWeight.toFixed(1)} lb carried</span>
              <span>{carryCapacity} lb capacity</span>
            </div>
            <div style={{ height: 8, background: '#2D1B00', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (totalWeight / carryCapacity) * 100)}%`,
                background: totalWeight > carryCapacity * 0.8 ? '#8B1A1A' : '#C9A227',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
          {totalWeight > carryCapacity && (
            <div style={{ fontSize: 12, color: '#8B1A1A', fontStyle: 'italic' }}>
              ⚠ Encumbered! Movement speed reduced.
            </div>
          )}
        </div>

        <Inventory
          items={otherItems}
          onRemove={hooks.removeEquipment}
          onUpdate={hooks.updateEquipment}
          onAdd={hooks.addEquipment}
        />
      </div>
    </div>
  );
}

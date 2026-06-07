/**
 * Inventory — General items with weight, quantity, description
 */

import React, { useState } from 'react';
import type { EquipmentItem } from '../../types';

interface InventoryProps {
  items: EquipmentItem[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, changes: Partial<EquipmentItem>) => void;
  onAdd: (item: EquipmentItem) => void;
}

export default function Inventory({ items, onRemove, onUpdate, onAdd }: InventoryProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newWeight, setNewWeight] = useState(0);
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      quantity: newQty,
      weight: newWeight,
      description: newDesc || undefined,
    });
    setNewName(''); setNewQty(1); setNewWeight(0); setNewDesc('');
    setAdding(false);
  };

  return (
    <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', letterSpacing: '0.06em' }}>
          INVENTORY ({items.length} items)
        </div>
        <button
          onClick={() => setAdding(!adding)}
          style={{
            background: '#2D1B00', color: '#C9A227',
            border: 'none', borderRadius: 4,
            padding: '3px 10px', cursor: 'pointer',
            fontSize: 11, fontFamily: "'Cinzel', serif",
          }}
        >
          + Add Item
        </button>
      </div>

      {adding && (
        <div style={{
          background: '#F4E4BC', border: '1px solid #C9A227',
          borderRadius: 6, padding: 12, marginBottom: 12,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Item name"
            style={{ padding: '6px 8px', border: '1px solid #2D1B00', borderRadius: 4, fontFamily: "'Crimson Text', serif", fontSize: 14, background: '#FFF8E7', color: '#2D1B00' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5A3E1B' }}>
              Qty:
              <input type="number" value={newQty} min={1} onChange={e => setNewQty(parseInt(e.target.value) || 1)}
                style={{ width: 50, padding: '4px 6px', border: '1px solid #2D1B00', borderRadius: 4, background: '#FFF8E7', color: '#2D1B00' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5A3E1B' }}>
              Weight (lb):
              <input type="number" value={newWeight} min={0} step={0.1} onChange={e => setNewWeight(parseFloat(e.target.value) || 0)}
                style={{ width: 60, padding: '4px 6px', border: '1px solid #2D1B00', borderRadius: 4, background: '#FFF8E7', color: '#2D1B00' }} />
            </label>
          </div>
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            style={{ padding: '6px 8px', border: '1px solid #2D1B00', borderRadius: 4, fontFamily: "'Crimson Text', serif", fontSize: 13, background: '#FFF8E7', color: '#2D1B00' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} style={{ flex: 1, background: '#C9A227', color: '#2D1B00', border: '1px solid #2D1B00', borderRadius: 4, padding: '6px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 12 }}>
              Add
            </button>
            <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'none', color: '#5A3E1B', border: '1px solid #5A3E1B', borderRadius: 4, padding: '6px', cursor: 'pointer', fontSize: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ color: '#8B6914', fontStyle: 'italic', fontSize: 13 }}>No general items.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#F4E4BC', border: '1px solid #2D1B0033',
              borderRadius: 4, padding: '6px 10px',
            }}>
              <span style={{ fontSize: 18 }}>📦</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#2D1B00', fontFamily: "'Cinzel', serif" }}>{item.name}</div>
                {item.description && <div style={{ fontSize: 11, color: '#5A3E1B' }}>{item.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                  style={{ background: '#2D1B00', color: '#C9A227', border: 'none', borderRadius: 3, width: 20, height: 20, cursor: 'pointer', fontSize: 14 }}
                >−</button>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: '#2D1B00', minWidth: 20, textAlign: 'center' }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
                  style={{ background: '#2D1B00', color: '#C9A227', border: 'none', borderRadius: 3, width: 20, height: 20, cursor: 'pointer', fontSize: 14 }}
                >+</button>
              </div>
              <span style={{ fontSize: 11, color: '#5A3E1B', minWidth: 40, textAlign: 'right' }}>
                {(item.weight * item.quantity).toFixed(1)} lb
              </span>
              <button
                onClick={() => onRemove(item.id)}
                style={{ background: 'none', border: 'none', color: '#8B1A1A', cursor: 'pointer', fontSize: 14 }}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

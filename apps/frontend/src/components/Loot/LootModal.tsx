import { useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useSessionStore } from '@/stores/sessionStore';
import { useCharacterStore } from '@/stores/characterStore';

interface LootItem {
  name: string;
  type: string;
  quantity: number;
  costGp?: number;
}

interface LootModalProps {
  lootId: string;
  items: LootItem[];
  gold: number;
  label: string;
  onClose: () => void;
}

function typeIcon(type: string): string {
  switch (type) {
    case 'weapon': return '⚔️';
    case 'armor':  return '🛡️';
    case 'potion': return '🧪';
    case 'magic':  return '✨';
    default:       return '📦';
  }
}

export function LootModal({ lootId, items, gold, label, onClose }: LootModalProps) {
  const player = useSessionStore((s) => s.player);
  const sessionId = useSessionStore((s) => s.sessionId);
  const { addItem, addCurrency } = useCharacterStore.getState();

  const handleClose = () => {
    (window as any).__activeLoot = null;
    onClose();
  };

  const [takenItems, setTakenItems] = useState<Set<string>>(new Set());
  const [goldTaken, setGoldTaken] = useState(false);

  const emitTake = (itemName: string) => {
    const socket = getSocket();
    if (socket && sessionId && player) {
      socket.emit('loot:take', {
        sessionId,
        lootId,
        playerId: player.id,
        playerName: player.name,
        itemName,
      });
    }
  };

  const handleTakeItem = (item: LootItem) => {
    if (!player || takenItems.has(item.name)) return;
    addItem(player.id, {
      id: Date.now().toString(),
      name: item.name,
      quantity: item.quantity,
      type: item.type as 'weapon' | 'armor' | 'potion' | 'misc' | 'magic',
    });
    emitTake(item.name);
    setTakenItems((prev) => new Set(prev).add(item.name));
  };

  const handleTakeGold = () => {
    if (!player || goldTaken) return;
    addCurrency(player.id, { gp: gold });
    emitTake(`${gold} gp`);
    setGoldTaken(true);
  };

  const GOLD = '#c9a227';
  const BG = '#1a0f00';
  const TEXT = '#f4e4bc';
  const BORDER = 'rgba(201,162,39,0.3)';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          background: BG,
          border: `1px solid ${GOLD}`,
          borderRadius: 8,
          width: '100%',
          maxWidth: 500,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 0 40px rgba(201,162,39,0.2)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: `1px solid ${BORDER}`,
            background: 'rgba(201,162,39,0.08)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'Cinzel, serif',
              fontSize: 16,
              fontWeight: 700,
              color: GOLD,
              background: `linear-gradient(90deg, #c9a227 0%, #f4e4bc 50%, #c9a227 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'lootShimmer 2.5s linear infinite',
            }}
          >
            {label}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(244,228,188,0.5)', fontSize: 18, lineHeight: 1,
              padding: '0 4px',
            }}
            aria-label="Close loot"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Gold section */}
          {gold > 0 && (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(201,162,39,0.08)',
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
              }}
            >
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: GOLD, fontWeight: 600 }}>
                💰 {gold} gp
              </span>
              <button
                onClick={handleTakeGold}
                disabled={goldTaken}
                style={{
                  padding: '5px 14px', borderRadius: 4, cursor: goldTaken ? 'default' : 'pointer',
                  fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 600,
                  background: goldTaken ? 'rgba(255,255,255,0.05)' : 'rgba(201,162,39,0.2)',
                  border: `1px solid ${goldTaken ? 'rgba(255,255,255,0.1)' : 'rgba(201,162,39,0.5)'}`,
                  color: goldTaken ? 'rgba(244,228,188,0.35)' : GOLD,
                  transition: 'all 0.15s',
                }}
              >
                {goldTaken ? 'Taken' : 'Take Gold'}
              </button>
            </div>
          )}

          {/* Item list */}
          {items.map((item) => {
            const taken = takenItems.has(item.name);
            return (
              <div
                key={item.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon(item.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: TEXT, fontWeight: 500 }}>
                    {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span
                      style={{
                        marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 10,
                        background: 'rgba(201,162,39,0.15)', color: GOLD,
                        fontFamily: 'Cinzel, serif', fontWeight: 600,
                      }}
                    >
                      x{item.quantity}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleTakeItem(item)}
                  disabled={taken}
                  style={{
                    padding: '5px 14px', borderRadius: 4, cursor: taken ? 'default' : 'pointer',
                    fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 600,
                    background: taken ? 'rgba(255,255,255,0.05)' : 'rgba(201,162,39,0.2)',
                    border: `1px solid ${taken ? 'rgba(255,255,255,0.1)' : 'rgba(201,162,39,0.5)'}`,
                    color: taken ? 'rgba(244,228,188,0.35)' : GOLD,
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  {taken ? 'Taken' : 'Take'}
                </button>
              </div>
            );
          })}

          {items.length === 0 && gold === 0 && (
            <p style={{ textAlign: 'center', color: 'rgba(244,228,188,0.4)', fontStyle: 'italic', fontSize: 13 }}>
              This loot is empty.
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={handleClose}
            style={{
              width: '100%', padding: '9px 0',
              fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${BORDER}`,
              borderRadius: 4, cursor: 'pointer',
              color: 'rgba(244,228,188,0.6)',
              letterSpacing: 0.5,
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes lootShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}

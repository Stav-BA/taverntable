import React, { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';
import { NPCManager } from './NPCManager/NPCManager';
import { EncounterBuilder } from './EncounterBuilder/EncounterBuilder';
import { CampaignJournal } from './CampaignJournal/CampaignJournal';
import { AIDMPanel } from './AIDMPanel/AIDMPanel';
import { ConditionsPanel } from './ConditionsPanel';
import { DeathSaveTracker } from './DeathSaveTracker';
import { RestManager } from './RestManager';

type DMTab = 'npcs' | 'encounters' | 'journal' | 'ai-dm' | 'combat' | 'conditions' | 'loot';

const TABS: Array<{ id: DMTab; label: string; icon: string }> = [
  { id: 'npcs',       label: 'NPCs',       icon: '🧙' },
  { id: 'encounters', label: 'Encounters', icon: '⚔️' },
  { id: 'combat',     label: 'Combat',     icon: '🩸' },
  { id: 'conditions', label: 'Conditions', icon: '🎭' },
  { id: 'loot',       label: 'Loot',       icon: '🧰' },
  { id: 'journal',    label: 'Journal',    icon: '📜' },
  { id: 'ai-dm',      label: 'AI DM',      icon: '🔮' },
];

// ── LootPanel ─────────────────────────────────────────────────────────────────

function LootPanel() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const addToken = useGameStore((s) => s.addToken);

  // Chest contents form state
  const [chestGold, setChestGold] = useState(0);
  const [chestItems, setChestItems] = useState<string[]>(['', '', '']);
  const [placed, setPlaced] = useState(false);

  // Drop Loot (quick loot drop without a chest token)
  const [lootGold, setLootGold] = useState(0);
  const [lootItems, setLootItems] = useState<string[]>(['']);
  const [lootLabel, setLootLabel] = useState('Monster Loot');
  const [lootDropped, setLootDropped] = useState(false);

  const goldColor = '#c9a227';
  const bdr = 'rgba(201,162,39,0.2)';
  const surface = 'rgba(255,255,255,0.04)';
  const txt = '#f4e4bc';
  const txtDim = 'rgba(244,228,188,0.55)';

  const placeChest = () => {
    const chestId = `chest-${Date.now()}`;
    const chestToken = {
      id: chestId,
      x: 5,
      y: 5,
      name: 'Treasure Chest',
      hp: 1,
      maxHp: 1,
      ac: 0,
      colour: '#c9a227',
      isNpc: false,
      isPlayer: false,
      isChest: true,
      imageUrl: 'emoji:🧰',
      conditions: [] as [],
      isVisible: true,
    };

    // Store chest contents globally so players can look them up on click
    if (!(window as any).__chestContents) {
      (window as any).__chestContents = {};
    }
    (window as any).__chestContents[chestId] = {
      gold: chestGold,
      items: chestItems
        .filter((name) => name.trim().length > 0)
        .map((name) => ({ name: name.trim(), type: 'misc', quantity: 1 })),
    };

    // Add locally
    addToken(chestToken);

    // Emit to other players via socket
    const socket = getSocket();
    if (socket && sessionId) {
      socket.emit('token:add', { sessionId, token: chestToken });
    }

    setPlaced(true);
    setTimeout(() => setPlaced(false), 2500);
  };

  const dropLoot = () => {
    const socket = getSocket();
    if (!socket || !sessionId) return;
    const filteredItems = lootItems
      .filter((name) => name.trim().length > 0)
      .map((name) => ({ name: name.trim(), type: 'misc', quantity: 1 }));
    socket.emit('loot:drop', {
      sessionId,
      lootId: Date.now().toString(),
      items: filteredItems,
      gold: lootGold,
      label: lootLabel || 'Monster Loot',
    });
    setLootGold(0);
    setLootItems(['']);
    setLootLabel('Monster Loot');
    setLootDropped(true);
    setTimeout(() => setLootDropped(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Place Chest ── */}
      <div style={{ background: surface, border: `1px solid ${bdr}`, borderRadius: 8, padding: 12 }}>
        <h4 style={{ color: goldColor, margin: '0 0 10px', fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 700 }}>
          🧰 Place Treasure Chest
        </h4>

        {/* Gold */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 10, color: txtDim, display: 'block', marginBottom: 4 }}>Gold (gp)</label>
          <input
            type="number"
            min={0}
            value={chestGold}
            onChange={(e) => setChestGold(Math.max(0, parseInt(e.target.value) || 0))}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${bdr}`,
              borderRadius: 4, padding: '5px 8px',
              color: txt, fontSize: 11, fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Items (up to 3) */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, color: txtDim, display: 'block', marginBottom: 4 }}>Items (up to 3)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chestItems.map((item, idx) => (
              <input
                key={idx}
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...chestItems];
                  next[idx] = e.target.value;
                  setChestItems(next);
                }}
                placeholder={`Item ${idx + 1} name…`}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(0,0,0,0.3)', border: `1px solid ${bdr}`,
                  borderRadius: 4, padding: '5px 8px',
                  color: txt, fontSize: 11, fontFamily: 'inherit',
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={placeChest}
          style={{
            width: '100%', padding: '8px 0',
            background: placed ? 'rgba(45,138,45,0.2)' : 'rgba(201,162,39,0.2)',
            border: `1px solid ${placed ? 'rgba(45,138,45,0.5)' : 'rgba(201,162,39,0.5)'}`,
            borderRadius: 4, cursor: 'pointer',
            color: placed ? '#2d8a2d' : goldColor,
            fontSize: 11, fontFamily: 'Cinzel, serif', fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {placed ? 'Chest placed! ✓' : '🧰 Place Chest on Map'}
        </button>
      </div>

      {/* ── Drop Loot ── */}
      <div style={{ borderTop: `1px solid rgba(201,162,39,0.3)`, paddingTop: 16 }}>
        <h4 style={{ color: goldColor, margin: '0 0 12px', fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 700 }}>
          💎 Drop Loot
        </h4>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 10, color: txtDim, display: 'block', marginBottom: 4 }}>Loot label</label>
          <input
            type="text"
            value={lootLabel}
            onChange={(e) => setLootLabel(e.target.value)}
            placeholder="Loot label…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: surface, border: `1px solid ${bdr}`,
              borderRadius: 4, padding: '5px 8px',
              color: txt, fontSize: 11, fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, color: txtDim, display: 'block', marginBottom: 4 }}>Gold (gp)</label>
          <input
            type="number"
            min={0}
            value={lootGold}
            onChange={(e) => setLootGold(Math.max(0, parseInt(e.target.value) || 0))}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: surface, border: `1px solid ${bdr}`,
              borderRadius: 4, padding: '5px 8px',
              color: txt, fontSize: 11, fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 10, color: txtDim, display: 'block', marginBottom: 4 }}>Items</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lootItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...lootItems];
                    next[idx] = e.target.value;
                    setLootItems(next);
                  }}
                  placeholder={`Item ${idx + 1} name…`}
                  style={{
                    flex: 1, background: surface, border: `1px solid ${bdr}`,
                    borderRadius: 4, padding: '5px 8px',
                    color: txt, fontSize: 11, fontFamily: 'inherit',
                  }}
                />
                {lootItems.length > 1 && (
                  <button
                    onClick={() => setLootItems(lootItems.filter((_, i) => i !== idx))}
                    style={{
                      padding: '0 8px', borderRadius: 4, cursor: 'pointer',
                      background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.3)', fontSize: 12,
                    }}
                    aria-label="Remove item"
                  >✕</button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setLootItems([...lootItems, ''])}
            style={{
              marginTop: 6, fontSize: 10, padding: '4px 10px', borderRadius: 3, cursor: 'pointer',
              background: surface, border: `1px solid ${bdr}`, color: txtDim,
            }}
          >+ Add Item</button>
        </div>

        <button
          onClick={dropLoot}
          style={{
            width: '100%', padding: '8px 0',
            background: lootDropped ? 'rgba(45,138,45,0.2)' : 'rgba(201,162,39,0.2)',
            border: `1px solid ${lootDropped ? 'rgba(45,138,45,0.5)' : 'rgba(201,162,39,0.5)'}`,
            borderRadius: 4, cursor: 'pointer',
            color: lootDropped ? '#2d8a2d' : goldColor,
            fontSize: 11, fontFamily: 'Cinzel, serif', fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {lootDropped ? 'Loot dropped! ✓' : '💎 Drop Loot'}
        </button>
      </div>
    </div>
  );
}

// ── DMToolsPanel ──────────────────────────────────────────────────────────────

export function DMToolsPanel() {
  const isDM = useSessionStore((s) => s.isDM);
  const [activeTab, setActiveTab] = useState<DMTab>('npcs');

  if (!isDM) return null;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Tab bar */}
      <div
        className="flex flex-shrink-0 flex-wrap"
        style={{ borderBottom: '1px solid rgba(201,162,39,0.3)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 font-cinzel text-xs transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(201,162,39,0.15)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #c9a227' : '2px solid transparent',
              color: activeTab === tab.id ? '#c9a227' : 'rgba(244,228,188,0.45)',
              border: 'none',
              cursor: 'pointer',
              paddingBottom: activeTab === tab.id ? '6px' : '8px',
              minWidth: 0,
            }}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className="uppercase tracking-wider truncate w-full text-center" style={{ fontSize: 9 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }}>
        {activeTab === 'npcs'       && <NPCManager />}
        {activeTab === 'encounters' && <EncounterBuilder />}
        {activeTab === 'journal'    && <CampaignJournal />}
        {activeTab === 'ai-dm'      && <AIDMPanel />}
        {activeTab === 'conditions' && <ConditionsPanel />}
        {activeTab === 'loot'       && <LootPanel />}
        {activeTab === 'combat'     && (
          <div className="flex flex-col gap-4">
            <DeathSaveTracker />
            <div style={{ borderTop: '1px solid rgba(201,162,39,0.2)', paddingTop: '1rem' }}>
              <RestManager />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

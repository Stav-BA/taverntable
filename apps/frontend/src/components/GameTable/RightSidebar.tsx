import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useCharacterStore } from '@/stores/characterStore';
import { socketEmit } from '@/lib/socket';
import { DMToolsPanel } from '@/components/DMTools';
import { LootModal } from '@/components/Loot';
import { CharacterSheetModal } from '@/components/CharacterSheet/CharacterSheetModal';

const MACRO_PRESETS = [
  { label: 'Perception', icon: '👁', expression: '1d20', modifier: 0 },
  { label: 'Stealth', icon: '🌑', expression: '1d20', modifier: 0 },
  { label: 'Initiative', icon: '⚔️', expression: '1d20', modifier: 0 },
  { label: 'Death Save', icon: '💀', expression: '1d20', modifier: 0 },
  { label: 'Inspiration', icon: '✨', expression: '1d20', modifier: 0 },
  { label: 'Short Rest', icon: '🛌', expression: '1d6', modifier: 0 },
];

interface ActiveLoot {
  lootId: string;
  items: Array<{ name: string; type: string; quantity: number; costGp?: number }>;
  gold: number;
  label: string;
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="flex flex-col items-center p-1 rounded-sm"
      style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.2)' }}
    >
      <span
        className="font-cinzel font-black text-lg leading-none"
        style={{ color: '#f4e4bc' }}
      >
        {value}
      </span>
      <span
        className="font-cinzel text-xs uppercase tracking-wider mt-0.5"
        style={{ color: 'rgba(244,228,188,0.5)' }}
      >
        {label}
      </span>
    </div>
  );
}

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const colour = pct > 0.6 ? '#2d8a2d' : pct > 0.3 ? '#c9a227' : '#8b1a1a';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>HP</span>
        <span className="font-cinzel text-sm font-bold" style={{ color: colour }}>
          {hp} / {maxHp}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct * 100}%`, background: colour }}
        />
      </div>
    </div>
  );
}

export default function RightSidebar() {
  const tokens = useGameStore((s) => s.tokens);
  const player = useSessionStore((s) => s.player);
  const isDM = useSessionStore((s) => s.isDM);
  const selectedTokenId = useSessionStore((s) => s.selectedTokenId);
  const connectedPlayers = useSessionStore((s) => s.connectedPlayers);
  const [activeTab, setActiveTab] = useState<'character' | 'players' | 'dm-tools'>('character');
  const [showLootModal, setShowLootModal] = useState(false);
  const [activeLoot, setActiveLoot] = useState<ActiveLoot | null>(null);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);

  const sheets = useCharacterStore((s) => s.sheets);
  const hasSheet = player ? !!sheets[player.id] : false;

  // Poll for loot every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const loot = (window as any).__activeLoot as ActiveLoot | null | undefined;
      setActiveLoot(loot ?? null);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const myToken = tokens.find((t) => t.playerId === player?.id) ?? null;
  const selectedToken = selectedTokenId ? tokens.find((t) => t.id === selectedTokenId) : null;
  const displayToken = selectedToken ?? myToken;

  const handleMacroRoll = (expression: string, modifier: number, _label: string) => {
    if (!player) return;
    const requestId = Math.random().toString(36).slice(2, 11);
    socketEmit.diceRoll(expression, modifier, requestId);
  };

  return (
    <div
      className="sidebar-panel-right flex flex-col"
      style={{ width: 280, flexShrink: 0 }}
    >
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(201,162,39,0.3)' }}>
        {([
          { id: 'character', label: '🧙 Character' },
          { id: 'players',   label: '👥 Players' },
          ...(isDM ? [{ id: 'dm-tools', label: '🎲 DM Tools' }] : []),
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="flex-1 font-cinzel text-xs uppercase tracking-wider py-2 transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(201,162,39,0.15)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #c9a227' : '2px solid transparent',
              color: activeTab === tab.id ? '#c9a227' : 'rgba(244,228,188,0.5)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dm-tools' ? (
        <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          <DMToolsPanel />
        </div>
      ) : activeTab === 'character' ? (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          {/* Character Panel */}
          {displayToken ? (
            <>
              {/* Token name & colour */}
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-cinzel font-bold text-sm"
                  style={{
                    background: displayToken.colour,
                    color: '#fff',
                    boxShadow: `0 0 12px ${displayToken.colour}44`,
                  }}
                >
                  {displayToken.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-cinzel font-bold text-parchment text-sm">{displayToken.name}</p>
                  <p className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>
                    {displayToken.isPlayer ? 'Player Character' : 'NPC / Monster'}
                  </p>
                </div>
              </div>

              {/* HP Bar */}
              <HpBar hp={displayToken.hp} maxHp={displayToken.maxHp} />

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-1.5">
                <StatBlock label="AC" value={displayToken.ac} />
                <StatBlock label="HP" value={`${displayToken.hp}/${displayToken.maxHp}`} />
                <StatBlock label="Pos" value={`${displayToken.x},${displayToken.y}`} />
              </div>

              {/* Conditions */}
              {displayToken.conditions.length > 0 && (
                <div>
                  <p className="font-cinzel text-xs text-gold mb-1 uppercase tracking-wider">
                    Conditions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {displayToken.conditions.map((c) => (
                      <span key={c} className="condition-badge">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              className="text-center font-crimson italic text-sm py-8"
              style={{ color: 'rgba(244,228,188,0.4)' }}
            >
              {isDM ? 'Select a token to view stats' : 'No character token on map yet'}
            </div>
          )}

          {/* Open Character Sheet button */}
          {!isDM && hasSheet && (
            <button
              onClick={() => setShowCharacterSheet(true)}
              style={{
                width: '100%', padding: '7px 0',
                background: 'rgba(201,162,39,0.15)',
                border: '1px solid rgba(201,162,39,0.45)',
                borderRadius: 3, cursor: 'pointer',
                color: '#c9a227', fontSize: 12, fontFamily: 'Cinzel, serif',
                fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.15)'; }}
            >
              📜 Open Character Sheet
            </button>
          )}

          {/* Macros */}
          <div>
            <p className="font-cinzel text-xs text-gold mb-2 uppercase tracking-wider">
              Quick Rolls
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {MACRO_PRESETS.map((macro) => (
                <button
                  key={macro.label}
                  onClick={() => handleMacroRoll(macro.expression, macro.modifier, macro.label)}
                  className="flex items-center gap-1.5 px-2 py-2 font-crimson text-sm transition-all"
                  style={{
                    background: 'rgba(45,27,0,0.4)',
                    border: '1px solid rgba(201,162,39,0.2)',
                    color: 'rgba(244,228,188,0.8)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(201,162,39,0.5)';
                    e.currentTarget.style.background = 'rgba(201,162,39,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(201,162,39,0.2)';
                    e.currentTarget.style.background = 'rgba(45,27,0,0.4)';
                  }}
                >
                  <span>{macro.icon}</span>
                  <span className="truncate">{macro.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-2">
            {connectedPlayers.length === 0 ? (
              <p
                className="text-center font-crimson italic text-sm py-4"
                style={{ color: 'rgba(244,228,188,0.4)' }}
              >
                Waiting for players...
              </p>
            ) : (
              connectedPlayers.map((p) => {
                const token = tokens.find((t) => t.playerId === p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-sm"
                    style={{
                      background: 'rgba(45,27,0,0.3)',
                      border: '1px solid rgba(201,162,39,0.15)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-cinzel font-bold text-xs"
                      style={{
                        background: p.colour,
                        color: '#fff',
                      }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-cinzel text-xs font-semibold truncate"
                        style={{ color: '#f4e4bc' }}>
                        {p.name}
                      </p>
                      {token && (
                        <p className="font-crimson text-xs"
                          style={{ color: 'rgba(244,228,188,0.5)' }}>
                          HP: {token.hp}/{token.maxHp}
                        </p>
                      )}
                    </div>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: '#2d8a2d', boxShadow: '0 0 4px #2d8a2d' }}
                      title="Online"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Floating loot button — visible to all when loot is available */}
      {activeLoot && (
        <div style={{ padding: '8px', borderTop: '1px solid rgba(201,162,39,0.3)', flexShrink: 0 }}>
          <button
            onClick={() => setShowLootModal(true)}
            style={{
              width: '100%', padding: '8px 0',
              background: 'rgba(201,162,39,0.2)',
              border: '1px solid rgba(201,162,39,0.5)',
              borderRadius: 4, cursor: 'pointer',
              color: '#c9a227', fontSize: 12, fontFamily: 'Cinzel, serif',
              fontWeight: 600, letterSpacing: 0.5,
            }}
          >
            💎 Loot Available! — Open
          </button>
        </div>
      )}

      {/* Loot modal overlay */}
      {showLootModal && activeLoot && (
        <LootModal
          lootId={activeLoot.lootId}
          items={activeLoot.items}
          gold={activeLoot.gold}
          label={activeLoot.label}
          onClose={() => {
            (window as any).__activeLoot = null;
            setActiveLoot(null);
            setShowLootModal(false);
          }}
        />
      )}

      {/* Character sheet modal */}
      {showCharacterSheet && player && (
        <CharacterSheetModal
          playerId={player.id}
          onClose={() => setShowCharacterSheet(false)}
        />
      )}
    </div>
  );
}

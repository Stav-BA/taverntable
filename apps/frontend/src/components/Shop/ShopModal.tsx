import React, { useState } from 'react';
import { SHOP_TEMPLATES, toGoldValue } from '@/lib/equipment5e';
import type { ShopItem, Weapon, Armor, MagicItem } from '@/lib/equipment5e';
import { useCharacterStore } from '@/stores/characterStore';
import { useSessionStore } from '@/stores/sessionStore';
import { getSocket } from '@/lib/socket';

// ── helpers ───────────────────────────────────────────────────────────────────

type ItemCategory = 'all' | 'weapon' | 'armor' | 'potion' | 'magic' | 'misc';

function isWeapon(item: Weapon | Armor | MagicItem): item is Weapon {
  return 'damageDice' in item;
}

function isArmor(item: Weapon | Armor | MagicItem): item is Armor {
  return 'baseAC' in item;
}

function isMagicItem(item: Weapon | Armor | MagicItem): item is MagicItem {
  return 'rarity' in item;
}

function getItemCategory(item: Weapon | Armor | MagicItem): ItemCategory {
  if (isWeapon(item)) return 'weapon';
  if (isArmor(item)) return 'armor';
  if (isMagicItem(item)) {
    if (item.type === 'Potion') return 'potion';
    return 'magic';
  }
  return 'misc';
}

function getEffectiveCost(shopItem: ShopItem): number {
  return shopItem.customPrice ?? shopItem.item.costGp;
}

function formatPrice(gp: number): string {
  if (gp < 0.1) return `${Math.round(gp * 100)} cp`;
  if (gp < 1) return `${Math.round(gp * 10)} sp`;
  if (gp === Math.floor(gp)) return `${gp} gp`;
  return `${gp.toFixed(1)} gp`;
}

const RARITY_COLOUR: Record<string, string> = {
  Common: '#9ca3af',
  Uncommon: '#22c55e',
  Rare: '#3b82f6',
  'Very Rare': '#a855f7',
  Legendary: '#f97316',
  Artifact: '#ec4899',
};

const CATEGORY_ICON: Record<ItemCategory, string> = {
  all: '📦',
  weapon: '⚔️',
  armor: '🛡️',
  potion: '🧪',
  magic: '✨',
  misc: '📦',
};

const TABS: Array<{ id: ItemCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'potion', label: 'Potions' },
  { id: 'magic', label: 'Magic Items' },
  { id: 'misc', label: 'Misc' },
];

const C_GOLD = '#c9a227';
const C_BG = '#1a0f00';
const C_SURFACE = 'rgba(255,255,255,0.04)';
const C_BORDER = 'rgba(201,162,39,0.3)';
const C_TEXT = '#f4e4bc';
const C_DIM = 'rgba(244,228,188,0.55)';

// ── CurrencyBar ───────────────────────────────────────────────────────────────

interface CurrencyValues {
  cp: number; sp: number; ep: number; gp: number; pp: number;
}

function CurrencyBar({ currency }: { currency: CurrencyValues }) {
  const coins = [
    { label: 'PP', value: currency.pp, colour: '#e2e8f0' },
    { label: 'GP', value: currency.gp, colour: C_GOLD },
    { label: 'EP', value: currency.ep, colour: '#94a3b8' },
    { label: 'SP', value: currency.sp, colour: '#c0c0c0' },
    { label: 'CP', value: currency.cp, colour: '#b45309' },
  ];
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '8px 16px', flexWrap: 'wrap',
      background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${C_BORDER}`,
      alignItems: 'center',
    }}>
      <span style={{ fontSize: 11, color: C_DIM, marginRight: 4 }}>Your Wallet:</span>
      {coins.map(({ label, value, colour }) => (
        <span key={label} style={{ fontSize: 12, color: colour, fontWeight: 600 }}>
          {value.toLocaleString()} {label}
        </span>
      ))}
    </div>
  );
}

// ── ItemCard ──────────────────────────────────────────────────────────────────

interface ItemCardProps {
  shopItem: ShopItem;
  canAfford: boolean;
  onBuy: () => void;
  flash: 'success' | 'error' | null;
  expanded: boolean;
  onToggle: () => void;
}

function ItemCard({ shopItem, canAfford, onBuy, flash, expanded, onToggle }: ItemCardProps) {
  const { item } = shopItem;
  const cost = getEffectiveCost(shopItem);
  const category = getItemCategory(item);
  const icon = CATEGORY_ICON[category];
  const rarity: string | undefined = isMagicItem(item) ? item.rarity : undefined;
  const rarityColor = rarity ? (RARITY_COLOUR[rarity] ?? '#9ca3af') : undefined;

  return (
    <div style={{
      background: flash === 'success' ? 'rgba(34,197,94,0.12)'
        : flash === 'error' ? 'rgba(239,68,68,0.12)'
        : C_SURFACE,
      border: `1px solid ${flash === 'success' ? '#22c55e' : flash === 'error' ? '#ef4444' : C_BORDER}`,
      borderRadius: 6,
      overflow: 'hidden',
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      {/* Card header row */}
      <div
        style={{ padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }}
        onClick={onToggle}
      >
        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C_TEXT }}>{item.name}</span>
            {rarity && rarityColor && (
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 3,
                background: `${rarityColor}22`, color: rarityColor,
                border: `1px solid ${rarityColor}55`, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>{rarity}</span>
            )}
            {isMagicItem(item) && item.requiresAttunement && (
              <span style={{
                fontSize: 9, color: '#f97316',
                border: '1px solid #f97316aa', padding: '1px 4px', borderRadius: 3,
              }}>Attunement</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: C_DIM, marginTop: 2 }}>
            {isWeapon(item) && `${item.damageDice} ${item.damageType} · ${item.category}`}
            {isArmor(item) && `AC ${item.baseAC} · ${item.category}`}
            {isMagicItem(item) && item.type}
          </div>
        </div>
        {/* Price + buy */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C_GOLD }}>{formatPrice(cost)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onBuy(); }}
            disabled={!canAfford}
            style={{
              padding: '3px 10px', borderRadius: 3,
              cursor: canAfford ? 'pointer' : 'not-allowed',
              fontSize: 10, fontWeight: 600,
              background: canAfford ? 'rgba(201,162,39,0.2)' : 'rgba(255,255,255,0.04)',
              color: canAfford ? C_GOLD : C_DIM,
              border: `1px solid ${canAfford ? C_BORDER : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.15s',
            }}
          >
            {flash === 'success' ? '✓ Purchased!' : flash === 'error' ? 'Not enough gold' : 'Buy'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '8px 10px 10px', borderTop: `1px solid ${C_BORDER}` }}>
          {isWeapon(item) && (
            <div style={{ fontSize: 11, color: C_DIM, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span>Damage: <strong style={{ color: C_TEXT }}>{item.damageDice} {item.damageType}</strong></span>
              {item.versatileDice && (
                <span>Versatile: <strong style={{ color: C_TEXT }}>{item.versatileDice}</strong></span>
              )}
              {item.properties.length > 0 && (
                <span>Properties: <strong style={{ color: C_TEXT }}>{item.properties.join(', ')}</strong></span>
              )}
              {item.range && <span>Range: <strong style={{ color: C_TEXT }}>{item.range}</strong></span>}
              {item.throwRange && <span>Throw Range: <strong style={{ color: C_TEXT }}>{item.throwRange}</strong></span>}
              <span>Weight: <strong style={{ color: C_TEXT }}>{item.weight} lbs</strong></span>
            </div>
          )}
          {isArmor(item) && (
            <div style={{ fontSize: 11, color: C_DIM, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span>Base AC: <strong style={{ color: C_TEXT }}>{item.baseAC}</strong></span>
              <span>Category: <strong style={{ color: C_TEXT }}>{item.category}</strong></span>
              {item.addDexMod && (
                <span>
                  DEX mod:{' '}
                  <strong style={{ color: C_TEXT }}>
                    +{item.maxDexBonus !== undefined ? `up to ${item.maxDexBonus}` : 'full'}
                  </strong>
                </span>
              )}
              {item.strengthReq !== undefined && (
                <span>STR req: <strong style={{ color: C_TEXT }}>{item.strengthReq}</strong></span>
              )}
              {item.stealthDisadvantage && (
                <span style={{ color: '#ef4444' }}>Stealth Disadvantage</span>
              )}
            </div>
          )}
          {isMagicItem(item) && (
            <div style={{ fontSize: 11, color: C_DIM }}>
              <p style={{ color: C_TEXT, lineHeight: 1.5, margin: 0 }}>{item.description}</p>
              {item.healingDice && (
                <p style={{ marginTop: 4, marginBottom: 0 }}>
                  Healing: <strong style={{ color: C_TEXT }}>{item.healingDice}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ShopModal ─────────────────────────────────────────────────────────────────

export interface ShopModalProps {
  shopId: string;
  onClose: () => void;
}

export function ShopModal({ shopId, onClose }: ShopModalProps) {
  const template = SHOP_TEMPLATES.find((t) => t.id === shopId);
  const player = useSessionStore((s) => s.player);
  const sessionId = useSessionStore((s) => s.sessionId);
  const connectedPlayers = useSessionStore((s) => s.connectedPlayers);
  const sheets = useCharacterStore((s) => s.sheets);
  const spendGold = useCharacterStore((s) => s.spendGold);
  const addItem = useCharacterStore((s) => s.addItem);

  const [activeTab, setActiveTab] = useState<ItemCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flashes, setFlashes] = useState<Record<string, 'success' | 'error'>>({});

  if (!template) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: C_TEXT, padding: 32 }}>Shop not found: {shopId}</div>
      </div>
    );
  }

  const mySheet = player ? sheets[player.id] : null;
  const currency: CurrencyValues = mySheet?.currency ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const walletGp = toGoldValue(currency);

  const filteredInventory = template.inventory.filter((si) =>
    activeTab === 'all' || getItemCategory(si.item) === activeTab
  );

  const handleBuy = (shopItem: ShopItem) => {
    if (!player) return;
    const cost = getEffectiveCost(shopItem);
    const key = shopItem.item.id;

    const success = spendGold(player.id, cost);

    if (success) {
      const category = getItemCategory(shopItem.item);
      const itemType: 'weapon' | 'armor' | 'potion' | 'misc' | 'magic' =
        category === 'weapon' ? 'weapon'
        : category === 'armor' ? 'armor'
        : category === 'potion' ? 'potion'
        : category === 'magic' ? 'magic'
        : 'misc';

      addItem(player.id, {
        id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: shopItem.item.name,
        quantity: 1,
        type: itemType,
        costGp: cost,
        ...(isMagicItem(shopItem.item) && {
          rarity: shopItem.item.rarity,
          requiresAttunement: shopItem.item.requiresAttunement,
          description: shopItem.item.description,
          healingDice: shopItem.item.healingDice,
          magicItemId: shopItem.item.id,
        }),
        ...(isWeapon(shopItem.item) && {
          weaponId: shopItem.item.id,
          damageDice: shopItem.item.damageDice,
          damageType: shopItem.item.damageType,
        }),
        ...(isArmor(shopItem.item) && {
          armorId: shopItem.item.id,
        }),
      });

      // Emit socket purchase event so DM sees it in chat
      const socket = getSocket();
      if (socket && sessionId) {
        const playerName =
          connectedPlayers.find((p) => p.id === player.id)?.name ?? player.name;
        socket.emit('shop:purchase', {
          sessionId,
          playerId: player.id,
          playerName,
          itemName: shopItem.item.name,
          costGp: cost,
        });
      }

      setFlashes((prev) => ({ ...prev, [key]: 'success' }));
      setTimeout(() => setFlashes((prev) => { const n = { ...prev }; delete n[key]; return n; }), 2000);
    } else {
      setFlashes((prev) => ({ ...prev, [key]: 'error' }));
      setTimeout(() => setFlashes((prev) => { const n = { ...prev }; delete n[key]; return n; }), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 700, maxHeight: '90vh',
        background: C_BG, border: `1px solid ${C_BORDER}`,
        borderRadius: 8, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 0 40px rgba(201,162,39,0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${C_BORDER}`,
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div>
            <h2 style={{ color: C_GOLD, fontFamily: 'Cinzel, serif', fontSize: 18, margin: 0 }}>
              {template.emoji} {template.name}
            </h2>
            <p style={{ color: C_DIM, fontSize: 12, margin: '2px 0 0' }}>
              {template.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${C_BORDER}`,
              color: C_DIM, cursor: 'pointer', borderRadius: 4,
              width: 28, height: 28, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Currency bar */}
        <CurrencyBar currency={currency} />

        {/* Tab filter */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${C_BORDER}`,
          flexShrink: 0, overflowX: 'auto',
        }}>
          {TABS.map((tab) => {
            const count = tab.id === 'all'
              ? template.inventory.length
              : template.inventory.filter((si) => getItemCategory(si.item) === tab.id).length;
            if (count === 0 && tab.id !== 'all') return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 12px', border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: activeTab === tab.id ? 'rgba(201,162,39,0.15)' : 'transparent',
                  borderBottom: activeTab === tab.id ? `2px solid ${C_GOLD}` : '2px solid transparent',
                  color: activeTab === tab.id ? C_GOLD : C_DIM,
                  fontSize: 11, fontFamily: 'Cinzel, serif',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}
              >
                {tab.label} <span style={{ fontSize: 9, opacity: 0.7 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Item list */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 12,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {filteredInventory.length === 0 && (
            <p style={{ color: C_DIM, fontSize: 12, textAlign: 'center', padding: 24, fontStyle: 'italic' }}>
              No items in this category.
            </p>
          )}
          {filteredInventory.map((shopItem) => {
            const cost = getEffectiveCost(shopItem);
            const canAfford = walletGp >= cost;
            const key = shopItem.item.id;
            return (
              <ItemCard
                key={key}
                shopItem={shopItem}
                canAfford={canAfford}
                onBuy={() => handleBuy(shopItem)}
                flash={flashes[key] ?? null}
                expanded={expandedId === key}
                onToggle={() => setExpandedId(expandedId === key ? null : key)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { socketEmit } from '@/lib/socket';
import { CONDITIONS, CONDITION_NAMES } from '@taverntable/dnd-rules';
import type { Condition } from '@/stores/gameStore';

export function ConditionsPanel() {
  const tokens = useGameStore((s) => s.tokens);
  const updateToken = useGameStore((s) => s.updateToken);

  const [selectedTokenId,  setSelectedTokenId]  = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>(CONDITION_NAMES[0]);
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  function applyCondition() {
    if (!selectedToken || !selectedCondition) return;
    const existing: Condition[] = selectedToken.conditions ?? [];
    if (existing.includes(selectedCondition as Condition)) return; // already applied
    const next = [...existing, selectedCondition as Condition];
    socketEmit.tokenUpdate(selectedToken.id, { conditions: next });
    updateToken(selectedToken.id, { conditions: next });
  }

  function removeCondition(tokenId: string, condition: Condition) {
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return;
    const next = (token.conditions ?? []).filter((c) => c !== condition);
    socketEmit.tokenUpdate(tokenId, { conditions: next });
    updateToken(tokenId, { conditions: next });
  }

  // Tokens that have at least one condition applied
  const affectedTokens = tokens.filter((t) => t.conditions && t.conditions.length > 0);

  return (
    <div className="flex flex-col gap-3">

      {/* ── Apply Condition ──────────────────────────────────────────── */}
      <div className="rounded p-3" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}>
        <p className="font-cinzel text-xs uppercase tracking-wider mb-2" style={{ color: '#c9a227' }}>
          Apply Condition
        </p>
        <div className="flex flex-col gap-2">
          <select
            value={selectedTokenId}
            onChange={(e) => setSelectedTokenId(e.target.value)}
            className="w-full font-crimson text-sm px-2 py-1.5 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          >
            <option value="">— Select token —</option>
            {tokens.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="w-full font-crimson text-sm px-2 py-1.5 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          >
            {CONDITION_NAMES.map((c) => {
              const def = CONDITIONS[c];
              return (
                <option key={c} value={c}>
                  {def.icon} {def.name}
                </option>
              );
            })}
          </select>

          <button
            onClick={applyCondition}
            disabled={!selectedTokenId}
            className="w-full font-cinzel text-xs py-2 rounded transition-all"
            style={{
              background: selectedTokenId ? 'rgba(139,26,26,0.4)' : 'rgba(45,27,0,0.3)',
              border: `1px solid ${selectedTokenId ? 'rgba(139,26,26,0.7)' : 'rgba(201,162,39,0.15)'}`,
              color: selectedTokenId ? '#ff6b6b' : 'rgba(244,228,188,0.3)',
              cursor: selectedTokenId ? 'pointer' : 'default',
            }}
          >
            Apply Condition
          </button>
        </div>
      </div>

      {/* ── Active Conditions per Token ──────────────────────────────── */}
      {affectedTokens.length > 0 && (
        <div className="rounded p-3" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}>
          <p className="font-cinzel text-xs uppercase tracking-wider mb-2" style={{ color: '#c9a227' }}>
            Active Conditions
          </p>
          <div className="flex flex-col gap-2">
            {affectedTokens.map((token) => (
              <div key={token.id}>
                <p className="font-cinzel text-xs mb-1" style={{ color: '#f4e4bc' }}>
                  {token.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(token.conditions ?? []).map((cond) => {
                    const def = CONDITIONS[cond];
                    if (!def) return null;
                    return (
                      <span
                        key={cond}
                        className="flex items-center gap-1 font-crimson text-xs rounded px-2 py-0.5"
                        style={{ background: 'rgba(139,26,26,0.25)', border: '1px solid rgba(139,26,26,0.5)', color: '#f4e4bc' }}
                      >
                        {def.icon} {def.name}
                        <button
                          onClick={() => removeCondition(token.id, cond)}
                          style={{ color: 'rgba(244,228,188,0.4)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, lineHeight: 1 }}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Condition Reference ──────────────────────────────────────── */}
      <div className="rounded p-3" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}>
        <p className="font-cinzel text-xs uppercase tracking-wider mb-2" style={{ color: '#c9a227' }}>
          2024 Condition Reference
        </p>
        <div className="flex flex-col gap-1">
          {CONDITION_NAMES.map((c) => {
            const def = CONDITIONS[c];
            const isOpen = expandedCondition === c;
            return (
              <div key={c} className="rounded overflow-hidden" style={{ border: '1px solid rgba(201,162,39,0.15)' }}>
                <button
                  onClick={() => setExpandedCondition(isOpen ? null : c)}
                  className="w-full flex items-center justify-between px-2 py-1.5 font-cinzel text-xs"
                  style={{ background: isOpen ? 'rgba(201,162,39,0.12)' : 'rgba(20,10,0,0.3)', color: '#f4e4bc', cursor: 'pointer', border: 'none' }}
                >
                  <span>{def.icon} {def.name}</span>
                  <span style={{ color: 'rgba(244,228,188,0.4)' }}>{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="px-2 pb-2 pt-1" style={{ background: 'rgba(20,10,0,0.3)' }}>
                    <ul className="flex flex-col gap-0.5">
                      {def.effects.map((eff, idx) => (
                        <li key={idx} className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.7)', paddingLeft: '0.75rem', textIndent: '-0.75rem' }}>
                          • {eff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

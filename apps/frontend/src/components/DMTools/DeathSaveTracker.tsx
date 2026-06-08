import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { socketEmit } from '@/lib/socket';

interface DeathSaveState {
  successes: number;
  failures: number;
}

/**
 * DeathSaveTracker — 2024 PHB rules.
 * Lists all player tokens at 0 HP. DM records successes/failures.
 * Natural 20: set HP to 1. Natural 1: 2 failures.
 * 3 successes = Stable. 3 failures = Dead.
 */
export function DeathSaveTracker() {
  const tokens    = useGameStore((s) => s.tokens);
  const updateToken = useGameStore((s) => s.updateToken);

  // Local per-session state — tokenId -> saves
  const [saves, setSaves] = useState<Record<string, DeathSaveState>>({});

  // Dying = player tokens with hp <= 0
  const dyingTokens = tokens.filter((t) => t.isPlayer && t.hp <= 0);

  // Remove tokens from save tracking when they heal above 0
  useEffect(() => {
    const dyingIds = new Set(dyingTokens.map((t) => t.id));
    setSaves((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (!dyingIds.has(id)) delete next[id];
      });
      return next;
    });
  }, [dyingTokens.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function getSave(tokenId: string): DeathSaveState {
    return saves[tokenId] ?? { successes: 0, failures: 0 };
  }

  function addSuccess(tokenId: string) {
    setSaves((prev) => {
      const cur = prev[tokenId] ?? { successes: 0, failures: 0 };
      if (cur.successes >= 3) return prev;
      return { ...prev, [tokenId]: { ...cur, successes: cur.successes + 1 } };
    });
  }

  function addFailure(tokenId: string, count = 1) {
    setSaves((prev) => {
      const cur = prev[tokenId] ?? { successes: 0, failures: 0 };
      const next = Math.min(3, cur.failures + count);
      return { ...prev, [tokenId]: { ...cur, failures: next } };
    });
  }

  function handleNat20(tokenId: string) {
    // Regain 1 HP, wake up
    socketEmit.tokenUpdate(tokenId, { hp: 1 });
    updateToken(tokenId, { hp: 1 });
    setSaves((prev) => {
      const next = { ...prev };
      delete next[tokenId];
      return next;
    });
  }

  function handleNat1(tokenId: string) {
    addFailure(tokenId, 2);
  }

  if (dyingTokens.length === 0) {
    return (
      <div
        className="rounded p-3 text-center"
        style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)' }}
      >
        <p className="font-crimson italic text-sm" style={{ color: 'rgba(244,228,188,0.4)' }}>
          No players at 0 HP.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-cinzel text-xs uppercase tracking-wider" style={{ color: '#c9a227' }}>
        Death Save Tracker — 2024 PHB
      </p>
      {dyingTokens.map((token) => {
        const save = getSave(token.id);
        const stable = save.successes >= 3;
        const dead   = save.failures  >= 3;

        return (
          <div
            key={token.id}
            className="rounded p-3"
            style={{
              background: dead ? 'rgba(139,26,26,0.2)' : stable ? 'rgba(45,138,45,0.15)' : 'rgba(45,27,0,0.4)',
              border: `1px solid ${dead ? 'rgba(139,26,26,0.5)' : stable ? 'rgba(45,138,45,0.4)' : 'rgba(201,162,39,0.3)'}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-cinzel text-sm font-bold" style={{ color: '#f4e4bc' }}>
                {token.name}
              </span>
              {stable && (
                <span className="font-cinzel text-xs" style={{ color: '#2d8a2d' }}>
                  Stable
                </span>
              )}
              {dead && (
                <span className="font-cinzel text-xs" style={{ color: '#8b1a1a' }}>
                  Dead
                </span>
              )}
            </div>

            {/* Successes */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-cinzel text-xs w-20" style={{ color: 'rgba(244,228,188,0.6)' }}>Successes</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: i < save.successes ? '#2d8a2d' : 'rgba(20,10,0,0.5)',
                      border: `1px solid ${i < save.successes ? '#2d8a2d' : 'rgba(201,162,39,0.3)'}`,
                    }}
                  >
                    {i < save.successes ? '✓' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Failures */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-cinzel text-xs w-20" style={{ color: 'rgba(244,228,188,0.6)' }}>Failures</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: i < save.failures ? '#8b1a1a' : 'rgba(20,10,0,0.5)',
                      border: `1px solid ${i < save.failures ? '#8b1a1a' : 'rgba(201,162,39,0.3)'}`,
                    }}
                  >
                    {i < save.failures ? '✕' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            {!stable && !dead && (
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => addSuccess(token.id)}
                  className="font-cinzel text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(45,138,45,0.3)', border: '1px solid rgba(45,138,45,0.6)', color: '#2d8a2d', cursor: 'pointer' }}
                >
                  Success
                </button>
                <button
                  onClick={() => addFailure(token.id)}
                  className="font-cinzel text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(139,26,26,0.6)', color: '#ff6b6b', cursor: 'pointer' }}
                >
                  Failure
                </button>
                <button
                  onClick={() => handleNat20(token.id)}
                  className="font-cinzel text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(201,162,39,0.25)', border: '1px solid rgba(201,162,39,0.6)', color: '#c9a227', cursor: 'pointer' }}
                >
                  Natural 20!
                </button>
                <button
                  onClick={() => handleNat1(token.id)}
                  className="font-cinzel text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(100,10,10,0.4)', border: '1px solid rgba(139,26,26,0.8)', color: '#c0392b', cursor: 'pointer' }}
                >
                  Natural 1
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

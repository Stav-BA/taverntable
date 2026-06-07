/**
 * Step 5 — Ability Scores
 * Three methods: Roll 4d6-drop-lowest, Standard Array, Point Buy
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  rollAbilityScoreSet,
  standardArray,
  pointBuyCost,
  pointBuySpent,
  getAbilityModifier,
  POINT_BUY_BUDGET,
  POINT_BUY_MIN,
  POINT_BUY_MAX,
} from '@taverntable/dnd-rules';
import type { RolledAbilityScore } from '@taverntable/dnd-rules';
import type { Character } from '../types';

interface Step5Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  onReady: (ready: boolean) => void;
}

type Method = 'roll' | 'array' | 'pointbuy';
type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

const ABILITY_LABELS: { key: AbilityKey; label: string; abbr: string }[] = [
  { key: 'str', label: 'Strength', abbr: 'STR' },
  { key: 'dex', label: 'Dexterity', abbr: 'DEX' },
  { key: 'con', label: 'Constitution', abbr: 'CON' },
  { key: 'int', label: 'Intelligence', abbr: 'INT' },
  { key: 'wis', label: 'Wisdom', abbr: 'WIS' },
  { key: 'cha', label: 'Charisma', abbr: 'CHA' },
];

const DEFAULT_SCORES: Record<AbilityKey, number> = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

function modStr(mod: number) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ─── Roll Method ──────────────────────────────────────────────────────────────

function RollMethod({ onAssign }: { onAssign: (scores: Record<AbilityKey, number>) => void }) {
  const [rolls, setRolls] = useState<RolledAbilityScore[]>([]);
  const [assignments, setAssignments] = useState<Partial<Record<AbilityKey, number>>>({});
  const [rolling, setRolling] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const doRoll = useCallback(() => {
    setRolling(true);
    setAssignments({});
    setTimeout(() => {
      setRolls(rollAbilityScoreSet());
      setRolling(false);
    }, 600);
  }, []);

  const handleDrop = (abilityKey: AbilityKey, rollIndex: number) => {
    const score = rolls[rollIndex].score;
    const newAssignments = { ...assignments };
    // Unassign if this roll was already assigned elsewhere
    (Object.keys(newAssignments) as AbilityKey[]).forEach(k => {
      if (newAssignments[k] === rollIndex) delete newAssignments[k];
    });
    newAssignments[abilityKey] = rollIndex;
    setAssignments(newAssignments);
    if (Object.keys(newAssignments).length === 6) {
      const scores = {} as Record<AbilityKey, number>;
      (Object.keys(newAssignments) as AbilityKey[]).forEach(k => {
        scores[k] = rolls[newAssignments[k]!].score;
      });
      onAssign(scores);
    }
  };

  const assignedIndices = new Set(Object.values(assignments));

  return (
    <div>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <button
          onClick={doRoll}
          disabled={rolling}
          style={{
            background: '#8B1A1A', color: '#F4E4BC',
            border: '2px solid #2D1B00', borderRadius: 6,
            padding: '12px 32px', fontSize: 16,
            fontFamily: "'Cinzel', serif", cursor: rolling ? 'wait' : 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          {rolling ? '🎲 Rolling...' : '🎲 Roll Ability Scores'}
        </button>
        <p style={{ color: '#5A3E1B', fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
          Rolls 4d6, drops the lowest die for each score
        </p>
      </div>

      {rolls.length > 0 && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Rolled results tray */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#5A3E1B', marginBottom: 8 }}>
              ROLLED RESULTS — drag to an ability slot
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {rolls.map((roll, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  style={{
                    background: assignedIndices.has(i) ? '#EDD9A3' : '#F4E4BC',
                    border: `2px solid ${assignedIndices.has(i) ? '#8B6914' : '#2D1B00'}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    cursor: 'grab',
                    textAlign: 'center',
                    opacity: assignedIndices.has(i) ? 0.5 : 1,
                    minWidth: 80,
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cinzel', serif", color: '#2D1B00' }}>
                    {roll.score}
                  </div>
                  <div style={{ fontSize: 11, color: '#5A3E1B', marginTop: 4 }}>
                    [{roll.keptRolls.join('+')}]
                  </div>
                  <div style={{ fontSize: 10, color: '#8B6914', marginTop: 2 }}>
                    dropped: {Math.min(...roll.allRolls)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment slots */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ABILITY_LABELS.map(({ key, abbr, label }) => {
              const assignedIdx = assignments[key];
              const score = assignedIdx !== undefined ? rolls[assignedIdx].score : null;
              return (
                <div
                  key={key}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => dragIdx !== null && handleDrop(key, dragIdx)}
                  style={{
                    background: score !== null ? '#FFF8E7' : '#EDD9A3',
                    border: `2px dashed ${score !== null ? '#C9A227' : '#5A3E1B'}`,
                    borderRadius: 6,
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 48,
                  }}
                >
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#5A3E1B', minWidth: 36 }}>{abbr}</span>
                  <span style={{ flex: 1, fontSize: 12, color: '#8B6914' }}>{label}</span>
                  {score !== null ? (
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: '#2D1B00' }}>
                      {score} <span style={{ fontSize: 13, color: '#5A3E1B' }}>({modStr(getAbilityModifier(score))})</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#8B6914', fontStyle: 'italic' }}>Drop here</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Standard Array Method ────────────────────────────────────────────────────

function StandardArrayMethod({ onAssign }: { onAssign: (scores: Record<AbilityKey, number>) => void }) {
  const array = standardArray(); // [15, 14, 13, 12, 10, 8]
  const [assignments, setAssignments] = useState<Partial<Record<AbilityKey, number>>>({});
  const [dragValue, setDragValue] = useState<number | null>(null);

  const assignedValues = Object.values(assignments);
  const availableValues = array.filter(v => !assignedValues.includes(v));

  const handleDrop = (abilityKey: AbilityKey) => {
    if (dragValue === null) return;
    const newAssignments = { ...assignments };
    // Remove from prior slot
    (Object.keys(newAssignments) as AbilityKey[]).forEach(k => {
      if (newAssignments[k] === dragValue) delete newAssignments[k];
    });
    newAssignments[abilityKey] = dragValue;
    setAssignments(newAssignments);
    if (Object.keys(newAssignments).length === 6) {
      onAssign(newAssignments as Record<AbilityKey, number>);
    }
  };

  const clearSlot = (key: AbilityKey) => {
    const next = { ...assignments };
    delete next[key];
    setAssignments(next);
  };

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {/* Value chips tray */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#5A3E1B', marginBottom: 8 }}>
          STANDARD ARRAY — drag each value to an ability
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {array.map(v => {
            const used = assignedValues.includes(v);
            return (
              <div
                key={v}
                draggable={!used}
                onDragStart={() => setDragValue(v)}
                style={{
                  background: used ? '#EDD9A3' : '#2D1B00',
                  color: used ? '#8B6914' : '#C9A227',
                  border: `2px solid ${used ? '#8B6914' : '#C9A227'}`,
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "'Cinzel', serif",
                  cursor: used ? 'default' : 'grab',
                  opacity: used ? 0.4 : 1,
                  minWidth: 56,
                  textAlign: 'center',
                  userSelect: 'none',
                }}
              >
                {v}
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: '#5A3E1B', fontStyle: 'italic' }}>
          {availableValues.length} values remaining to assign
        </p>
      </div>

      {/* Ability slots */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ABILITY_LABELS.map(({ key, abbr, label }) => {
          const value = assignments[key];
          return (
            <div
              key={key}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(key)}
              style={{
                background: value !== undefined ? '#FFF8E7' : '#EDD9A3',
                border: `2px dashed ${value !== undefined ? '#C9A227' : '#5A3E1B'}`,
                borderRadius: 6,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#5A3E1B', minWidth: 36 }}>{abbr}</span>
              <span style={{ flex: 1, fontSize: 12, color: '#8B6914' }}>{label}</span>
              {value !== undefined ? (
                <>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: '#2D1B00' }}>
                    {value} <span style={{ fontSize: 13, color: '#5A3E1B' }}>({modStr(getAbilityModifier(value))})</span>
                  </span>
                  <button
                    onClick={() => clearSlot(key)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B6914', fontSize: 16 }}
                  >✕</button>
                </>
              ) : (
                <span style={{ fontSize: 12, color: '#8B6914', fontStyle: 'italic' }}>Drop here</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Point Buy Method ─────────────────────────────────────────────────────────

function PointBuyMethod({ onAssign }: { onAssign: (scores: Record<AbilityKey, number>) => void }) {
  const [scores, setScores] = useState<Record<AbilityKey, number>>({ ...DEFAULT_SCORES });

  const spent = pointBuySpent(scores);
  const remaining = POINT_BUY_BUDGET - spent;

  const changeScore = (key: AbilityKey, delta: number) => {
    const current = scores[key];
    const next = current + delta;
    if (next < POINT_BUY_MIN || next > POINT_BUY_MAX) return;
    const nextSpent = spent - pointBuyCost(current) + pointBuyCost(next);
    if (nextSpent > POINT_BUY_BUDGET) return;
    const newScores = { ...scores, [key]: next };
    setScores(newScores);
    if (Object.values(newScores).every(v => v >= POINT_BUY_MIN)) {
      onAssign(newScores);
    }
  };

  return (
    <div>
      <div style={{
        background: '#2D1B00', color: '#C9A227',
        borderRadius: 6, padding: '10px 20px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20,
        marginBottom: 20, fontFamily: "'Cinzel', serif",
      }}>
        <span style={{ fontSize: 14 }}>Points Remaining:</span>
        <span style={{ fontSize: 28, fontWeight: 700, color: remaining < 5 ? '#FF6666' : '#C9A227' }}>
          {remaining}
        </span>
        <span style={{ fontSize: 14 }}>/ {POINT_BUY_BUDGET}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ABILITY_LABELS.map(({ key, abbr, label }) => {
          const score = scores[key];
          const mod = getAbilityModifier(score);
          const cost = pointBuyCost(score);
          const canUp = score < POINT_BUY_MAX && (spent - cost + pointBuyCost(score + 1)) <= POINT_BUY_BUDGET;
          const canDown = score > POINT_BUY_MIN;

          return (
            <div
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#EDD9A3', border: '1px solid #2D1B00',
                borderRadius: 6, padding: '10px 16px',
              }}
            >
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: '#5A3E1B', minWidth: 36 }}>{abbr}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#2D1B00' }}>{label}</span>

              <button
                onClick={() => changeScore(key, -1)}
                disabled={!canDown}
                style={{
                  background: canDown ? '#8B1A1A' : '#EDD9A3',
                  color: canDown ? '#F4E4BC' : '#8B6914',
                  border: '1px solid #2D1B00',
                  borderRadius: 4, width: 30, height: 30,
                  cursor: canDown ? 'pointer' : 'not-allowed',
                  fontSize: 18, lineHeight: 1,
                }}
              >−</button>

              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color: '#2D1B00' }}>
                  {score}
                </div>
                <div style={{ fontSize: 12, color: '#5A3E1B' }}>{modStr(mod)}</div>
              </div>

              <button
                onClick={() => changeScore(key, 1)}
                disabled={!canUp}
                style={{
                  background: canUp ? '#2D5016' : '#EDD9A3',
                  color: canUp ? '#F4E4BC' : '#8B6914',
                  border: '1px solid #2D1B00',
                  borderRadius: 4, width: 30, height: 30,
                  cursor: canUp ? 'pointer' : 'not-allowed',
                  fontSize: 18, lineHeight: 1,
                }}
              >+</button>

              <span style={{ fontSize: 12, color: '#8B6914', minWidth: 40, textAlign: 'right' }}>
                cost: {cost}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, padding: '10px 16px', background: '#EDD9A3', borderRadius: 6, fontSize: 12, color: '#5A3E1B' }}>
        <strong style={{ fontFamily: "'Cinzel', serif" }}>Cost Table:</strong>{' '}
        8=0 · 9=1 · 10=2 · 11=3 · 12=4 · 13=5 · 14=7 · 15=9
      </div>
    </div>
  );
}

// ─── Main Step ────────────────────────────────────────────────────────────────

export default function Step5_AbilityScores({ character, updateCharacter, onReady }: Step5Props) {
  const [method, setMethod] = useState<Method>('array');

  const handleAssign = useCallback((scores: Record<AbilityKey, number>) => {
    updateCharacter({ abilityScores: scores });
    onReady(true);
  }, [updateCharacter, onReady]);

  const methodBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#2D1B00' : '#EDD9A3',
    color: active ? '#C9A227' : '#5A3E1B',
    border: `2px solid ${active ? '#C9A227' : '#2D1B00'}`,
    borderRadius: 6,
    padding: '8px 20px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 13,
    letterSpacing: '0.03em',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 24, marginBottom: 4, textAlign: 'center' }}>
        Ability Scores
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 20, fontSize: 14 }}>
        Choose your generation method, then assign scores to abilities.
      </p>

      {/* Method Tabs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
        <button style={methodBtnStyle(method === 'roll')} onClick={() => setMethod('roll')}>
          🎲 Roll (4d6 drop lowest)
        </button>
        <button style={methodBtnStyle(method === 'array')} onClick={() => setMethod('array')}>
          📋 Standard Array
        </button>
        <button style={methodBtnStyle(method === 'pointbuy')} onClick={() => setMethod('pointbuy')}>
          💰 Point Buy (27 pts)
        </button>
      </div>

      {method === 'roll' && <RollMethod onAssign={handleAssign} />}
      {method === 'array' && <StandardArrayMethod onAssign={handleAssign} />}
      {method === 'pointbuy' && <PointBuyMethod onAssign={handleAssign} />}
    </div>
  );
}

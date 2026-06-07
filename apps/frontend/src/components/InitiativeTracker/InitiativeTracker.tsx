import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { socketEmit } from '@/lib/socket';
import CombatantRow from './CombatantRow';
import type { Combatant } from '@/stores/gameStore';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function InitiativeTracker() {
  const initiative = useGameStore((s) => s.initiative);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const inCombat = useGameStore((s) => s.inCombat);
  const setInitiative = useGameStore((s) => s.setInitiative);
  const setInCombat = useGameStore((s) => s.setInCombat);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const isDM = useSessionStore((s) => s.isDM);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInitiative, setNewInitiative] = useState('');
  const [newHp, setNewHp] = useState('');
  const [newAc, setNewAc] = useState('');

  const handleNextTurn = () => {
    nextTurn();
    socketEmit.initiativeNext();
  };

  const handleStartCombat = () => {
    setInCombat(true);
    socketEmit.combatStart();
  };

  const handleEndCombat = () => {
    setInCombat(false);
    socketEmit.combatEnd();
  };

  const handleAddCombatant = () => {
    if (!newName.trim()) return;

    const combatant: Combatant = {
      id: generateId(),
      tokenId: '',
      name: newName.trim(),
      initiative: parseInt(newInitiative) || 0,
      hp: parseInt(newHp) || 10,
      maxHp: parseInt(newHp) || 10,
      ac: parseInt(newAc) || 10,
      colour: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      conditions: [],
      isPlayer: false,
    };

    const sorted = [...initiative, combatant].sort((a, b) => b.initiative - a.initiative);
    setInitiative(sorted);
    socketEmit.initiativeSet(sorted);
    setNewName('');
    setNewInitiative('');
    setNewHp('');
    setNewAc('');
    setShowAddForm(false);
  };

  const handleRemoveCombatant = (id: string) => {
    const updated = initiative.filter((c) => c.id !== id);
    setInitiative(updated);
    socketEmit.initiativeSet(updated);
  };

  const sortedByInitiative = [...initiative].sort((a, b) => b.initiative - a.initiative);
  const currentCombatant = sortedByInitiative[currentTurnIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="section-header flex items-center justify-between">
        <span>⚔️ Initiative</span>
        {inCombat && (
          <span className="text-xs" style={{ color: 'rgba(201,162,39,0.7)' }}>
            Round {Math.floor(currentTurnIndex / Math.max(initiative.length, 1)) + 1}
          </span>
        )}
      </div>

      {/* Current turn banner */}
      {inCombat && currentCombatant && (
        <div
          className="px-3 py-1.5 text-center font-cinzel text-xs font-semibold"
          style={{
            background: 'rgba(201,162,39,0.15)',
            borderBottom: '1px solid rgba(201,162,39,0.3)',
            color: '#c9a227',
            textShadow: '0 0 8px rgba(201,162,39,0.5)',
          }}
        >
          {currentCombatant.name}'s Turn
        </div>
      )}

      {/* Combatant list */}
      <div className="flex-1 overflow-y-auto">
        {sortedByInitiative.length === 0 ? (
          <div
            className="p-4 text-center font-crimson italic text-sm"
            style={{ color: 'rgba(244,228,188,0.4)' }}
          >
            {isDM ? 'Add combatants to begin tracking' : 'Waiting for DM to set initiative...'}
          </div>
        ) : (
          sortedByInitiative.map((combatant, i) => (
            <div key={combatant.id} className="relative group">
              <CombatantRow
                combatant={combatant}
                isCurrentTurn={inCombat && i === currentTurnIndex}
                index={i}
              />
              {isDM && (
                <button
                  onClick={() => handleRemoveCombatant(combatant.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm"
                  style={{
                    background: 'rgba(139,26,26,0.7)',
                    color: '#f4e4bc',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title="Remove combatant"
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* DM controls */}
      {isDM && (
        <div
          className="p-2 flex flex-col gap-2"
          style={{ borderTop: '1px solid rgba(201,162,39,0.2)' }}
        >
          {/* Add combatant form */}
          {showAddForm && (
            <div
              className="p-2 rounded-sm flex flex-col gap-1.5"
              style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.2)' }}
            >
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-tavern text-sm py-1"
              />
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="number"
                  placeholder="Init"
                  value={newInitiative}
                  onChange={(e) => setNewInitiative(e.target.value)}
                  className="input-tavern text-sm py-1 text-center"
                />
                <input
                  type="number"
                  placeholder="HP"
                  value={newHp}
                  onChange={(e) => setNewHp(e.target.value)}
                  className="input-tavern text-sm py-1 text-center"
                />
                <input
                  type="number"
                  placeholder="AC"
                  value={newAc}
                  onChange={(e) => setNewAc(e.target.value)}
                  className="input-tavern text-sm py-1 text-center"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleAddCombatant}
                  className="flex-1 font-cinzel text-xs py-1 uppercase tracking-wider"
                  style={{
                    background: '#2d5016',
                    color: '#f4e4bc',
                    border: '1px solid #3d6b1e',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="font-cinzel text-xs px-2 py-1"
                  style={{
                    background: 'rgba(139,26,26,0.5)',
                    color: '#f4e4bc',
                    border: '1px solid rgba(139,26,26,0.8)',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-1">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 font-cinzel text-xs py-1.5 uppercase tracking-wider"
              style={{
                background: 'rgba(201,162,39,0.15)',
                color: '#c9a227',
                border: '1px solid rgba(201,162,39,0.4)',
                cursor: 'pointer',
              }}
            >
              + Add
            </button>

            {!inCombat ? (
              <button
                onClick={handleStartCombat}
                disabled={initiative.length === 0}
                className="flex-1 font-cinzel text-xs py-1.5 uppercase tracking-wider"
                style={{
                  background: initiative.length > 0 ? '#2d5016' : 'rgba(45,80,22,0.3)',
                  color: initiative.length > 0 ? '#f4e4bc' : 'rgba(244,228,188,0.4)',
                  border: '1px solid rgba(45,80,22,0.6)',
                  cursor: initiative.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                ⚔️ Start
              </button>
            ) : (
              <>
                <button
                  onClick={handleNextTurn}
                  className="flex-1 font-cinzel text-xs py-1.5 uppercase tracking-wider"
                  style={{
                    background: '#c9a227',
                    color: '#2d1b00',
                    border: '1px solid #a8831a',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Next ▶
                </button>
                <button
                  onClick={handleEndCombat}
                  className="font-cinzel text-xs px-2 py-1.5"
                  style={{
                    background: 'rgba(139,26,26,0.5)',
                    color: '#f4e4bc',
                    border: '1px solid rgba(139,26,26,0.8)',
                    cursor: 'pointer',
                  }}
                >
                  End
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

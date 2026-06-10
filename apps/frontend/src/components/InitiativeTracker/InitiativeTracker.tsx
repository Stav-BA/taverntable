import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { socketEmit, getSocket } from '@/lib/socket';
import CombatantRow from './CombatantRow';
import PlayerInitiativeModal from './PlayerInitiativeModal';
import type { Combatant } from '@/stores/gameStore';

// ── Types ─────────────────────────────────────────────────────────────────────

type RollEntry = {
  id: string;
  name: string;
  colour: string;
  isPlayer: boolean;
  isEnemy: boolean;
  dexMod: number;
  roll: number | null;
  surprised: boolean;
  hp: number;
  maxHp: number;
  ac: number;
  speed: number;
};

type PlayerSubmission = {
  id: string;
  name: string;
  roll: number;
  dexMod: number;
  total: number;
  isMonster: boolean;
  colour: string;
  hp: number;
  maxHp: number;
  ac: number;
  isPlayer: boolean;
  speed?: number;
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollWithAdvantage(): number {
  return Math.max(rollD20(), rollD20());
}

function rollWithDisadvantage(): number {
  return Math.min(rollD20(), rollD20());
}

// Silence unused-var warnings for the helpers that may be used later
void rollWithAdvantage;

function makeCombatant(overrides: Partial<Combatant> & { name: string }): Combatant {
  return {
    id: generateId(),
    tokenId: '',
    name: overrides.name,
    initiative: overrides.initiative ?? 0,
    hp: overrides.hp ?? 10,
    maxHp: overrides.maxHp ?? 10,
    ac: overrides.ac ?? 10,
    colour: overrides.colour ?? `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
    conditions: [],
    isPlayer: overrides.isPlayer ?? false,
    dexMod: overrides.dexMod ?? 0,
    initiativeRoll: overrides.initiativeRoll ?? 0,
    actionUsed: false,
    bonusActionUsed: false,
    reactionUsed: false,
    movementUsed: 0,
    speed: overrides.speed ?? 30,
    isEnemy: overrides.isEnemy ?? false,
    surprised: overrides.surprised ?? false,
  };
}

// ── Initiative Roll Modal ─────────────────────────────────────────────────────

function InitiativeRollModal({
  tokens,
  playerSubmissions,
  onRequestRolls,
  onConfirm,
  onCancel,
}: {
  tokens: Array<{ id: string; name: string; colour: string; isPlayer: boolean; hp: number; maxHp: number; ac: number }>;
  playerSubmissions?: Array<{ id: string; name: string; roll: number; dexMod: number; total: number; colour: string }>;
  onRequestRolls?: () => void;
  onConfirm: (entries: RollEntry[]) => void;
  onCancel: () => void;
}) {
  const [entries, setEntries] = useState<RollEntry[]>(() =>
    tokens.map((t) => ({
      id: t.id,
      name: t.name,
      colour: t.colour,
      isPlayer: t.isPlayer,
      isEnemy: !t.isPlayer,
      dexMod: 0,
      roll: null,
      surprised: false,
      hp: t.hp,
      maxHp: t.maxHp,
      ac: t.ac,
      speed: 30,
    }))
  );

  // Auto-fill player entries when their submissions arrive from the server
  useEffect(() => {
    if (!playerSubmissions || playerSubmissions.length === 0) return;
    setEntries((prev) =>
      prev.map((e) => {
        const sub = playerSubmissions.find((ps) => ps.id === e.id);
        if (sub && e.roll === null) {
          return { ...e, roll: sub.roll, dexMod: sub.dexMod };
        }
        return e;
      })
    );
  }, [playerSubmissions]);

  const [showAddNpc, setShowAddNpc] = useState(false);
  const [npcName, setNpcName] = useState('');
  const [npcHp, setNpcHp] = useState('10');
  const [npcAc, setNpcAc] = useState('10');

  const update = (id: string, patch: Partial<RollEntry>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const handleRoll = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const roll = entry.surprised ? rollWithDisadvantage() : rollD20();
    update(id, { roll });
  };

  const handleRollAll = () => {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        roll: e.surprised ? rollWithDisadvantage() : rollD20(),
      }))
    );
  };

  const handleAddNpc = () => {
    if (!npcName.trim()) return;
    const newEntry: RollEntry = {
      id: generateId(),
      name: npcName.trim(),
      colour: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      isPlayer: false,
      isEnemy: true,
      dexMod: 0,
      roll: null,
      surprised: false,
      hp: parseInt(npcHp) || 10,
      maxHp: parseInt(npcHp) || 10,
      ac: parseInt(npcAc) || 10,
      speed: 30,
    };
    setEntries((prev) => [...prev, newEntry]);
    setNpcName('');
    setNpcHp('10');
    setNpcAc('10');
    setShowAddNpc(false);
  };

  const handleRemove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const allRolled = entries.every((e) => e.roll !== null);

  const handleConfirm = () => {
    onConfirm(entries.filter((e) => e.roll !== null));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(10,5,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#1a0f00',
          border: '2px solid rgba(201,162,39,0.5)',
          borderRadius: 4,
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(201,162,39,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem', color: '#c9a227', margin: 0, flexShrink: 0 }}>
            Roll Initiative
          </h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {onRequestRolls && (
              <button
                onClick={onRequestRolls}
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.65rem',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  background: 'rgba(100,50,200,0.2)',
                  color: '#bb99ff',
                  border: '1px solid rgba(150,100,255,0.5)',
                  borderRadius: 2,
                  marginRight: 4,
                }}
              >
                Request Player Rolls
              </button>
            )}
            <button
              onClick={handleRollAll}
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '0.65rem',
                padding: '4px 10px',
                cursor: 'pointer',
                background: 'rgba(201,162,39,0.2)',
                color: '#c9a227',
                border: '1px solid rgba(201,162,39,0.5)',
                borderRadius: 2,
              }}
            >
              Roll All
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 44px 52px 52px 52px 28px',
            gap: 4,
            padding: '4px 16px',
            borderBottom: '1px solid rgba(201,162,39,0.15)',
          }}
        >
          {['Name', 'Roll', 'Dex Mod', 'Final', 'Surp.', ''].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '0.55rem',
                color: 'rgba(201,162,39,0.6)',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Entries */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {entries.map((e) => {
            const final = e.roll !== null ? e.roll + e.dexMod : null;
            return (
              <div
                key={e.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 44px 52px 52px 52px 28px',
                  gap: 4,
                  padding: '5px 16px',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(45,27,0,0.5)',
                }}
              >
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: e.colour,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'Cinzel, serif',
                      fontSize: '0.65rem',
                      color: '#f4e4bc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {e.name}
                  </span>
                </div>

                {/* Roll */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <input
                    type="number"
                    value={e.roll ?? ''}
                    onChange={(ev) => update(e.id, { roll: parseInt(ev.target.value) || null })}
                    placeholder="—"
                    style={{
                      width: 28,
                      textAlign: 'center',
                      background: 'rgba(45,27,0,0.6)',
                      border: '1px solid rgba(201,162,39,0.3)',
                      color: '#f4e4bc',
                      fontFamily: 'Cinzel, serif',
                      fontSize: '0.65rem',
                      padding: '2px',
                      borderRadius: 2,
                    }}
                  />
                  <button
                    onClick={() => handleRoll(e.id)}
                    title="Roll d20"
                    style={{
                      width: 14,
                      height: 18,
                      fontSize: '0.5rem',
                      cursor: 'pointer',
                      background: 'rgba(201,162,39,0.2)',
                      border: '1px solid rgba(201,162,39,0.4)',
                      color: '#c9a227',
                      borderRadius: 2,
                      padding: 0,
                    }}
                  >
                    d
                  </button>
                </div>

                {/* Dex mod */}
                <input
                  type="number"
                  value={e.dexMod}
                  onChange={(ev) => update(e.id, { dexMod: parseInt(ev.target.value) || 0 })}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    background: 'rgba(45,27,0,0.6)',
                    border: '1px solid rgba(201,162,39,0.2)',
                    color: '#f4e4bc',
                    fontFamily: 'Cinzel, serif',
                    fontSize: '0.65rem',
                    padding: '2px',
                    borderRadius: 2,
                  }}
                />

                {/* Final score */}
                <span
                  style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: final !== null ? '#c9a227' : 'rgba(201,162,39,0.3)',
                    textAlign: 'center',
                  }}
                >
                  {final ?? '—'}
                </span>

                {/* Surprised checkbox */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={e.surprised}
                    onChange={(ev) => update(e.id, { surprised: ev.target.checked })}
                    title="Surprised (rolls with disadvantage)"
                    style={{ cursor: 'pointer', accentColor: '#c9a227' }}
                  />
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(e.id)}
                  style={{
                    width: 18,
                    height: 18,
                    fontSize: '0.6rem',
                    cursor: 'pointer',
                    background: 'rgba(139,26,26,0.4)',
                    border: 'none',
                    color: '#f4e4bc',
                    borderRadius: 2,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}

          {/* Player submissions panel */}
          {playerSubmissions && playerSubmissions.length > 0 && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(201,162,39,0.2)' }}>
              <p style={{
                fontFamily: 'Cinzel, serif', fontSize: '0.6rem',
                color: 'rgba(201,162,39,0.6)', marginBottom: 6, letterSpacing: '0.1em',
              }}>
                PLAYER ROLLS
              </p>
              {playerSubmissions.map(ps => (
                <div key={ps.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ps.colour, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: '#f4e4bc', flex: 1 }}>
                    {ps.name}
                  </span>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.75rem', fontWeight: 700, color: '#c9a227' }}>
                    {ps.total}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add NPC row */}
          {showAddNpc && (
            <div style={{ padding: '8px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="NPC name"
                value={npcName}
                onChange={(e) => setNpcName(e.target.value)}
                className="input-tavern"
                style={{ flex: 1, fontSize: '0.7rem', padding: '3px 6px' }}
              />
              <input
                type="number"
                placeholder="HP"
                value={npcHp}
                onChange={(e) => setNpcHp(e.target.value)}
                className="input-tavern"
                style={{ width: 44, textAlign: 'center', fontSize: '0.7rem', padding: '3px 4px' }}
              />
              <input
                type="number"
                placeholder="AC"
                value={npcAc}
                onChange={(e) => setNpcAc(e.target.value)}
                className="input-tavern"
                style={{ width: 44, textAlign: 'center', fontSize: '0.7rem', padding: '3px 4px' }}
              />
              <button
                onClick={handleAddNpc}
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.6rem',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  background: '#2d5016',
                  color: '#f4e4bc',
                  border: '1px solid #3d6b1e',
                  borderRadius: 2,
                }}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddNpc(false)}
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.6rem',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  background: 'rgba(139,26,26,0.5)',
                  color: '#f4e4bc',
                  border: '1px solid rgba(139,26,26,0.8)',
                  borderRadius: 2,
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(201,162,39,0.3)',
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            onClick={() => setShowAddNpc(true)}
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.65rem',
              padding: '5px 12px',
              cursor: 'pointer',
              background: 'rgba(45,27,0,0.6)',
              color: 'rgba(244,228,188,0.7)',
              border: '1px solid rgba(201,162,39,0.3)',
              borderRadius: 2,
            }}
          >
            + NPC
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onCancel}
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.65rem',
              padding: '5px 12px',
              cursor: 'pointer',
              background: 'rgba(139,26,26,0.4)',
              color: '#f4e4bc',
              border: '1px solid rgba(139,26,26,0.6)',
              borderRadius: 2,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allRolled}
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '5px 14px',
              cursor: allRolled ? 'pointer' : 'not-allowed',
              background: allRolled ? '#c9a227' : 'rgba(201,162,39,0.2)',
              color: allRolled ? '#1a0f00' : 'rgba(201,162,39,0.4)',
              border: `1px solid ${allRolled ? '#a8831a' : 'rgba(201,162,39,0.3)'}`,
              borderRadius: 2,
            }}
          >
            Begin Combat
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main InitiativeTracker ────────────────────────────────────────────────────

export default function InitiativeTracker() {
  const initiative = useGameStore((s) => s.initiative);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const inCombat = useGameStore((s) => s.inCombat);
  const round = useGameStore((s) => s.round);
  const tokens = useGameStore((s) => s.tokens);
  const setInitiative = useGameStore((s) => s.setInitiative);
  const setInCombat = useGameStore((s) => s.setInCombat);
  const setRound = useGameStore((s) => s.setRound);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const updateCombatant = useGameStore((s) => s.updateCombatant);
  const isDM = useSessionStore((s) => s.isDM);

  const [showRollModal, setShowRollModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [submissions, setSubmissions] = useState<PlayerSubmission[]>([]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // DM only: open roll modal when encounter is launched via backend event
    const onRequested = () => {
      if (isDM) setShowRollModal(true);
    };
    socket.on('initiative:requested', onRequested);

    // ALL clients: DM started the roll phase — players open their roll modal
    const onRollRequest = () => {
      if (!isDM) setShowPlayerModal(true);
    };
    socket.on('initiative:roll_request', onRollRequest);

    // DM only: live update of submissions from players
    const onSubmissionUpdate = (payload: { submissions: PlayerSubmission[] }) => {
      if (isDM) setSubmissions(payload.submissions);
    };
    socket.on('initiative:submission_update', onSubmissionUpdate);

    // ALL clients: final sorted initiative order from backend
    const onReady = (sorted: unknown[]) => {
      const combatants = (sorted as Array<Record<string, unknown>>).map((e) =>
        makeCombatant({
          id: (e.id as string) || generateId(),
          tokenId: e.id as string,
          name: e.name as string,
          initiative: ((e.roll as number) ?? 0) + ((e.dexMod as number) ?? 0),
          initiativeRoll: (e.roll as number) ?? 0,
          dexMod: (e.dexMod as number) ?? 0,
          hp: e.hp as number,
          maxHp: e.maxHp as number,
          ac: e.ac as number,
          colour: e.colour as string,
          isPlayer: (e.isPlayer as boolean) ?? false,
          isEnemy: (e.isEnemy as boolean) ?? !(e.isPlayer as boolean),
          surprised: (e.surprised as boolean) ?? false,
          speed: (e.speed as number) ?? 30,
        })
      );
      setInitiative(combatants);
      setInCombat(true);
      setRound(1);
      setShowRollModal(false);
      setShowPlayerModal(false);
    };
    socket.on('initiative:ready', onReady);

    return () => {
      socket.off('initiative:requested', onRequested);
      socket.off('initiative:roll_request', onRollRequest);
      socket.off('initiative:submission_update', onSubmissionUpdate);
      socket.off('initiative:ready', onReady);
    };
  }, [isDM, setInitiative, setInCombat, setRound]);

  const handleRollInitiative = () => setShowRollModal(true);

  const handleModalConfirm = (entries: RollEntry[]) => {
    // Merge any player submissions that the modal may not have received via useEffect
    const mergedEntries = entries.map((e) => {
      if (e.isPlayer && e.roll === null) {
        const sub = submissions.find((s) => s.id === e.id && s.isPlayer);
        if (sub) return { ...e, roll: sub.roll, dexMod: sub.dexMod };
      }
      return e;
    });

    const combatantsPayload = mergedEntries.map((e) => ({
      id: e.id,
      name: e.name,
      roll: e.roll ?? 0,
      dexMod: e.dexMod,
      hp: e.hp,
      maxHp: e.maxHp,
      ac: e.ac,
      colour: e.colour,
      isPlayer: e.isPlayer,
      isEnemy: !e.isPlayer,
      surprised: e.surprised,
      speed: e.speed ?? 30,
    }));
    const socket = getSocket();
    if (socket) {
      // Backend sorts and broadcasts initiative:ready to all clients
      socket.emit('initiative:finalize', { combatants: combatantsPayload });
    }
    socketEmit.combatStart();
    setShowRollModal(false);
  };

  const handleEndCombat = () => {
    setInCombat(false);
    setRound(0);
    setInitiative([]);
    socketEmit.combatEnd();
    socketEmit.initiativeSet([]);
  };

  const handleNextTurn = () => {
    const current = initiative[currentTurnIndex];
    if (current) {
      updateCombatant(current.id, {
        actionUsed: false,
        bonusActionUsed: false,
        reactionUsed: false,
        movementUsed: 0,
      });
      socketEmit.initiativeUpdate(current.id, {
        actionUsed: false,
        bonusActionUsed: false,
        reactionUsed: false,
        movementUsed: 0,
      });
    }
    nextTurn();
    socketEmit.initiativeNext();
  };

  const handleRemoveCombatant = (id: string) => {
    const updated = initiative.filter((c) => c.id !== id);
    setInitiative(updated);
    socketEmit.initiativeSet(updated);
  };

  const currentCombatant = initiative[currentTurnIndex];

  const tokenList = tokens.map((t) => ({
    id: t.id,
    name: t.name,
    colour: t.colour,
    isPlayer: t.isPlayer,
    hp: t.hp,
    maxHp: t.maxHp,
    ac: t.ac,
  }));

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="section-header flex items-center justify-between" style={{ flexShrink: 0 }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Initiative
        </span>
        {inCombat && round > 0 && (
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: 'rgba(201,162,39,0.7)' }}>
            Round {round}
          </span>
        )}
      </div>

      {/* Current turn banner */}
      {inCombat && currentCombatant && (
        <div
          style={{
            padding: '5px 12px',
            textAlign: 'center',
            fontFamily: 'Cinzel, serif',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: 'rgba(201,162,39,0.12)',
            borderBottom: '1px solid rgba(201,162,39,0.25)',
            color: '#c9a227',
            textShadow: '0 0 8px rgba(201,162,39,0.5)',
            flexShrink: 0,
          }}
        >
          {currentCombatant.name}'s Turn
        </div>
      )}

      {/* Pre-combat — DM roll button */}
      {!inCombat && isDM && (
        <div style={{ padding: '8px', flexShrink: 0 }}>
          <button
            onClick={handleRollInitiative}
            style={{
              width: '100%',
              fontFamily: 'Cinzel, serif',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '8px',
              cursor: 'pointer',
              background: 'rgba(201,162,39,0.15)',
              color: '#c9a227',
              border: '1px solid rgba(201,162,39,0.5)',
              borderRadius: 2,
              boxShadow: '0 0 12px rgba(201,162,39,0.1)',
            }}
          >
            Roll Initiative
          </button>
        </div>
      )}

      {/* Combatant list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {initiative.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              fontFamily: 'Crimson Text, Georgia, serif',
              fontStyle: 'italic',
              fontSize: '0.8rem',
              color: 'rgba(244,228,188,0.4)',
            }}
          >
            {isDM ? 'Click "Roll Initiative" to begin combat' : 'Waiting for DM to set initiative...'}
          </div>
        ) : (
          initiative.map((combatant, i) => (
            <div key={combatant.id} style={{ position: 'relative' }}>
              <CombatantRow
                combatant={combatant}
                isCurrentTurn={inCombat && i === currentTurnIndex}
                index={i}
                onEndTurn={inCombat && i === currentTurnIndex ? handleNextTurn : undefined}
              />
              {isDM && (
                <button
                  onClick={() => handleRemoveCombatant(combatant.id)}
                  style={{
                    position: 'absolute',
                    right: 4,
                    top: 4,
                    width: 16,
                    height: 16,
                    fontSize: '0.55rem',
                    opacity: 0,
                    cursor: 'pointer',
                    background: 'rgba(139,26,26,0.7)',
                    color: '#f4e4bc',
                    border: 'none',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="group-hover:opacity-100"
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                  title="Remove combatant"
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* DM in-combat controls */}
      {isDM && inCombat && (
        <div
          style={{
            padding: '8px',
            borderTop: '1px solid rgba(201,162,39,0.2)',
            display: 'flex',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleNextTurn}
            style={{
              flex: 1,
              fontFamily: 'Cinzel, serif',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '6px',
              cursor: 'pointer',
              background: '#c9a227',
              color: '#1a0f00',
              border: '1px solid #a8831a',
              borderRadius: 2,
            }}
          >
            Next Turn
          </button>
          <button
            onClick={handleEndCombat}
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.65rem',
              padding: '6px 10px',
              cursor: 'pointer',
              background: 'rgba(139,26,26,0.5)',
              color: '#f4e4bc',
              border: '1px solid rgba(139,26,26,0.8)',
              borderRadius: 2,
            }}
          >
            End Combat
          </button>
        </div>
      )}

      {/* Roll Initiative Modal (DM) */}
      {showRollModal && (
        <InitiativeRollModal
          tokens={tokenList}
          playerSubmissions={submissions
            .filter((s) => s.isPlayer)
            .map((s) => ({ id: s.id, name: s.name, roll: s.roll, dexMod: s.dexMod, total: s.total, colour: s.colour }))}
          onRequestRolls={() => {
            const socket = getSocket();
            if (!socket) return;
            const monsters = tokenList.filter((t) => !t.isPlayer);
            const playerCount = tokenList.filter((t) => t.isPlayer).length;
            socket.emit('initiative:start_roll', { monsters, expectedPlayerCount: playerCount });
          }}
          onConfirm={handleModalConfirm}
          onCancel={() => setShowRollModal(false)}
        />
      )}

      {/* Player initiative roll modal */}
      {showPlayerModal && (
        <PlayerInitiativeModal onClose={() => setShowPlayerModal(false)} />
      )}
    </div>
  );
}

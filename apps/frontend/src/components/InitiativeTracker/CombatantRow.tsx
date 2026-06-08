import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { socketEmit } from '@/lib/socket';
import type { Combatant } from '@/stores/gameStore';

interface Props {
  combatant: Combatant;
  isCurrentTurn: boolean;
  index: number;
  onEndTurn?: () => void;
}

const CONDITION_ICONS: Record<string, string> = {
  blinded: '👁',
  charmed: '💕',
  deafened: '👂',
  frightened: '😱',
  grappled: '🤜',
  incapacitated: '💤',
  invisible: '👻',
  paralyzed: '⚡',
  petrified: '🪨',
  poisoned: '☠',
  prone: '⬇',
  restrained: '⛓',
  stunned: '💫',
  unconscious: '💀',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const colour = pct > 0.6 ? '#2d8a2d' : pct > 0.3 ? '#c9a227' : '#8b1a1a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          minWidth: 32,
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            background: colour,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '0.6rem',
          color: colour,
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {hp}/{maxHp}
      </span>
    </div>
  );
}

function ActionBadge({ label, used }: { label: string; used: boolean }) {
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        borderRadius: 2,
        fontSize: '0.55rem',
        fontFamily: 'Cinzel, serif',
        fontWeight: 700,
        background: used ? 'rgba(45,27,0,0.4)' : 'rgba(201,162,39,0.2)',
        color: used ? 'rgba(201,162,39,0.3)' : '#c9a227',
        border: `1px solid ${used ? 'rgba(201,162,39,0.15)' : 'rgba(201,162,39,0.5)'}`,
        textDecoration: used ? 'line-through' : 'none',
      }}
    >
      {label[0]}
    </span>
  );
}

export default function CombatantRow({ combatant, isCurrentTurn, index, onEndTurn }: Props) {
  const isDM = useSessionStore((s) => s.isDM);
  const player = useSessionStore((s) => s.player);
  const updateCombatant = useGameStore((s) => s.updateCombatant);

  const isDead = combatant.hp <= 0;
  const isUnconscious = combatant.conditions.includes('unconscious');

  const isMyToken = !isDM && player && combatant.isPlayer && combatant.tokenId === player.id;
  const canEndTurn = isDM || isMyToken;

  const handleHpChange = (delta: number) => {
    const newHp = Math.max(0, Math.min(combatant.maxHp, combatant.hp + delta));
    updateCombatant(combatant.id, { hp: newHp });
    socketEmit.initiativeUpdate(combatant.id, { hp: newHp });
  };

  const markAction = (field: 'actionUsed' | 'bonusActionUsed' | 'reactionUsed') => {
    const val = !combatant[field];
    updateCombatant(combatant.id, { [field]: val });
    socketEmit.initiativeUpdate(combatant.id, { [field]: val });
  };

  const colourHex = combatant.colour;

  return (
    <div
      style={{
        background: isCurrentTurn
          ? 'rgba(201,162,39,0.08)'
          : index % 2 === 0
          ? 'rgba(45,27,0,0.2)'
          : 'transparent',
        borderLeft: isCurrentTurn
          ? '3px solid #c9a227'
          : '3px solid transparent',
        boxShadow: isCurrentTurn ? '0 0 16px rgba(201,162,39,0.12) inset' : 'none',
        opacity: isDead ? 0.55 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
        }}
      >
        {/* Turn indicator / index */}
        <div style={{ flexShrink: 0, width: 16, textAlign: 'center' }}>
          {isCurrentTurn ? (
            <span style={{ color: '#c9a227', fontSize: '0.65rem' }}>▶</span>
          ) : (
            <span style={{ color: 'rgba(244,228,188,0.3)', fontFamily: 'Cinzel, serif', fontSize: '0.6rem' }}>
              {index + 1}
            </span>
          )}
        </div>

        {/* Colour circle with initials */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: colourHex,
            boxShadow: isCurrentTurn ? `0 0 8px ${colourHex}` : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#fff', fontFamily: 'Cinzel, serif' }}>
            {getInitials(combatant.name)}
          </span>
        </div>

        {/* Name + conditions + HP */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <p
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: isCurrentTurn ? '#f4e4bc' : 'rgba(244,228,188,0.8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {combatant.name}
            </p>
            {isDead && <span style={{ fontSize: '0.65rem' }} title="Dead/Unconscious">💀</span>}
          </div>

          {/* HP bar */}
          <HpBar hp={combatant.hp} maxHp={combatant.maxHp} />

          {/* Condition icons */}
          {combatant.conditions.length > 0 && (
            <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
              {combatant.conditions.slice(0, 5).map((c) => (
                <span key={c} title={c} style={{ fontSize: '0.6rem', lineHeight: 1 }}>
                  {CONDITION_ICONS[c] ?? '?'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Initiative + AC + Action economy */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          {/* Init score */}
          <span
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#c9a227',
              minWidth: 20,
              textAlign: 'center',
            }}
            title="Initiative"
          >
            {combatant.initiative}
          </span>

          {/* AC */}
          <span
            style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.6)' }}
            title="Armour Class"
          >
            AC {combatant.ac}
          </span>

          {/* Action economy badges */}
          <div style={{ display: 'flex', gap: 2 }}>
            <ActionBadge label="Action" used={combatant.actionUsed} />
            <ActionBadge label="Bonus" used={combatant.bonusActionUsed} />
            <ActionBadge label="Reaction" used={combatant.reactionUsed} />
          </div>
        </div>
      </div>

      {/* Expanded controls — shown when it's this combatant's turn */}
      {isCurrentTurn && (
        <div
          style={{
            padding: '4px 10px 8px',
            borderTop: '1px solid rgba(201,162,39,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* Mark action economy used */}
          <div style={{ display: 'flex', gap: 3 }}>
            {isDM && (
              <>
                <ActionToggleBtn
                  label="Action"
                  used={combatant.actionUsed}
                  onClick={() => markAction('actionUsed')}
                />
                <ActionToggleBtn
                  label="Bonus"
                  used={combatant.bonusActionUsed}
                  onClick={() => markAction('bonusActionUsed')}
                />
                <ActionToggleBtn
                  label="React."
                  used={combatant.reactionUsed}
                  onClick={() => markAction('reactionUsed')}
                />
              </>
            )}
          </div>

          {/* HP adjustment (DM only) */}
          {isDM && (
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: 'rgba(201,162,39,0.6)', marginRight: 2 }}>HP</span>
              {[-5, -1, 1, 5].map((delta) => (
                <button
                  key={delta}
                  onClick={() => handleHpChange(delta)}
                  style={{
                    width: 28,
                    height: 20,
                    fontSize: '0.6rem',
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: delta < 0 ? 'rgba(139,26,26,0.5)' : 'rgba(45,80,22,0.5)',
                    color: '#f4e4bc',
                    border: `1px solid ${delta < 0 ? 'rgba(139,26,26,0.7)' : 'rgba(45,80,22,0.7)'}`,
                    borderRadius: 2,
                  }}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          )}

          {/* End turn button */}
          {canEndTurn && onEndTurn && (
            <button
              onClick={onEndTurn}
              style={{
                width: '100%',
                fontFamily: 'Cinzel, serif',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '4px 8px',
                cursor: 'pointer',
                background: 'rgba(201,162,39,0.2)',
                color: '#c9a227',
                border: '1px solid rgba(201,162,39,0.5)',
                borderRadius: 2,
              }}
            >
              End Turn
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ActionToggleBtn({ label, used, onClick }: { label: string; used: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        fontSize: '0.55rem',
        fontFamily: 'Cinzel, serif',
        padding: '2px 3px',
        cursor: 'pointer',
        background: used ? 'rgba(139,26,26,0.3)' : 'rgba(201,162,39,0.15)',
        color: used ? 'rgba(244,228,188,0.4)' : '#c9a227',
        border: `1px solid ${used ? 'rgba(139,26,26,0.4)' : 'rgba(201,162,39,0.4)'}`,
        borderRadius: 2,
        textDecoration: used ? 'line-through' : 'none',
      }}
    >
      {label}
    </button>
  );
}

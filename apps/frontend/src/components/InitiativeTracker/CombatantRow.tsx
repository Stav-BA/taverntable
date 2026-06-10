import { useState, useEffect } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import type { Combatant } from '@/stores/gameStore';
import { useCharacterStore } from '@/stores/characterStore';
import { getSocket, socketEmit } from '@/lib/socket';
import { abilityMod, proficiencyBonus } from '@/lib/classes5e';
import { MONSTERS } from '@/lib/monsters';
import { getWeaponById, calcWeaponAttackBonus } from '@/lib/equipment5e';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  combatant: Combatant;
  isCurrentTurn: boolean;
  index: number;
  onEndTurn?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

const DAMAGE_TYPES = [
  'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning',
  'poison', 'acid', 'radiant', 'necrotic', 'psychic', 'thunder', 'force',
];

// ── Dice helpers ───────────────────────────────────────────────────────────────

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollNotation(notation: string, doubleDice = false): { rolls: number[]; total: number } {
  const m = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return { rolls: [], total: 0 };
  let count = parseInt(m[1]);
  const sides = parseInt(m[2]);
  const bonus = m[3] ? parseInt(m[3]) : 0;
  if (doubleDice) count *= 2;
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + bonus };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const colour = pct > 0.6 ? '#2d8a2d' : pct > 0.3 ? '#c9a227' : '#8b1a1a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', minWidth: 32 }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: colour, borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: colour, minWidth: 36, textAlign: 'right' }}>
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
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: 2, fontSize: '0.55rem',
        fontFamily: 'Cinzel, serif', fontWeight: 700,
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

function ActionToggleBtn({ label, used, onClick }: { label: string; used: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, fontSize: '0.55rem', fontFamily: 'Cinzel, serif', padding: '2px 3px',
        cursor: 'pointer',
        background: used ? 'rgba(139,26,26,0.3)' : 'rgba(201,162,39,0.15)',
        color: used ? 'rgba(244,228,188,0.4)' : '#c9a227',
        border: `1px solid ${used ? 'rgba(139,26,26,0.4)' : 'rgba(201,162,39,0.4)'}`,
        borderRadius: 2, textDecoration: used ? 'line-through' : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ── Attack Result Bubble ────────────────────────────────────────────────────────

interface AttackResult {
  d20Roll: number;
  attackBonus: number;
  total: number;
  targetAC: number;
  hit: boolean;
  isCrit: boolean;
  isMiss: boolean;
  damageRolls: number[];
  damageTotal: number;
  damageType: string;
  actionName: string;
}

function AttackResultBubble({ result, onDismiss }: { result: AttackResult; onDismiss: () => void }) {
  const hitLabel = result.isCrit ? 'CRIT!' : result.isMiss ? 'MISS' : result.hit ? 'HIT' : 'MISS';
  const hitColour = result.isCrit ? '#f4c842' : result.hit ? '#2d8a2d' : '#8b1a1a';
  return (
    <div style={{
      background: 'rgba(26,15,0,0.97)', border: `1px solid ${hitColour}`,
      borderRadius: 6, padding: '10px 14px', marginTop: 6,
      boxShadow: `0 0 18px ${hitColour}44`, position: 'relative',
    }}>
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute', top: 4, right: 6, background: 'transparent',
          border: 'none', color: 'rgba(244,228,188,0.4)', cursor: 'pointer', fontSize: '0.7rem',
        }}
      >
        x
      </button>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: 'rgba(244,228,188,0.6)', marginBottom: 4 }}>
        {result.actionName}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{
          fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Cinzel, serif',
          color: result.d20Roll === 20 ? '#f4c842' : result.d20Roll === 1 ? '#8b1a1a' : '#f4e4bc',
        }}>
          {result.d20Roll}
        </span>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.75rem', color: 'rgba(244,228,188,0.5)' }}>
          {result.attackBonus >= 0 ? `+${result.attackBonus}` : result.attackBonus}
        </span>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: 'rgba(244,228,188,0.4)' }}>=</span>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 700, color: '#f4e4bc' }}>
          {result.total}
        </span>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: 'rgba(244,228,188,0.4)' }}>
          vs AC {result.targetAC}
        </span>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', fontWeight: 700, color: hitColour, marginLeft: 'auto' }}>
          {hitLabel}
        </span>
      </div>
      {(result.hit || result.isCrit) && (
        <div style={{ borderTop: '1px solid rgba(201,162,39,0.2)', paddingTop: 6 }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.5)' }}>
            Damage: [{result.damageRolls.join(', ')}] ={' '}
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', fontWeight: 700, color: hitColour }}>
            {result.damageTotal}
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.4)', marginLeft: 4 }}>
            {result.damageType}
          </span>
          {result.isCrit && (
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: '#f4c842', marginLeft: 6 }}>
              (double dice!)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Target Picker ──────────────────────────────────────────────────────────────

function TargetPicker({
  targets, selectedId, onSelect,
}: {
  targets: Combatant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (targets.length === 0) {
    return (
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.4)', padding: '4px 0' }}>
        No valid targets
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {targets.map((t) => {
        const isSelected = t.id === selectedId;
        const pct = t.maxHp > 0 ? Math.max(0, t.hp / t.maxHp) : 0;
        const hpColour = pct > 0.6 ? '#2d8a2d' : pct > 0.3 ? '#c9a227' : '#8b1a1a';
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 6px', borderRadius: 3, cursor: 'pointer',
              background: isSelected ? 'rgba(201,162,39,0.2)' : 'rgba(45,27,0,0.4)',
              border: `1px solid ${isSelected ? '#c9a227' : 'rgba(201,162,39,0.2)'}`,
              textAlign: 'left',
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.colour, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: '#f4e4bc', flex: 1 }}>{t.name}</span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: hpColour }}>{t.hp}/{t.maxHp}</span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.5)' }}>AC {t.ac}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CombatantRow({ combatant, isCurrentTurn, index, onEndTurn }: Props) {
  const isDM = useSessionStore((s) => s.isDM);
  const player = useSessionStore((s) => s.player);
  const sessionId = useSessionStore((s) => s.sessionId);
  const updateCombatant = useGameStore((s) => s.updateCombatant);
  const initiative = useGameStore((s) => s.initiative);
  const sheets = useCharacterStore((s) => s.sheets);

  const isMyToken = !isDM && player != null && combatant.isPlayer && combatant.tokenId === player.id;
  const canEndTurn = isDM || isMyToken;
  const isDead = combatant.hp <= 0;

  // Monster lookup
  const monsterDef = combatant.isEnemy
    ? MONSTERS.find((m) => m.name.toLowerCase() === combatant.name.toLowerCase())
    : undefined;
  const isMonster = combatant.isEnemy && monsterDef != null;

  // Character sheet for player
  const sheet = !isMonster && player ? sheets[player.id] : undefined;

  // Attack panel state
  const [selectedMonsterAction, setSelectedMonsterAction] = useState<{
    name: string;
    attackBonus: number;
    damageDice: string;
    damageType: string;
  } | null>(null);

  const [customAttackBonus, setCustomAttackBonus] = useState(0);
  const [customDamageDice, setCustomDamageDice] = useState('1d6');
  const [customDamageType, setCustomDamageType] = useState('slashing');
  const [customActionName, setCustomActionName] = useState('Attack');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);

  // Auto-fill weapon from equipped gear
  useEffect(() => {
    if (!isMonster && sheet) {
      const strMod = abilityMod(sheet.str);
      const dexMod = abilityMod(sheet.dex);
      const prof = proficiencyBonus(sheet.level);
      const equippedWeapon = sheet.equipment?.find((e) => e.equipped && e.weaponId);
      if (equippedWeapon?.weaponId) {
        const weaponDef = getWeaponById(equippedWeapon.weaponId);
        if (weaponDef) {
          const atk = calcWeaponAttackBonus(weaponDef, strMod, dexMod, prof);
          setCustomAttackBonus(atk);
          setCustomDamageDice(weaponDef.damageDice);
          setCustomDamageType(weaponDef.damageType);
          setCustomActionName(weaponDef.name);
          return;
        }
      }
      setCustomAttackBonus(strMod + prof);
    }
  }, [sheet, isMonster]);

  // Valid targets: alive opposing side
  const targets = initiative.filter((c) => {
    if (c.hp <= 0) return false;
    if (c.id === combatant.id) return false;
    if (combatant.isEnemy) return !c.isEnemy;
    return c.isEnemy;
  });

  const markAction = (field: 'actionUsed' | 'bonusActionUsed' | 'reactionUsed') => {
    const val = !combatant[field];
    updateCombatant(combatant.id, { [field]: val });
    socketEmit.initiativeUpdate(combatant.id, { [field]: val });
  };

  const handleHpChange = (delta: number) => {
    const newHp = Math.max(0, Math.min(combatant.maxHp, combatant.hp + delta));
    updateCombatant(combatant.id, { hp: newHp });
    socketEmit.initiativeUpdate(combatant.id, { hp: newHp });
  };

  // Resolve active attack parameters
  const activeAttack = isMonster && selectedMonsterAction
    ? selectedMonsterAction
    : !isMonster
    ? { name: customActionName, attackBonus: customAttackBonus, damageDice: customDamageDice, damageType: customDamageType }
    : null;

  const handleRollAttack = () => {
    if (!activeAttack) return;
    const target = initiative.find((c) => c.id === selectedTargetId);
    if (!target) return;

    const d20 = rollD20();
    const isCrit = d20 === 20;
    const isMiss = d20 === 1;
    const total = d20 + activeAttack.attackBonus;
    const hit = !isMiss && (isCrit || total >= target.ac);

    let damageRolls: number[] = [];
    let damageTotal = 0;

    if (hit) {
      const dmgResult = rollNotation(activeAttack.damageDice, isCrit);
      damageRolls = dmgResult.rolls;
      damageTotal = dmgResult.total;
    }

    const result: AttackResult = {
      d20Roll: d20, attackBonus: activeAttack.attackBonus, total,
      targetAC: target.ac, hit, isCrit, isMiss,
      damageRolls, damageTotal, damageType: activeAttack.damageType, actionName: activeAttack.name,
    };
    setAttackResult(result);

    // Update target HP and conditions
    const newConditions = [...target.conditions];
    let newHp = target.hp;
    if (hit) {
      newHp = Math.max(0, target.hp - damageTotal);
      if (newHp <= 0 && target.isPlayer && !newConditions.includes('unconscious')) {
        newConditions.push('unconscious');
      }
      updateCombatant(target.id, { hp: newHp, conditions: newConditions as typeof target.conditions });
      socketEmit.initiativeUpdate(target.id, { hp: newHp, conditions: newConditions });
    }

    // Mark attacker action used
    updateCombatant(combatant.id, { actionUsed: true });
    socketEmit.initiativeUpdate(combatant.id, { actionUsed: true });

    // Broadcast combat:attack (backend generates the chat message)
    getSocket().emit('combat:attack', {
      sessionId,
      attackerName: combatant.name,
      targetId: target.id,
      targetName: target.name,
      actionName: activeAttack.name,
      roll: d20,
      attackBonus: activeAttack.attackBonus,
      total,
      targetAC: target.ac,
      hit,
      isCrit,
      damageTotal,
      damageType: activeAttack.damageType,
      newTargetHp: newHp,
      newTargetConditions: newConditions,
    });
  };

  const showAttackPanel = isCurrentTurn && !combatant.actionUsed && (isDM || isMyToken);
  const canRoll = activeAttack != null && selectedTargetId != null;
  const colourHex = combatant.colour;

  return (
    <div
      style={{
        background: isCurrentTurn
          ? 'rgba(201,162,39,0.08)'
          : index % 2 === 0 ? 'rgba(45,27,0,0.2)' : 'transparent',
        borderLeft: isCurrentTurn ? '3px solid #c9a227' : '3px solid transparent',
        boxShadow: isCurrentTurn ? '0 0 16px rgba(201,162,39,0.12) inset' : 'none',
        opacity: isDead ? 0.55 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {/* ── Main row ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
        {/* Turn indicator */}
        <div style={{ flexShrink: 0, width: 16, textAlign: 'center' }}>
          {isCurrentTurn ? (
            <span style={{ color: '#c9a227', fontSize: '0.65rem' }}>&#9654;</span>
          ) : (
            <span style={{ color: 'rgba(244,228,188,0.3)', fontFamily: 'Cinzel, serif', fontSize: '0.6rem' }}>
              {index + 1}
            </span>
          )}
        </div>

        {/* Colour circle */}
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: colourHex,
          boxShadow: isCurrentTurn ? `0 0 8px ${colourHex}` : undefined,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#fff', fontFamily: 'Cinzel, serif' }}>
            {getInitials(combatant.name)}
          </span>
        </div>

        {/* Name + HP + conditions */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <p style={{
              fontFamily: 'Cinzel, serif', fontSize: '0.7rem', fontWeight: 600,
              color: isCurrentTurn ? '#f4e4bc' : 'rgba(244,228,188,0.8)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, margin: 0,
            }}>
              {combatant.name}
            </p>
            {isDead && <span style={{ fontSize: '0.65rem' }} title="Dead/Unconscious">&#x1F480;</span>}
          </div>
          <HpBar hp={combatant.hp} maxHp={combatant.maxHp} />
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

        {/* Right: initiative + AC + badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', fontWeight: 700, color: '#c9a227', minWidth: 20, textAlign: 'center' }} title="Initiative">
            {combatant.initiative}
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.6)' }} title="Armour Class">
            AC {combatant.ac}
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            <ActionBadge label="Action" used={combatant.actionUsed} />
            <ActionBadge label="Bonus" used={combatant.bonusActionUsed} />
            <ActionBadge label="Reaction" used={combatant.reactionUsed} />
          </div>
        </div>
      </div>

      {/* ── Expanded turn controls ────────────────────────────────────────────── */}
      {isCurrentTurn && (
        <div style={{
          padding: '4px 10px 8px', borderTop: '1px solid rgba(201,162,39,0.15)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {/* Action economy toggles (DM only) */}
          {isDM && (
            <div style={{ display: 'flex', gap: 3 }}>
              <ActionToggleBtn label="Action" used={combatant.actionUsed} onClick={() => markAction('actionUsed')} />
              <ActionToggleBtn label="Bonus" used={combatant.bonusActionUsed} onClick={() => markAction('bonusActionUsed')} />
              <ActionToggleBtn label="React." used={combatant.reactionUsed} onClick={() => markAction('reactionUsed')} />
            </div>
          )}

          {/* HP adjustment (DM only) */}
          {isDM && (
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: 'rgba(201,162,39,0.6)', marginRight: 2 }}>HP</span>
              {[-5, -1, 1, 5].map((delta) => (
                <button
                  key={delta}
                  onClick={() => handleHpChange(delta)}
                  style={{
                    width: 28, height: 20, fontSize: '0.6rem', fontFamily: 'Cinzel, serif', fontWeight: 700,
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

          {/* ── Attack Panel ──────────────────────────────────────────────────── */}
          {showAttackPanel && (
            <div style={{
              background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)',
              borderRadius: 4, padding: '8px',
            }}>
              <div style={{
                fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: '#c9a227',
                marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Attack
              </div>

              {/* Monster action cards */}
              {isMonster && monsterDef && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  {monsterDef.actions
                    .filter((a) => a.attackBonus != null || a.damageDice != null)
                    .map((a) => {
                      const atkBonus = a.attackBonus ?? 0;
                      const dmgDice = a.damageDice ?? '1d4';
                      const dmgType = a.damageType ?? 'bludgeoning';
                      const isSelected = selectedMonsterAction?.name === a.name;
                      return (
                        <button
                          key={a.name}
                          onClick={() =>
                            setSelectedMonsterAction(
                              isSelected ? null : { name: a.name, attackBonus: atkBonus, damageDice: dmgDice, damageType: dmgType }
                            )
                          }
                          style={{
                            padding: '5px 8px', borderRadius: 3, cursor: 'pointer', textAlign: 'left',
                            background: isSelected ? 'rgba(201,162,39,0.2)' : 'rgba(26,15,0,0.6)',
                            border: `1px solid ${isSelected ? '#c9a227' : 'rgba(201,162,39,0.2)'}`,
                          }}
                        >
                          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: '#f4e4bc', fontWeight: 600 }}>
                            {a.name}
                          </div>
                          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.5)', marginTop: 1 }}>
                            +{atkBonus} to hit &bull; {dmgDice} {dmgType}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Player custom attack fields */}
              {!isMonster && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.6)', width: 58 }}>Action</label>
                    <input
                      value={customActionName}
                      onChange={(e) => setCustomActionName(e.target.value)}
                      style={{
                        flex: 1, background: 'rgba(26,15,0,0.8)', border: '1px solid rgba(201,162,39,0.3)',
                        borderRadius: 2, color: '#f4e4bc', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', padding: '2px 5px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.6)', width: 58 }}>Atk Bonus</label>
                    <input
                      type="number"
                      value={customAttackBonus}
                      onChange={(e) => setCustomAttackBonus(parseInt(e.target.value) || 0)}
                      style={{
                        width: 50, background: 'rgba(26,15,0,0.8)', border: '1px solid rgba(201,162,39,0.3)',
                        borderRadius: 2, color: '#f4e4bc', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', padding: '2px 5px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.6)', width: 58 }}>Damage</label>
                    <input
                      value={customDamageDice}
                      onChange={(e) => setCustomDamageDice(e.target.value)}
                      placeholder="1d6"
                      style={{
                        width: 50, background: 'rgba(26,15,0,0.8)', border: '1px solid rgba(201,162,39,0.3)',
                        borderRadius: 2, color: '#f4e4bc', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', padding: '2px 5px',
                      }}
                    />
                    <select
                      value={customDamageType}
                      onChange={(e) => setCustomDamageType(e.target.value)}
                      style={{
                        flex: 1, background: 'rgba(26,15,0,0.8)', border: '1px solid rgba(201,162,39,0.3)',
                        borderRadius: 2, color: '#f4e4bc', fontFamily: 'Cinzel, serif', fontSize: '0.58rem', padding: '2px 3px',
                      }}
                    >
                      {DAMAGE_TYPES.map((dt) => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Target picker */}
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.5)',
                  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Target
                </div>
                <TargetPicker targets={targets} selectedId={selectedTargetId} onSelect={setSelectedTargetId} />
              </div>

              {/* Roll Attack button */}
              <button
                onClick={handleRollAttack}
                disabled={!canRoll}
                style={{
                  width: '100%', fontFamily: 'Cinzel, serif', fontSize: '0.7rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em', padding: '5px 8px',
                  cursor: canRoll ? 'pointer' : 'not-allowed',
                  background: canRoll ? 'rgba(139,26,26,0.7)' : 'rgba(45,27,0,0.4)',
                  color: canRoll ? '#f4e4bc' : 'rgba(244,228,188,0.3)',
                  border: `1px solid ${canRoll ? 'rgba(139,26,26,0.9)' : 'rgba(201,162,39,0.15)'}`,
                  borderRadius: 3,
                }}
              >
                Roll Attack
              </button>

              {attackResult && (
                <AttackResultBubble result={attackResult} onDismiss={() => setAttackResult(null)} />
              )}
            </div>
          )}

          {/* End turn */}
          {canEndTurn && onEndTurn && (
            <button
              onClick={onEndTurn}
              style={{
                width: '100%', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 8px',
                cursor: 'pointer',
                background: 'rgba(201,162,39,0.2)', color: '#c9a227',
                border: '1px solid rgba(201,162,39,0.5)', borderRadius: 2,
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

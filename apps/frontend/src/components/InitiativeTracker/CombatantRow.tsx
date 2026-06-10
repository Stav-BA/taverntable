import { useState, useEffect } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import type { Combatant } from '@/stores/gameStore';
import { useCharacterStore } from '@/stores/characterStore';
import { getSocket, socketEmit } from '@/lib/socket';
import { abilityMod, proficiencyBonus } from '@/lib/classes5e';
import { MONSTERS } from '@/lib/monsters';
import { getWeaponById, calcWeaponAttackBonus, getArmorById, calcArmorAC } from '@/lib/equipment5e';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  combatant: Combatant;
  isCurrentTurn: boolean;
  index: number;
  onEndTurn?: () => void;
}

type CombatStep = 'choose-action' | 'choose-weapon' | 'pick-target' | 'result' | 'done';

interface WeaponOption {
  name: string;
  attackBonus: number;
  damageDice: string;
  damageType: string;
}

interface AttackResult {
  d20Roll: number;
  attackBonus: number;
  total: number;
  targetAC: number;
  hit: boolean;
  isCrit: boolean;
  isFumble: boolean;
  damageRolls: number[];
  damageTotal: number;
  damageType: string;
  actionName: string;
  targetName: string;
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

const FUMBLE_OPTIONS = [
  'No effect — just a miss',
  'Drop weapon (falls 5ft away)',
  'Hit an ally (roll damage against nearest ally)',
  'Stumble — lose Bonus Action this turn',
  'Overextend — grant Advantage to next attack against you',
  'Weapon breaks (unusable until repaired)',
];

// ── Dice helpers ───────────────────────────────────────────────────────────────

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollNotation(notation: string, doubleDice = false): { rolls: number[]; total: number } {
  const m = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return { rolls: [0], total: 0 };
  let count = parseInt(m[1]);
  const sides = parseInt(m[2]);
  const bonus = m[3] ? parseInt(m[3]) : 0;
  if (doubleDice) count *= 2;
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + bonus };
}

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

// ── Step breadcrumb ────────────────────────────────────────────────────────────

function StepBreadcrumb({ step }: { step: CombatStep }) {
  const steps: { key: CombatStep; label: string }[] = [
    { key: 'choose-action', label: 'Action' },
    { key: 'choose-weapon', label: 'Weapon' },
    { key: 'pick-target', label: 'Roll' },
    { key: 'result', label: 'Result' },
  ];
  const activeIdx = steps.findIndex((s) => s.key === step);
  if (activeIdx < 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontFamily: 'Cinzel, serif', fontSize: '0.57rem',
            color: i === activeIdx ? '#c9a227' : i < activeIdx ? 'rgba(201,162,39,0.35)' : 'rgba(244,228,188,0.2)',
            fontWeight: i === activeIdx ? 700 : 400,
          }}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span style={{ color: 'rgba(201,162,39,0.2)', fontSize: '0.5rem' }}>›</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Target Picker ──────────────────────────────────────────────────────────────

function TargetPicker({ targets, selectedId, onSelect }: {
  targets: Combatant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (targets.length === 0) {
    return <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.4)', padding: '4px 0' }}>No valid targets</div>;
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

// ── Attack Result Bubble ────────────────────────────────────────────────────────

function AttackResultBubble({ result, isDM, fumbleChoice, onFumbleChange, onFumbleSend, onDismiss }: {
  result: AttackResult;
  isDM: boolean;
  fumbleChoice: string;
  onFumbleChange: (v: string) => void;
  onFumbleSend: () => void;
  onDismiss: () => void;
}) {
  let hitLabel: string;
  let hitColour: string;
  if (result.isCrit) { hitLabel = '⚡ CRITICAL HIT!'; hitColour = '#f4c842'; }
  else if (result.isFumble) { hitLabel = '💥 FUMBLE!'; hitColour = '#cc2222'; }
  else if (result.hit) { hitLabel = '✓ HIT'; hitColour = '#2d8a2d'; }
  else { hitLabel = '✗ MISS'; hitColour = '#8b1a1a'; }

  return (
    <div style={{
      background: 'rgba(10,6,0,0.98)', border: `2px solid ${hitColour}`,
      borderRadius: 8, padding: '12px 14px', marginTop: 4,
      boxShadow: `0 0 28px ${hitColour}44`, position: 'relative',
    }}>
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute', top: 5, right: 8, background: 'transparent',
          border: 'none', color: 'rgba(244,228,188,0.35)', cursor: 'pointer', fontSize: '0.75rem',
        }}
      >
        ✕
      </button>

      {/* Action + target */}
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.62rem', color: 'rgba(244,228,188,0.5)', marginBottom: 8 }}>
        {result.actionName} → {result.targetName}
      </div>

      {/* Roll row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {/* d20 badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: result.d20Roll === 20 ? 'rgba(244,200,66,0.2)' : result.d20Roll === 1 ? 'rgba(139,26,26,0.35)' : 'rgba(45,27,0,0.8)',
          border: `2px solid ${result.d20Roll === 20 ? '#f4c842' : result.d20Roll === 1 ? '#cc2222' : 'rgba(201,162,39,0.4)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: result.d20Roll === 20 ? '0 0 14px #f4c84266' : result.d20Roll === 1 ? '0 0 14px #cc222266' : 'none',
        }}>
          <span style={{
            fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: '1.2rem',
            color: result.d20Roll === 20 ? '#f4c842' : result.d20Roll === 1 ? '#ff5555' : '#f4e4bc',
          }}>
            {result.d20Roll}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {!result.isCrit && !result.isFumble && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: 'rgba(244,228,188,0.5)' }}>
                {result.attackBonus >= 0 ? `+${result.attackBonus}` : result.attackBonus}
              </span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.35)' }}>=</span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 700, color: '#f4e4bc' }}>
                {result.total}
              </span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.4)' }}>
                vs AC {result.targetAC}
              </span>
            </div>
          )}
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', fontWeight: 800, color: hitColour, letterSpacing: '0.04em' }}>
            {hitLabel}
          </span>
        </div>
      </div>

      {/* Damage */}
      {(result.hit || result.isCrit) && result.damageRolls.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(201,162,39,0.2)', paddingTop: 8,
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.45)' }}>
            [{result.damageRolls.join(' + ')}] =
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 900, color: hitColour }}>
            {result.damageTotal}
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.4)' }}>
            {result.damageType}
          </span>
          {result.isCrit && (
            <span style={{
              fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: '#f4c842',
              background: 'rgba(244,200,66,0.12)', padding: '1px 6px', borderRadius: 2, border: '1px solid rgba(244,200,66,0.3)',
            }}>
              double dice
            </span>
          )}
        </div>
      )}

      {/* Fumble consequence picker — DM only */}
      {result.isFumble && isDM && (
        <div style={{ borderTop: '1px solid rgba(204,34,34,0.35)', paddingTop: 8, marginTop: 8 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.62rem', color: 'rgba(244,228,188,0.6)', marginBottom: 5 }}>
            ⚠️ DM — Choose fumble consequence:
          </div>
          <select
            value={fumbleChoice}
            onChange={(e) => onFumbleChange(e.target.value)}
            style={{
              width: '100%', background: 'rgba(20,8,0,0.95)', border: '1px solid rgba(204,34,34,0.5)',
              borderRadius: 3, color: '#f4e4bc', fontFamily: 'Cinzel, serif', fontSize: '0.62rem',
              padding: '4px 6px', marginBottom: 6,
            }}
          >
            {FUMBLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <button
            onClick={onFumbleSend}
            style={{
              width: '100%', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', fontWeight: 700,
              padding: '5px 8px', cursor: 'pointer',
              background: 'rgba(139,26,26,0.65)', color: '#f4e4bc',
              border: '1px solid rgba(204,34,34,0.7)', borderRadius: 3,
            }}
          >
            💥 Announce Consequence
          </button>
        </div>
      )}
    </div>
  );
}

// ── AC resolution helper ───────────────────────────────────────────────────────

/**
 * Resolves the real AC for a combatant by looking up their equipped armor from
 * their character sheet. Falls back to the combatant's stored ac value if no
 * sheet / armor data is available (e.g. monsters, unlinked tokens).
 */
function resolveTargetAC(
  target: Combatant,
  tokens: Array<{ id: string; playerId?: string }>,
  sheets: Record<string, { dex: number; equipment: Array<{ type: string; equipped?: boolean; armorId?: string }> }>,
): number {
  const token = tokens.find((t) => t.id === target.tokenId);
  if (!token?.playerId) return target.ac;
  const sheet = sheets[token.playerId];
  if (!sheet) return target.ac;
  const equippedArmor = sheet.equipment.find(
    (e) => e.type === 'armor' && e.equipped !== false && e.armorId,
  );
  if (!equippedArmor?.armorId) return target.ac;
  const armorDef = getArmorById(equippedArmor.armorId);
  if (!armorDef) return target.ac;
  const dexMod = Math.floor((sheet.dex - 10) / 2);
  return calcArmorAC(armorDef, dexMod);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CombatantRow({ combatant, isCurrentTurn, index, onEndTurn }: Props) {
  const isDM = useSessionStore((s) => s.isDM);
  const player = useSessionStore((s) => s.player);
  const sessionId = useSessionStore((s) => s.sessionId);
  const updateCombatant = useGameStore((s) => s.updateCombatant);
  const initiative = useGameStore((s) => s.initiative);
  const tokens = useGameStore((s) => s.tokens);
  const sheets = useCharacterStore((s) => s.sheets);

  // tokenId is "player-{player.id}" (set in CharacterCreationModal as `player-${player.id}`)
  // Also handle the case where tokenId equals player.id directly (fallback)
  const myToken = tokens.find((t) => t.playerId === player?.id);
  const isMyToken = !isDM && player != null && combatant.isPlayer &&
    (combatant.tokenId === `player-${player.id}` || combatant.tokenId === player.id || (myToken != null && combatant.tokenId === myToken.id));
  const canControl = isDM || isMyToken;
  const isDead = combatant.hp <= 0;

  // Monster lookup
  const monsterDef = combatant.isEnemy
    ? MONSTERS.find((m) => m.name.toLowerCase() === combatant.name.toLowerCase())
    : undefined;
  const isMonster = combatant.isEnemy && monsterDef != null;

  // Character sheet for player
  const sheet = !isMonster && player ? sheets[player.id] : undefined;

  // ── Combat step machine ──────────────────────────────────────────────────────
  const [combatStep, setCombatStep] = useState<CombatStep>('choose-action');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponOption | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);
  const [fumbleChoice, setFumbleChoice] = useState(FUMBLE_OPTIONS[0]);
  const [nonAttackNote, setNonAttackNote] = useState<string | null>(null);

  // Reset when turn becomes active
  useEffect(() => {
    if (isCurrentTurn) {
      setCombatStep('choose-action');
      setSelectedWeapon(null);
      setSelectedTargetId(null);
      setAttackResult(null);
      setFumbleChoice(FUMBLE_OPTIONS[0]);
      setNonAttackNote(null);
    }
  }, [isCurrentTurn]);

  // Build weapon options for players
  const playerWeapons: WeaponOption[] = [];
  if (!isMonster && sheet) {
    const strMod = abilityMod(sheet.str);
    const dexMod = abilityMod(sheet.dex);
    const prof = proficiencyBonus(sheet.level);
    const weaponItems = sheet.equipment?.filter((e) => e.weaponId) ?? [];
    weaponItems.forEach((item) => {
      const def = item.weaponId ? getWeaponById(item.weaponId) : null;
      if (def) {
        const atk = calcWeaponAttackBonus(def, strMod, dexMod, prof);
        playerWeapons.push({
          name: def.name + (item.equipped ? ' ✓' : ''),
          attackBonus: atk,
          damageDice: def.damageDice,
          damageType: def.damageType,
        });
      }
    });
    if (playerWeapons.length === 0) {
      playerWeapons.push({ name: 'Unarmed Strike', attackBonus: strMod + prof, damageDice: '1d4', damageType: 'bludgeoning' });
    }
  }

  // Monster attack options
  const monsterWeapons: WeaponOption[] = isMonster && monsterDef
    ? monsterDef.actions
        .filter((a) => a.attackBonus != null || a.damageDice != null)
        .map((a) => ({
          name: a.name,
          attackBonus: a.attackBonus ?? 0,
          damageDice: a.damageDice ?? '1d4',
          damageType: a.damageType ?? 'bludgeoning',
        }))
    : [];

  const availableWeapons = isMonster ? monsterWeapons : playerWeapons;

  // Valid targets
  const targets = initiative.filter((c) => {
    if (c.hp <= 0) return false;
    if (c.id === combatant.id) return false;
    return combatant.isEnemy ? !c.isEnemy : c.isEnemy;
  });

  // ── HP manual adjust (DM) ────────────────────────────────────────────────────
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

  // ── Non-attack action ────────────────────────────────────────────────────────
  const handleNonAttackAction = (label: string, note: string) => {
    setNonAttackNote(note);
    setCombatStep('done');
    updateCombatant(combatant.id, { actionUsed: true });
    socketEmit.initiativeUpdate(combatant.id, { actionUsed: true });
    getSocket().emit('combat:action', { sessionId, actorName: combatant.name, actionName: label, description: note });
  };

  // ── Roll attack ──────────────────────────────────────────────────────────────
  const handleRollAttack = () => {
    if (!selectedWeapon || !selectedTargetId) return;
    const target = initiative.find((c) => c.id === selectedTargetId);
    if (!target) return;

    const d20 = rollD20();
    const isCrit = d20 === 20;
    const isFumble = d20 === 1;
    const total = d20 + selectedWeapon.attackBonus;
    const effectiveAC = resolveTargetAC(target, tokens, sheets as Record<string, { dex: number; equipment: Array<{ type: string; equipped?: boolean; armorId?: string }> }>);
    const hit = !isFumble && (isCrit || total >= effectiveAC);

    let damageRolls: number[] = [];
    let damageTotal = 0;
    if (hit) {
      const dmg = rollNotation(selectedWeapon.damageDice, isCrit);
      damageRolls = dmg.rolls;
      damageTotal = dmg.total;
    }

    const cleanName = selectedWeapon.name.replace(' ✓', '');
    const result: AttackResult = {
      d20Roll: d20, attackBonus: selectedWeapon.attackBonus, total,
      targetAC: effectiveAC, hit, isCrit, isFumble,
      damageRolls, damageTotal, damageType: selectedWeapon.damageType,
      actionName: cleanName, targetName: target.name,
    };
    setAttackResult(result);
    setCombatStep('result');

    // Apply damage
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

    // Mark action used
    updateCombatant(combatant.id, { actionUsed: true });
    socketEmit.initiativeUpdate(combatant.id, { actionUsed: true });

    // Tell backend (backend generates chat message)
    getSocket().emit('combat:attack', {
      sessionId,
      attackerName: combatant.name,
      targetId: target.id,
      targetName: target.name,
      actionName: cleanName,
      roll: d20, attackBonus: selectedWeapon.attackBonus, total,
      targetAC: effectiveAC, hit, isCrit, isFumble,
      damageTotal, damageType: selectedWeapon.damageType,
      newTargetHp: newHp, newTargetConditions: newConditions,
    });
  };

  const handleFumbleSend = () => {
    getSocket().emit('combat:fumble', {
      sessionId,
      attackerName: combatant.name,
      consequence: fumbleChoice,
    });
  };

  const showControls = isCurrentTurn && canControl && !isDead;

  // ── Render ───────────────────────────────────────────────────────────────────
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
        <div style={{ flexShrink: 0, width: 16, textAlign: 'center' }}>
          {isCurrentTurn
            ? <span style={{ color: '#c9a227', fontSize: '0.65rem' }}>&#9654;</span>
            : <span style={{ color: 'rgba(244,228,188,0.3)', fontFamily: 'Cinzel, serif', fontSize: '0.6rem' }}>{index + 1}</span>
          }
        </div>

        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: combatant.colour,
          boxShadow: isCurrentTurn ? `0 0 8px ${combatant.colour}` : undefined,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#fff', fontFamily: 'Cinzel, serif' }}>
            {getInitials(combatant.name)}
          </span>
        </div>

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
                <span key={c} title={c} style={{ fontSize: '0.6rem', lineHeight: 1 }}>{CONDITION_ICONS[c] ?? '?'}</span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', fontWeight: 700, color: '#c9a227', minWidth: 20, textAlign: 'center' }}>
            {combatant.initiative}
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'rgba(244,228,188,0.6)' }}>
            AC {combatant.ac}
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            <ActionBadge label="Action" used={combatant.actionUsed} />
            <ActionBadge label="Bonus" used={combatant.bonusActionUsed} />
            <ActionBadge label="Reaction" used={combatant.reactionUsed} />
          </div>
        </div>
      </div>

      {/* ── Expanded controls ─────────────────────────────────────────────────── */}
      {isCurrentTurn && (
        <div style={{ padding: '4px 10px 8px', borderTop: '1px solid rgba(201,162,39,0.15)', display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* DM action economy toggles */}
          {isDM && (
            <div style={{ display: 'flex', gap: 3 }}>
              <ActionToggleBtn label="Action" used={combatant.actionUsed} onClick={() => markAction('actionUsed')} />
              <ActionToggleBtn label="Bonus" used={combatant.bonusActionUsed} onClick={() => markAction('bonusActionUsed')} />
              <ActionToggleBtn label="React." used={combatant.reactionUsed} onClick={() => markAction('reactionUsed')} />
            </div>
          )}

          {/* DM HP adjustment */}
          {isDM && (
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: 'rgba(201,162,39,0.6)', marginRight: 2 }}>HP</span>
              {[-10, -5, -1, 1, 5, 10].map((d) => (
                <button key={d} onClick={() => handleHpChange(d)} style={{
                  width: 28, height: 20, fontSize: '0.6rem', fontFamily: 'Cinzel, serif', fontWeight: 700,
                  cursor: 'pointer',
                  background: d < 0 ? 'rgba(139,26,26,0.5)' : 'rgba(45,80,22,0.5)',
                  color: '#f4e4bc',
                  border: `1px solid ${d < 0 ? 'rgba(139,26,26,0.7)' : 'rgba(45,80,22,0.7)'}`,
                  borderRadius: 2,
                }}>
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>
          )}

          {/* ── COMBAT WIZARD ─────────────────────────────────────────────────── */}
          {showControls && (
            <div style={{
              background: 'rgba(18,10,0,0.8)', border: '1px solid rgba(201,162,39,0.22)',
              borderRadius: 6, padding: '10px',
            }}>
              <StepBreadcrumb step={combatStep} />

              {/* STEP 1 — Choose action */}
              {combatStep === 'choose-action' && !combatant.actionUsed && (
                <div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.45)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Choose your action
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {[
                      { icon: '⚔️', label: 'Attack', desc: 'Make a weapon attack', primary: true },
                      { icon: '🏃', label: 'Dash', desc: 'Double movement speed' },
                      { icon: '🛡️', label: 'Dodge', desc: 'Attacks against you: disadvantage' },
                      { icon: '🙏', label: 'Help', desc: 'Ally gets advantage on next roll' },
                      { icon: '🔮', label: 'Cast Spell', desc: 'Expend a spell slot' },
                      { icon: '🎲', label: 'Other', desc: 'Describe action in chat' },
                    ].map(({ icon, label, desc, primary }) => (
                      <button
                        key={label}
                        onClick={() => {
                          if (label === 'Attack') {
                            setCombatStep('choose-weapon');
                          } else {
                            handleNonAttackAction(label, `${icon} ${combatant.name} uses ${label} — ${desc}`);
                          }
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                          padding: '7px 9px', borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                          background: primary ? 'rgba(139,26,26,0.3)' : 'rgba(38,22,0,0.7)',
                          border: `1px solid ${primary ? 'rgba(139,26,26,0.65)' : 'rgba(201,162,39,0.18)'}`,
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', marginBottom: 2 }}>{icon}</span>
                        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', fontWeight: 700, color: primary ? '#f4c842' : '#f4e4bc' }}>{label}</span>
                        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.51rem', color: 'rgba(244,228,188,0.38)', marginTop: 1, lineHeight: 1.35 }}>{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action used, waiting */}
              {combatStep === 'choose-action' && combatant.actionUsed && (
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.62rem', color: 'rgba(244,228,188,0.4)', textAlign: 'center', padding: '6px 0' }}>
                  Action spent — use Bonus Action or End Turn
                </div>
              )}

              {/* Non-attack confirmation */}
              {combatStep === 'done' && nonAttackNote && (
                <div style={{
                  background: 'rgba(45,27,0,0.5)', border: '1px solid rgba(201,162,39,0.25)',
                  borderRadius: 4, padding: '7px 9px',
                  fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: 'rgba(244,228,188,0.65)',
                }}>
                  {nonAttackNote}
                </div>
              )}

              {/* STEP 2 — Choose weapon */}
              {combatStep === 'choose-weapon' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <button onClick={() => setCombatStep('choose-action')} style={{
                      background: 'transparent', border: 'none', color: 'rgba(201,162,39,0.5)',
                      cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.6rem', padding: 0,
                    }}>← Back</button>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Choose weapon
                    </span>
                  </div>
                  {availableWeapons.length === 0 ? (
                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.62rem', color: 'rgba(244,228,188,0.4)' }}>
                      No attacks available
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {availableWeapons.map((w) => (
                        <button
                          key={w.name}
                          onClick={() => { setSelectedWeapon(w); setCombatStep('pick-target'); }}
                          style={{
                            padding: '7px 10px', borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                            background: 'rgba(26,15,0,0.8)', border: '1px solid rgba(201,162,39,0.28)',
                          }}
                        >
                          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.68rem', color: '#f4e4bc', fontWeight: 700 }}>
                            {w.name}
                          </div>
                          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.45)', marginTop: 2 }}>
                            +{w.attackBonus} to hit &bull; {w.damageDice} {w.damageType}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 — Pick target + roll */}
              {combatStep === 'pick-target' && selectedWeapon && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <button onClick={() => setCombatStep('choose-weapon')} style={{
                      background: 'transparent', border: 'none', color: 'rgba(201,162,39,0.5)',
                      cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.6rem', padding: 0,
                    }}>← Back</button>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'rgba(244,228,188,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Pick target
                    </span>
                  </div>

                  {/* Weapon chip */}
                  <div style={{
                    background: 'rgba(100,20,20,0.2)', border: '1px solid rgba(139,26,26,0.4)',
                    borderRadius: 3, padding: '5px 9px', marginBottom: 8,
                    fontFamily: 'Cinzel, serif', fontSize: '0.63rem',
                  }}>
                    <span style={{ color: '#f4c842' }}>⚔️ {selectedWeapon.name.replace(' ✓', '')}</span>
                    <span style={{ color: 'rgba(244,228,188,0.45)', marginLeft: 6 }}>
                      +{selectedWeapon.attackBonus} hit &bull; {selectedWeapon.damageDice} {selectedWeapon.damageType}
                    </span>
                  </div>

                  <TargetPicker targets={targets} selectedId={selectedTargetId} onSelect={setSelectedTargetId} />

                  <button
                    onClick={handleRollAttack}
                    disabled={!selectedTargetId}
                    style={{
                      width: '100%', marginTop: 8,
                      fontFamily: 'Cinzel, serif', fontSize: '0.75rem', fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.12em', padding: '8px 10px',
                      cursor: selectedTargetId ? 'pointer' : 'not-allowed',
                      background: selectedTargetId ? 'rgba(139,26,26,0.75)' : 'rgba(45,27,0,0.4)',
                      color: selectedTargetId ? '#f4e4bc' : 'rgba(244,228,188,0.2)',
                      border: `1px solid ${selectedTargetId ? 'rgba(180,40,40,0.8)' : 'rgba(201,162,39,0.1)'}`,
                      borderRadius: 4,
                      boxShadow: selectedTargetId ? '0 0 12px rgba(139,26,26,0.45)' : 'none',
                    }}
                  >
                    🎲 Roll d20 Attack
                  </button>
                </div>
              )}

              {/* STEP 4 — Result */}
              {combatStep === 'result' && attackResult && (
                <AttackResultBubble
                  result={attackResult}
                  isDM={isDM}
                  fumbleChoice={fumbleChoice}
                  onFumbleChange={setFumbleChoice}
                  onFumbleSend={handleFumbleSend}
                  onDismiss={() => { setAttackResult(null); setCombatStep('done'); }}
                />
              )}
            </div>
          )}

          {/* End turn button */}
          {(isDM || isMyToken) && onEndTurn && (
            <button
              onClick={onEndTurn}
              style={{
                width: '100%', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em', padding: '5px 8px',
                cursor: 'pointer',
                background: 'rgba(201,162,39,0.12)', color: '#c9a227',
                border: '1px solid rgba(201,162,39,0.38)', borderRadius: 2,
              }}
            >
              End Turn →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

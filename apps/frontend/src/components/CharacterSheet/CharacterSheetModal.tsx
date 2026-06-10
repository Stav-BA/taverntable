import React, { useState } from 'react';
import { useCharacterStore, CharacterSheet } from '@/stores/characterStore';
import {
  getAbilityMod, getProfBonus, getSavingThrowBonus, getSkillBonus,
  getPassivePerception, getSpellcastingBonus, getSpellSaveDC, xpToNextLevelInfo,
} from '@/stores/characterStore';
import { CLASSES, SKILLS, abilityMod } from '@/lib/classes5e';
import type { AbilityKey, Spell, ClassDefinition } from '@/lib/classes5e';

const gold = '#c9a227';
const bg = 'rgba(15,10,5,0.97)';
const surface = 'rgba(255,255,255,0.04)';
const border = 'rgba(201,162,39,0.2)';
const text = '#f4e4bc';
const textDim = 'rgba(244,228,188,0.55)';

type SheetTab = 'overview' | 'abilities' | 'spells' | 'equipment' | 'notes';

interface Props {
  playerId: string;
  onClose: () => void;
}

export function CharacterSheetModal({ playerId, onClose }: Props) {
  const sheet = useCharacterStore((s) => s.sheets[playerId]);
  const updateSheet = useCharacterStore((s) => s.updateSheet);
  const useSpellSlot = useCharacterStore((s) => s.useSpellSlot);
  const spendHitDie = useCharacterStore((s) => s.spendHitDie);
  const usePotion = useCharacterStore((s) => s.usePotion);
  const addDeathSaveSuccess = useCharacterStore((s) => s.addDeathSaveSuccess);
  const addDeathSaveFailure = useCharacterStore((s) => s.addDeathSaveFailure);
  const resetDeathSaves = useCharacterStore((s) => s.resetDeathSaves);
  const setConcentration = useCharacterStore((s) => s.setConcentration);

  const [activeTab, setActiveTab] = useState<SheetTab>('overview');
  const [editField, setEditField] = useState<string | null>(null);

  if (!sheet) return null;

  const cls = CLASSES[sheet.className];
  const profBonus = getProfBonus(sheet);
  const isDying = sheet.hp <= 0 && !sheet.isStabilized;
  const xpInfo = xpToNextLevelInfo(sheet);

  const TABS: Array<{ id: SheetTab; label: string; emoji: string }> = [
    { id: 'overview',   label: 'Overview',  emoji: '⚔️' },
    { id: 'abilities',  label: 'Abilities', emoji: '💪' },
    { id: 'spells',     label: 'Spells',    emoji: '🔮' },
    { id: 'equipment',  label: 'Equipment', emoji: '🎒' },
    { id: 'notes',      label: 'Notes',     emoji: '📜' },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 620, maxWidth: '95vw', maxHeight: '90vh',
          background: bg, border: `1px solid ${border}`,
          borderRadius: 12, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 0', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: gold, margin: 0 }}>
                {sheet.characterName}
              </h2>
              <p style={{ color: textDim, fontSize: 12, margin: '3px 0 0' }}>
                {sheet.race} {sheet.className} · Level {sheet.level} · {sheet.background}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* XP bar */}
              {sheet.level < 20 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: textDim, marginBottom: 2 }}>
                    XP: {sheet.xp.toLocaleString()} / {(sheet.xp + xpInfo.needed).toLocaleString()}
                  </div>
                  <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <div style={{ width: `${xpInfo.percent}%`, height: '100%', background: gold, borderRadius: 2 }} />
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: textDim, fontSize: 20, cursor: 'pointer', padding: '0 4px' }}
              >×</button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '6px 4px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? `2px solid ${gold}` : '2px solid transparent',
                  color: activeTab === tab.id ? gold : textDim, fontSize: 11,
                  fontFamily: 'Cinzel, serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                }}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {activeTab === 'overview' && (
            <OverviewTab
              sheet={sheet} cls={cls} profBonus={profBonus} isDying={isDying}
              onUpdate={(updates) => updateSheet(playerId, updates)}
              onSpendHitDie={() => spendHitDie(playerId)}
              onUsePotion={(id) => usePotion(playerId, id)}
              onDeathSaveSuccess={() => addDeathSaveSuccess(playerId)}
              onDeathSaveFailure={() => addDeathSaveFailure(playerId)}
              onResetDeathSaves={() => resetDeathSaves(playerId)}
            />
          )}
          {activeTab === 'abilities' && (
            <AbilitiesTab sheet={sheet} profBonus={profBonus} onUpdate={(u) => updateSheet(playerId, u)} />
          )}
          {activeTab === 'spells' && (
            <SpellsTab
              sheet={sheet}
              onUseSlot={(lvl) => useSpellSlot(playerId, lvl)}
              onConcentrate={(name) => setConcentration(playerId, name)}
              onUpdate={(u) => updateSheet(playerId, u)}
            />
          )}
          {activeTab === 'equipment' && (
            <EquipmentTab sheet={sheet} onUsePotion={(id) => usePotion(playerId, id)} onUpdate={(u) => updateSheet(playerId, u)} />
          )}
          {activeTab === 'notes' && (
            <NotesTab sheet={sheet} onUpdate={(u) => updateSheet(playerId, u)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────

function OverviewTab({ sheet, cls, profBonus, isDying, onUpdate, onSpendHitDie, onUsePotion, onDeathSaveSuccess, onDeathSaveFailure, onResetDeathSaves }: {
  sheet: CharacterSheet; cls: ClassDefinition;
  profBonus: number; isDying: boolean;
  onUpdate: (u: Partial<CharacterSheet>) => void;
  onSpendHitDie: () => void;
  onUsePotion: (id: string) => void;
  onDeathSaveSuccess: () => void;
  onDeathSaveFailure: () => void;
  onResetDeathSaves: () => void;
}) {
  const hpPct = sheet.maxHp > 0 ? Math.max(0, sheet.hp / sheet.maxHp) : 0;
  const hpColour = hpPct > 0.6 ? '#2d8a2d' : hpPct > 0.3 ? gold : '#8b1a1a';
  const potions = sheet.equipment.filter((i) => i.type === 'potion' && i.quantity > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main combat stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'AC', value: sheet.ac },
          { label: 'Initiative', value: (sheet.initiative !== 0 ? sheet.initiative : getAbilityMod(sheet, 'dex')), prefix: '+' },
          { label: 'Speed', value: `${sheet.speed} ft` },
          { label: 'Prof. Bonus', value: `+${profBonus}` },
        ].map((stat) => (
          <div key={stat.label} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: gold, fontFamily: 'Cinzel, serif' }}>
              {stat.prefix ?? ''}{stat.value}
            </div>
            <div style={{ fontSize: 10, color: textDim, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* HP */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: gold, fontFamily: 'Cinzel, serif', textTransform: 'uppercase', letterSpacing: 1 }}>Hit Points</span>
          {sheet.tempHp > 0 && <span style={{ fontSize: 11, color: '#87CEEB' }}>+{sheet.tempHp} Temp</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: hpColour, fontFamily: 'Cinzel, serif' }}>{sheet.hp}</div>
          <div style={{ color: textDim, fontSize: 16 }}>/</div>
          <div style={{ fontSize: 18, color: text, fontFamily: 'Cinzel, serif' }}>{sheet.maxHp}</div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${hpPct * 100}%`, height: '100%', background: hpColour, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
        {/* HP controls */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[-10, -5, -1, 1, 5, 10].map((delta) => (
            <button
              key={delta}
              onClick={() => onUpdate({ hp: Math.max(0, Math.min(sheet.maxHp, sheet.hp + delta)) })}
              style={{
                flex: 1, minWidth: 36, padding: '4px 0', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', borderRadius: 4,
                background: delta < 0 ? 'rgba(139,26,26,0.4)' : 'rgba(45,100,22,0.4)',
                color: text, border: `1px solid ${delta < 0 ? 'rgba(139,26,26,0.6)' : 'rgba(45,100,22,0.6)'}`,
              }}
            >{delta > 0 ? `+${delta}` : delta}</button>
          ))}
        </div>
      </div>

      {/* Hit Dice + Temp HP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Hit Dice (d{cls.hitDie})
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: text, fontFamily: 'Cinzel, serif', marginBottom: 8 }}>
            {sheet.hitDiceCurrent} / {sheet.hitDiceMax}
          </div>
          <button
            onClick={onSpendHitDie}
            disabled={sheet.hitDiceCurrent <= 0 || sheet.hp >= sheet.maxHp}
            style={{
              width: '100%', padding: '5px 0', fontSize: 11, cursor: 'pointer', borderRadius: 4,
              background: 'rgba(201,162,39,0.15)', color: gold, border: `1px solid ${border}`,
              opacity: sheet.hitDiceCurrent <= 0 ? 0.4 : 1,
            }}
          >Spend Hit Die</button>
        </div>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Temp HP
          </div>
          <input
            type="number"
            min={0}
            value={sheet.tempHp}
            onChange={(e) => onUpdate({ tempHp: Math.max(0, parseInt(e.target.value) || 0) })}
            style={{
              width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: 4,
              padding: '6px 8px', color: '#87CEEB', fontSize: 18, fontWeight: 700, fontFamily: 'Cinzel, serif',
              textAlign: 'center',
            }}
          />
        </div>
      </div>

      {/* Death saves */}
      {isDying && (
        <div style={{ background: 'rgba(139,0,0,0.2)', border: '1px solid rgba(139,0,0,0.5)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            💀 Death Saving Throws
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: textDim, marginBottom: 4 }}>Successes</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map((i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: i < sheet.deathSaves.successes ? '#2d8a2d' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: textDim, marginBottom: 4 }}>Failures</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map((i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: i < sheet.deathSaves.failures ? '#8b1a1a' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onDeathSaveSuccess} style={deathSaveBtnStyle('#2d8a2d')}>✓ Success</button>
            <button onClick={onDeathSaveFailure} style={deathSaveBtnStyle('#8b1a1a')}>✗ Failure</button>
            <button onClick={onResetDeathSaves} style={deathSaveBtnStyle('#555')}>Reset</button>
          </div>
        </div>
      )}

      {/* Potions */}
      {potions.length > 0 && (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Potions</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {potions.map((p) => (
              <button
                key={p.id}
                onClick={() => onUsePotion(p.id)}
                title={p.description}
                style={{
                  padding: '6px 12px', background: 'rgba(200,50,50,0.2)', border: '1px solid rgba(200,50,50,0.4)',
                  borderRadius: 6, color: '#ffaaaa', fontSize: 12, cursor: 'pointer',
                }}
              >
                🧪 {p.name} ×{p.quantity}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Passive Perception + Concentration */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatBox label="Passive Perception" value={getPassivePerception(sheet)} />
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Concentration</div>
          <div style={{ fontSize: 13, color: sheet.concentrating ? '#d4aaff' : textDim, fontStyle: sheet.concentrating ? 'normal' : 'italic' }}>
            {sheet.concentrating ?? 'None'}
          </div>
        </div>
      </div>
    </div>
  );
}

function deathSaveBtnStyle(colour: string) {
  return {
    flex: 1, padding: '5px 0', borderRadius: 4, cursor: 'pointer' as const,
    background: `${colour}33`, color: text, border: `1px solid ${colour}66`, fontSize: 11,
  };
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: gold, fontFamily: 'Cinzel, serif' }}>{value}</div>
      <div style={{ fontSize: 10, color: textDim, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

// ── ABILITIES TAB ─────────────────────────────────────────────────────────────

function AbilitiesTab({ sheet, profBonus, onUpdate }: { sheet: CharacterSheet; profBonus: number; onUpdate: (u: Partial<CharacterSheet>) => void }) {
  const abilities: { key: AbilityKey; label: string }[] = [
    { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' }, { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' }, { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Ability scores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
        {abilities.map(({ key, label }) => {
          const score = sheet[key];
          const mod = abilityMod(score);
          return (
            <div key={key} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: gold, fontFamily: 'Cinzel, serif' }}>
                {mod >= 0 ? `+${mod}` : mod}
              </div>
              <input
                type="number"
                min={1} max={30}
                value={score}
                onChange={(e) => onUpdate({ [key]: Math.max(1, Math.min(30, parseInt(e.target.value) || 10)) })}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`,
                  borderRadius: 3, padding: '2px 0', color: text, fontSize: 11, textAlign: 'center', marginTop: 4,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Saving throws */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 11, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Saving Throws</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {abilities.map(({ key, label }) => {
            const bonus = getSavingThrowBonus(sheet, key);
            const isProficient = sheet.savingThrowProficiencies.includes(key);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isProficient ? gold : 'rgba(255,255,255,0.15)', border: `1px solid ${border}`, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: textDim, width: 32 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: bonus >= 0 ? text : '#ff9999' }}>
                  {bonus >= 0 ? `+${bonus}` : bonus}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 11, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Skills</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
          {SKILLS.map(({ name, ability }) => {
            const bonus = getSkillBonus(sheet, name);
            const isProficient = sheet.skillProficiencies.includes(name);
            const isExpert = sheet.skillExpertise.includes(name);
            return (
              <div
                key={name}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px', borderRadius: 3, cursor: 'pointer' }}
                onClick={() => {
                  if (isExpert) {
                    onUpdate({ skillExpertise: sheet.skillExpertise.filter((s) => s !== name), skillProficiencies: sheet.skillProficiencies.filter((s) => s !== name) });
                  } else if (isProficient) {
                    onUpdate({ skillExpertise: [...sheet.skillExpertise, name] });
                  } else {
                    onUpdate({ skillProficiencies: [...sheet.skillProficiencies, name] });
                  }
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: isExpert ? '#d4aaff' : isProficient ? gold : 'rgba(255,255,255,0.12)',
                  border: `1px solid ${border}`,
                }} />
                <span style={{ fontSize: 10, color: textDim, flex: 1 }}>{name}</span>
                <span style={{ fontSize: 10, color: textDim, width: 20, textAlign: 'right' }}>({ability.toUpperCase()})</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: bonus >= 0 ? text : '#ff9999', width: 24, textAlign: 'right' }}>
                  {bonus >= 0 ? `+${bonus}` : bonus}
                </span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 9, color: textDim, marginTop: 6 }}>Click skill to toggle: none → proficient → expertise</p>
      </div>
    </div>
  );
}

// ── SPELLS TAB ────────────────────────────────────────────────────────────────

function SpellsTab({ sheet, onUseSlot, onConcentrate, onUpdate }: {
  sheet: CharacterSheet;
  onUseSlot: (level: number) => void;
  onConcentrate: (name: string | null) => void;
  onUpdate: (u: Partial<CharacterSheet>) => void;
}) {
  const cls = CLASSES[sheet.className];
  const isWarlock = sheet.className === 'Warlock';
  const hasSpells = cls.spellcasting !== 'none';
  const spellBonus = getSpellcastingBonus(sheet);
  const spellDC = getSpellSaveDC(sheet);
  const [selectedLevel, setSelectedLevel] = useState<number>(0);

  if (!hasSpells) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: textDim, fontSize: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
        {sheet.className} does not have spellcasting.
      </div>
    );
  }

  const allClassSpells = cls.spellList;
  const filteredSpells = allClassSpells.filter((s) => s.level === selectedLevel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Spellcasting stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <StatBox label="Spell Attack" value={`+${spellBonus}`} />
        <StatBox label="Save DC" value={spellDC} />
        <StatBox label="Ability" value={cls.spellcastingAbility?.toUpperCase() ?? '—'} />
      </div>

      {/* Spell slots */}
      {isWarlock ? (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Pact Magic Slots (Level {sheet.warlockSlotLevel})
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: sheet.warlockSlotsMax }).map((_, i) => (
              <button
                key={i}
                onClick={() => onUpdate({ warlockSlotsCurrent: Math.max(0, sheet.warlockSlotsCurrent - 1) })}
                style={{
                  width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
                  background: i < sheet.warlockSlotsCurrent ? '#4B0082' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${i < sheet.warlockSlotsCurrent ? '#9400D3' : border}`,
                  color: '#d4aaff', fontSize: 14,
                }}
              >
                {i < sheet.warlockSlotsCurrent ? '◆' : '◇'}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Spell Slots</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sheet.spellSlotsMax.map((maxSlots, idx) => {
              if (maxSlots === 0) return null;
              const level = idx + 1;
              const current = sheet.spellSlots[idx];
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: textDim, width: 40, textTransform: 'uppercase' }}>
                    {level}{['st','nd','rd','th','th','th','th','th','th'][idx]}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: maxSlots }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => i < current && onUseSlot(level)}
                        style={{
                          width: 24, height: 24, borderRadius: 4, cursor: i < current ? 'pointer' : 'default',
                          background: i < current ? 'rgba(201,162,39,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${i < current ? gold : border}`,
                          color: gold, fontSize: 10,
                        }}
                      >
                        {i < current ? '◆' : '◇'}
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: textDim }}>{current}/{maxSlots}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Concentration */}
      {sheet.concentrating && (
        <div style={{ background: 'rgba(75,0,130,0.15)', border: '1px solid rgba(148,0,211,0.3)', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#d4aaff' }}>🔮 Concentrating: <strong>{sheet.concentrating}</strong></span>
          <button onClick={() => onConcentrate(null)} style={{ background: 'none', border: 'none', color: '#ff9999', cursor: 'pointer', fontSize: 12 }}>End</button>
        </div>
      )}

      {/* Spell browser */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 11, color: gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Spell List</div>
        {/* Level filter */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {[0,1,2,3,4,5,6,7,8,9].map((lvl) => {
            const hasSpellsAtLevel = allClassSpells.some((s) => s.level === lvl);
            if (!hasSpellsAtLevel && lvl > 0) return null;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10,
                  background: selectedLevel === lvl ? 'rgba(201,162,39,0.2)' : 'transparent',
                  border: `1px solid ${selectedLevel === lvl ? gold : border}`,
                  color: selectedLevel === lvl ? gold : textDim,
                }}
              >
                {lvl === 0 ? 'Cantrip' : `${lvl}${['','st','nd','rd','th','th','th','th','th','th'][lvl]}`}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
          {filteredSpells.map((spell) => (
            <SpellCard key={spell.name} spell={spell} isConcentrating={sheet.concentrating === spell.name} onConcentrate={() => onConcentrate(spell.concentration ? spell.name : null)} />
          ))}
          {filteredSpells.length === 0 && <p style={{ fontSize: 11, color: textDim, textAlign: 'center', padding: 12 }}>No spells at this level</p>}
        </div>
      </div>
    </div>
  );
}

function SpellCard({ spell, isConcentrating, onConcentrate }: { spell: Spell; isConcentrating: boolean; onConcentrate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        background: isConcentrating ? 'rgba(75,0,130,0.15)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isConcentrating ? 'rgba(148,0,211,0.4)' : border}`,
        borderRadius: 6, padding: '6px 10px', cursor: 'pointer',
      }}
      onClick={() => setExpanded((e) => !e)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: text }}>{spell.name}</span>
          {spell.concentration && <span style={{ fontSize: 9, color: '#d4aaff', border: '1px solid rgba(148,0,211,0.4)', borderRadius: 3, padding: '1px 4px' }}>C</span>}
          {spell.ritual && <span style={{ fontSize: 9, color: '#87CEEB', border: '1px solid rgba(135,206,235,0.4)', borderRadius: 3, padding: '1px 4px' }}>R</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: textDim }}>{spell.castingTime}</span>
          {spell.concentration && (
            <button
              onClick={(e) => { e.stopPropagation(); onConcentrate(); }}
              style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, cursor: 'pointer', background: 'rgba(75,0,130,0.3)', color: '#d4aaff', border: '1px solid rgba(148,0,211,0.4)' }}
            >
              {isConcentrating ? 'End' : 'Cast'}
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${border}` }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 4, fontSize: 10, color: textDim }}>
            <span>Range: {spell.range}</span>
            <span>Duration: {spell.duration}</span>
            <span>Components: {spell.components}</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(244,228,188,0.8)', margin: 0, lineHeight: 1.5 }}>{spell.description}</p>
        </div>
      )}
    </div>
  );
}

// ── EQUIPMENT TAB ─────────────────────────────────────────────────────────────

function EquipmentTab({ sheet, onUsePotion, onUpdate }: { sheet: CharacterSheet; onUsePotion: (id: string) => void; onUpdate: (u: Partial<CharacterSheet>) => void }) {
  const [newItemName, setNewItemName] = useState('');

  const addMiscItem = () => {
    if (!newItemName.trim()) return;
    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      quantity: 1,
      type: 'misc' as const,
    };
    onUpdate({ equipment: [...sheet.equipment, newItem] });
    setNewItemName('');
  };

  const removeItem = (id: string) => {
    onUpdate({ equipment: sheet.equipment.filter((i) => i.id !== id) });
  };

  const changeQty = (id: string, delta: number) => {
    onUpdate({
      equipment: sheet.equipment.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
      ).filter((i) => i.quantity > 0),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sheet.equipment.map((item) => (
        <div key={item.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{item.type === 'potion' ? '🧪' : item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '📦'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: text, fontWeight: 600 }}>{item.name}</div>
            {item.description && <div style={{ fontSize: 10, color: textDim }}>{item.description}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => changeQty(item.id, -1)} style={qtyBtnStyle}>−</button>
            <span style={{ fontSize: 12, color: text, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
            <button onClick={() => changeQty(item.id, 1)} style={qtyBtnStyle}>+</button>
          </div>
          {item.type === 'potion' && (
            <button
              onClick={() => onUsePotion(item.id)}
              style={{ padding: '4px 10px', background: 'rgba(200,50,50,0.2)', border: '1px solid rgba(200,50,50,0.4)', borderRadius: 4, color: '#ffaaaa', fontSize: 11, cursor: 'pointer' }}
            >Use</button>
          )}
          <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: textDim, cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      ))}

      {/* Add item */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          placeholder="Add item…"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addMiscItem()}
          style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: 6, padding: '6px 10px', color: text, fontSize: 12 }}
        />
        <button
          onClick={() => {
            const healingPotion: typeof sheet.equipment[0] = { id: `potion-${Date.now()}`, name: 'Healing Potion', quantity: 1, type: 'potion', healingDice: '2d4+2', description: 'Bonus action: heal 2d4+2 HP' };
            onUpdate({ equipment: [...sheet.equipment, healingPotion] });
          }}
          style={{ padding: '6px 10px', background: 'rgba(200,50,50,0.15)', border: '1px solid rgba(200,50,50,0.3)', borderRadius: 6, color: '#ffaaaa', fontSize: 11, cursor: 'pointer' }}
        >+ Potion</button>
        <button onClick={addMiscItem} style={{ padding: '6px 10px', background: 'rgba(201,162,39,0.15)', border: `1px solid ${border}`, borderRadius: 6, color: gold, fontSize: 11, cursor: 'pointer' }}>+ Item</button>
      </div>
    </div>
  );
}

const qtyBtnStyle: React.CSSProperties = {
  width: 22, height: 22, background: surface, border: `1px solid ${border}`, borderRadius: 3, color: text, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

// ── NOTES TAB ─────────────────────────────────────────────────────────────────

function NotesTab({ sheet, onUpdate }: { sheet: CharacterSheet; onUpdate: (u: Partial<CharacterSheet>) => void }) {
  const fields: Array<{ key: keyof CharacterSheet; label: string; placeholder: string }> = [
    { key: 'features', label: 'Features & Traits', placeholder: 'Class features, racial traits, feats…' },
    { key: 'ideals', label: 'Ideals', placeholder: 'What principles drive you?' },
    { key: 'bonds', label: 'Bonds', placeholder: 'Who or what is most important to you?' },
    { key: 'flaws', label: 'Flaws', placeholder: 'What weaknesses or vices do you have?' },
    { key: 'notes', label: 'Session Notes', placeholder: 'Anything else worth remembering…' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {(['race', 'background', 'alignment'] as const).map((field) => (
          <div key={field}>
            <label style={{ fontSize: 10, color: textDim, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>{field}</label>
            <input
              value={sheet[field] as string}
              onChange={(e) => onUpdate({ [field]: e.target.value })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: 4, padding: '5px 8px', color: text, fontSize: 12 }}
            />
          </div>
        ))}
      </div>
      {fields.map(({ key, label, placeholder }) => (
        <div key={String(key)}>
          <label style={{ fontSize: 10, color: textDim, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>{label}</label>
          <textarea
            value={sheet[key] as string}
            onChange={(e) => onUpdate({ [key]: e.target.value })}
            placeholder={placeholder}
            rows={3}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: text, fontSize: 12, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
      ))}
    </div>
  );
}

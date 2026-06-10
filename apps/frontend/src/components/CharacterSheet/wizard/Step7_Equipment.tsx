/**
 * Step 7 — Starting Equipment (choice-based)
 * Players pick from D&D 5e PHB choice groups per class.
 * Guaranteed items are shown separately.
 */

import React, { useEffect, useState, useMemo } from 'react';
import type { Character, EquipmentItem } from '../types';
import { getClassGear, buildEquipmentList } from '../../../lib/startingGear5e';
import type { GearOption } from '../../../lib/startingGear5e';

interface Step7Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  onReady: (ready: boolean) => void;
}

// ── Item icon helper ─────────────────────────────────────────────────────────

function itemIcon(item: EquipmentItem): string {
  if (item.isWeapon) {
    const dmg = item.weaponData?.damage ?? '';
    if (dmg.includes('d12') || dmg.includes('d10')) return '🪓';
    if (item.weaponData?.range) return '🏹';
    return '⚔️';
  }
  if (item.isArmor) {
    const t = item.armorData?.armorType ?? '';
    if (t === 'heavy') return '🛡️';
    if (t === 'medium') return '🥋';
    return '👘';
  }
  const name = item.name.toLowerCase();
  if (name.includes('pack'))    return '🎒';
  if (name.includes('spell'))   return '📖';
  if (name.includes('symbol') || name.includes('holy')) return '✨';
  if (name.includes('focus') || name.includes('orb') || name.includes('pouch')) return '🔮';
  if (name.includes('arrow') || name.includes('bolt') || name.includes('dart')) return '🏹';
  if (name.includes('shield'))  return '🛡️';
  if (name.includes('tool'))    return '🔧';
  if (name.includes('lute') || name.includes('instrument')) return '🎵';
  if (name.includes('herb'))    return '🌿';
  return '📦';
}

// ── Option card ──────────────────────────────────────────────────────────────

function OptionCard({
  option, selected, onClick,
}: {
  option: GearOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
        padding: '10px 12px', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
        background: selected ? '#FFF8E7' : '#F4E4BC',
        border: `2px solid ${selected ? '#C9A227' : '#8B6914'}`,
        boxShadow: selected ? '0 0 0 2px rgba(201,162,39,0.3)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      {/* Radio indicator */}
      <div style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        border: `2px solid ${selected ? '#C9A227' : '#8B6914'}`,
        background: selected ? '#C9A227' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D1B00' }} />}
      </div>

      <div style={{ flex: 1 }}>
        {/* Label */}
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#2D1B00', fontWeight: selected ? 700 : 600, marginBottom: 4 }}>
          {option.label}
        </div>

        {/* Item chips */}
        {option.items.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {option.items.map((item) => (
              <span
                key={item.id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: selected ? 'rgba(201,162,39,0.2)' : 'rgba(45,27,0,0.08)',
                  border: `1px solid ${selected ? 'rgba(201,162,39,0.5)' : 'rgba(45,27,0,0.15)'}`,
                  borderRadius: 4, padding: '2px 7px',
                  fontFamily: "'Crimson Text', serif", fontSize: 12, color: '#3D2400',
                }}
              >
                <span>{itemIcon(item)}</span>
                <span>{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>
                {item.isWeapon && item.weaponData && (
                  <span style={{ color: '#8B4513', fontStyle: 'italic' }}>
                    {item.weaponData.damage} {item.weaponData.damageType}
                  </span>
                )}
                {item.isArmor && item.armorData && (
                  <span style={{ color: '#4A6741', fontStyle: 'italic' }}>
                    AC {item.armorData.baseAC}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ── Choice group ─────────────────────────────────────────────────────────────

function ChoiceGroup({
  choiceIndex, prompt, options, selected, onSelect,
}: {
  choiceIndex: number;
  prompt: string;
  options: GearOption[];
  selected: string | undefined;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: selected ? '#C9A227' : '#8B6914',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: '#2D1B00',
        }}>
          {choiceIndex + 1}
        </div>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#5A3E1B', fontWeight: 600 }}>
          {prompt}
        </span>
        {!selected && (
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#CC3300', marginLeft: 'auto' }}>
            Required ↑
          </span>
        )}
        {selected && (
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#4A7A3A', marginLeft: 'auto' }}>
            ✓ Chosen
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 30 }}>
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            option={opt}
            selected={selected === opt.id}
            onClick={() => onSelect(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Guaranteed items panel ────────────────────────────────────────────────────

function GuaranteedPanel({ items }: { items: EquipmentItem[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{
      background: '#EDD9A3', border: '1px solid #8B6914', borderRadius: 6, padding: '12px 16px', marginTop: 6,
    }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', marginBottom: 8, letterSpacing: '0.05em' }}>
        ALWAYS INCLUDED
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <span
            key={item.id}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#F4E4BC', border: '1px solid #C9A227',
              borderRadius: 4, padding: '3px 8px',
              fontFamily: "'Crimson Text', serif", fontSize: 13, color: '#2D1B00',
            }}
          >
            <span>{itemIcon(item)}</span>
            <span>{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Summary sidebar ───────────────────────────────────────────────────────────

function EquipmentSummary({ items, strScore }: { items: EquipmentItem[]; strScore: number }) {
  const totalWeight = items.reduce((s, i) => s + i.weight * i.quantity, 0);
  const weapons = items.filter(i => i.isWeapon);
  const armors = items.filter(i => i.isArmor);

  return (
    <div style={{
      background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8,
      padding: 16, minWidth: 200, alignSelf: 'flex-start',
    }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', marginBottom: 12, letterSpacing: '0.05em' }}>
        YOUR LOADOUT
      </div>

      {items.length === 0 ? (
        <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 13, color: '#8B6914', fontStyle: 'italic' }}>
          Make your choices to see your loadout
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Weapons */}
          {weapons.length > 0 && (
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#8B4513', marginBottom: 3 }}>⚔️ WEAPONS</div>
              {weapons.map(w => (
                <div key={w.id} style={{ fontFamily: "'Crimson Text', serif", fontSize: 12, color: '#2D1B00', paddingLeft: 8, marginBottom: 1 }}>
                  {w.name} — {w.weaponData?.damage} {w.weaponData?.damageType}
                </div>
              ))}
            </div>
          )}

          {/* Armor */}
          {armors.length > 0 && (
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#4A6741', marginBottom: 3 }}>🛡️ ARMOR</div>
              {armors.map(a => (
                <div key={a.id} style={{ fontFamily: "'Crimson Text', serif", fontSize: 12, color: '#2D1B00', paddingLeft: 8, marginBottom: 1 }}>
                  {a.name} — AC {a.armorData?.baseAC}
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div style={{ borderTop: '1px solid #8B6914', paddingTop: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Items',          value: String(items.length) },
              { label: 'Total Weight',   value: `${totalWeight.toFixed(1)} lb` },
              { label: 'Carry Capacity', value: `${strScore * 15} lb` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#F4E4BC', borderRadius: 4, padding: '5px 8px' }}>
                <div style={{ fontSize: 10, color: '#5A3E1B', fontFamily: "'Cinzel', serif" }}>{label}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: '#2D1B00', fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Step7_Equipment({ character, updateCharacter, onReady }: Step7Props) {
  const gear = useMemo(() => getClassGear(character.class), [character.class]);
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Reset selections when class changes
  useEffect(() => {
    setSelections({});
  }, [character.class]);

  // Check completion and build equipment list whenever selections change
  useEffect(() => {
    if (!gear) {
      onReady(true); // no class = let them through
      return;
    }
    const allChosen = gear.choices.every(c => selections[c.id] != null);
    onReady(allChosen);

    if (allChosen) {
      const equip = buildEquipmentList(gear, selections);
      updateCharacter({ equipment: equip });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, gear]);

  const handleSelect = (choiceId: string, optionId: string) => {
    setSelections(prev => ({ ...prev, [choiceId]: optionId }));
  };

  const previewItems = gear ? buildEquipmentList(gear, selections) : [];

  // ── No class chosen ─────────────────────────────────────────────────────────
  if (!gear) {
    return (
      <div>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 22, textAlign: 'center', marginBottom: 8 }}>
          Starting Equipment
        </h2>
        <div style={{ textAlign: 'center', color: '#8B6914', fontStyle: 'italic', padding: '40px 20px', fontFamily: "'Crimson Text', serif", fontSize: 15 }}>
          No class selected — please go back and choose your class first.
        </div>
      </div>
    );
  }

  const totalChoices = gear.choices.length;
  const madeChoices = gear.choices.filter(c => selections[c.id] != null).length;
  const allDone = madeChoices === totalChoices;

  return (
    <div>
      {/* Header */}
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 22, textAlign: 'center', marginBottom: 4 }}>
        Starting Equipment
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 4, fontFamily: "'Crimson Text', serif", fontSize: 15 }}>
        As a <strong>{character.class}</strong>, choose your starting gear for each option below.
      </p>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
        {gear.choices.map((c, i) => (
          <div
            key={c.id}
            style={{
              width: 28, height: 6, borderRadius: 3,
              background: selections[c.id] ? '#C9A227' : '#D4B483',
              transition: 'background 0.2s',
            }}
            title={c.prompt}
          />
        ))}
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#5A3E1B', marginLeft: 4 }}>
          {madeChoices}/{totalChoices} chosen
        </span>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Choice groups */}
        <div style={{ flex: 2 }}>
          {gear.choices.map((choice, i) => (
            <ChoiceGroup
              key={choice.id}
              choiceIndex={i}
              prompt={choice.prompt}
              options={choice.options}
              selected={selections[choice.id]}
              onSelect={(optId) => handleSelect(choice.id, optId)}
            />
          ))}

          {/* Guaranteed items */}
          <GuaranteedPanel items={gear.guaranteed} />

          {/* Completion banner */}
          {allDone && (
            <div style={{
              marginTop: 16, padding: '10px 16px', borderRadius: 6, textAlign: 'center',
              background: '#E8F5E2', border: '2px solid #4A7A3A',
            }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#2D5A20', fontWeight: 700 }}>
                ✅ All choices made — your equipment is ready!
              </span>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <EquipmentSummary
          items={previewItems}
          strScore={character.abilityScores.str}
        />
      </div>
    </div>
  );
}

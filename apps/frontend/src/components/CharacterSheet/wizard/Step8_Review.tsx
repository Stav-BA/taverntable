/**
 * Step 8 — Full Character Review before saving
 */

import React from 'react';
import { getAbilityModifier, getProficiencyBonus } from '@taverntable/dnd-rules';
import type { Character } from '../types';

interface Step8Props {
  character: Character;
  onEdit: (step: number) => void;
}

function modStr(mod: number) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const ABILITY_ABBR: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
};

function Section({ title, step, onEdit, children }: { title: string; step: number; onEdit: (s: number) => void; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 15, margin: 0, letterSpacing: '0.04em' }}>
          {title}
        </h3>
        <button
          onClick={() => onEdit(step)}
          style={{
            background: 'none', border: '1px solid #C9A227',
            color: '#8B6914', borderRadius: 4, padding: '2px 10px',
            cursor: 'pointer', fontSize: 11, fontFamily: "'Cinzel', serif",
          }}
        >
          ✏ Edit
        </button>
      </div>
      <div style={{ background: '#EDD9A3', border: '1px solid #2D1B00', borderRadius: 6, padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

export default function Step8_Review({ character, onEdit }: Step8Props) {
  const profBonus = character.level >= 1 ? getProficiencyBonus(character.level) : 2;
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

  const equippedArmor = character.equipment.find(e => e.isArmor && e.equipped);
  const weapons = character.equipment.filter(e => e.isWeapon);

  return (
    <div>
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 24, marginBottom: 4, textAlign: 'center' }}>
        Review Your Character
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
        Everything looks good? Click "Create Character" to begin your adventure.
      </p>

      {/* Identity */}
      <Section title="Identity" step={5} onEdit={onEdit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Name', character.name || '—'],
            ['Pronouns', character.pronouns || '—'],
            ['Species', character.species || '—'],
            ['Class', character.class || '—'],
            ['Background', character.background || '—'],
            ['Alignment', character.alignment || '—'],
            ['Level', String(character.level)],
          ].map(([label, value]) => (
            <div key={label}>
              <span style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif" }}>{label}: </span>
              <span style={{ fontSize: 14, color: '#2D1B00', fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Ability Scores */}
      <Section title="Ability Scores" step={4} onEdit={onEdit}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {abilities.map(ab => {
            const score = character.abilityScores[ab];
            const mod = getAbilityModifier(score);
            return (
              <div key={ab} style={{
                background: '#F4E4BC', border: '2px solid #2D1B00', borderRadius: 8,
                padding: '12px 16px', textAlign: 'center', minWidth: 72,
              }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#5A3E1B', marginBottom: 4 }}>
                  {ABILITY_ABBR[ab]}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 700, color: '#2D1B00' }}>
                  {score}
                </div>
                <div style={{ fontSize: 13, color: '#5A3E1B', marginTop: 2 }}>
                  {modStr(mod)}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#5A3E1B' }}>
          Proficiency Bonus: <strong style={{ color: '#C9A227' }}>+{profBonus}</strong>
        </div>
      </Section>

      {/* Skills */}
      {character.skillProficiencies.length > 0 && (
        <Section title="Skill Proficiencies" step={4} onEdit={onEdit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {character.skillProficiencies.map(skill => (
              <span key={skill} style={{
                background: '#2D5016', color: '#F4E4BC',
                borderRadius: 12, padding: '3px 10px',
                fontSize: 12, fontFamily: "'Cinzel', serif",
              }}>
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Equipment */}
      <Section title="Starting Equipment" step={6} onEdit={onEdit}>
        {character.equipment.length === 0 ? (
          <div style={{ color: '#8B6914', fontStyle: 'italic' }}>No equipment selected.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {character.equipment.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#2D1B00' }}>
                <span>{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>
                {item.isArmor && item.armorData && (
                  <span style={{ color: '#5A3E1B', fontSize: 12 }}>AC {item.armorData.baseAC}</span>
                )}
                {item.isWeapon && item.weaponData && (
                  <span style={{ color: '#5A3E1B', fontSize: 12 }}>{item.weaponData.damage} {item.weaponData.damageType}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Backstory preview */}
      {character.backstory && (
        <Section title="Backstory" step={5} onEdit={onEdit}>
          <p style={{ fontSize: 14, color: '#2D1B00', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            {character.backstory.slice(0, 300)}{character.backstory.length > 300 ? '...' : ''}
          </p>
        </Section>
      )}

      <div style={{
        background: '#2D5016', color: '#F4E4BC',
        borderRadius: 8, padding: '16px 24px',
        textAlign: 'center', fontSize: 16,
        fontFamily: "'Cinzel', serif",
        letterSpacing: '0.04em',
        marginTop: 8,
      }}>
        ⚔ Ready to adventure as <strong>{character.name || 'your character'}</strong>!
        <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8, fontFamily: "'Crimson Text', Georgia, serif", fontStyle: 'italic' }}>
          Click "Create Character" to open your live character sheet.
        </div>
      </div>
    </div>
  );
}

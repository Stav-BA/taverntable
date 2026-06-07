/**
 * Step 4 — Background, ASI, and Origin Feat (2024 rule)
 */

import React, { useState, useEffect } from 'react';
import type { Character, BackgroundData } from '../types';
import { SRD_BACKGROUNDS } from '../types';

interface Step4Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  onReady: (ready: boolean) => void;
}

const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

export default function Step4_Background({ character, updateCharacter, onReady }: Step4Props) {
  const [selected, setSelected] = useState<BackgroundData | null>(
    SRD_BACKGROUNDS.find(b => b.name === character.background) ?? null,
  );

  useEffect(() => { onReady(!!selected); }, [selected, onReady]);

  const handleSelect = (bg: BackgroundData) => {
    setSelected(bg);
    // Apply ASI
    const newScores = { ...character.abilityScores };
    bg.abilityScoreIncreases.forEach(asi => {
      const key = asi.ability as keyof typeof newScores;
      newScores[key] = (newScores[key] || 10) + asi.amount;
    });
    // Add skill proficiencies
    const existingProfs = character.skillProficiencies.filter(
      s => !SRD_BACKGROUNDS.some(b => b.skillProficiencies.includes(s)),
    );
    updateCharacter({
      background: bg.name,
      abilityScores: newScores,
      skillProficiencies: [...existingProfs, ...bg.skillProficiencies],
    });
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 24, marginBottom: 4, textAlign: 'center' }}>
        Choose Your Background
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 8, fontSize: 14 }}>
        Your background shapes your past — and grants your ability score increases, skills, and origin feat.
      </p>
      <div style={{
        background: '#FFF8E7', border: '1px solid #C9A227', borderRadius: 6,
        padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#5A3E1B',
        textAlign: 'center',
      }}>
        📜 <strong>2024 Rule:</strong> Backgrounds now grant your Ability Score Increases (+2 to one, +1 to another) and an <em>Origin Feat</em>.
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Background List */}
        <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {SRD_BACKGROUNDS.map(bg => {
            const isSelected = selected?.name === bg.name;
            return (
              <div
                key={bg.name}
                onClick={() => handleSelect(bg)}
                style={{
                  background: isSelected ? '#FFF8E7' : '#EDD9A3',
                  border: `2px solid ${isSelected ? '#C9A227' : '#2D1B00'}`,
                  borderRadius: 8,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 0 2px #C9A22766' : 'none',
                }}
              >
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 15,
                  color: isSelected ? '#8B6914' : '#2D1B00',
                  fontWeight: isSelected ? 700 : 400,
                  marginBottom: 6,
                }}>
                  {bg.name}
                </div>
                <div style={{ fontSize: 12, color: '#5A3E1B', marginBottom: 6 }}>
                  <span style={{ color: '#C9A227' }}>⬆</span> {bg.abilityScoreIncreases.map(a => `+${a.amount} ${ABILITY_LABELS[a.ability]}`).join(', ')}
                </div>
                <div style={{ fontSize: 12, color: '#5A3E1B' }}>
                  Skills: {bg.skillProficiencies.join(', ')}
                </div>
                <div style={{ fontSize: 12, color: '#5A3E1B', marginTop: 4 }}>
                  Feat: <em>{bg.feat}</em>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div style={{
          flex: 1,
          background: '#EDD9A3',
          border: '2px solid #2D1B00',
          borderRadius: 8,
          padding: 20,
          minWidth: 200,
          alignSelf: 'flex-start',
        }}>
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 18, margin: 0 }}>
                {selected.name}
              </h3>
              <p style={{ color: '#5A3E1B', fontSize: 13, fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                {selected.description}
              </p>

              <Section label="Ability Score Increases">
                {selected.abilityScoreIncreases.map(a => (
                  <div key={a.ability} style={{ fontSize: 13, color: '#2D1B00' }}>
                    <span style={{ color: '#2D5016', fontWeight: 700 }}>+{a.amount}</span> {ABILITY_LABELS[a.ability]}
                  </div>
                ))}
              </Section>

              <Section label="Skill Proficiencies">
                <div style={{ fontSize: 13, color: '#2D1B00' }}>{selected.skillProficiencies.join(', ')}</div>
              </Section>

              {selected.toolProficiency && (
                <Section label="Tool Proficiency">
                  <div style={{ fontSize: 13, color: '#2D1B00' }}>{selected.toolProficiency}</div>
                </Section>
              )}

              {selected.languages > 0 && (
                <Section label="Languages">
                  <div style={{ fontSize: 13, color: '#2D1B00' }}>+{selected.languages} of your choice</div>
                </Section>
              )}

              <Section label="Origin Feat">
                <div style={{
                  background: '#1A3A6B', color: '#C9D8FF',
                  padding: '6px 10px', borderRadius: 4,
                  fontSize: 13, fontFamily: "'Cinzel', serif",
                }}>
                  ✨ {selected.feat}
                </div>
              </Section>

              <Section label="Starting Equipment">
                {selected.equipment.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#2D1B00', padding: '2px 0' }}>
                    • {item}
                  </div>
                ))}
              </Section>
            </div>
          ) : (
            <div style={{ color: '#8B6914', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
              Select a background to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#F4E4BC', borderRadius: 4, padding: 10 }}>
      <div style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif", letterSpacing: '0.04em', marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

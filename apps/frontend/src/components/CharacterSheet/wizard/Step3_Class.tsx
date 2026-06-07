/**
 * Step 3 — Class Picker
 * Hit die, role, subclass preview, spellcaster badge.
 */

import React, { useState, useEffect } from 'react';
import type { Character, ClassData } from '../types';
import { SRD_CLASSES } from '../types';

interface Step3Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  onReady: (ready: boolean) => void;
}

export default function Step3_Class({ character, updateCharacter, onReady }: Step3Props) {
  const [selected, setSelected] = useState<ClassData | null>(
    SRD_CLASSES.find(c => c.name === character.class) ?? null,
  );

  useEffect(() => { onReady(!!selected); }, [selected, onReady]);

  const handleSelect = (cls: ClassData) => {
    setSelected(cls);
    updateCharacter({
      class: cls.name,
      savingThrowProficiencies: cls.savingThrows,
      equipment: cls.startingEquipment,
    });
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 24, marginBottom: 4, textAlign: 'center' }}>
        Choose Your Class
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
        Your class determines your abilities, hit points, and role in the party.
      </p>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Class List */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SRD_CLASSES.map(cls => {
            const isSelected = selected?.name === cls.name;
            return (
              <div
                key={cls.name}
                onClick={() => handleSelect(cls)}
                style={{
                  background: isSelected ? '#FFF8E7' : '#EDD9A3',
                  border: `2px solid ${isSelected ? '#C9A227' : '#2D1B00'}`,
                  borderRadius: 6,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(201,162,39,0.3)' : 'none',
                }}
              >
                <span style={{ fontSize: 28, minWidth: 36, textAlign: 'center' }}>{cls.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: 16,
                      color: '#2D1B00',
                      fontWeight: isSelected ? 700 : 400,
                    }}>
                      {cls.name}
                    </span>
                    {cls.isSpellcaster && (
                      <span style={{
                        background: '#1A3A6B', color: '#C9D8FF',
                        fontSize: 10, padding: '1px 6px', borderRadius: 10,
                        fontFamily: "'Cinzel', serif",
                      }}>✨ CASTER</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#5A3E1B' }}>
                    {cls.role} · d{cls.hitDie} hit die · {cls.primaryAbility}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 60 }}>
                  <div style={{
                    background: '#2D1B00', color: '#C9A227',
                    borderRadius: 4, padding: '4px 8px',
                    fontSize: 14, fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                  }}>
                    d{cls.hitDie}
                  </div>
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
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignSelf: 'flex-start',
          position: 'sticky',
          top: 0,
        }}>
          {selected ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}>{selected.emoji}</div>
                <h3 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 18, margin: '8px 0 4px' }}>
                  {selected.name}
                </h3>
                <p style={{ color: '#5A3E1B', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
                  {selected.description}
                </p>
              </div>

              <InfoBlock label="Role">{selected.role}</InfoBlock>
              <InfoBlock label="Hit Die">d{selected.hitDie} per level</InfoBlock>
              <InfoBlock label="Primary Ability">{selected.primaryAbility}</InfoBlock>
              <InfoBlock label="Saving Throws">{selected.savingThrows.join(', ')}</InfoBlock>
              <InfoBlock label={`Subclass (Level ${selected.subclassLevel})`}>{selected.subclassName}</InfoBlock>

              <div style={{ background: '#F4E4BC', borderRadius: 4, padding: 10 }}>
                <div style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif", letterSpacing: '0.04em', marginBottom: 6 }}>
                  SKILL CHOICES ({selected.numSkillChoices})
                </div>
                <div style={{ fontSize: 12, color: '#2D1B00', lineHeight: 1.8 }}>
                  {selected.skillChoices.slice(0, 6).join(', ')}
                  {selected.skillChoices.length > 6 ? ` +${selected.skillChoices.length - 6} more` : ''}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B6914', fontStyle: 'italic', textAlign: 'center', minHeight: 200 }}>
              Select a class to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#F4E4BC', borderRadius: 4, padding: '8px 10px' }}>
      <div style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif", letterSpacing: '0.04em', marginBottom: 3 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 13, color: '#2D1B00' }}>{children}</div>
    </div>
  );
}

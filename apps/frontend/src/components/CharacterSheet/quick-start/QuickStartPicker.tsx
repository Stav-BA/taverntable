/**
 * QuickStartPicker — Pick a class, get an instant pre-built character
 */

import React, { useState } from 'react';
import { getAbilityModifier, getProficiencyBonus } from '@taverntable/dnd-rules';
import type { Character, EquipmentItem } from '../types';
import { DEFAULT_CHARACTER, SRD_CLASSES } from '../types';

interface QuickStartPickerProps {
  onSelect: (character: Character) => void;
  onBack: () => void;
}

type QuickKey = 'Fighter' | 'Wizard' | 'Rogue' | 'Cleric' | 'Barbarian' | 'Bard';

interface QuickStartData {
  species: string;
  background: string;
  abilityScores: Character['abilityScores'];
  skills: string[];
  savingThrows: string[];
  tagline: string;
}

const QUICK_START_CHARACTERS: Record<QuickKey, QuickStartData> = {
  Fighter: {
    species: 'Human',
    background: 'Soldier',
    abilityScores: { str: 17, dex: 13, con: 15, int: 8, wis: 11, cha: 9 },
    skills: ['Athletics', 'Intimidation'],
    savingThrows: ['Strength', 'Constitution'],
    tagline: 'Battle-hardened soldier, masters of weapons and tactics.',
  },
  Wizard: {
    species: 'Elf',
    background: 'Sage',
    abilityScores: { str: 8, dex: 14, con: 13, int: 17, wis: 11, cha: 10 },
    skills: ['Arcana', 'History'],
    savingThrows: ['Intelligence', 'Wisdom'],
    tagline: 'Scholarly spellcaster with power to reshape reality.',
  },
  Rogue: {
    species: 'Halfling',
    background: 'Criminal',
    abilityScores: { str: 8, dex: 17, con: 13, int: 12, wis: 11, cha: 14 },
    skills: ['Stealth', 'Deception', 'Acrobatics', 'Sleight of Hand'],
    savingThrows: ['Dexterity', 'Intelligence'],
    tagline: 'Shadow-walking trickster who strikes from the dark.',
  },
  Cleric: {
    species: 'Dwarf',
    background: 'Acolyte',
    abilityScores: { str: 14, dex: 8, con: 15, int: 10, wis: 17, cha: 11 },
    skills: ['Insight', 'Medicine'],
    savingThrows: ['Wisdom', 'Charisma'],
    tagline: 'Divine champion balancing healing with holy might.',
  },
  Barbarian: {
    species: 'Half-Orc',
    background: 'Outlander',
    abilityScores: { str: 17, dex: 13, con: 16, int: 8, wis: 11, cha: 9 },
    skills: ['Athletics', 'Survival'],
    savingThrows: ['Strength', 'Constitution'],
    tagline: 'Primal fury incarnate — rage makes them unstoppable.',
  },
  Bard: {
    species: 'Half-Elf',
    background: 'Entertainer',
    abilityScores: { str: 8, dex: 14, con: 12, int: 13, wis: 10, cha: 16 },
    skills: ['Persuasion', 'Performance', 'Deception', 'Insight'],
    savingThrows: ['Dexterity', 'Charisma'],
    tagline: 'Charismatic performer who weaves magic through music.',
  },
};

const QUICK_KEYS: QuickKey[] = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Barbarian', 'Bard'];

function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

export default function QuickStartPicker({ onSelect, onBack }: QuickStartPickerProps) {
  const [hoveredClass, setHoveredClass] = useState<QuickKey | null>(null);

  const buildCharacter = (className: QuickKey): Character => {
    const data = QUICK_START_CHARACTERS[className];
    const classData = SRD_CLASSES.find(c => c.name === className)!;
    const conMod = getAbilityModifier(data.abilityScores.con);
    const hitDie = classData.hitDie;
    const maxHP = hitDie + conMod;

    return {
      ...DEFAULT_CHARACTER,
      name: `Quick-Start ${className}`,
      species: data.species,
      class: className,
      background: data.background,
      level: 1,
      xp: 0,
      abilityScores: data.abilityScores,
      skillProficiencies: data.skills,
      savingThrowProficiencies: data.savingThrows,
      skillExpertise: [],
      features: [],
      equipment: classData.startingEquipment,
      spells: [],
      currentHP: maxHP,
      tempHP: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      conditions: [],
      exhaustionLevel: 0,
      deathSaves: { successes: 0, failures: 0 },
    };
  };

  const preview = hoveredClass ? QUICK_START_CHARACTERS[hoveredClass] : null;
  const previewClass = hoveredClass ? SRD_CLASSES.find(c => c.name === hoveredClass) : null;

  return (
    <div style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 26, margin: '0 0 8px' }}>
          ⚡ Quick-Start
        </h2>
        <p style={{ color: '#5A3E1B', fontSize: 16, margin: 0 }}>
          Pick a class. We'll handle everything else. You'll be ready to play in seconds.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Class grid */}
        <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {QUICK_KEYS.map(key => {
            const cls = SRD_CLASSES.find(c => c.name === key)!;
            const data = QUICK_START_CHARACTERS[key];
            return (
              <div
                key={key}
                onMouseEnter={() => setHoveredClass(key)}
                onMouseLeave={() => setHoveredClass(null)}
                onClick={() => onSelect(buildCharacter(key))}
                style={{
                  background: '#EDD9A3',
                  border: '3px solid #2D1B00',
                  borderRadius: 8,
                  padding: '20px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  transform: hoveredClass === key ? 'scale(1.05)' : 'none',
                  boxShadow: hoveredClass === key ? '0 6px 20px rgba(0,0,0,0.25)' : '0 2px 6px rgba(0,0,0,0.1)',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 10 }}>{cls.emoji}</div>
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 17, color: '#2D1B00', fontWeight: 700,
                  marginBottom: 6,
                }}>
                  {key}
                </div>
                <div style={{ fontSize: 12, color: '#5A3E1B', lineHeight: 1.4, marginBottom: 10 }}>
                  {data.species} · {data.background}
                </div>
                <div style={{
                  background: '#2D1B00', color: '#C9A227',
                  borderRadius: 4, padding: '4px 8px',
                  fontSize: 12, fontFamily: "'Cinzel', serif",
                  display: 'inline-block',
                }}>
                  d{cls.hitDie} Hit Die
                </div>

                {hoveredClass === key && (
                  <div style={{
                    position: 'absolute',
                    bottom: -36,
                    left: '50%', transform: 'translateX(-50%)',
                    background: '#C9A227', color: '#2D1B00',
                    padding: '6px 16px', borderRadius: 4,
                    fontFamily: "'Cinzel', serif", fontSize: 13,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    border: '2px solid #2D1B00',
                  }}>
                    Click to play as {key}!
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview Panel */}
        <div style={{
          flex: 1, minWidth: 220,
          background: '#EDD9A3', border: '2px solid #2D1B00',
          borderRadius: 8, padding: 20,
          alignSelf: 'flex-start',
        }}>
          {preview && previewClass && hoveredClass ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 48 }}>{previewClass.emoji}</div>
                <h3 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 18, margin: '8px 0 4px' }}>
                  {hoveredClass}
                </h3>
                <p style={{ color: '#5A3E1B', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
                  {preview.tagline}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InfoLine label="Species">{preview.species}</InfoLine>
                <InfoLine label="Background">{preview.background}</InfoLine>
                <InfoLine label="Skills">{preview.skills.join(', ')}</InfoLine>

                <div style={{ background: '#F4E4BC', borderRadius: 4, padding: 10, marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
                    ABILITY SCORES
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                    {(Object.entries(preview.abilityScores) as [string, number][]).map(([ab, score]) => (
                      <div key={ab} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#5A3E1B', textTransform: 'uppercase' }}>{ab}</div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: '#2D1B00' }}>
                          {score}
                        </div>
                        <div style={{ fontSize: 11, color: '#5A3E1B' }}>{modStr(getAbilityModifier(score))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: '#8B6914', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
              Hover over a class to preview your quick-start character
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '2px solid #2D1B00',
            color: '#2D1B00', borderRadius: 4,
            padding: '8px 24px', cursor: 'pointer',
            fontFamily: "'Cinzel', serif", fontSize: 14,
          }}
        >
          ← Back to Mode Selection
        </button>
      </div>
    </div>
  );
}

function InfoLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#F4E4BC', borderRadius: 4, padding: '6px 10px' }}>
      <span style={{ fontSize: 11, color: '#5A3E1B', fontFamily: "'Cinzel', serif" }}>{label}: </span>
      <span style={{ fontSize: 13, color: '#2D1B00' }}>{children}</span>
    </div>
  );
}

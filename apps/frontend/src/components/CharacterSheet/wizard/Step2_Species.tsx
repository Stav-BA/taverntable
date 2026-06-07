/**
 * Step 2 — Species Picker
 * Illustrated cards with traits panel, 2024 ASI note.
 */

import React, { useState, useEffect } from 'react';
import type { Character, SpeciesData } from '../types';
import { SRD_SPECIES } from '../types';

interface Step2Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  onReady: (ready: boolean) => void;
}

export default function Step2_Species({ character, updateCharacter, onReady }: Step2Props) {
  const [selected, setSelected] = useState<SpeciesData | null>(
    SRD_SPECIES.find(s => s.name === character.species) ?? null,
  );

  useEffect(() => {
    onReady(!!selected);
  }, [selected, onReady]);

  const handleSelect = (species: SpeciesData) => {
    setSelected(species);
    updateCharacter({ species: species.name });
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 24, marginBottom: 4, textAlign: 'center' }}>
        Choose Your Species
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 8, fontSize: 14 }}>
        Your species determines traits, size, and speed.
      </p>
      <div style={{
        background: '#FFF8E7', border: '1px solid #C9A227', borderRadius: 6,
        padding: '10px 16px', marginBottom: 24, fontSize: 13, color: '#5A3E1B',
        textAlign: 'center',
      }}>
        📜 <strong>2024 Rule:</strong> Ability Score Increases come from your <em>Background</em>, not your Species. Choose freely!
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Species Grid */}
        <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {SRD_SPECIES.map(species => {
            const isSelected = selected?.name === species.name;
            return (
              <div
                key={species.name}
                onClick={() => handleSelect(species)}
                style={{
                  background: isSelected ? '#FFF8E7' : '#EDD9A3',
                  border: `2px solid ${isSelected ? '#C9A227' : '#2D1B00'}`,
                  borderRadius: 8,
                  padding: '16px 12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: isSelected ? '0 0 0 2px #C9A22766' : 'none',
                  transform: isSelected ? 'scale(1.03)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{species.emoji}</div>
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 14,
                  color: isSelected ? '#8B6914' : '#2D1B00',
                  fontWeight: isSelected ? 700 : 400,
                  marginBottom: 4,
                }}>
                  {species.name}
                </div>
                <div style={{ fontSize: 11, color: '#5A3E1B' }}>
                  {species.size} · {species.speed} ft.
                </div>
              </div>
            );
          })}
        </div>

        {/* Traits Panel */}
        <div style={{
          flex: 1,
          background: '#EDD9A3',
          border: '2px solid #2D1B00',
          borderRadius: 8,
          padding: 20,
          minWidth: 200,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {selected ? (
            <>
              <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>{selected.emoji}</div>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 18, margin: '0 0 8px', textAlign: 'center' }}>
                {selected.name}
              </h3>
              <p style={{ color: '#5A3E1B', fontSize: 13, lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>
                {selected.description}
              </p>

              <div style={{ background: '#F4E4BC', borderRadius: 4, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#5A3E1B', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.04em' }}>
                  STATISTICS
                </div>
                <div style={{ fontSize: 13, color: '#2D1B00' }}>
                  <div>⚡ Speed: {selected.speed} ft.</div>
                  <div>📏 Size: {selected.size}</div>
                </div>
              </div>

              <div style={{ background: '#F4E4BC', borderRadius: 4, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#5A3E1B', marginBottom: 8, fontFamily: "'Cinzel', serif", letterSpacing: '0.04em' }}>
                  RACIAL TRAITS
                </div>
                {selected.traits.map(trait => (
                  <div key={trait} style={{
                    fontSize: 13, color: '#2D1B00',
                    padding: '4px 0',
                    borderBottom: '1px solid #C9A22744',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ color: '#C9A227' }}>✦</span>
                    {trait}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B6914', fontStyle: 'italic', textAlign: 'center' }}>
              Select a species to see their traits
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

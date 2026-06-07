/**
 * Step 1 — Creation Mode picker
 * Guided Wizard / Quick-Start / Expert Mode
 */

import React from 'react';
import type { CreationMode } from './WizardShell';

interface Step1Props {
  mode: CreationMode;
  onSelectMode: (mode: CreationMode) => void;
}

interface ModeCard {
  id: CreationMode;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

const MODES: ModeCard[] = [
  {
    id: 'guided',
    icon: '🧭',
    title: 'Guided Wizard',
    subtitle: 'I\'m new to D&D, guide me through each choice',
    description: 'We\'ll walk you through every decision step by step — species, class, background, ability scores, and more — with plain-English explanations. Perfect for your first character.',
    color: '#2D5016',
  },
  {
    id: 'quickstart',
    icon: '⚡',
    title: 'Quick-Start',
    subtitle: 'Get me playing in 30 seconds, I\'ll customise later',
    description: 'Pick a class and we\'ll hand you a fully built, ready-to-play character. You can refine any detail between sessions. Jump straight into the adventure.',
    color: '#8B1A1A',
  },
  {
    id: 'expert',
    icon: '🎨',
    title: 'Expert Mode',
    subtitle: 'Show me everything, I know what I\'m doing',
    description: 'All options visible at once with no hand-holding. Full access to every rule, variant, and edge case. For experienced players who want total control.',
    color: '#1A3A6B',
  },
];

export default function Step1_Mode({ mode, onSelectMode }: Step1Props) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', fontSize: 26, marginBottom: 8, textAlign: 'center' }}>
        How would you like to create your character?
      </h2>
      <p style={{ color: '#5A3E1B', textAlign: 'center', marginBottom: 32, fontSize: 16 }}>
        You can always change this later.
      </p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {MODES.map(m => {
          const selected = mode === m.id;
          return (
            <div
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              style={{
                flex: '1 1 240px',
                maxWidth: 260,
                background: selected ? '#FFF8E7' : '#EDD9A3',
                border: `3px solid ${selected ? '#C9A227' : '#2D1B00'}`,
                borderRadius: 8,
                padding: 24,
                cursor: 'pointer',
                boxShadow: selected ? `0 0 0 3px ${m.color}44, 0 4px 16px rgba(0,0,0,0.2)` : '0 2px 8px rgba(0,0,0,0.1)',
                transform: selected ? 'translateY(-4px)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
                textAlign: 'center',
              }}
            >
              {selected && (
                <div style={{
                  position: 'absolute', top: -12, right: -12,
                  background: '#C9A227', color: '#2D1B00',
                  borderRadius: '50%', width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, border: '2px solid #2D1B00',
                }}>✓</div>
              )}

              <div style={{ fontSize: 52, marginBottom: 12 }}>{m.icon}</div>
              <h3 style={{
                fontFamily: "'Cinzel', serif",
                color: selected ? m.color : '#2D1B00',
                fontSize: 18,
                margin: '0 0 6px',
                letterSpacing: '0.03em',
              }}>
                {m.title}
              </h3>
              <p style={{
                color: '#5A3E1B',
                fontStyle: 'italic',
                fontSize: 13,
                margin: '0 0 12px',
                lineHeight: 1.4,
              }}>
                "{m.subtitle}"
              </p>
              <p style={{
                color: '#2D1B00',
                fontSize: 14,
                lineHeight: 1.6,
                margin: 0,
              }}>
                {m.description}
              </p>
            </div>
          );
        })}
      </div>

      <p style={{
        textAlign: 'center',
        marginTop: 28,
        color: '#5A3E1B',
        fontSize: 13,
        fontStyle: 'italic',
      }}>
        ✦ D&D 5e 2024 rules — All SRD species and classes included ✦
      </p>
    </div>
  );
}

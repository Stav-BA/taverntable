/**
 * WizardShell — 8-step character creation wizard
 * Animated step transitions, progress bar, back/continue navigation.
 */

import React, { useState, useCallback } from 'react';
import type { Character } from '../types';
import { DEFAULT_CHARACTER } from '../types';
import Step1_Mode from './Step1_Mode';
import Step2_Species from './Step2_Species';
import Step3_Class from './Step3_Class';
import Step4_Background from './Step4_Background';
import Step5_AbilityScores from './Step5_AbilityScores';
import Step6_Details from './Step6_Details';
import Step7_Equipment from './Step7_Equipment';
import Step8_Review from './Step8_Review';

export type CreationMode = 'guided' | 'quickstart' | 'expert';

interface WizardShellProps {
  onComplete: (character: Character) => void;
  onCancel: () => void;
}

const STEP_LABELS = [
  'Mode', 'Species', 'Class', 'Background',
  'Ability Scores', 'Details', 'Equipment', 'Review',
];

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    fontFamily: "'Crimson Text', Georgia, serif",
  },
  shell: {
    background: '#F4E4BC',
    border: '3px solid #2D1B00',
    borderRadius: 8,
    width: 'min(900px, 95vw)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  },
  header: {
    background: '#2D1B00',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: "'Cinzel', 'Times New Roman', serif",
    color: '#C9A227',
    fontSize: 22,
    margin: 0,
    letterSpacing: '0.05em',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid #C9A227',
    color: '#C9A227',
    borderRadius: 4,
    padding: '4px 12px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 13,
  },
  progressBar: {
    background: '#2D1B00',
    padding: '0 24px 12px',
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  stepDot: (active: boolean, done: boolean): React.CSSProperties => ({
    flex: 1,
    height: 4,
    borderRadius: 2,
    background: done ? '#C9A227' : active ? '#8B6914' : '#5A3E1B',
    transition: 'background 0.3s',
  }),
  stepLabels: {
    display: 'flex',
    padding: '0 24px 8px',
    background: '#2D1B00',
  },
  stepLabel: (active: boolean, done: boolean): React.CSSProperties => ({
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: done ? '#C9A227' : active ? '#F4E4BC' : '#8B6914',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '0.03em',
    transition: 'color 0.3s',
  }),
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 32px',
  },
  footer: {
    borderTop: '2px solid #2D1B00',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#EDD9A3',
  },
  backBtn: {
    background: 'none',
    border: '2px solid #2D1B00',
    color: '#2D1B00',
    borderRadius: 4,
    padding: '8px 24px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 14,
    letterSpacing: '0.05em',
  },
  continueBtn: (disabled: boolean): React.CSSProperties => ({
    background: disabled ? '#8B6914' : '#C9A227',
    border: '2px solid #2D1B00',
    color: '#2D1B00',
    borderRadius: 4,
    padding: '8px 28px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.05em',
    opacity: disabled ? 0.6 : 1,
    transition: 'background 0.2s',
  }),
  stepCount: {
    fontFamily: "'Cinzel', serif",
    fontSize: 13,
    color: '#5A3E1B',
  },
};

export default function WizardShell({ onComplete, onCancel }: WizardShellProps) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<CreationMode>('guided');
  const [character, setCharacter] = useState<Character>({ ...DEFAULT_CHARACTER });
  const [canContinue, setCanContinue] = useState(false);

  const updateCharacter = useCallback((updates: Partial<Character>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  }, []);

  const goNext = () => {
    if (step < STEP_LABELS.length - 1) {
      setStep(s => s + 1);
      setCanContinue(false);
    } else {
      onComplete(character);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
      setCanContinue(true);
    }
  };

  const stepProps = { character, updateCharacter, mode, onReady: setCanContinue };

  const renderStep = () => {
    switch (step) {
      case 0: return <Step1_Mode mode={mode} onSelectMode={m => { setMode(m); setCanContinue(true); }} />;
      case 1: return <Step2_Species {...stepProps} />;
      case 2: return <Step3_Class {...stepProps} />;
      case 3: return <Step4_Background {...stepProps} />;
      case 4: return <Step5_AbilityScores {...stepProps} />;
      case 5: return <Step6_Details {...stepProps} />;
      case 6: return <Step7_Equipment {...stepProps} />;
      case 7: return <Step8_Review character={character} onEdit={setStep} />;
      default: return null;
    }
  };

  const isLastStep = step === STEP_LABELS.length - 1;

  return (
    <div style={styles.overlay}>
      <div style={styles.shell}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>⚔ Create Your Character</h2>
          <button style={styles.cancelBtn} onClick={onCancel}>✕ Cancel</button>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressBar}>
          {STEP_LABELS.map((_, i) => (
            <div key={i} style={styles.stepDot(i === step, i < step)} />
          ))}
        </div>
        <div style={styles.stepLabels}>
          {STEP_LABELS.map((label, i) => (
            <span key={i} style={styles.stepLabel(i === step, i < step)}>{label}</span>
          ))}
        </div>

        {/* Step Content */}
        <div style={styles.content}>
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            style={styles.backBtn}
            onClick={goBack}
            disabled={step === 0}
          >
            ← Back
          </button>
          <span style={styles.stepCount}>Step {step + 1} of {STEP_LABELS.length}</span>
          <button
            style={styles.continueBtn(!canContinue && !isLastStep)}
            onClick={goNext}
            disabled={!canContinue && !isLastStep}
          >
            {isLastStep ? '⚔ Create Character' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

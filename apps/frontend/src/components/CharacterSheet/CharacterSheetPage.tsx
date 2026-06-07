/**
 * CharacterSheetPage — Top-level entry point
 *
 * Renders:
 *  - WizardShell (if no character exists yet)
 *  - QuickStartPicker (if quick-start mode chosen)
 *  - SheetLayout (once a character is created)
 */

import React, { useState } from 'react';
import type { Character } from './types';
import WizardShell from './wizard/WizardShell';
import QuickStartPicker from './quick-start/QuickStartPicker';
import SheetLayout from './sheet/SheetLayout';

type Phase = 'wizard' | 'quickstart' | 'sheet';

interface CharacterSheetPageProps {
  /** If provided, skip wizard and open existing character */
  existingCharacter?: Character;
  onSave?: (character: Character) => void;
  onBack?: () => void;
}

export default function CharacterSheetPage({
  existingCharacter,
  onSave,
  onBack,
}: CharacterSheetPageProps) {
  const [phase, setPhase] = useState<Phase>(existingCharacter ? 'sheet' : 'wizard');
  const [character, setCharacter] = useState<Character | null>(existingCharacter ?? null);

  const handleWizardComplete = (char: Character) => {
    setCharacter(char);
    setPhase('sheet');
    onSave?.(char);
  };

  const handleQuickStart = (char: Character) => {
    setCharacter(char);
    setPhase('sheet');
    onSave?.(char);
  };

  const handleSave = (char: Character) => {
    setCharacter(char);
    onSave?.(char);
  };

  if (phase === 'wizard') {
    return (
      <WizardShell
        onComplete={handleWizardComplete}
        onCancel={onBack ?? (() => {})}
      />
    );
  }

  if (phase === 'quickstart') {
    return (
      <div style={{ padding: 40, fontFamily: "'Crimson Text', Georgia, serif", background: '#F4E4BC', minHeight: '100vh' }}>
        <QuickStartPicker
          onSelect={handleQuickStart}
          onBack={() => setPhase('wizard')}
        />
      </div>
    );
  }

  if (phase === 'sheet' && character) {
    return (
      <SheetLayout
        initialCharacter={character}
        onSave={handleSave}
      />
    );
  }

  // Fallback
  return null;
}

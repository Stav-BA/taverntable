/**
 * NotesTab — wrapper
 */

import React from 'react';
import type { Character } from '../../types';
import NotesEditor from './NotesEditor';

interface NotesTabProps {
  character: Character;
  hooks: { update: <K extends keyof Character>(key: K, value: Character[K]) => void };
}

export default function NotesTab({ character, hooks }: NotesTabProps) {
  return <NotesEditor character={character} onUpdate={hooks.update} />;
}

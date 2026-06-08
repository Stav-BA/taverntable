import React, { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { NPCManager } from './NPCManager/NPCManager';
import { EncounterBuilder } from './EncounterBuilder/EncounterBuilder';
import { CampaignJournal } from './CampaignJournal/CampaignJournal';
import { AIDMPanel } from './AIDMPanel/AIDMPanel';
import { ConditionsPanel } from './ConditionsPanel';
import { DeathSaveTracker } from './DeathSaveTracker';
import { RestManager } from './RestManager';

type DMTab = 'npcs' | 'encounters' | 'journal' | 'ai-dm' | 'combat' | 'conditions';

const TABS: Array<{ id: DMTab; label: string; icon: string }> = [
  { id: 'npcs',       label: 'NPCs',       icon: '🧙' },
  { id: 'encounters', label: 'Encounters', icon: '⚔️' },
  { id: 'combat',     label: 'Combat',     icon: '🩸' },
  { id: 'conditions', label: 'Conditions', icon: '🎭' },
  { id: 'journal',    label: 'Journal',    icon: '📜' },
  { id: 'ai-dm',      label: 'AI DM',      icon: '🔮' },
];

export function DMToolsPanel() {
  const isDM = useSessionStore((s) => s.isDM);
  const [activeTab, setActiveTab] = useState<DMTab>('npcs');

  if (!isDM) return null;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Tab bar */}
      <div
        className="flex flex-shrink-0 flex-wrap"
        style={{ borderBottom: '1px solid rgba(201,162,39,0.3)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 font-cinzel text-xs transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(201,162,39,0.15)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #c9a227' : '2px solid transparent',
              color: activeTab === tab.id ? '#c9a227' : 'rgba(244,228,188,0.45)',
              border: 'none',
              cursor: 'pointer',
              paddingBottom: activeTab === tab.id ? '6px' : '8px',
              minWidth: 0,
            }}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className="uppercase tracking-wider truncate w-full text-center" style={{ fontSize: 9 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }}>
        {activeTab === 'npcs'       && <NPCManager />}
        {activeTab === 'encounters' && <EncounterBuilder />}
        {activeTab === 'journal'    && <CampaignJournal />}
        {activeTab === 'ai-dm'      && <AIDMPanel />}
        {activeTab === 'conditions' && <ConditionsPanel />}
        {activeTab === 'combat'     && (
          <div className="flex flex-col gap-4">
            <DeathSaveTracker />
            <div style={{ borderTop: '1px solid rgba(201,162,39,0.2)', paddingTop: '1rem' }}>
              <RestManager />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

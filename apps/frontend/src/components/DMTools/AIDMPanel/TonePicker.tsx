import React from 'react';
import { useDMStore } from '@/stores/dmStore';

const TONES: Array<{
  id: 'heroic' | 'gritty' | 'comedic' | 'horror' | 'mystery';
  icon: string;
  label: string;
  description: string;
  colour: string;
}> = [
  {
    id: 'heroic',
    icon: '⚔️',
    label: 'Heroic',
    description: 'Epic battles, legendary deeds, and the triumph of good over evil.',
    colour: '#c9a227',
  },
  {
    id: 'gritty',
    icon: '🌑',
    label: 'Gritty',
    description: 'Dark and realistic. Survival is never guaranteed. Moral ambiguity reigns.',
    colour: '#777',
  },
  {
    id: 'comedic',
    icon: '🎭',
    label: 'Comedic',
    description: 'Light-hearted adventures full of absurdity, wit, and unexpected turns.',
    colour: '#e67e22',
  },
  {
    id: 'horror',
    icon: '💀',
    label: 'Horror',
    description: 'Dread, tension, and things that lurk in the dark. Not all monsters are slain.',
    colour: '#8b1a1a',
  },
  {
    id: 'mystery',
    icon: '🔍',
    label: 'Mystery',
    description: 'Puzzles, conspiracies, and secrets that unravel at the worst moments.',
    colour: '#4a4a8b',
  },
];

export function TonePicker() {
  const campaignTone = useDMStore((s) => s.campaignTone);
  const setCampaignTone = useDMStore((s) => s.setCampaignTone);
  const [hovered, setHovered] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <p className="font-cinzel text-xs uppercase tracking-wider" style={{ color: 'rgba(244,228,188,0.6)' }}>Campaign Tone</p>
      <div className="grid grid-cols-5 gap-1">
        {TONES.map((tone) => {
          const isActive = campaignTone === tone.id;
          const isHovered = hovered === tone.id;
          return (
            <div key={tone.id} className="relative">
              <button
                onClick={() => setCampaignTone(tone.id)}
                onMouseEnter={() => setHovered(tone.id)}
                onMouseLeave={() => setHovered(null)}
                className="w-full flex flex-col items-center gap-1 py-2 px-1 rounded transition-all"
                style={{
                  background: isActive ? `${tone.colour}33` : 'rgba(45,27,0,0.4)',
                  border: isActive ? `2px solid ${tone.colour}` : `1px solid ${isHovered ? tone.colour + '88' : 'rgba(201,162,39,0.2)'}`,
                  cursor: 'pointer',
                }}
              >
                <span className="text-xl">{tone.icon}</span>
                <span
                  className="font-cinzel text-xs leading-none"
                  style={{ color: isActive ? tone.colour : 'rgba(244,228,188,0.6)', fontSize: 10 }}
                >
                  {tone.label}
                </span>
              </button>

              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute z-10 bottom-full mb-1 left-1/2 -translate-x-1/2 rounded p-2 w-40"
                  style={{
                    background: 'rgba(20,10,0,0.95)',
                    border: `1px solid ${tone.colour}66`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                  }}
                >
                  <p className="font-cinzel text-xs mb-0.5" style={{ color: tone.colour }}>{tone.label}</p>
                  <p className="font-crimson text-xs leading-tight" style={{ color: 'rgba(244,228,188,0.8)' }}>{tone.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

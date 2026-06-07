import React, { useState } from 'react';
import { JournalEntry as JournalEntryType } from '@/stores/dmStore';

const TAG_STYLES: Record<string, { bg: string; colour: string }> = {
  combat:    { bg: 'rgba(139,26,26,0.3)',  colour: '#ff6b6b' },
  roleplay:  { bg: 'rgba(45,27,130,0.3)',  colour: '#8b8bff' },
  discovery: { bg: 'rgba(27,100,45,0.3)',  colour: '#6bffaa' },
  milestone: { bg: 'rgba(100,80,0,0.3)',   colour: '#c9a227' },
};

interface Props {
  entry: JournalEntryType;
}

export function JournalEntry({ entry }: Props) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.timestamp);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="rounded p-3 flex flex-col gap-2"
      style={{
        background: 'rgba(45,27,0,0.4)',
        border: '1px solid rgba(201,162,39,0.2)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-cinzel text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', color: '#c9a227' }}
            >
              Session {entry.sessionNumber}
            </span>
            <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.4)' }}>{timeStr}</span>
          </div>
          <p className="font-cinzel text-sm font-bold mt-1" style={{ color: '#f4e4bc' }}>
            {entry.title}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-cinzel text-xs flex-shrink-0 mt-1"
          style={{ color: 'rgba(244,228,188,0.4)', cursor: 'pointer' }}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {entry.tags.map((tag) => {
          const s = TAG_STYLES[tag];
          return (
            <span
              key={tag}
              className="font-cinzel text-xs px-1.5 py-0.5 rounded capitalize"
              style={{ background: s.bg, color: s.colour, border: `1px solid ${s.colour}44` }}
            >
              {tag}
            </span>
          );
        })}
        {entry.characterTags.map((char) => (
          <span
            key={char}
            className="font-cinzel text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(45,27,0,0.4)', color: 'rgba(244,228,188,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}
          >
            @{char}
          </span>
        ))}
      </div>

      {/* Body (expandable) */}
      {(expanded || entry.body.length < 120) && (
        <p className="font-crimson text-sm leading-relaxed" style={{ color: 'rgba(244,228,188,0.8)' }}>
          {entry.body}
        </p>
      )}
      {!expanded && entry.body.length >= 120 && (
        <p className="font-crimson text-sm" style={{ color: 'rgba(244,228,188,0.6)' }}>
          {entry.body.slice(0, 120)}...{' '}
          <button
            onClick={() => setExpanded(true)}
            style={{ color: '#c9a227', cursor: 'pointer', fontStyle: 'italic' }}
          >
            read more
          </button>
        </p>
      )}
    </div>
  );
}

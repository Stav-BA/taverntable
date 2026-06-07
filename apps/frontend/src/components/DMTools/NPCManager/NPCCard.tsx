import React, { useState } from 'react';
import { NPC, useDMStore } from '@/stores/dmStore';

const DISPOSITION_STYLES: Record<NPC['disposition'], { bg: string; border: string; label: string }> = {
  hostile:    { bg: '#8b1a1a',   border: '#c0392b', label: 'Hostile' },
  unfriendly: { bg: '#7d4e00',   border: '#e67e22', label: 'Unfriendly' },
  neutral:    { bg: '#3a3a3a',   border: '#777',    label: 'Neutral' },
  friendly:   { bg: '#1a5c1a',   border: '#27ae60', label: 'Friendly' },
  ally:       { bg: '#7a6000',   border: '#c9a227', label: 'Ally' },
};

interface Props {
  npc: NPC;
  onSpeak: (npc: NPC) => void;
  onEdit: (npc: NPC) => void;
}

export function NPCCard({ npc, onSpeak, onEdit }: Props) {
  const { updateNPC, removeNPC } = useDMStore();
  const [localNotes, setLocalNotes] = useState(npc.notes);
  const [localHp, setLocalHp] = useState(npc.hp);

  const ds = DISPOSITION_STYLES[npc.disposition];
  const hpPct = npc.maxHp > 0 ? Math.max(0, Math.min(1, localHp / npc.maxHp)) : 0;
  const hpColour = hpPct > 0.6 ? '#27ae60' : hpPct > 0.3 ? '#c9a227' : '#8b1a1a';

  return (
    <div
      className="p-3 rounded flex flex-col gap-2"
      style={{
        background: 'rgba(45,27,0,0.5)',
        border: `1px solid ${ds.border}44`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="text-3xl flex-shrink-0 leading-none">{npc.portrait}</div>
        <div className="flex-1 min-w-0">
          <p className="font-cinzel font-bold text-sm truncate" style={{ color: '#f4e4bc' }}>
            {npc.name}
          </p>
          <p className="font-crimson text-xs capitalize" style={{ color: 'rgba(244,228,188,0.6)' }}>
            {npc.role}
          </p>
        </div>
        <span
          className="text-xs font-cinzel px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: ds.bg, color: '#f4e4bc', border: `1px solid ${ds.border}` }}
        >
          {ds.label}
        </span>
      </div>

      {/* HP tracker */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>HP</span>
          <input
            type="number"
            min={0}
            max={npc.maxHp}
            value={localHp}
            onChange={(e) => {
              const v = Math.max(0, Math.min(npc.maxHp, parseInt(e.target.value) || 0));
              setLocalHp(v);
              updateNPC(npc.id, { hp: v });
            }}
            className="w-12 text-center font-cinzel text-xs rounded px-1 py-0.5"
            style={{
              background: 'rgba(45,27,0,0.6)',
              border: '1px solid rgba(201,162,39,0.3)',
              color: hpColour,
            }}
          />
          <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.4)' }}>/ {npc.maxHp}</span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.15)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${hpPct * 100}%`, background: hpColour }}
          />
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={localNotes}
        onChange={(e) => {
          setLocalNotes(e.target.value);
          updateNPC(npc.id, { notes: e.target.value });
        }}
        placeholder="Quick notes..."
        rows={2}
        className="w-full font-crimson text-xs resize-none rounded px-2 py-1"
        style={{
          background: 'rgba(45,27,0,0.4)',
          border: '1px solid rgba(201,162,39,0.2)',
          color: 'rgba(244,228,188,0.8)',
        }}
      />

      {/* Actions */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onSpeak(npc)}
          className="flex-1 font-cinzel text-xs py-1.5 rounded transition-all"
          style={{
            background: 'rgba(201,162,39,0.2)',
            border: '1px solid rgba(201,162,39,0.5)',
            color: '#c9a227',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.2)'; }}
        >
          💬 Speak
        </button>
        <button
          onClick={() => onEdit(npc)}
          className="flex-1 font-cinzel text-xs py-1.5 rounded transition-all"
          style={{
            background: 'rgba(45,27,0,0.4)',
            border: '1px solid rgba(201,162,39,0.3)',
            color: 'rgba(244,228,188,0.7)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(45,27,0,0.4)'; }}
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => removeNPC(npc.id)}
          className="font-cinzel text-xs px-2 py-1.5 rounded transition-all"
          style={{
            background: 'rgba(139,26,26,0.2)',
            border: '1px solid rgba(139,26,26,0.4)',
            color: '#c0392b',
            cursor: 'pointer',
          }}
          title="Remove NPC"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

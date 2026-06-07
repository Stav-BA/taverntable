import React, { useState } from 'react';
import { NPC, useDMStore } from '@/stores/dmStore';
import { NPCCard } from './NPCCard';
import { NPCDialogueModal } from './NPCDialogueModal';

const PORTRAIT_OPTIONS = [
  '🧙','🧝','🧟','🧛','🐉','👹','👺','🤺','🧜','🧚',
  '🦊','🐺','🦁','🐗','🕷️','🦂','🧌','👻','💀','🤡',
  '🎭','⚔️','🛡️','🔮','📜','💰','🍺','🗝️','🕯️','🌙',
];

const ROLE_OPTIONS: NPC['role'][] = [
  'merchant','guard','noble','villain','ally','shopkeeper','innkeeper','quest-giver','monster','other'
];
const DISPOSITION_OPTIONS: NPC['disposition'][] = ['hostile','unfriendly','neutral','friendly','ally'];

function AddNPCForm({ onClose }: { onClose: () => void }) {
  const { addNPC } = useDMStore();
  const [form, setForm] = useState({
    name: '',
    role: 'merchant' as NPC['role'],
    disposition: 'neutral' as NPC['disposition'],
    maxHp: 20,
    portrait: '🧙',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addNPC({
      id: Math.random().toString(36).slice(2),
      ...form,
      hp: form.maxHp,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
      <h3 className="font-cinzel font-bold text-base" style={{ color: '#c9a227' }}>Add New NPC</h3>

      <div>
        <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full font-crimson text-sm px-3 py-1.5 rounded"
          style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as NPC['role'] })}
            className="w-full font-crimson text-sm px-2 py-1.5 rounded capitalize"
            style={{ background: 'rgba(45,27,0,0.8)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          >
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Disposition</label>
          <select
            value={form.disposition}
            onChange={(e) => setForm({ ...form, disposition: e.target.value as NPC['disposition'] })}
            className="w-full font-crimson text-sm px-2 py-1.5 rounded capitalize"
            style={{ background: 'rgba(45,27,0,0.8)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          >
            {DISPOSITION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Max HP</label>
        <input
          type="number"
          min={1}
          max={999}
          value={form.maxHp}
          onChange={(e) => setForm({ ...form, maxHp: parseInt(e.target.value) || 1 })}
          className="w-24 font-crimson text-sm px-2 py-1.5 rounded"
          style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
        />
      </div>

      <div>
        <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Portrait</label>
        <div className="flex flex-wrap gap-1">
          {PORTRAIT_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setForm({ ...form, portrait: p })}
              className="w-8 h-8 text-lg rounded transition-all"
              style={{
                background: form.portrait === p ? 'rgba(201,162,39,0.3)' : 'rgba(45,27,0,0.4)',
                border: form.portrait === p ? '2px solid #c9a227' : '1px solid rgba(201,162,39,0.2)',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full font-crimson text-sm resize-none px-3 py-1.5 rounded"
          style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 font-cinzel text-xs py-2 rounded transition-all"
          style={{ background: 'rgba(201,162,39,0.3)', border: '1px solid rgba(201,162,39,0.6)', color: '#c9a227', cursor: 'pointer' }}
        >
          Add NPC
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 font-cinzel text-xs py-2 rounded"
          style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.2)', color: 'rgba(244,228,188,0.6)', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function NPCManager() {
  const npcs = useDMStore((s) => s.npcs);
  const [showAdd, setShowAdd] = useState(false);
  const [dialogueNPC, setDialogueNPC] = useState<NPC | null>(null);
  const [editNPC, setEditNPC] = useState<NPC | null>(null);
  const [filterDisposition, setFilterDisposition] = useState<NPC['disposition'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'disposition'>('name');

  const DISPOSITION_OPTIONS: Array<NPC['disposition'] | 'all'> = ['all', 'hostile', 'unfriendly', 'neutral', 'friendly', 'ally'];

  const filtered = npcs
    .filter((n) => filterDisposition === 'all' || n.disposition === filterDisposition)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      const order = { hostile: 0, unfriendly: 1, neutral: 2, friendly: 3, ally: 4 };
      return order[a.disposition] - order[b.disposition];
    });

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filterDisposition}
          onChange={(e) => setFilterDisposition(e.target.value as NPC['disposition'] | 'all')}
          className="font-cinzel text-xs px-2 py-1 rounded flex-1"
          style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc', minWidth: 0 }}
        >
          {DISPOSITION_OPTIONS.map((d) => <option key={d} value={d}>{d === 'all' ? 'All' : d}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="font-cinzel text-xs px-2 py-1 rounded flex-1"
          style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc', minWidth: 0 }}
        >
          <option value="name">Sort: Name</option>
          <option value="role">Sort: Role</option>
          <option value="disposition">Sort: Disposition</option>
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="font-cinzel text-xs px-3 py-1 rounded flex-shrink-0"
          style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.5)', color: '#c9a227', cursor: 'pointer' }}
        >
          + Add NPC
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          className="rounded"
          style={{ background: 'rgba(20,10,0,0.8)', border: '1px solid rgba(201,162,39,0.4)' }}
        >
          <AddNPCForm onClose={() => setShowAdd(false)} />
        </div>
      )}

      {/* NPC grid */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center font-crimson italic text-sm py-8" style={{ color: 'rgba(244,228,188,0.4)' }}>
            No NPCs yet. Add one to begin.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filtered.map((npc) => (
              <NPCCard
                key={npc.id}
                npc={npc}
                onSpeak={setDialogueNPC}
                onEdit={setEditNPC}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogue modal */}
      {dialogueNPC && (
        <NPCDialogueModal
          npc={dialogueNPC}
          onClose={() => setDialogueNPC(null)}
          onSendToChat={(msg, name) => {
            // Could integrate with chat store — noop for now
            console.log('[NPC Chat]', name, msg);
          }}
        />
      )}
    </div>
  );
}

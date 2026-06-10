import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MonsterStatBlock } from './MonsterStatBlock';
import { SpellCard } from './SpellCard';

type Tab = 'monsters' | 'spells' | 'items';

interface ContentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToEncounter?: (monster: unknown) => void;
  onAddSpell?: (spell: unknown) => void;
}

export const ContentSearchModal: React.FC<ContentSearchModalProps> = ({
  isOpen, onClose, onAddToEncounter, onAddSpell,
}) => {
  const [tab, setTab] = useState<Tab>('monsters');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [crRange, setCrRange] = useState<[number, number]>([0, 30]);
  const [spellLevel, setSpellLevel] = useState<number | ''>('');
  const [spellClass, setSpellClass] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchResults = useCallback(async (q: string, t: Tab, pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: '20' });
      if (q) params.set('search', q);
      if (t === 'monsters' && crRange[0] > 0) params.set('cr_min', String(crRange[0]));
      if (t === 'spells' && spellLevel !== '') params.set('level', String(spellLevel));
      if (t === 'spells' && spellClass) params.set('class', spellClass);

      const res = await fetch(`/api/content/${t}?${params}`);
      const data = await res.json();
      setResults(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [crRange, spellLevel, spellClass]);

  useEffect(() => {
    if (!isOpen) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(search, tab, page), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, tab, page, isOpen, fetchResults]);

  useEffect(() => {
    if (isOpen) { setPage(1); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [isOpen, tab]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); /* parent handles open */ }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const tabs: Tab[] = ['monsters', 'spells', 'items'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#fdf1dc] rounded-xl shadow-2xl border-2 border-[#c9a227] w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Search bar */}
        <div className="p-4 border-b border-[#c9a227]/40">
          <div className="flex items-center gap-2 bg-white/80 rounded-lg border border-[#c9a227] px-3 py-2">
            <span className="text-gray-400 text-lg">🔍</span>
            <input ref={inputRef} className="flex-1 bg-transparent outline-none text-[#2d1b00] placeholder-gray-400"
              placeholder={`Search ${tab}...`} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">✕</button>}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {tabs.map(t => (
              <button key={t} onClick={() => { setTab(t); setSearch(''); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  tab === t ? 'bg-[#922610] text-white' : 'bg-[#2d1b00]/10 text-[#2d1b00] hover:bg-[#2d1b00]/20'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Filters */}
          {tab === 'spells' && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <select className="text-xs border border-[#c9a227] rounded px-2 py-1 bg-white" value={spellLevel}
                onChange={e => { setSpellLevel(e.target.value === '' ? '' : parseInt(e.target.value)); setPage(1); }}>
                <option value="">All Levels</option>
                {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l === 0 ? 'Cantrip' : `Level ${l}`}</option>)}
              </select>
              <select className="text-xs border border-[#c9a227] rounded px-2 py-1 bg-white" value={spellClass}
                onChange={e => { setSpellClass(e.target.value); setPage(1); }}>
                <option value="">All Classes</option>
                {['bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard'].map(c => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <div className="text-center text-gray-500 py-8">Loading...</div>}
          {!loading && results.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No {tab} found{search ? ` for "${search}"` : ''}.
            </div>
          )}

          {!loading && results.map((item: unknown, i) => {
            const m = item as Record<string, unknown>;
            const key = (m.slug as string) ?? String(i);
            const isExpanded = expanded === key;

            return (
              <div key={key} className="border border-[#c9a227]/40 rounded-lg overflow-hidden">
                {/* Compact row */}
                <div className="flex items-center gap-3 px-3 py-2 bg-white/60 cursor-pointer hover:bg-[#c9a227]/10"
                  onClick={() => setExpanded(isExpanded ? null : key)}>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[#2d1b00]">{m.name as string}</span>
                    {tab === 'monsters' && (
                      <span className="ml-2 text-xs text-gray-500">CR {m.cr as string | number} • {m.type as string}</span>
                    )}
                    {tab === 'spells' && (
                      <span className="ml-2 text-xs text-gray-500">
                        {(m.level as number) === 0 ? 'Cantrip' : `Level ${m.level as number}`} {m.school as string}
                      </span>
                    )}
                    {tab === 'items' && (
                      <span className="ml-2 text-xs text-gray-500">{m.type as string}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {tab === 'monsters' && onAddToEncounter && (
                      <button onClick={e => { e.stopPropagation(); onAddToEncounter(item); }}
                        className="text-xs bg-[#922610] text-white px-2 py-1 rounded hover:bg-[#7a1f0e]">
                        + Encounter
                      </button>
                    )}
                    {tab === 'spells' && onAddSpell && (
                      <button onClick={e => { e.stopPropagation(); onAddSpell(item); }}
                        className="text-xs bg-[#2d1b00] text-white px-2 py-1 rounded hover:bg-[#1a0f00]">
                        + Spells
                      </button>
                    )}
                    <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="p-3 bg-[#fdf1dc]/80">
                    {tab === 'monsters' && <MonsterStatBlock monster={m as Parameters<typeof MonsterStatBlock>[0]['monster']} />}
                    {tab === 'spells' && <SpellCard spell={m as unknown as Parameters<typeof SpellCard>[0]['spell']} />}
                    {tab === 'items' && (
                      <div className="text-sm text-gray-800">
                        {String(m.description ?? '')}
                        {!!m.mastery && <p className="mt-1"><span className="font-bold">Mastery:</span> {String(m.mastery)}</p>}
                        {!!m.rarity && <p className="mt-1"><span className="font-bold">Rarity:</span> {String(m.rarity)}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 pt-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm bg-[#2d1b00]/10 rounded disabled:opacity-40 hover:bg-[#2d1b00]/20">← Prev</button>
              <span className="text-sm text-gray-600 py-1">Page {page} of {Math.ceil(total / 20)}</span>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm bg-[#2d1b00]/10 rounded disabled:opacity-40 hover:bg-[#2d1b00]/20">Next →</button>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#c9a227]/40 text-xs text-gray-500 flex justify-between">
          <span>{total} results</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};

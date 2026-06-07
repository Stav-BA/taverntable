import React, { useState } from 'react';
import { useDMStore, JournalEntry as JournalEntryType } from '@/stores/dmStore';
import { JournalEntry } from './JournalEntry';

const TAG_OPTIONS: Array<JournalEntryType['tags'][number]> = ['combat', 'roleplay', 'discovery', 'milestone'];

function exportToMarkdown(entries: JournalEntryType[]): string {
  const sections: Record<number, JournalEntryType[]> = {};
  entries.forEach((e) => {
    if (!sections[e.sessionNumber]) sections[e.sessionNumber] = [];
    sections[e.sessionNumber].push(e);
  });

  return Object.entries(sections)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([session, entries]) => {
      const header = `## Session ${session}\n`;
      const body = entries
        .map((e) => {
          const time = new Date(e.timestamp).toLocaleString();
          const tags = e.tags.join(', ');
          return `### ${e.title}\n*${time}* | Tags: ${tags}\n\n${e.body}`;
        })
        .join('\n\n---\n\n');
      return header + '\n' + body;
    })
    .join('\n\n');
}

export function CampaignJournal() {
  const { journalEntries, addJournalEntry, currentSession } = useDMStore();
  const [searchText, setSearchText] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | JournalEntryType['tags'][number]>('all');
  const [filterSession, setFilterSession] = useState<number | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTags, setNewTags] = useState<JournalEntryType['tags']>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);

  const sessions = Array.from(new Set(journalEntries.map((e) => e.sessionNumber))).sort((a, b) => a - b);

  const filtered = journalEntries
    .filter((e) => {
      if (searchText && !e.title.toLowerCase().includes(searchText.toLowerCase()) && !e.body.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterTag !== 'all' && !e.tags.includes(filterTag)) return false;
      if (filterSession !== 'all' && e.sessionNumber !== filterSession) return false;
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleAddEntry = () => {
    if (!newTitle.trim()) return;
    addJournalEntry({
      sessionNumber: currentSession,
      title: newTitle.trim(),
      body: newBody.trim(),
      tags: newTags,
      characterTags: [],
    });
    setNewTitle('');
    setNewBody('');
    setNewTags([]);
    setShowNewEntry(false);
  };

  const handleExport = () => {
    const md = exportToMarkdown(journalEntries);
    navigator.clipboard.writeText(md).catch(() => { /* ignore */ });
    alert('Campaign journal copied to clipboard as Markdown!');
  };

  const toggleTag = (tag: JournalEntryType['tags'][number]) => {
    setNewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Group by session for timeline
  const bySession: Record<number, JournalEntryType[]> = {};
  filtered.forEach((e) => {
    if (!bySession[e.sessionNumber]) bySession[e.sessionNumber] = [];
    bySession[e.sessionNumber].push(e);
  });

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search + filters */}
      <div className="flex flex-col gap-2">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search journal..."
          className="w-full font-crimson text-sm px-3 py-1.5 rounded"
          style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
        />
        <div className="flex gap-2">
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value as typeof filterTag)}
            className="flex-1 font-cinzel text-xs px-2 py-1 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          >
            <option value="all">All Tags</option>
            {TAG_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="flex-1 font-cinzel text-xs px-2 py-1 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          >
            <option value="all">All Sessions</option>
            {sessions.map((s) => <option key={s} value={s}>Session {s}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewEntry(!showNewEntry)}
            className="flex-1 font-cinzel text-xs py-1.5 rounded"
            style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', color: '#c9a227', cursor: 'pointer' }}
          >
            + Add Entry
          </button>
          <button
            onClick={handleExport}
            className="flex-1 font-cinzel text-xs py-1.5 rounded"
            style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.3)', color: 'rgba(244,228,188,0.7)', cursor: 'pointer' }}
          >
            Export
          </button>
        </div>
      </div>

      {/* New entry form */}
      {showNewEntry && (
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(20,10,0,0.7)', border: '1px solid rgba(201,162,39,0.4)' }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Entry title..."
            className="w-full font-cinzel text-sm px-3 py-1.5 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="What happened..."
            rows={3}
            className="w-full font-crimson text-sm resize-none px-3 py-1.5 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          />
          <div className="flex gap-1 flex-wrap">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="font-cinzel text-xs px-2 py-0.5 rounded capitalize"
                style={{
                  background: newTags.includes(tag) ? 'rgba(201,162,39,0.3)' : 'rgba(45,27,0,0.4)',
                  border: newTags.includes(tag) ? '1px solid #c9a227' : '1px solid rgba(201,162,39,0.2)',
                  color: newTags.includes(tag) ? '#c9a227' : 'rgba(244,228,188,0.6)',
                  cursor: 'pointer',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddEntry}
              className="flex-1 font-cinzel text-xs py-1.5 rounded"
              style={{ background: 'rgba(201,162,39,0.3)', border: '1px solid rgba(201,162,39,0.6)', color: '#c9a227', cursor: 'pointer' }}
            >
              Save Entry
            </button>
            <button
              onClick={() => setShowNewEntry(false)}
              className="flex-1 font-cinzel text-xs py-1.5 rounded"
              style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.2)', color: 'rgba(244,228,188,0.6)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4">
        {Object.keys(bySession).length === 0 ? (
          <p className="text-center font-crimson italic text-sm py-8" style={{ color: 'rgba(244,228,188,0.4)' }}>
            The chronicle is empty. Your story awaits.
          </p>
        ) : (
          Object.entries(bySession)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([session, entries]) => (
              <div key={session}>
                <div
                  className="flex items-center gap-2 mb-2"
                >
                  <div className="flex-1 h-px" style={{ background: 'rgba(201,162,39,0.3)' }} />
                  <span className="font-cinzel text-xs uppercase tracking-widest px-2" style={{ color: '#c9a227' }}>
                    Session {session}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(201,162,39,0.3)' }} />
                </div>
                <div className="flex flex-col gap-2">
                  {entries.map((e) => <JournalEntry key={e.id} entry={e} />)}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import { useDMStore } from '@/stores/dmStore';
import { useDMTools } from '@/hooks/useDMTools';
import { TonePicker } from './TonePicker';
import { NarrationBubble } from './NarrationBubble';

export function AIDMPanel() {
  const {
    campaignName, setCampaignName,
    campaignSetting, setCampaignSetting,
    currentScene, setCurrentScene,
    aiMessages, isAIStreaming,
    currentLocation, setLocation,
    activeQuests, addQuest, updateQuestStatus,
    npcs,
  } = useDMStore();

  const { narrate, sceneEnter } = useDMTools();

  const [showAddQuest, setShowAddQuest] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestDesc, setNewQuestDesc] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleGenerateHook = () => {
    narrate('Generate an exciting adventure hook for the party based on the current scene and campaign tone. Be creative and concise — 2-3 sentences maximum.');
  };

  const handleDescribeScene = () => {
    if (!currentScene.trim()) return;
    narrate(`Describe the following scene vividly for the players, in second-person perspective: ${currentScene}`);
    sceneEnter(currentScene);
  };

  const handleAddQuest = () => {
    if (!newQuestTitle.trim()) return;
    addQuest({
      id: Math.random().toString(36).slice(2),
      title: newQuestTitle.trim(),
      description: newQuestDesc.trim(),
      status: 'active',
    });
    setNewQuestTitle('');
    setNewQuestDesc('');
    setShowAddQuest(false);
  };

  const topNPCs = npcs.slice(0, 5);
  const DISPOSITION_COLOUR: Record<string, string> = {
    hostile: '#e74c3c', unfriendly: '#e67e22', neutral: '#777',
    friendly: '#27ae60', ally: '#c9a227',
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">

      {/* === Campaign Setup === */}
      <section className="flex flex-col gap-3">
        <h3 className="font-cinzel text-xs uppercase tracking-widest" style={{ color: '#c9a227' }}>
          Campaign Setup
        </h3>

        <div>
          <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Campaign Name</label>
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="The Shattered Crown..."
            className="w-full font-crimson text-sm px-3 py-1.5 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          />
        </div>

        <TonePicker />

        <div>
          <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Setting</label>
          <input
            value={campaignSetting}
            onChange={(e) => setCampaignSetting(e.target.value)}
            placeholder="Faerûn, Eberron, homebrew..."
            className="w-full font-crimson text-sm px-3 py-1.5 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          />
        </div>

        <div>
          <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>Current Scene</label>
          <textarea
            value={currentScene}
            onChange={(e) => setCurrentScene(e.target.value)}
            placeholder="The party stands at the entrance to a crumbling dungeon..."
            rows={3}
            className="w-full font-crimson text-sm resize-none px-3 py-1.5 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDescribeScene}
            disabled={!currentScene.trim() || isAIStreaming}
            className="flex-1 font-cinzel text-xs py-2 rounded transition-all"
            style={{
              background: currentScene.trim() && !isAIStreaming ? 'rgba(201,162,39,0.3)' : 'rgba(45,27,0,0.3)',
              border: '1px solid rgba(201,162,39,0.4)',
              color: currentScene.trim() && !isAIStreaming ? '#c9a227' : 'rgba(244,228,188,0.3)',
              cursor: currentScene.trim() && !isAIStreaming ? 'pointer' : 'not-allowed',
            }}
          >
            Describe Scene
          </button>
          <button
            onClick={handleGenerateHook}
            disabled={isAIStreaming}
            className="flex-1 font-cinzel text-xs py-2 rounded transition-all"
            style={{
              background: !isAIStreaming ? 'rgba(139,26,26,0.3)' : 'rgba(45,27,0,0.3)',
              border: '1px solid rgba(139,26,26,0.5)',
              color: !isAIStreaming ? '#ff6b6b' : 'rgba(244,228,188,0.3)',
              cursor: !isAIStreaming ? 'pointer' : 'not-allowed',
            }}
          >
            Generate Hook
          </button>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(201,162,39,0.2)' }} />

      {/* === AI DM Chat === */}
      <section className="flex flex-col gap-2">
        <h3 className="font-cinzel text-xs uppercase tracking-widest" style={{ color: '#c9a227' }}>
          AI DM Narrations
        </h3>

        <div
          className="flex flex-col gap-2 overflow-y-auto p-1"
          style={{ maxHeight: 280, minHeight: 80 }}
        >
          {aiMessages.length === 0 ? (
            <p className="text-center font-crimson italic text-sm py-4" style={{ color: 'rgba(244,228,188,0.4)' }}>
              The AI DM awaits your command...
            </p>
          ) : (
            aiMessages.map((msg, i) => (
              <NarrationBubble
                key={msg.id}
                text={msg.content}
                isStreaming={isAIStreaming && i === aiMessages.length - 1}
                timestamp={msg.timestamp}
                onSendToChat={() => {
                  // Chat integration hook
                  console.log('[AI DM → Chat]', msg.content);
                }}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(201,162,39,0.2)' }} />

      {/* === World State === */}
      <section className="flex flex-col gap-3">
        <h3 className="font-cinzel text-xs uppercase tracking-widest" style={{ color: '#c9a227' }}>
          World State
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2">
          <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>Location:</span>
          <input
            value={currentLocation}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="The Rusty Flagon Inn..."
            className="flex-1 font-crimson text-sm px-2 py-1 rounded"
            style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.25)', color: '#f4e4bc' }}
          />
        </div>

        {/* Active quests */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="font-cinzel text-xs uppercase tracking-wider" style={{ color: 'rgba(244,228,188,0.6)' }}>Active Quests</p>
            <button
              onClick={() => setShowAddQuest(!showAddQuest)}
              className="font-cinzel text-xs px-2 py-0.5 rounded"
              style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227', cursor: 'pointer' }}
            >
              + Add
            </button>
          </div>

          {showAddQuest && (
            <div className="flex flex-col gap-2 mb-2 p-2 rounded" style={{ background: 'rgba(20,10,0,0.5)', border: '1px solid rgba(201,162,39,0.3)' }}>
              <input
                value={newQuestTitle}
                onChange={(e) => setNewQuestTitle(e.target.value)}
                placeholder="Quest title..."
                className="w-full font-crimson text-sm px-2 py-1 rounded"
                style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
              />
              <input
                value={newQuestDesc}
                onChange={(e) => setNewQuestDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full font-crimson text-sm px-2 py-1 rounded"
                style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.3)', color: '#f4e4bc' }}
              />
              <div className="flex gap-2">
                <button onClick={handleAddQuest} className="flex-1 font-cinzel text-xs py-1 rounded" style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', color: '#c9a227', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setShowAddQuest(false)} className="flex-1 font-cinzel text-xs py-1 rounded" style={{ background: 'rgba(45,27,0,0.4)', border: '1px solid rgba(201,162,39,0.2)', color: 'rgba(244,228,188,0.5)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {activeQuests.length === 0 ? (
              <p className="font-crimson text-xs italic" style={{ color: 'rgba(244,228,188,0.35)' }}>No quests tracked.</p>
            ) : (
              activeQuests.map((q) => (
                <div key={q.id} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: 'rgba(45,27,0,0.3)', border: '1px solid rgba(201,162,39,0.15)' }}>
                  <span className="flex-1 font-crimson text-xs truncate" style={{ color: '#f4e4bc' }}>{q.title}</span>
                  <select
                    value={q.status}
                    onChange={(e) => updateQuestStatus(q.id, e.target.value as typeof q.status)}
                    className="font-cinzel text-xs px-1 py-0.5 rounded"
                    style={{ background: 'rgba(45,27,0,0.8)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227', fontSize: 10 }}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Done</option>
                    <option value="failed">Failed</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NPC disposition quick-view */}
        {topNPCs.length > 0 && (
          <div>
            <p className="font-cinzel text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(244,228,188,0.6)' }}>NPC Dispositions</p>
            <div className="flex flex-col gap-1">
              {topNPCs.map((npc) => (
                <div key={npc.id} className="flex items-center gap-2 px-2 py-0.5">
                  <span className="text-sm">{npc.portrait}</span>
                  <span className="flex-1 font-crimson text-xs truncate" style={{ color: '#f4e4bc' }}>{npc.name}</span>
                  <span
                    className="font-cinzel text-xs px-1.5 py-0.5 rounded capitalize"
                    style={{
                      background: `${DISPOSITION_COLOUR[npc.disposition]}22`,
                      color: DISPOSITION_COLOUR[npc.disposition],
                      border: `1px solid ${DISPOSITION_COLOUR[npc.disposition]}44`,
                      fontSize: 10,
                    }}
                  >
                    {npc.disposition}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

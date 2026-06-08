import { useEffect } from 'react';
import { useDMStore, AIDMMessage } from '@/stores/dmStore';
import { useSessionStore } from '@/stores/sessionStore';
import { getSocket } from '@/lib/socket';

export function useDMTools() {
  const isDM = useSessionStore((s) => s.isDM);
  const {
    addAIMessage,
    appendAIChunk,
    setAIStreaming,
    addJournalEntry,
    currentSession,
    campaignTone,
    currentScene,
  } = useDMStore();

  useEffect(() => {
    if (!isDM) return;
    const socket = getSocket();

    socket.on('dm:chunk', (chunk: string) => {
      appendAIChunk(chunk);
    });

    socket.on('dm:response', (data: { content: string }) => {
      setAIStreaming(false);
      addJournalEntry({
        sessionNumber: currentSession,
        title: 'AI DM Narration',
        body: data.content,
        tags: ['roleplay'],
        characterTags: [],
      });
    });

    socket.on('dm:error', (err: { message: string }) => {
      setAIStreaming(false);
      console.error('[DM Socket Error]', err.message);
    });

    socket.on('dm:memory-updated', (data: { summary: string }) => {
      addJournalEntry({
        sessionNumber: currentSession,
        title: 'Memory Update',
        body: data.summary,
        tags: ['milestone'],
        characterTags: [],
      });
    });

    return () => {
      socket.off('dm:chunk');
      socket.off('dm:response');
      socket.off('dm:error');
      socket.off('dm:memory-updated');
    };
  }, [isDM, currentSession]);

  const narrate = (prompt: string) => {
    const socket = getSocket();
    const msg: AIDMMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'dm',
      content: '',
      timestamp: Date.now(),
    };
    addAIMessage(msg);
    setAIStreaming(true);
    socket.emit('dm:narrate', { prompt, tone: campaignTone, scene: currentScene });
  };

  const npcSpeak = (npcId: string, playerInput: string) => {
    getSocket().emit('dm:npc-speak', { npcId, playerInput });
  };

  const sceneEnter = (scene: string) => {
    getSocket().emit('dm:scene-enter', { scene });
  };

  const setTone = (tone: string) => {
    getSocket().emit('dm:set-tone', { tone });
  };

  return { narrate, npcSpeak, sceneEnter, setTone };
}

import { useEffect } from 'react';
import { useDMStore, AIDMMessage } from '@/stores/dmStore';
import { useSessionStore } from '@/stores/sessionStore';
import { io } from 'socket.io-client';

// Lazily get the shared socket instance
let _socket: ReturnType<typeof io> | null = null;
function getSocket() {
  if (!_socket) {
    _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001');
  }
  return _socket;
}

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
    const socket = getSocket();
    socket.emit('dm:npc-speak', { npcId, playerInput });
  };

  const sceneEnter = (scene: string) => {
    const socket = getSocket();
    socket.emit('dm:scene-enter', { scene });
  };

  const setTone = (tone: string) => {
    const socket = getSocket();
    socket.emit('dm:set-tone', { tone });
  };

  return { narrate, npcSpeak, sceneEnter, setTone };
}

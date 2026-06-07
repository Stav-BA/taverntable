import React, { useState, useEffect, useRef } from 'react';
import { NPC } from '@/stores/dmStore';
import { useDMTools } from '@/hooks/useDMTools';
import { io } from 'socket.io-client';

let _socket: ReturnType<typeof io> | null = null;
function getSocket() {
  if (!_socket) _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001');
  return _socket;
}

interface DialogueTurn {
  playerInput: string;
  npcResponse: string;
}

interface Props {
  npc: NPC;
  onClose: () => void;
  onSendToChat: (message: string, npcName: string) => void;
}

export function NPCDialogueModal({ npc, onClose, onSendToChat }: Props) {
  const { npcSpeak } = useDMTools();
  const [playerInput, setPlayerInput] = useState('');
  const [history, setHistory] = useState<DialogueTurn[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const responseRef = useRef('');
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on('dm:npc-chunk', (chunk: string) => {
      responseRef.current += chunk;
      setCurrentResponse(responseRef.current);
    });

    socket.on('dm:npc-response', (data: { content: string }) => {
      const finalResponse = data.content || responseRef.current;
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.npcResponse === '') {
          return [...prev.slice(0, -1), { ...last, npcResponse: finalResponse }];
        }
        return prev;
      });
      setCurrentResponse('');
      responseRef.current = '';
      setIsStreaming(false);
    });

    return () => {
      socket.off('dm:npc-chunk');
      socket.off('dm:npc-response');
    };
  }, []);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, currentResponse]);

  const handleSpeak = () => {
    if (!playerInput.trim() || isStreaming) return;
    setHistory((prev) => [...prev.slice(-4), { playerInput: playerInput.trim(), npcResponse: '' }]);
    setIsStreaming(true);
    responseRef.current = '';
    npcSpeak(npc.id, playerInput.trim());
    setPlayerInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg mx-4 flex flex-col rounded"
        style={{
          background: 'linear-gradient(180deg, #1a0e00 0%, #2d1b00 100%)',
          border: '2px solid rgba(201,162,39,0.5)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4"
          style={{ borderBottom: '1px solid rgba(201,162,39,0.3)' }}
        >
          <div className="text-4xl">{npc.portrait}</div>
          <div className="flex-1">
            <h2 className="font-cinzel font-bold text-lg" style={{ color: '#c9a227' }}>
              {npc.name}
            </h2>
            <p className="font-crimson text-sm capitalize" style={{ color: 'rgba(244,228,188,0.6)' }}>
              {npc.role}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-cinzel text-lg w-8 h-8 rounded flex items-center justify-center"
            style={{ color: 'rgba(244,228,188,0.5)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Dialogue history */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
          {history.length === 0 && !isStreaming && (
            <p
              className="text-center font-crimson italic text-sm py-4"
              style={{ color: 'rgba(244,228,188,0.4)' }}
            >
              Ask {npc.name} something...
            </p>
          )}

          {history.map((turn, i) => (
            <div key={i} className="flex flex-col gap-2">
              {/* Player */}
              <div className="flex justify-end">
                <div
                  className="max-w-xs rounded-lg px-3 py-2 font-crimson text-sm"
                  style={{ background: 'rgba(45,27,0,0.6)', border: '1px solid rgba(201,162,39,0.2)', color: 'rgba(244,228,188,0.9)' }}
                >
                  {turn.playerInput}
                </div>
              </div>
              {/* NPC response */}
              {turn.npcResponse && (
                <div className="flex justify-start gap-2">
                  <div className="text-2xl flex-shrink-0">{npc.portrait}</div>
                  <div
                    className="max-w-xs rounded-lg px-3 py-2 font-crimson text-sm relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(201,162,39,0.15), rgba(45,27,0,0.6))',
                      border: '1px solid rgba(201,162,39,0.4)',
                      color: '#f4e4bc',
                    }}
                  >
                    <p className="font-cinzel text-xs mb-1" style={{ color: '#c9a227' }}>{npc.name}</p>
                    <p>{turn.npcResponse}</p>
                    <button
                      onClick={() => onSendToChat(turn.npcResponse, npc.name)}
                      className="mt-2 font-cinzel text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(201,162,39,0.2)', color: '#c9a227', border: '1px solid rgba(201,162,39,0.4)', cursor: 'pointer' }}
                    >
                      Send to Chat
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Streaming response */}
          {isStreaming && (
            <div className="flex justify-start gap-2">
              <div className="text-2xl flex-shrink-0">{npc.portrait}</div>
              <div
                className="max-w-xs rounded-lg px-3 py-2 font-crimson text-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,162,39,0.15), rgba(45,27,0,0.6))',
                  border: '1px solid rgba(201,162,39,0.4)',
                  color: '#f4e4bc',
                }}
              >
                <p className="font-cinzel text-xs mb-1" style={{ color: '#c9a227' }}>{npc.name}</p>
                <p>{currentResponse}<span className="animate-pulse">|</span></p>
              </div>
            </div>
          )}

          <div ref={historyEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid rgba(201,162,39,0.3)' }}>
          <textarea
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSpeak(); } }}
            placeholder="What do you say to the NPC?"
            rows={2}
            className="flex-1 font-crimson text-sm resize-none rounded px-3 py-2"
            style={{
              background: 'rgba(45,27,0,0.6)',
              border: '1px solid rgba(201,162,39,0.3)',
              color: '#f4e4bc',
            }}
          />
          <button
            onClick={handleSpeak}
            disabled={isStreaming || !playerInput.trim()}
            className="font-cinzel text-xs px-4 py-2 rounded transition-all flex-shrink-0"
            style={{
              background: isStreaming || !playerInput.trim() ? 'rgba(201,162,39,0.1)' : 'rgba(201,162,39,0.3)',
              border: '1px solid rgba(201,162,39,0.5)',
              color: isStreaming || !playerInput.trim() ? 'rgba(201,162,39,0.4)' : '#c9a227',
              cursor: isStreaming || !playerInput.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Speak
          </button>
        </div>
      </div>
    </div>
  );
}

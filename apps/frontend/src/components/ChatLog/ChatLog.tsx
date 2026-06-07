import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { socketEmit } from '@/lib/socket';
import ChatMessageComponent from './ChatMessage';

export default function ChatLog() {
  const messages = useGameStore((s) => s.chatMessages);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const player = useSessionStore((s) => s.player);
  const isDM = useSessionStore((s) => s.isDM);

  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !player) return;

    const msg = {
      id: `msg-${Date.now()}`,
      type: isDM ? ('dm' as const) : ('player' as const),
      playerId: player.id,
      playerName: player.name,
      text: inputText.trim(),
      timestamp: Date.now(),
    };

    addChatMessage(msg);
    socketEmit.chatMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="section-header">💬 Chat Log</div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map((msg) => (
          <ChatMessageComponent key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom hint */}
      {!autoScroll && (
        <button
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setAutoScroll(true);
          }}
          className="mx-2 mb-1 font-cinzel text-xs py-1 text-center"
          style={{
            background: 'rgba(201,162,39,0.15)',
            border: '1px solid rgba(201,162,39,0.3)',
            color: '#c9a227',
            cursor: 'pointer',
          }}
        >
          ↓ New messages
        </button>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-1 p-2"
        style={{ borderTop: '1px solid rgba(201,162,39,0.2)' }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isDM ? 'Speak as DM...' : 'Say something...'}
          maxLength={500}
          className="input-tavern flex-1 text-sm py-1.5"
          style={{ fontSize: '0.85rem' }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="font-cinzel text-xs px-3 py-1.5 flex-shrink-0"
          style={{
            background: inputText.trim() ? '#c9a227' : 'rgba(201,162,39,0.2)',
            color: inputText.trim() ? '#2d1b00' : 'rgba(201,162,39,0.4)',
            border: '1px solid rgba(201,162,39,0.5)',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 700,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

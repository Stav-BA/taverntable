import React, { useEffect, useState } from 'react';

interface Props {
  text: string;
  isStreaming: boolean;
  timestamp: number;
  onSendToChat?: () => void;
}

export function NarrationBubble({ text, isStreaming, timestamp, onSendToChat }: Props) {
  const [displayed, setDisplayed] = useState('');
  const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!isStreaming) {
      setDisplayed(text);
      return;
    }
    // Typewriter: reveal text character by character
    let index = displayed.length;
    const interval = setInterval(() => {
      if (index >= text.length) {
        clearInterval(interval);
        return;
      }
      setDisplayed(text.slice(0, index + 1));
      index++;
    }, 30);
    return () => clearInterval(interval);
  }, [text, isStreaming]);

  return (
    <div
      className="rounded p-4 flex flex-col gap-2 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(244,228,188,0.12) 0%, rgba(45,27,0,0.6) 100%)',
        border: '1px solid rgba(201,162,39,0.4)',
        boxShadow: 'inset 0 0 40px rgba(201,162,39,0.05)',
      }}
    >
      {/* Decorative corner flourish */}
      <div
        className="absolute top-1 left-1 font-cinzel text-xs"
        style={{ color: 'rgba(201,162,39,0.3)', userSelect: 'none' }}
      >
        ❧
      </div>

      <p
        className="font-crimson text-sm leading-relaxed pt-3"
        style={{ color: '#f4e4bc', fontStyle: 'italic' }}
      >
        {displayed}
        {isStreaming && <span className="animate-pulse ml-0.5" style={{ color: '#c9a227' }}>|</span>}
      </p>

      <div className="flex items-center justify-between mt-1">
        <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.35)' }}>{timeStr}</span>
        {onSendToChat && !isStreaming && (
          <button
            onClick={onSendToChat}
            className="font-cinzel text-xs px-2 py-0.5 rounded transition-all"
            style={{
              background: 'rgba(201,162,39,0.15)',
              border: '1px solid rgba(201,162,39,0.4)',
              color: '#c9a227',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201,162,39,0.15)'; }}
          >
            Send to Chat
          </button>
        )}
      </div>
    </div>
  );
}

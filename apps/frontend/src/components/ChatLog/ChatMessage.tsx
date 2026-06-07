import type { ChatMessage as ChatMessageType } from '@/stores/gameStore';

interface Props {
  message: ChatMessageType;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessage({ message }: Props) {
  if (message.type === 'system') {
    return (
      <div className="chat-msg-system py-1 px-2 text-xs my-0.5">
        {message.text}
      </div>
    );
  }

  if (message.type === 'roll') {
    const roll = message.rollResult;
    return (
      <div className="chat-msg-roll rounded-sm px-2 py-1.5 my-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="font-cinzel text-xs font-semibold"
            style={{ color: '#c9a227' }}
          >
            🎲 {message.playerName}
          </span>
          <span className="text-xs" style={{ color: 'rgba(244,228,188,0.4)' }}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="font-crimson text-sm" style={{ color: 'rgba(244,228,188,0.9)' }}>
          {roll ? (
            <>
              <span style={{ color: 'rgba(244,228,188,0.6)' }}>{roll.expression}</span>
              {' → '}
              <span
                className="font-cinzel font-bold text-base"
                style={{
                  color: roll.total >= 20 ? '#FFD700' : roll.total <= 5 ? '#DC143C' : '#f4e4bc',
                }}
              >
                {roll.total}
              </span>
              {roll.rolls.length > 0 && (
                <span className="text-xs ml-1" style={{ color: 'rgba(244,228,188,0.5)' }}>
                  [{roll.rolls.map((r) => `${r.die}: [${r.results.join(',')}]`).join(' ')}
                  {roll.modifier !== 0 ? (roll.modifier > 0 ? `+${roll.modifier}` : `${roll.modifier}`) : ''}]
                </span>
              )}
            </>
          ) : (
            message.text
          )}
        </div>
      </div>
    );
  }

  const isDM = message.type === 'dm';

  return (
    <div className={`${isDM ? 'chat-msg-dm' : 'chat-msg-player'} rounded-sm px-2 py-1.5 my-0.5`}
      style={{ background: isDM ? 'rgba(139,26,26,0.15)' : 'rgba(244,228,188,0.08)' }}>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="font-cinzel text-xs font-semibold"
          style={{ color: isDM ? '#c9a227' : 'rgba(244,228,188,0.7)' }}
        >
          {isDM ? '⚔️ ' : ''}{message.playerName ?? 'Unknown'}
        </span>
        <span className="text-xs flex-shrink-0" style={{ color: 'rgba(244,228,188,0.3)' }}>
          {formatTime(message.timestamp)}
        </span>
      </div>
      <p
        className="font-crimson text-sm leading-snug"
        style={{ color: 'rgba(244,228,188,0.9)' }}
      >
        {message.text}
      </p>
    </div>
  );
}

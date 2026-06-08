import InitiativeTracker from '@/components/InitiativeTracker/InitiativeTracker';
import ChatLog from '@/components/ChatLog/ChatLog';
import { useSessionStore } from '@/stores/sessionStore';
import { useDMStore } from '@/stores/dmStore';
import { socketEmit } from '@/lib/socket';

export default function LeftSidebar() {
  const isDM = useSessionStore((s) => s.isDM);

  return (
    <div
      className="sidebar-panel flex flex-col"
      style={{ width: 320, flexShrink: 0 }}
    >
      {/* DM Readiness Panel — shown only to DM, above initiative */}
      {isDM && <DMReadinessPanel />}

      {/* Initiative Tracker — top half */}
      <div
        className="flex flex-col"
        style={{
          height: isDM ? '35%' : '40%',
          borderBottom: '1px solid rgba(201,162,39,0.3)',
          overflow: 'hidden',
        }}
      >
        <InitiativeTracker />
      </div>

      {/* Chat Log — bottom half */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <ChatLog />
      </div>
    </div>
  );
}

function DMReadinessPanel() {
  const connectedPlayers = useSessionStore((s) => s.connectedPlayers);
  const campaignName = useDMStore((s) => s.campaignName);
  const campaignLore = useDMStore((s) => s.campaignLore);

  // Filter out DM entries — consider players those without the DM flag; in practice all entries in connectedPlayers are real players since the DM is also tracked, so we show all
  const players = connectedPlayers;
  const allReady = players.length > 0 && players.every((p) => p.ready);

  const handleStartAdventure = () => {
    socketEmit.adventureStart(campaignName, campaignLore);
  };

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(201,162,39,0.3)',
        padding: '8px 12px',
        background: 'rgba(45,27,0,0.3)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '0.6rem',
          color: 'rgba(201,162,39,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: 6,
        }}
      >
        Player Readiness
      </div>

      {/* Player list */}
      {players.length === 0 ? (
        <p style={{ fontFamily: 'Crimson Text, Georgia, serif', fontSize: '0.75rem', color: 'rgba(244,228,188,0.4)', fontStyle: 'italic' }}>
          Waiting for players to join...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {/* Ready indicator */}
              <span style={{ fontSize: '0.7rem' }}>
                {p.ready ? '🟢' : '⚫'}
              </span>
              <span
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.7rem',
                  color: p.ready ? '#f4e4bc' : 'rgba(244,228,188,0.5)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.name}
              </span>
              {p.ready && (
                <span style={{ fontSize: '0.6rem', color: '#2d8a2d', fontFamily: 'Cinzel, serif' }}>
                  Ready
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Start adventure button */}
      <button
        onClick={handleStartAdventure}
        disabled={!allReady}
        style={{
          width: '100%',
          fontFamily: 'Cinzel, serif',
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '0.4rem 0.5rem',
          cursor: allReady ? 'pointer' : 'not-allowed',
          background: allReady
            ? 'linear-gradient(135deg, rgba(201,162,39,0.25), rgba(201,162,39,0.15))'
            : 'rgba(45,27,0,0.2)',
          color: allReady ? '#c9a227' : 'rgba(201,162,39,0.3)',
          border: `1px solid ${allReady ? 'rgba(201,162,39,0.6)' : 'rgba(201,162,39,0.2)'}`,
          borderRadius: 2,
          transition: 'all 0.2s ease',
          boxShadow: allReady ? '0 0 12px rgba(201,162,39,0.2)' : 'none',
        }}
      >
        {allReady ? 'Start the Adventure!' : 'Waiting for all players...'}
      </button>
    </div>
  );
}

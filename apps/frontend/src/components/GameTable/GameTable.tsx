import { useEffect, useState } from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Toolbar from '@/components/Toolbar/Toolbar';
import DiceRoller from '@/components/DiceRoller/DiceRoller';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
import CanvasContainer from '@/canvas/CanvasContainer';
import CharacterCreationModal from '@/components/CharacterCreationModal';
import AdventureStartOverlay from '@/components/AdventureStartOverlay';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { useDMStore } from '@/stores/dmStore';
import { socketEmit } from '@/lib/socket';
import { useNavigate } from 'react-router-dom';

export default function GameTable() {
  const isDM = useSessionStore((s) => s.isDM);
  const player = useSessionStore((s) => s.player);
  const clearSession = useSessionStore((s) => s.clearSession);
  const tokens = useGameStore((s) => s.tokens);
  const currentMap = useGameStore((s) => s.currentMap);
  const adventureStarted = useGameStore((s) => s.adventureStarted);
  const adventurePayload = useGameStore((s) => s.adventurePayload);
  const setAdventureStarted = useGameStore((s) => s.setAdventureStarted);
  const navigate = useNavigate();

  const [playerReady, setPlayerReady] = useState(false);

  // Reset game state on mount
  useEffect(() => {
    const gs = useGameStore.getState();
    gs.setFogRevealed([]);
    gs.setTokens([]);
    gs.setInCombat(false);
    gs.setFogEnabled(false);
  }, []);

  // Load default map — always start at tavern
  useEffect(() => {
    if (currentMap) return;
    const { availableMaps, setCurrentMap } = useGameStore.getState();
    const defaultMap = availableMaps.find((m) => m.id.includes('tavern')) ?? availableMaps[0];
    if (defaultMap) {
      setCurrentMap(defaultMap);
      if (isDM) {
        socketEmit.mapChange(defaultMap.id, defaultMap as unknown as Record<string, unknown>);
      }
    }
  }, [currentMap, isDM]);

  // Show character creation modal for players who haven't created a token yet
  const playerToken = player ? tokens.find((t) => t.playerId === player.id) : undefined;
  const [characterCreated, setCharacterCreated] = useState(false);
  const showCharacterCreation = !isDM && !!player && !playerToken && !characterCreated;

  const handleLeave = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  const handleReadyClick = () => {
    if (!player) return;
    setPlayerReady(true);
    socketEmit.playerReady(player.id, true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#1a0f00',
      }}
    >
      {/* Top toolbar — full width, fixed height */}
      <div style={{ height: 48, flexShrink: 0, position: 'relative' }}>
        <Toolbar />
        {/* Leave button */}
        <button
          onClick={handleLeave}
          title="Leave session"
          style={{
            position: 'absolute',
            right: isDM ? 80 : 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(139,26,26,0.4)',
            border: '1px solid rgba(139,26,26,0.6)',
            color: 'rgba(244,228,188,0.7)',
            fontFamily: 'Cinzel, serif',
            fontSize: '0.65rem',
            padding: '0.2rem 0.6rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139,26,26,0.7)';
            e.currentTarget.style.color = '#f4e4bc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(139,26,26,0.4)';
            e.currentTarget.style.color = 'rgba(244,228,188,0.7)';
          }}
        >
          Leave
        </button>
      </div>

      {/* Middle row: Left Sidebar | Canvas | Right Sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left sidebar */}
        <LeftSidebar />

        {/* Canvas — fills remaining width */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0, minHeight: 0 }}>
          <CanvasContainer />
          <FogBrushControls />
        </div>

        {/* Right sidebar */}
        <RightSidebar />
      </div>

      {/* Bottom dice roller bar */}
      <div style={{ height: 64, flexShrink: 0, position: 'relative' }}>
        <DiceRoller />
      </div>

      {/* Floating audio player (DM only) */}
      <AudioPlayer />

      {/* Character creation modal — shown to new players before they have a token */}
      {showCharacterCreation && (
        <CharacterCreationModal onComplete={() => setCharacterCreated(true)} />
      )}

      {/* Player "Ready for Adventure" button */}
      {!isDM && !playerReady && (
        <ReadyButton onClick={handleReadyClick} />
      )}

      {/* Adventure start overlay — shown to everyone */}
      {adventureStarted && adventurePayload && (
        <AdventureStartOverlay
          campaignName={adventurePayload.campaignName}
          lore={adventurePayload.lore}
          onDismiss={() => setAdventureStarted(false)}
        />
      )}
    </div>
  );
}

function ReadyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'linear-gradient(135deg, #c9a227, #a8831a)',
        border: '2px solid #e0b830',
        color: '#1a0f00',
        fontFamily: 'Cinzel, serif',
        fontSize: '0.9rem',
        fontWeight: 700,
        padding: '0.7rem 2rem',
        cursor: 'pointer',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        boxShadow: '0 4px 20px rgba(201,162,39,0.5)',
        borderRadius: 2,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 28px rgba(201,162,39,0.8)';
        e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,162,39,0.5)';
        e.currentTarget.style.transform = 'translateX(-50%)';
      }}
    >
      Ready for Adventure!
    </button>
  );
}

function FogBrushControls() {
  const activeTool = useSessionStore((s) => s.activeTool);
  const isDM = useSessionStore((s) => s.isDM);

  if (!isDM || (activeTool !== 'fog-reveal' && activeTool !== 'fog-hide')) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(45,27,0,0.9)',
        border: '1px solid rgba(201,162,39,0.5)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'auto',
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '0.7rem',
          color: '#c9a227',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {activeTool === 'fog-reveal' ? 'Reveal Mode' : 'Hide Mode'} — Click drag on map
      </span>
    </div>
  );
}

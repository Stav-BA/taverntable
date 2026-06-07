import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { socketEmit } from '@/lib/socket';
import type { SessionState } from '@/stores/sessionStore';

interface Tool {
  id: SessionState['activeTool'];
  icon: string;
  label: string;
  dmOnly?: boolean;
  shortcut?: string;
}

const TOOLS: Tool[] = [
  { id: 'select', icon: '↖', label: 'Select', shortcut: 'S' },
  { id: 'move', icon: '✥', label: 'Move', shortcut: 'M' },
  { id: 'measure', icon: '📏', label: 'Measure', shortcut: 'R' },
  { id: 'ping', icon: '📍', label: 'Ping', shortcut: 'P' },
  { id: 'fog-reveal', icon: '🔦', label: 'Reveal', dmOnly: true },
  { id: 'fog-hide', icon: '🌫️', label: 'Hide Fog', dmOnly: true },
];

export default function Toolbar() {
  const activeTool = useSessionStore((s) => s.activeTool);
  const setActiveTool = useSessionStore((s) => s.setActiveTool);
  const isDM = useSessionStore((s) => s.isDM);
  const currentMap = useGameStore((s) => s.currentMap);
  const sessionCode = useSessionStore((s) => s.sessionCode);

  const visibleTools = TOOLS.filter((t) => !t.dmOnly || isDM);

  const handleMapChange = (mapId: string) => {
    socketEmit.mapChange(mapId);
  };

  return (
    <div
      className="flex items-center gap-1 px-3 h-full"
      style={{
        background: 'linear-gradient(180deg, #3d2408 0%, #2d1b00 100%)',
        borderBottom: '2px solid rgba(201,162,39,0.5)',
      }}
    >
      {/* Logo / Session */}
      <div className="flex items-center gap-3 flex-shrink-0 mr-2">
        <span
          className="font-cinzel font-black text-lg"
          style={{ color: '#c9a227', textShadow: '0 0 12px rgba(201,162,39,0.4)' }}
        >
          🍺 TT
        </span>
        {sessionCode && (
          <span
            className="font-cinzel text-xs px-2 py-0.5"
            style={{
              background: 'rgba(201,162,39,0.1)',
              border: '1px solid rgba(201,162,39,0.3)',
              color: 'rgba(244,228,188,0.6)',
              letterSpacing: '0.2em',
            }}
          >
            {sessionCode}
          </span>
        )}
      </div>

      {/* Divider */}
      <div
        className="w-px h-6 flex-shrink-0 mx-1"
        style={{ background: 'rgba(201,162,39,0.3)' }}
      />

      {/* Tool buttons */}
      {visibleTools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
          title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          style={{ minWidth: 44 }}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>{tool.icon}</span>
          <span style={{ fontSize: '0.6rem' }}>{tool.label}</span>
        </button>
      ))}

      {/* Flex spacer */}
      <div className="flex-1" />

      {/* DM map picker */}
      {isDM && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-cinzel text-xs" style={{ color: 'rgba(244,228,188,0.5)' }}>
            Map:
          </span>
          <select
            value={currentMap?.id ?? ''}
            onChange={(e) => handleMapChange(e.target.value)}
            style={{
              background: 'rgba(45,27,0,0.7)',
              border: '1px solid rgba(201,162,39,0.4)',
              color: '#f4e4bc',
              fontFamily: 'Cinzel, serif',
              fontSize: '0.7rem',
              padding: '0.2rem 0.5rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {useGameStore.getState().availableMaps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* DM badge */}
      {isDM && (
        <div
          className="font-cinzel text-xs px-2 py-0.5 ml-2 flex-shrink-0"
          style={{
            background: 'rgba(139,26,26,0.3)',
            border: '1px solid rgba(139,26,26,0.6)',
            color: '#c9a227',
          }}
        >
          ⚔️ DM
        </div>
      )}
    </div>
  );
}

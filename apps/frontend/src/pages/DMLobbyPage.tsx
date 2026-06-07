import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';

function generateSessionCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export default function DMLobbyPage() {
  const navigate = useNavigate();
  const availableMaps = useGameStore((s) => s.availableMaps);
  const setCurrentMap = useGameStore((s) => s.setCurrentMap);
  const setSession = useSessionStore((s) => s.setSession);
  const setPlayer = useSessionStore((s) => s.setPlayer);
  const setIsDM = useSessionStore((s) => s.setIsDM);

  const [sessionCode] = useState(generateSessionCode);
  const [dmName, setDmName] = useState('Dungeon Master');
  const [selectedMapId, setSelectedMapId] = useState(availableMaps[0]?.id ?? '');
  const [fogEnabled, setFogEnabled] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const selectedMap = availableMaps.find((m) => m.id === selectedMapId);

  const handleStartSession = async () => {
    if (!dmName.trim()) return;
    setIsCreating(true);

    // Simulate session creation
    await new Promise((r) => setTimeout(r, 600));

    const sessionId = `session-${sessionCode}`;
    const dmId = generateId();

    setIsDM(true);
    setSession(sessionId, sessionCode);
    setPlayer({ id: dmId, name: dmName.trim(), colour: '#C9A227' });

    if (selectedMap) {
      setCurrentMap(selectedMap);
    }

    setIsCreating(false);
    navigate(`/game/${sessionId}`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #3d2408 0%, #2d1b00 40%, #1a0f00 100%)',
      }}
    >
      <div className="parchment-panel rounded-sm max-w-lg w-full p-8 relative animate-float-in">
        {/* Corner ornaments */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
          <div key={pos} className={`absolute ${pos} text-gold opacity-40 font-cinzel`}>
            ✦
          </div>
        ))}

        <div className="text-center mb-6">
          <h1 className="font-cinzel font-bold text-3xl text-dark-brown mb-1">DM Command Post</h1>
          <div className="ornament-divider">
            <span className="font-crimson text-medium-brown italic text-sm">
              Prepare your session, Dungeon Master
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Session Code Display */}
          <div className="parchment-panel rounded-sm p-4 text-center border-ornate">
            <p className="font-cinzel text-xs text-medium-brown uppercase tracking-widest mb-1">
              Session Code — Share with Players
            </p>
            <p
              className="font-cinzel text-4xl font-black tracking-[0.4em] text-dark-brown"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              {sessionCode}
            </p>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(sessionCode)}
              className="mt-2 font-cinzel text-xs text-medium-brown uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              📋 Copy Code
            </button>
          </div>

          {/* DM Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Your DM Name
            </label>
            <input
              type="text"
              value={dmName}
              onChange={(e) => setDmName(e.target.value)}
              maxLength={40}
              style={{
                background: 'rgba(45,27,0,0.08)',
                border: '2px solid #5c3d1e',
                color: '#2d1b00',
                padding: '0.5rem 0.75rem',
                outline: 'none',
                fontFamily: 'Crimson Text, serif',
                fontSize: '1.1rem',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#c9a227')}
              onBlur={(e) => (e.target.style.borderColor = '#5c3d1e')}
            />
          </div>

          {/* Map Picker */}
          <div className="flex flex-col gap-2">
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Starting Map
            </label>
            <div className="flex flex-col gap-2">
              {availableMaps.map((map) => (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => setSelectedMapId(map.id)}
                  className="flex items-center gap-3 p-3 transition-all text-left"
                  style={{
                    background:
                      selectedMapId === map.id
                        ? 'rgba(201,162,39,0.15)'
                        : 'rgba(45,27,0,0.06)',
                    border:
                      selectedMapId === map.id
                        ? '2px solid #c9a227'
                        : '2px solid #5c3d1e',
                    color: '#2d1b00',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-sm flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(45,27,0,0.15)' }}
                  >
                    {map.id.includes('tavern') ? '🍺' : map.id.includes('dungeon') ? '💀' : '🌲'}
                  </div>
                  <div>
                    <p className="font-cinzel font-semibold text-sm">{map.name}</p>
                    <p className="font-crimson text-xs opacity-60">
                      {map.gridCols} × {map.gridRows} squares
                    </p>
                  </div>
                  {selectedMapId === map.id && (
                    <span className="ml-auto text-gold font-cinzel">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Fog of War toggle */}
          <div className="flex items-center justify-between p-3 rounded-sm"
            style={{ background: 'rgba(45,27,0,0.08)', border: '1px solid #5c3d1e' }}>
            <div>
              <p className="font-cinzel text-sm font-semibold text-dark-brown">Fog of War</p>
              <p className="font-crimson text-xs text-medium-brown">Players see only revealed areas</p>
            </div>
            <button
              type="button"
              onClick={() => setFogEnabled(!fogEnabled)}
              className="relative w-12 h-6 rounded-full transition-all"
              style={{
                background: fogEnabled ? '#c9a227' : '#5c3d1e',
                border: '2px solid',
                borderColor: fogEnabled ? '#a8831a' : '#3d2408',
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-parchment transition-all"
                style={{ left: fogEnabled ? '1.5rem' : '0.1rem' }}
              />
            </button>
          </div>

          {/* Launch button */}
          <button
            type="button"
            disabled={isCreating || !dmName.trim()}
            onClick={handleStartSession}
            className="btn-tavern text-base py-4 rounded-sm w-full mt-2"
            style={{ opacity: isCreating || !dmName.trim() ? 0.7 : 1 }}
          >
            {isCreating ? '⏳ Opening the tavern doors...' : '⚔️ Begin the Adventure'}
          </button>
        </div>

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full text-center font-cinzel text-xs uppercase tracking-wider mt-4 opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: '#2d1b00', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Return to Landing
        </button>
      </div>
    </div>
  );
}

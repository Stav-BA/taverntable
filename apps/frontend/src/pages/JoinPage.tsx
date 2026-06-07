import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';

const TOKEN_COLOURS = [
  { name: 'Crimson', value: '#DC143C' },
  { name: 'Royal Blue', value: '#4169E1' },
  { name: 'Emerald', value: '#50C878' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Violet', value: '#8A2BE2' },
  { name: 'Amber', value: '#FF8C00' },
  { name: 'Teal', value: '#008B8B' },
  { name: 'Pearl', value: '#F5F5F5' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export default function JoinPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [sessionCode, setSessionCode] = useState(code?.toUpperCase() ?? '');
  const [playerName, setPlayerName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [selectedColour, setSelectedColour] = useState(TOKEN_COLOURS[0].value);
  const [characterMode, setCharacterMode] = useState<'new' | 'existing'>('new');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setSession = useSessionStore((s) => s.setSession);
  const setPlayer = useSessionStore((s) => s.setPlayer);
  const setIsDM = useSessionStore((s) => s.setIsDM);

  const handleSessionCodeChange = (val: string) => {
    setSessionCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (sessionCode.length !== 6) {
      setError('Session code must be 6 characters.');
      return;
    }
    if (!playerName.trim()) {
      setError('Please enter your player name.');
      return;
    }

    setIsLoading(true);

    // Simulate session validation (replace with real API call)
    await new Promise((r) => setTimeout(r, 800));

    const playerId = generateId();
    const sessionId = `session-${sessionCode}`;

    setIsDM(false);
    setSession(sessionId, sessionCode);
    setPlayer({
      id: playerId,
      name: playerName.trim(),
      colour: selectedColour,
      characterName: characterName.trim() || playerName.trim(),
    });

    setIsLoading(false);
    navigate(`/game/${sessionId}`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #3d2408 0%, #2d1b00 40%, #1a0f00 100%)',
      }}
    >
      <div className="parchment-panel rounded-sm max-w-md w-full p-8 relative animate-float-in">
        {/* Corner ornaments */}
        <div className="absolute top-2 left-2 text-gold opacity-40 text-lg font-cinzel">✦</div>
        <div className="absolute top-2 right-2 text-gold opacity-40 text-lg font-cinzel">✦</div>
        <div className="absolute bottom-2 left-2 text-gold opacity-40 text-lg font-cinzel">✦</div>
        <div className="absolute bottom-2 right-2 text-gold opacity-40 text-lg font-cinzel">✦</div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-cinzel font-bold text-3xl text-dark-brown mb-1">Enter the Tavern</h1>
          <div className="ornament-divider">
            <span className="font-crimson text-medium-brown italic text-sm">
              Join your party at the table
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Session Code */}
          <div className="flex flex-col gap-1.5">
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Session Code
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => handleSessionCodeChange(e.target.value)}
              placeholder="TAVERN"
              maxLength={6}
              className="text-center text-2xl tracking-[0.4em] font-cinzel"
              style={{
                background: 'rgba(45,27,0,0.08)',
                border: '2px solid #5c3d1e',
                color: '#2d1b00',
                padding: '0.75rem',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#c9a227';
                e.target.style.boxShadow = '0 0 8px rgba(201,162,39,0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#5c3d1e';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Player Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Brave Adventurer"
              maxLength={30}
              style={{
                background: 'rgba(45,27,0,0.08)',
                border: '2px solid #5c3d1e',
                color: '#2d1b00',
                padding: '0.5rem 0.75rem',
                outline: 'none',
                fontFamily: 'Crimson Text, serif',
                fontSize: '1.1rem',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#c9a227';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#5c3d1e';
              }}
            />
          </div>

          {/* Character Mode */}
          <div className="flex flex-col gap-2">
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Character
            </label>
            <div className="flex gap-2">
              {(['new', 'existing'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCharacterMode(mode)}
                  className="flex-1 py-2 font-cinzel text-sm uppercase tracking-wider transition-all"
                  style={{
                    background: characterMode === mode ? '#c9a227' : 'rgba(45,27,0,0.08)',
                    border: '2px solid #5c3d1e',
                    color: characterMode === mode ? '#2d1b00' : '#5c3d1e',
                    fontWeight: characterMode === mode ? '700' : '400',
                    cursor: 'pointer',
                  }}
                >
                  {mode === 'new' ? '+ Create New' : '📋 Use Existing'}
                </button>
              ))}
            </div>

            {characterMode === 'new' && (
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Character name (optional)"
                maxLength={40}
                style={{
                  background: 'rgba(45,27,0,0.08)',
                  border: '2px solid #5c3d1e',
                  color: '#2d1b00',
                  padding: '0.5rem 0.75rem',
                  outline: 'none',
                  fontFamily: 'Crimson Text, serif',
                  fontSize: '1rem',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c9a227';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#5c3d1e';
                }}
              />
            )}
          </div>

          {/* Token Colour */}
          <div className="flex flex-col gap-2">
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Token Colour
            </label>
            <div className="flex gap-2 flex-wrap">
              {TOKEN_COLOURS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColour(c.value)}
                  title={c.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: c.value,
                    border:
                      selectedColour === c.value
                        ? '3px solid #c9a227'
                        : '3px solid rgba(45,27,0,0.3)',
                    boxShadow:
                      selectedColour === c.value
                        ? '0 0 8px rgba(201,162,39,0.6)'
                        : '0 2px 4px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    transform: selectedColour === c.value ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="font-crimson text-deep-red text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-tavern text-base py-4 rounded-sm mt-2 w-full"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? '⏳ Finding your seat...' : '🍺 Enter the Tavern'}
          </button>
        </form>

        {/* Back link */}
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

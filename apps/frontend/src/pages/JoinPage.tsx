import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(201,162,39,0.4)',
  color: '#f4e4bc',
  padding: '0.6rem 0.85rem',
  outline: 'none',
  fontFamily: 'Crimson Text, serif',
  fontSize: '1.1rem',
  borderRadius: 4,
  width: '100%',
  boxSizing: 'border-box',
};

function goldFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#c9a227';
  e.target.style.boxShadow = '0 0 8px rgba(201,162,39,0.3)';
}

function goldBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = 'rgba(201,162,39,0.4)';
  e.target.style.boxShadow = 'none';
}

export default function JoinPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      setError(t('join.error_code_length'));
      return;
    }
    if (!playerName.trim()) {
      setError(t('join.error_name_required'));
      return;
    }

    setIsLoading(true);
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
      className="relative min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url(/tavern-table-logo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-6 py-4">
        <img src="/tavern-table-icon.png" alt="TavernTable" style={{ height: 48 }} />
        <span
          className="font-cinzel font-bold text-xl"
          style={{ color: '#c9a227', letterSpacing: '0.05em' }}
        >
          TavernTable
        </span>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div
          style={{
            background: 'rgba(10,6,0,0.85)',
            border: '1px solid rgba(201,162,39,0.4)',
            borderRadius: 8,
            boxShadow: '0 0 40px rgba(201,162,39,0.12), 0 8px 32px rgba(0,0,0,0.6)',
            width: '100%',
            maxWidth: 480,
            padding: '2rem',
          }}
        >
          {/* Card title */}
          <div className="text-center mb-6">
            <h2
              className="font-cinzel font-bold text-2xl mb-1"
              style={{ color: '#c9a227' }}
            >
              🗺 Join a Game
            </h2>
            <p className="font-crimson text-sm italic" style={{ color: 'rgba(244,228,188,0.6)' }}>
              {t('join.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Session Code */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-cinzel text-xs uppercase tracking-wider"
                style={{ color: 'rgba(244,228,188,0.6)' }}
              >
                {t('join.code_label')}
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => handleSessionCodeChange(e.target.value)}
                placeholder="Enter session code..."
                maxLength={6}
                className="text-center text-3xl tracking-[0.5em] font-cinzel"
                style={{
                  ...inputStyle,
                  fontSize: '1.8rem',
                  padding: '0.75rem',
                  letterSpacing: '0.5em',
                }}
                onFocus={goldFocus}
                onBlur={goldBlur}
              />
            </div>

            {/* Player Name */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-cinzel text-xs uppercase tracking-wider"
                style={{ color: 'rgba(244,228,188,0.6)' }}
              >
                {t('join.name_label')}
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your adventurer name..."
                maxLength={30}
                style={inputStyle}
                onFocus={goldFocus}
                onBlur={goldBlur}
              />
            </div>

            {/* Character Mode */}
            <div className="flex flex-col gap-2">
              <label
                className="font-cinzel text-xs uppercase tracking-wider"
                style={{ color: 'rgba(244,228,188,0.6)' }}
              >
                {t('join.character_label')}
              </label>
              <div className="flex gap-2">
                {(['new', 'existing'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCharacterMode(mode)}
                    className="flex-1 py-2 font-cinzel text-xs uppercase tracking-wider transition-all rounded"
                    style={{
                      background:
                        characterMode === mode ? 'rgba(201,162,39,0.18)' : 'rgba(255,255,255,0.04)',
                      border:
                        characterMode === mode
                          ? '1px solid rgba(201,162,39,0.8)'
                          : '1px solid rgba(201,162,39,0.2)',
                      color: characterMode === mode ? '#c9a227' : 'rgba(244,228,188,0.6)',
                      cursor: 'pointer',
                      fontWeight: characterMode === mode ? 700 : 400,
                    }}
                  >
                    {mode === 'new' ? t('join.new_character') : `📋 ${t('join.existing_character')}`}
                  </button>
                ))}
              </div>

              {characterMode === 'new' && (
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder={t('join.character_name_placeholder')}
                  maxLength={40}
                  style={inputStyle}
                  onFocus={goldFocus}
                  onBlur={goldBlur}
                />
              )}
            </div>

            {/* Token Colour Picker */}
            <div className="flex flex-col gap-2">
              <label
                className="font-cinzel text-xs uppercase tracking-wider"
                style={{ color: 'rgba(244,228,188,0.6)' }}
              >
                {t('join.token_label')}
              </label>
              <div className="flex gap-3 flex-wrap">
                {TOKEN_COLOURS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColour(c.value)}
                    title={c.name}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: c.value,
                      border:
                        selectedColour === c.value
                          ? '3px solid #c9a227'
                          : '3px solid rgba(201,162,39,0.2)',
                      boxShadow:
                        selectedColour === c.value
                          ? '0 0 10px rgba(201,162,39,0.7)'
                          : '0 2px 6px rgba(0,0,0,0.4)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: selectedColour === c.value ? 'scale(1.18)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                className="font-crimson text-sm text-center"
                style={{ color: '#e05252' }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-tavern text-base py-4 w-full mt-1"
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? '⏳ Joining...' : 'Enter the Tavern →'}
            </button>
          </form>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-tavern-ghost w-full text-center font-cinzel text-xs uppercase tracking-wider mt-3 py-2"
          >
            ← Back
          </button>
        </div>
      </main>
    </div>
  );
}

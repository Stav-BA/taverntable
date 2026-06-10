import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { useDMStore } from '@/stores/dmStore';
import { getSocket, connectSocket } from '@/lib/socket';

type Tone = 'heroic' | 'gritty' | 'horror' | 'mystery' | 'comedic';

const TONES: { value: Tone; label: string; icon: string }[] = [
  { value: 'heroic', label: 'Heroic', icon: '⚔️' },
  { value: 'gritty', label: 'Gritty', icon: '🩸' },
  { value: 'horror', label: 'Horror', icon: '💀' },
  { value: 'mystery', label: 'Mystery', icon: '🔍' },
  { value: 'comedic', label: 'Comedic', icon: '🎭' },
];

function generateSessionCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

// ── Shared layout wrapper ─────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
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
        {children}
      </main>
    </div>
  );
}

// ── Input helper styles ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(201,162,39,0.4)',
  color: '#f4e4bc',
  padding: '0.5rem 0.75rem',
  outline: 'none',
  fontFamily: 'Crimson Text, serif',
  fontSize: '1.1rem',
  borderRadius: 4,
  width: '100%',
  boxSizing: 'border-box',
};

function goldFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = '#c9a227';
  e.target.style.boxShadow = '0 0 8px rgba(201,162,39,0.3)';
}

function goldBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'rgba(201,162,39,0.4)';
  e.target.style.boxShadow = 'none';
}

// ── Card style ────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'rgba(10,6,0,0.85)',
  border: '1px solid rgba(201,162,39,0.4)',
  borderRadius: 8,
  boxShadow: '0 0 40px rgba(201,162,39,0.12), 0 8px 32px rgba(0,0,0,0.6)',
  width: '100%',
  maxWidth: 520,
  padding: '2rem',
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function DMLobbyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const availableMaps = useGameStore((s) => s.availableMaps);
  const setCurrentMap = useGameStore((s) => s.setCurrentMap);
  const setSession = useSessionStore((s) => s.setSession);
  const setPlayer = useSessionStore((s) => s.setPlayer);
  const setIsDM = useSessionStore((s) => s.setIsDM);
  const setCampaignName = useDMStore((s) => s.setCampaignName);
  const setCampaignTone = useDMStore((s) => s.setCampaignTone);
  const setCampaignLore = useDMStore((s) => s.setCampaignLore);

  const [sessionCode] = useState(generateSessionCode);
  const [dmName, setDmName] = useState('Dungeon Master');
  const [selectedMapId, setSelectedMapId] = useState(availableMaps[0]?.id ?? '');
  const [fogEnabled, setFogEnabled] = useState(true);
  const [step, setStep] = useState<'setup' | 'lore'>('setup');

  const [campaignNameValue, setCampaignNameValue] = useState('');
  const [selectedTone, setSelectedTone] = useState<Tone>('heroic');
  const [loreText, setLoreText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedMap = availableMaps.find((m) => m.id === selectedMapId);
  const loreTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step !== 'lore') return;
    const socket = getSocket();
    const onChunk = ({ chunk }: { chunk: string }) => setLoreText((prev) => prev + chunk);
    const onDone = ({ text }: { text: string }) => {
      setLoreText(text);
      setIsGenerating(false);
    };
    socket.on('lore:chunk', onChunk);
    socket.on('lore:done', onDone);
    return () => {
      socket.off('lore:chunk', onChunk);
      socket.off('lore:done', onDone);
    };
  }, [step]);

  useEffect(() => {
    if (loreTextareaRef.current) {
      loreTextareaRef.current.scrollTop = loreTextareaRef.current.scrollHeight;
    }
  }, [loreText]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateLore = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setLoreText('');
    const tempDmId = generateId();
    const socket = connectSocket(`pre-session-${tempDmId}`, tempDmId, true);
    const emit = () =>
      socket.emit('lore:generate', {
        tone: selectedTone,
        seed: campaignNameValue.trim() || undefined,
      });
    if (!socket.connected) socket.once('connect', emit);
    else emit();
  };

  const handleStartSession = async () => {
    if (!dmName.trim()) return;
    setIsCreating(true);
    setCampaignName(campaignNameValue.trim());
    setCampaignTone(selectedTone);
    setCampaignLore(loreText.trim());
    await new Promise((r) => setTimeout(r, 600));
    const sessionId = `session-${sessionCode}`;
    const dmId = generateId();
    setIsDM(true);
    setSession(sessionId, sessionCode);
    setPlayer({ id: dmId, name: dmName.trim(), colour: '#C9A227' });
    if (selectedMap) setCurrentMap(selectedMap);
    setIsCreating(false);
    navigate(`/game/${sessionId}`);
  };

  // ── Step 1: Setup ───────────────────────────────────────────────────────────

  if (step === 'setup') {
    return (
      <PageShell>
        <div style={cardStyle}>
          {/* Panel header */}
          <div className="text-center mb-6">
            <h2
              className="font-cinzel font-bold text-2xl mb-1"
              style={{ color: '#c9a227' }}
            >
              ⚔ Dungeon Master
            </h2>
            <p className="font-crimson text-sm" style={{ color: 'rgba(244,228,188,0.6)' }}>
              {t('dm_lobby.subtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Session Code */}
            <div
              className="text-center rounded-md py-5 px-4"
              style={{
                background: 'rgba(201,162,39,0.06)',
                border: '1px solid rgba(201,162,39,0.3)',
              }}
            >
              <p
                className="font-cinzel text-xs uppercase tracking-widest mb-2"
                style={{ color: 'rgba(244,228,188,0.5)' }}
              >
                {t('dm_lobby.session_code')}
              </p>
              <p
                className="font-cinzel font-black text-5xl tracking-[0.5em]"
                style={{ color: '#c9a227', textShadow: '0 0 20px rgba(201,162,39,0.4)' }}
              >
                {sessionCode}
              </p>
              <p
                className="font-crimson text-xs mt-2"
                style={{ color: 'rgba(244,228,188,0.45)' }}
              >
                Share this code with your players
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-3 font-cinzel text-xs uppercase tracking-wider transition-opacity hover:opacity-100"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: copied ? '#c9a227' : 'rgba(244,228,188,0.5)',
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy code'}
              </button>
            </div>

            {/* DM Name */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-cinzel text-xs uppercase tracking-wider"
                style={{ color: 'rgba(244,228,188,0.6)' }}
              >
                {t('dm_lobby.your_dm_name')}
              </label>
              <input
                type="text"
                value={dmName}
                onChange={(e) => setDmName(e.target.value)}
                maxLength={40}
                style={inputStyle}
                onFocus={goldFocus}
                onBlur={goldBlur}
              />
            </div>

            {/* Map Picker */}
            <div className="flex flex-col gap-2">
              <label
                className="font-cinzel text-xs uppercase tracking-wider"
                style={{ color: 'rgba(244,228,188,0.6)' }}
              >
                {t('dm_lobby.map')}
              </label>
              <div className="flex flex-col gap-2">
                {availableMaps.map((map) => (
                  <button
                    key={map.id}
                    type="button"
                    onClick={() => setSelectedMapId(map.id)}
                    className="flex items-center gap-3 p-3 transition-all text-left rounded"
                    style={{
                      background:
                        selectedMapId === map.id
                          ? 'rgba(201,162,39,0.12)'
                          : 'rgba(255,255,255,0.03)',
                      border:
                        selectedMapId === map.id
                          ? '1px solid rgba(201,162,39,0.6)'
                          : '1px solid rgba(201,162,39,0.2)',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: 'rgba(201,162,39,0.1)' }}
                    >
                      {map.id.includes('tavern') ? '🍺' : map.id.includes('dungeon') ? '💀' : '🌲'}
                    </div>
                    <div className="flex-1">
                      <p className="font-cinzel font-semibold text-sm" style={{ color: '#f4e4bc' }}>
                        {map.name}
                      </p>
                      <p className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.45)' }}>
                        {map.gridCols} × {map.gridRows} squares
                      </p>
                    </div>
                    {selectedMapId === map.id && (
                      <span className="font-cinzel text-sm" style={{ color: '#c9a227' }}>
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Fog of War toggle */}
            <div
              className="flex items-center justify-between p-3 rounded"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(201,162,39,0.2)',
              }}
            >
              <div>
                <p className="font-cinzel text-sm font-semibold" style={{ color: '#f4e4bc' }}>
                  {t('dm_lobby.fog_of_war')}
                </p>
                <p className="font-crimson text-xs" style={{ color: 'rgba(244,228,188,0.45)' }}>
                  {t('dm_lobby.fog_description')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFogEnabled(!fogEnabled)}
                className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                style={{
                  background: fogEnabled ? '#c9a227' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(201,162,39,0.4)',
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    background: fogEnabled ? '#1a0f00' : 'rgba(244,228,188,0.5)',
                    left: fogEnabled ? '1.5rem' : '0.1rem',
                  }}
                />
              </button>
            </div>

            {/* Next button */}
            <button
              type="button"
              disabled={!dmName.trim()}
              onClick={() => setStep('lore')}
              className="btn-tavern text-base py-4 w-full mt-2"
              style={{ opacity: !dmName.trim() ? 0.6 : 1 }}
            >
              Next: Set the Stage →
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-tavern-ghost w-full text-center font-cinzel text-xs uppercase tracking-wider mt-3 py-2"
          >
            ← {t('dm_lobby.back')}
          </button>
        </div>
      </PageShell>
    );
  }

  // ── Step 2: Lore ────────────────────────────────────────────────────────────

  return (
    <PageShell>
      <div style={{ ...cardStyle, maxWidth: 560 }}>
        <div className="text-center mb-6">
          <h2
            className="font-cinzel font-bold text-2xl mb-1"
            style={{ color: '#c9a227' }}
          >
            Set the Stage
          </h2>
          <p className="font-crimson text-sm italic" style={{ color: 'rgba(244,228,188,0.6)' }}>
            Shape the world your players will remember
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Campaign Name */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-cinzel text-xs uppercase tracking-wider"
              style={{ color: 'rgba(244,228,188,0.6)' }}
            >
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignNameValue}
              onChange={(e) => setCampaignNameValue(e.target.value)}
              maxLength={80}
              placeholder="The Shadow of Moonsreach"
              style={inputStyle}
              onFocus={goldFocus}
              onBlur={goldBlur}
            />
          </div>

          {/* Campaign Tone */}
          <div className="flex flex-col gap-2">
            <label
              className="font-cinzel text-xs uppercase tracking-wider"
              style={{ color: 'rgba(244,228,188,0.6)' }}
            >
              Campaign Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setSelectedTone(tone.value)}
                  className="flex items-center gap-1.5 px-3 py-2 font-cinzel text-xs uppercase tracking-wide transition-all rounded"
                  style={{
                    background:
                      selectedTone === tone.value
                        ? 'rgba(201,162,39,0.18)'
                        : 'rgba(255,255,255,0.04)',
                    border:
                      selectedTone === tone.value
                        ? '1px solid rgba(201,162,39,0.8)'
                        : '1px solid rgba(201,162,39,0.2)',
                    color: selectedTone === tone.value ? '#c9a227' : 'rgba(244,228,188,0.6)',
                    cursor: 'pointer',
                    fontWeight: selectedTone === tone.value ? 700 : 400,
                  }}
                >
                  <span>{tone.icon}</span>
                  <span>{tone.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lore Textarea */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-cinzel text-xs uppercase tracking-wider"
              style={{ color: 'rgba(244,228,188,0.6)' }}
            >
              Your Story
            </label>
            <textarea
              ref={loreTextareaRef}
              rows={8}
              value={loreText}
              onChange={(e) => setLoreText(e.target.value)}
              placeholder="Describe your world, the main conflict, the stakes... What dark secret lies at the heart of this adventure?"
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: '1.6',
              }}
              onFocus={goldFocus}
              onBlur={goldBlur}
            />
            {isGenerating && (
              <p className="font-crimson italic text-sm" style={{ color: '#c9a227' }}>
                The fates are weaving your story...
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateLore}
              className="flex-1 font-cinzel text-sm py-3 px-4 uppercase tracking-wider transition-all rounded"
              style={{
                background: isGenerating ? 'rgba(255,255,255,0.04)' : 'rgba(201,162,39,0.1)',
                border: '1px solid rgba(201,162,39,0.5)',
                color: '#c9a227',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.6 : 1,
              }}
            >
              {isGenerating ? '...' : '✨ Generate with AI'}
            </button>
            <button
              type="button"
              disabled={isCreating}
              onClick={handleStartSession}
              className="flex-1 btn-tavern text-sm py-3 px-4"
              style={{ opacity: isCreating ? 0.7 : 1 }}
            >
              {isCreating ? '⏳ Starting...' : '⚔ Enter the Tavern →'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStep('setup')}
          className="btn-tavern-ghost w-full text-center font-cinzel text-xs uppercase tracking-wider mt-4 py-2"
        >
          ← Back
        </button>
      </div>
    </PageShell>
  );
}

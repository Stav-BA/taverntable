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

  // Step 1 state
  const [sessionCode] = useState(generateSessionCode);
  const [dmName, setDmName] = useState('Dungeon Master');
  const [selectedMapId, setSelectedMapId] = useState(availableMaps[0]?.id ?? '');
  const [fogEnabled, setFogEnabled] = useState(true);

  // Step tracking
  const [step, setStep] = useState<'setup' | 'lore'>('setup');

  // Step 2 — lore state
  const [campaignNameValue, setCampaignNameValue] = useState('');
  const [selectedTone, setSelectedTone] = useState<Tone>('heroic');
  const [loreText, setLoreText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const selectedMap = availableMaps.find((m) => m.id === selectedMapId);
  const loreTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Listen for lore streaming events
  useEffect(() => {
    if (step !== 'lore') return;

    const socket = getSocket();

    const onChunk = ({ chunk }: { chunk: string }) => {
      setLoreText((prev) => prev + chunk);
    };

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

  // Auto-scroll textarea as lore streams in
  useEffect(() => {
    if (loreTextareaRef.current) {
      loreTextareaRef.current.scrollTop = loreTextareaRef.current.scrollHeight;
    }
  }, [loreText]);

  const handleGenerateLore = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setLoreText('');

    // Connect socket temporarily just to emit lore:generate (no session needed)
    const tempDmId = generateId();
    const socket = connectSocket(`pre-session-${tempDmId}`, tempDmId, true);

    if (!socket.connected) {
      socket.once('connect', () => {
        socket.emit('lore:generate', {
          tone: selectedTone,
          seed: campaignNameValue.trim() || undefined,
        });
      });
    } else {
      socket.emit('lore:generate', {
        tone: selectedTone,
        seed: campaignNameValue.trim() || undefined,
      });
    }
  };

  const handleStartSession = async () => {
    if (!dmName.trim()) return;
    setIsCreating(true);

    // Persist lore to store
    setCampaignName(campaignNameValue.trim());
    setCampaignTone(selectedTone);
    setCampaignLore(loreText.trim());

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

  // ──────────────────────────────────────────────────────────────────────────
  // Shared wrapper
  // ──────────────────────────────────────────────────────────────────────────

  const cornerOrnaments = ['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
    <div key={pos} className={`absolute ${pos} text-gold opacity-40 font-cinzel`}>
      ✦
    </div>
  ));

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1 — setup
  // ──────────────────────────────────────────────────────────────────────────

  if (step === 'setup') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #3d2408 0%, #2d1b00 40%, #1a0f00 100%)',
        }}
      >
        <div className="parchment-panel rounded-sm max-w-lg w-full p-8 relative animate-float-in">
          {cornerOrnaments}

          <div className="text-center mb-6">
            <h1 className="font-cinzel font-bold text-3xl text-dark-brown mb-1">
              {t('dm_lobby.title')}
            </h1>
            <div className="ornament-divider">
              <span className="font-crimson text-medium-brown italic text-sm">
                {t('dm_lobby.subtitle')}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Session Code Display */}
            <div className="parchment-panel rounded-sm p-4 text-center border-ornate">
              <p className="font-cinzel text-xs text-medium-brown uppercase tracking-widest mb-1">
                {t('dm_lobby.session_code')}
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
                📋 {t('dm_lobby.copy_link')}
              </button>
            </div>

            {/* DM Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
                {t('dm_lobby.your_dm_name')}
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
                {t('dm_lobby.map')}
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
            <div
              className="flex items-center justify-between p-3 rounded-sm"
              style={{ background: 'rgba(45,27,0,0.08)', border: '1px solid #5c3d1e' }}
            >
              <div>
                <p className="font-cinzel text-sm font-semibold text-dark-brown">
                  {t('dm_lobby.fog_of_war')}
                </p>
                <p className="font-crimson text-xs text-medium-brown">
                  {t('dm_lobby.fog_description')}
                </p>
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

            {/* Next button */}
            <button
              type="button"
              disabled={!dmName.trim()}
              onClick={() => setStep('lore')}
              className="btn-tavern text-base py-4 rounded-sm w-full mt-2"
              style={{ opacity: !dmName.trim() ? 0.7 : 1 }}
            >
              Next: Set the Stage →
            </button>
          </div>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-center font-cinzel text-xs uppercase tracking-wider mt-4 opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: '#2d1b00', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← {t('dm_lobby.back')}
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2 — lore
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #3d2408 0%, #2d1b00 40%, #1a0f00 100%)',
      }}
    >
      <div className="parchment-panel rounded-sm max-w-lg w-full p-8 relative animate-float-in">
        {cornerOrnaments}

        <div className="text-center mb-6">
          <h1 className="font-cinzel font-bold text-2xl text-dark-brown mb-1">
            Set the Stage
          </h1>
          <div className="ornament-divider">
            <span className="font-crimson text-medium-brown italic text-sm">
              Shape the world your players will remember
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Campaign Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignNameValue}
              onChange={(e) => setCampaignNameValue(e.target.value)}
              maxLength={80}
              placeholder="The Shadow of Moonsreach"
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

          {/* Campaign Tone */}
          <div className="flex flex-col gap-2">
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Campaign Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setSelectedTone(tone.value)}
                  className="flex items-center gap-1.5 px-3 py-2 font-cinzel text-xs uppercase tracking-wide transition-all"
                  style={{
                    background:
                      selectedTone === tone.value
                        ? 'rgba(201,162,39,0.2)'
                        : 'rgba(45,27,0,0.06)',
                    border:
                      selectedTone === tone.value
                        ? '2px solid #c9a227'
                        : '2px solid #5c3d1e',
                    color: selectedTone === tone.value ? '#c9a227' : '#2d1b00',
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
            <label className="font-cinzel text-sm font-semibold text-dark-brown uppercase tracking-wider">
              Your Story
            </label>
            <textarea
              ref={loreTextareaRef}
              rows={8}
              value={loreText}
              onChange={(e) => setLoreText(e.target.value)}
              placeholder="Describe your world, the main conflict, the stakes... What dark secret lies at the heart of this adventure?"
              style={{
                background: 'rgba(45,27,0,0.08)',
                border: '2px solid #5c3d1e',
                color: '#2d1b00',
                padding: '0.75rem',
                outline: 'none',
                fontFamily: 'Crimson Text, serif',
                fontSize: '1rem',
                resize: 'vertical',
                lineHeight: '1.6',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#c9a227')}
              onBlur={(e) => (e.target.style.borderColor = '#5c3d1e')}
            />
            {isGenerating && (
              <p
                className="font-crimson italic text-sm"
                style={{ color: '#c9a227' }}
              >
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
              className="flex-1 font-cinzel text-sm py-3 px-4 uppercase tracking-wider transition-all"
              style={{
                background: isGenerating ? 'rgba(45,27,0,0.1)' : 'rgba(201,162,39,0.12)',
                border: '2px solid #c9a227',
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
              {isCreating ? '⏳ Starting...' : '⚔️ Begin the Adventure'}
            </button>
          </div>
        </div>

        {/* Back to step 1 */}
        <button
          type="button"
          onClick={() => setStep('setup')}
          className="w-full text-center font-cinzel text-xs uppercase tracking-wider mt-4 opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: '#2d1b00', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

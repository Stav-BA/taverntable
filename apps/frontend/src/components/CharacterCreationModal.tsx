import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { socketEmit } from '@/lib/socket';

const TOKEN_COLOURS = [
  '#DC143C', '#4169E1', '#50C878', '#FFD700',
  '#8A2BE2', '#FF8C00', '#008B8B', '#F5F5F5',
];

const CLASS_OPTIONS = [
  'Barbarian', 'Bard', 'Cleric', 'Druid',
  'Fighter', 'Monk', 'Paladin', 'Ranger',
  'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
];

const DEFAULT_HP: Record<string, number> = {
  Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8,
  Fighter: 10, Monk: 8, Paladin: 10, Ranger: 10,
  Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6,
};

export default function CharacterCreationModal({ onClose }: { onClose?: () => void }) {
  const player = useSessionStore((s) => s.player);
  const addToken = useGameStore((s) => s.addToken);

  const [name, setName] = useState(player?.characterName || player?.name || '');
  const [charClass, setCharClass] = useState('Fighter');
  const [level, setLevel] = useState(1);
  const [maxHp, setMaxHp] = useState(10);
  const [ac, setAc] = useState(10);
  const [colour, setColour] = useState(player?.colour || TOKEN_COLOURS[1]);

  // Auto-set HP when class changes
  const handleClassChange = (cls: string) => {
    setCharClass(cls);
    setMaxHp((DEFAULT_HP[cls] ?? 8) + Math.floor((level - 1) * ((DEFAULT_HP[cls] ?? 8) / 2)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player || !name.trim()) return;

    const token = {
      id: `player-${player.id}`,
      name: name.trim(),
      x: 2,
      y: 2,
      colour,
      hp: maxHp,
      maxHp,
      ac,
      isPlayer: true,
      isNpc: false,
      playerId: player.id,
      conditions: [],
      isVisible: true,
    };

    // Add locally
    addToken(token);
    // Sync to all players via socket
    socketEmit.tokenAdd(token as unknown as Record<string, unknown>);

    onClose?.();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #2d1b00 0%, #1a0f00 100%)',
          border: '2px solid rgba(201,162,39,0.5)',
          boxShadow: '0 0 40px rgba(201,162,39,0.2), inset 0 0 60px rgba(0,0,0,0.5)',
          borderRadius: 4,
          padding: '2rem',
          width: '100%',
          maxWidth: 440,
          position: 'relative',
        }}
      >
        {/* Corner ornaments */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
          <span
            key={pos}
            className={`absolute ${pos} font-cinzel text-gold opacity-40`}
            style={{ fontSize: 14 }}
          >
            ✦
          </span>
        ))}

        <h2
          className="font-cinzel font-bold text-center mb-1"
          style={{ color: '#c9a227', fontSize: '1.4rem', letterSpacing: '0.05em' }}
        >
          Create Your Character
        </h2>
        <p
          className="text-center font-crimson italic mb-5"
          style={{ color: 'rgba(244,228,188,0.5)', fontSize: '0.95rem' }}
        >
          Your hero enters the tavern...
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Character Name */}
          <div>
            <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: '#c9a227' }}>
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your hero's name..."
              maxLength={40}
              required
              style={{
                width: '100%',
                background: 'rgba(45,27,0,0.6)',
                border: '1px solid rgba(201,162,39,0.3)',
                color: '#f4e4bc',
                padding: '0.5rem 0.75rem',
                fontFamily: 'Crimson Text, serif',
                fontSize: '1.1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#c9a227'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(201,162,39,0.3)'; }}
            />
          </div>

          {/* Class */}
          <div>
            <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: '#c9a227' }}>
              Class
            </label>
            <select
              value={charClass}
              onChange={(e) => handleClassChange(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(45,27,0,0.6)',
                border: '1px solid rgba(201,162,39,0.3)',
                color: '#f4e4bc',
                padding: '0.5rem 0.75rem',
                fontFamily: 'Cinzel, serif',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls} style={{ background: '#1a0f00' }}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Level + HP + AC row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Level', value: level, set: setLevel, min: 1, max: 20 },
              { label: 'Max HP', value: maxHp, set: setMaxHp, min: 1, max: 999 },
              { label: 'AC', value: ac, set: setAc, min: 1, max: 30 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label}>
                <label className="font-cinzel text-xs uppercase tracking-wider block mb-1" style={{ color: '#c9a227' }}>
                  {label}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => set(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
                  min={min}
                  max={max}
                  style={{
                    width: '100%',
                    background: 'rgba(45,27,0,0.6)',
                    border: '1px solid rgba(201,162,39,0.3)',
                    color: '#f4e4bc',
                    padding: '0.5rem',
                    fontFamily: 'Cinzel, serif',
                    fontSize: '1rem',
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#c9a227'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(201,162,39,0.3)'; }}
                />
              </div>
            ))}
          </div>

          {/* Token colour */}
          <div>
            <label className="font-cinzel text-xs uppercase tracking-wider block mb-2" style={{ color: '#c9a227' }}>
              Token Colour
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {TOKEN_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColour(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: c,
                    border: colour === c ? '3px solid #c9a227' : '3px solid rgba(201,162,39,0.2)',
                    boxShadow: colour === c ? `0 0 10px ${c}88` : 'none',
                    cursor: 'pointer',
                    transform: colour === c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview token */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: colour,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                color: '#fff',
                fontSize: '0.9rem',
                boxShadow: `0 0 16px ${colour}66`,
                flexShrink: 0,
              }}
            >
              {name.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div>
              <p className="font-cinzel font-bold" style={{ color: '#f4e4bc', fontSize: '0.9rem' }}>
                {name || 'Hero Name'}
              </p>
              <p className="font-crimson" style={{ color: 'rgba(244,228,188,0.5)', fontSize: '0.85rem' }}>
                Lvl {level} {charClass} · {maxHp} HP · AC {ac}
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-tavern"
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              fontSize: '1rem',
              width: '100%',
            }}
          >
            ⚔️ Enter the Adventure
          </button>
        </form>
      </div>
    </div>
  );
}

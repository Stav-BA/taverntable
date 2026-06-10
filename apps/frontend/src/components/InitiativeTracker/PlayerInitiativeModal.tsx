/**
 * PlayerInitiativeModal — shown to each player when the DM starts initiative.
 * The player rolls their own d20, sees their total (d20 + DEX mod), and submits.
 */
import { useState } from 'react';
import { useCharacterStore } from '@/stores/characterStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';
import { abilityMod } from '@/lib/classes5e';

export default function PlayerInitiativeModal({ onClose }: { onClose: () => void }) {
  const player = useSessionStore(s => s.player);
  const sheets = useCharacterStore(s => s.sheets);
  const tokens = useGameStore(s => s.tokens);
  const [roll, setRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sheet = player ? sheets[player.id] : null;
  const token = tokens.find(t => t.playerId === player?.id);
  // CharacterSheet stores dex as a flat field, not nested
  const dexMod = sheet ? abilityMod(sheet.dex) : 0;
  const total = roll !== null ? roll + dexMod : null;

  const handleRoll = async () => {
    if (rolling || submitted) return;
    setRolling(true);
    await new Promise(r => setTimeout(r, 600));
    const result = Math.floor(Math.random() * 20) + 1;
    setRoll(result);
    setRolling(false);
  };

  const handleSubmit = () => {
    if (roll === null || !player || !token) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('initiative:submit', {
      id: token.id,
      name: token.name,
      roll,
      dexMod,
      isMonster: false,
      hp: token.hp,
      maxHp: token.maxHp,
      ac: token.ac,
      colour: token.colour,
      isPlayer: true,
      speed: 30,
    });
    setSubmitted(true);
  };

  const S = {
    gold: '#c9a227',
    goldDim: 'rgba(201,162,39,0.4)',
    cream: '#f4e4bc',
    creamDim: 'rgba(244,228,188,0.6)',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(10,5,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(160deg,#2d1b00,#1a0f00)',
        border: '2px solid rgba(201,162,39,0.5)',
        borderRadius: 6, padding: '2rem', width: 320, textAlign: 'center',
        boxShadow: '0 0 40px rgba(201,162,39,0.15)',
      }}>
        {/* Header */}
        <h2 style={{ fontFamily: 'Cinzel,serif', color: S.gold, fontSize: '1.1rem', marginBottom: 4 }}>
          Roll Initiative!
        </h2>
        <p style={{ fontFamily: 'Crimson Text,serif', color: S.creamDim, fontSize: '0.9rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
          Combat begins — show your speed!
        </p>

        {!submitted ? (
          <>
            {/* Big animated d20 */}
            <div
              onClick={handleRoll}
              style={{
                width: 100, height: 100, margin: '0 auto 1rem',
                cursor: rolling ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                animation: rolling
                  ? 'diceWiggle 0.1s linear infinite'
                  : roll !== null ? 'none' : 'dicePulse 2s ease-in-out infinite',
                filter: rolling ? 'brightness(1.5)' : 'none',
              }}
            >
              <style>{`
                @keyframes diceWiggle { 0%{transform:rotate(-8deg) scale(1.1)} 50%{transform:rotate(8deg) scale(0.95)} 100%{transform:rotate(-8deg) scale(1.1)} }
                @keyframes dicePulse  { 0%,100%{filter:drop-shadow(0 0 8px rgba(201,162,39,0.4))} 50%{filter:drop-shadow(0 0 16px rgba(201,162,39,0.8))} }
              `}</style>
              <svg viewBox="0 0 100 100" width="100" height="100">
                <defs>
                  <radialGradient id="d20grd" cx="45%" cy="40%" r="55%">
                    <stop offset="0%" stopColor="#2a1a6e"/>
                    <stop offset="100%" stopColor="#0a0520"/>
                  </radialGradient>
                </defs>
                {(() => {
                  const pts = Array.from({ length: 6 }, (_, i) => {
                    const a = (i * 60 - 30) * Math.PI / 180;
                    return `${50 + 44 * Math.cos(a)},${50 + 44 * Math.sin(a)}`;
                  }).join(' ');
                  return <polygon points={pts} fill="url(#d20grd)" stroke="#c9a227" strokeWidth="2"/>;
                })()}
                {Array.from({ length: 6 }, (_, i) => {
                  const a = (i * 60 - 30) * Math.PI / 180;
                  return (
                    <line
                      key={i} x1="50" y1="50"
                      x2={50 + 44 * Math.cos(a)} y2={50 + 44 * Math.sin(a)}
                      stroke="rgba(201,162,39,0.2)" strokeWidth="0.8"
                    />
                  );
                })}
                <text
                  x="50" y="57" textAnchor="middle"
                  fontSize={rolling ? '12' : roll !== null ? '28' : '18'}
                  fontWeight="bold" fontFamily="Cinzel,serif" fill="#c9a227"
                >
                  {rolling ? '...' : roll !== null ? roll : 'd20'}
                </text>
              </svg>
            </div>

            {!rolling && roll === null && (
              <p style={{ fontFamily: 'Cinzel,serif', fontSize: '0.75rem', color: S.goldDim, marginBottom: '1rem' }}>
                Click the die to roll
              </p>
            )}

            {roll !== null && !rolling && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: '0.7rem', color: S.goldDim, marginBottom: 6 }}>
                  d20 ({roll}) + DEX ({dexMod >= 0 ? '+' : ''}{dexMod}) =
                </div>
                <div style={{
                  fontFamily: 'Cinzel,serif', fontSize: '2.2rem', fontWeight: 700, color: S.gold,
                  textShadow: '0 0 16px rgba(201,162,39,0.6)',
                }}>
                  {total}
                </div>
              </div>
            )}

            <p style={{ fontFamily: 'Crimson Text,serif', fontSize: '0.78rem', color: S.creamDim, marginBottom: '1rem' }}>
              DEX modifier: {dexMod >= 0 ? '+' : ''}{dexMod}
            </p>

            <button
              onClick={handleSubmit}
              disabled={roll === null}
              style={{
                width: '100%', padding: '0.65rem',
                fontFamily: 'Cinzel,serif', fontSize: '0.85rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: roll !== null
                  ? 'linear-gradient(135deg,rgba(201,162,39,0.35),rgba(201,162,39,0.2))'
                  : 'rgba(45,27,0,0.4)',
                border: `2px solid ${roll !== null ? S.gold : S.goldDim}`,
                color: roll !== null ? S.gold : S.goldDim,
                borderRadius: 4,
                cursor: roll !== null ? 'pointer' : 'not-allowed',
              }}
            >
              Submit Roll
            </button>
          </>
        ) : (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>&#10003;</div>
            <p style={{ fontFamily: 'Cinzel,serif', color: S.gold, fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>
              Initiative: {total}
            </p>
            <p style={{ fontFamily: 'Crimson Text,serif', color: S.creamDim, fontSize: '0.85rem', fontStyle: 'italic' }}>
              Waiting for the DM to begin combat...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

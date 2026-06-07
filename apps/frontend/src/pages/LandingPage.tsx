import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const DICE_SYMBOLS = ['⚄', 'D20', 'D12', 'D8', 'D6', 'D4', '⚃', 'D10', 'D100'];

interface FloatingDie {
  symbol: string;
  left: number;
  duration: number;
  delay: number;
  size: number;
}

function generateDice(count: number): FloatingDie[] {
  return Array.from({ length: count }, (_, i) => ({
    symbol: DICE_SYMBOLS[i % DICE_SYMBOLS.length],
    left: Math.random() * 100,
    duration: 12 + Math.random() * 20,
    delay: Math.random() * 15,
    size: 1.5 + Math.random() * 2,
  }));
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const diceRef = useRef<FloatingDie[]>(generateDice(20));

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, #3d2408 0%, #2d1b00 40%, #1a0f00 100%)',
      }}
    >
      {/* Floating dice background */}
      <div className="dice-bg-container">
        {diceRef.current.map((die, i) => (
          <span
            key={i}
            className="floating-die"
            style={{
              left: `${die.left}%`,
              animationDuration: `${die.duration}s`,
              animationDelay: `${die.delay}s`,
              fontSize: `${die.size}rem`,
            }}
          >
            {die.symbol}
          </span>
        ))}
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-3xl">
        {/* Logo / Crest */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-24 h-24 flex items-center justify-center rounded-full border-4 border-gold"
            style={{
              background:
                'radial-gradient(circle, #5c3d1e 0%, #2d1b00 100%)',
              boxShadow:
                '0 0 30px rgba(201,162,39,0.4), 0 0 60px rgba(201,162,39,0.15), inset 0 2px 4px rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-5xl" role="img" aria-label="tavern">
              🍺
            </span>
          </div>
          <div className="ornament-divider w-64">
            <span className="font-cinzel text-gold text-sm tracking-widest">✦</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-3">
          <h1
            className="font-cinzel font-black text-6xl md:text-7xl leading-none"
            style={{
              color: '#F4E4BC',
              textShadow:
                '0 0 30px rgba(201,162,39,0.5), 0 2px 4px rgba(0,0,0,0.8), 0 0 60px rgba(201,162,39,0.2)',
            }}
          >
            Tavern
            <span className="text-gold">Table</span>
          </h1>
          <p
            className="font-cinzel text-lg md:text-xl tracking-wider"
            style={{ color: 'rgba(244,228,188,0.8)' }}
          >
            D&D 5e Online Virtual Tabletop
          </p>
          <div className="ornament-divider w-96">
            <span className="font-cinzel text-gold text-xs tracking-[0.3em] whitespace-nowrap">
              {t('landing.hero')}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button
            className="btn-tavern text-base px-10 py-4 rounded-sm min-w-[220px]"
            onClick={() => navigate('/dm')}
          >
            ⚔ {t('landing.cta_dm')}
          </button>
          <button
            className="btn-tavern-ghost text-base px-10 py-4 rounded-sm min-w-[220px]"
            onClick={() => navigate('/join')}
          >
            🗺 {t('landing.cta_player')}
          </button>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-3 gap-6 mt-8 opacity-70">
          {[
            { icon: '🗡️', labelKey: 'landing.feature_combat' },
            { icon: '🌫️', labelKey: 'landing.feature_fog' },
            { icon: '🎲', labelKey: 'landing.feature_dice' },
          ].map(({ icon, labelKey }) => (
            <div key={labelKey} className="flex flex-col items-center gap-1">
              <span className="text-3xl">{icon}</span>
              <span
                className="font-cinzel text-xs tracking-widest uppercase"
                style={{ color: 'rgba(201,162,39,0.7)' }}
              >
                {t(labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom footer */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <span
          className="font-crimson text-sm"
          style={{ color: 'rgba(244,228,188,0.3)' }}
        >
          {t('landing.powered_by')}
        </span>
      </div>
    </div>
  );
}

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
        backgroundImage: 'url(/tavern-table-logo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay so text stays readable */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)' }}
      />

      {/* Extra vignette at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-3xl">

        {/* Title */}
        <div className="flex flex-col items-center gap-3">
          <h1
            className="font-cinzel font-black leading-none"
            style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              color: '#F4E4BC',
              textShadow:
                '0 0 40px rgba(201,162,39,0.7), 0 2px 8px rgba(0,0,0,0.9), 0 0 80px rgba(201,162,39,0.3)',
            }}
          >
            Tavern<span style={{ color: '#c9a227' }}>Table</span>
          </h1>
          <p
            className="font-cinzel tracking-wider"
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', color: 'rgba(244,228,188,0.85)' }}
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
        <div className="grid grid-cols-3 gap-6 mt-8" style={{ opacity: 0.85 }}>
          {[
            { icon: '🗡️', labelKey: 'landing.feature_combat' },
            { icon: '🌫️', labelKey: 'landing.feature_fog' },
            { icon: '🎲', labelKey: 'landing.feature_dice' },
          ].map(({ icon, labelKey }) => (
            <div key={labelKey} className="flex flex-col items-center gap-1">
              <span className="text-3xl">{icon}</span>
              <span
                className="font-cinzel text-xs tracking-widest uppercase"
                style={{ color: 'rgba(201,162,39,0.9)' }}
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
          style={{ color: 'rgba(244,228,188,0.4)' }}
        >
          {t('landing.powered_by')}
        </span>
      </div>
    </div>
  );
}

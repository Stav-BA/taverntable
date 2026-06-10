import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useTranslation } from 'react-i18next';

// ─── Floating 3D Dice ──────────────────────────────────────────────────────────

const DICE_COLORS = [
  // face-bg, face-border, pip/label color
  ['rgba(180,30,30,0.55)',   'rgba(220,80,80,0.6)',   '#ffcccc'],  // red
  ['rgba(30,60,180,0.55)',   'rgba(80,120,220,0.6)',  '#ccd8ff'],  // blue
  ['rgba(20,120,60,0.55)',   'rgba(60,180,100,0.6)',  '#ccffdd'],  // green
  ['rgba(120,20,160,0.55)',  'rgba(180,80,220,0.6)',  '#f0ccff'],  // purple
  ['rgba(180,130,10,0.55)',  'rgba(220,180,40,0.6)',  '#fff5cc'],  // gold
  ['rgba(20,140,160,0.55)',  'rgba(60,200,220,0.6)',  '#ccf8ff'],  // teal
  ['rgba(180,80,20,0.55)',   'rgba(230,130,60,0.6)',  '#ffe5cc'],  // orange
  ['rgba(160,10,80,0.55)',   'rgba(220,60,140,0.6)',  '#ffccee'],  // rose
];

const DIE_LABELS = ['4', '6', '8', '10', '12', '20', '100', '%'];

interface DieConfig {
  id: number;
  left: number;         // % across screen
  bottom: number;       // % start position (below fold for upward drift)
  size: number;         // px side length
  driftX: number;       // horizontal sway amplitude px
  duration: number;     // total float duration s
  delay: number;        // animation delay s
  rotX: number;         // starting rotateX deg
  rotY: number;         // starting rotateY deg
  rotSpeedX: number;    // deg/s rotate X
  rotSpeedY: number;    // deg/s rotate Y
  colorIdx: number;
  label: string;
}

function seeded(seed: number, min: number, max: number) {
  // deterministic-ish pseudo-random from index seed
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return min + (x - Math.floor(x)) * (max - min);
}

function makeDice(count: number): DieConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left:       seeded(i * 1,  2, 98),
    bottom:     seeded(i * 2, -40, -5),
    size:       seeded(i * 3, 36, 72),
    driftX:     seeded(i * 4, -60, 60),
    duration:   seeded(i * 5, 18, 38),
    delay:      seeded(i * 6, 0, 20),
    rotX:       seeded(i * 7, 0, 360),
    rotY:       seeded(i * 8, 0, 360),
    rotSpeedX:  seeded(i * 9, 30, 90) * (i % 2 === 0 ? 1 : -1),
    rotSpeedY:  seeded(i * 10, 20, 70) * (i % 3 === 0 ? 1 : -1),
    colorIdx:   Math.abs(Math.floor(seeded(i * 11, 0, 100))) % DICE_COLORS.length,
    label:      DIE_LABELS[Math.abs(Math.floor(seeded(i * 12, 0, 100))) % DIE_LABELS.length],
  }));
}

const DICE_DATA = makeDice(22);

function Cube({ die }: { die: DieConfig }) {
  const [bg, border, pip] = DICE_COLORS[die.colorIdx];
  const s = die.size;
  const half = s / 2;

  const faceStyle = (tx: number, ty: number, tz: number, rx: number, ry: number): React.CSSProperties => ({
    position: 'absolute',
    width: s, height: s,
    background: bg,
    border: `1.5px solid ${border}`,
    boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backfaceVisibility: 'hidden',
    transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
  });

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Cinzel, serif',
    fontSize: s * 0.28,
    fontWeight: 700,
    color: pip,
    userSelect: 'none',
    lineHeight: 1,
  };

  // keyframe names must be unique per die to avoid collision
  const animName = `floatDie${die.id}`;
  const rotAnimName = `rotateDie${die.id}`;

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0%   { transform: translateX(0px)           translateY(0px); }
          25%  { transform: translateX(${die.driftX * 0.5}px) translateY(${-window.innerHeight * 0.25}px); }
          50%  { transform: translateX(${die.driftX}px)        translateY(${-window.innerHeight * 0.55}px); }
          75%  { transform: translateX(${die.driftX * 0.3}px)  translateY(${-window.innerHeight * 0.78}px); }
          100% { transform: translateX(0px)           translateY(${-window.innerHeight * 1.15}px); }
        }
        @keyframes ${rotAnimName} {
          0%   { transform: rotateX(${die.rotX}deg) rotateY(${die.rotY}deg); }
          100% { transform: rotateX(${die.rotX + die.rotSpeedX * die.duration}deg) rotateY(${die.rotY + die.rotSpeedY * die.duration}deg); }
        }
      `}</style>

      {/* Outer wrapper: handles the float translation */}
      <div style={{
        position: 'absolute',
        left: `${die.left}%`,
        bottom: `${die.bottom}%`,
        width: s, height: s,
        animation: `${animName} ${die.duration}s ${die.delay}s linear infinite`,
        opacity: 0.28 + seeded(die.id * 13, 0, 0.22),
        filter: 'blur(0.4px)',
        willChange: 'transform',
      }}>
        {/* Inner wrapper: handles the 3D rotation, offset so cube is centred */}
        <div style={{
          position: 'relative',
          width: s, height: s,
          transformStyle: 'preserve-3d',
          animation: `${rotAnimName} ${die.duration}s ${die.delay}s linear infinite`,
          willChange: 'transform',
        }}>
          {/* 6 faces of the cube */}
          {/* Front */}
          <div style={faceStyle(0, 0, half, 0, 0)}>
            <span style={labelStyle}>D{die.label}</span>
          </div>
          {/* Back */}
          <div style={faceStyle(0, 0, -half, 0, 180)} />
          {/* Right */}
          <div style={faceStyle(half, 0, 0, 0, 90)} />
          {/* Left */}
          <div style={faceStyle(-half, 0, 0, 0, -90)} />
          {/* Top */}
          <div style={faceStyle(0, -half, 0, 90, 0)}>
            <span style={labelStyle}>✦</span>
          </div>
          {/* Bottom */}
          <div style={faceStyle(0, half, 0, -90, 0)} />
        </div>
      </div>
    </>
  );
}

function FloatingDice() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden',
      perspective: '900px',
      perspectiveOrigin: '50% 80%',
      pointerEvents: 'none',
      zIndex: 2,          // above dark overlay (z=1) but below content (z=10)
    }}>
      {DICE_DATA.map(die => <Cube key={die.id} die={die} />)}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1 }}
      />

      {/* Floating 3D dice — above overlay, behind main content */}
      <FloatingDice />

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

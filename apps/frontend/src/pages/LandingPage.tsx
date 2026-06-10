import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useTranslation } from 'react-i18next';

// ─── Polyhedral Dice SVG System ────────────────────────────────────────────────

// Deterministic pseudo-random (seed-based so SSR and client match)
function sr(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return min + (x - Math.floor(x)) * (max - min);
}

// ── Colour palettes ── each is [gradStop1, gradStop2, glowColor, numberColor]
const PALETTES = [
  // Galaxy Blue (like the reference image)
  ['#0a0a2e', '#1a1a6e', '#3a3adf', '#c8922a'],
  // Dragon Blood Red
  ['#1a0000', '#6e0000', '#cc1111', '#f5c842'],
  // Forest Emerald
  ['#001a05', '#004d15', '#00aa44', '#d4af37'],
  // Amethyst Purple
  ['#0f001a', '#3d0066', '#9933cc', '#e8c0ff'],
  // Obsidian & Gold
  ['#0a0a0a', '#1c1c1c', '#555555', '#c9a227'],
  // Ocean Abyss
  ['#001a1a', '#004444', '#009999', '#f0e68c'],
  // Sunset Ember
  ['#1a0500', '#6e2000', '#cc6600', '#ffe090'],
  // Arctic Ice
  ['#001020', '#003060', '#0080cc', '#aaeeff'],
];

// ── Sparkle dots (galaxy shimmer effect) ──────────────────────────────────────
function Sparkles({ id, count, glow }: { id: number; count: number; glow: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const cx = sr(id * 100 + i * 7, 15, 85);
        const cy = sr(id * 100 + i * 13, 15, 85);
        const r  = sr(id * 100 + i * 17, 0.4, 1.4);
        const op = sr(id * 100 + i * 23, 0.3, 1.0);
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="white" opacity={op}
            filter={`url(#glow${id})`}
          />
        );
      })}
    </>
  );
}

// ── SVG die shapes ─────────────────────────────────────────────────────────────

// d4 — equilateral triangle
function D4Shape({ id, pal, label }: { id: number; pal: string[]; label: string }) {
  const [c1, c2, glow, num] = pal;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id={`g${id}`} cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </radialGradient>
        <filter id={`glow${id}`}><feGaussianBlur stdDeviation="1" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Main triangle */}
      <polygon points="50,8 94,88 6,88" fill={`url(#g${id})`} stroke={glow} strokeWidth="1.5" strokeOpacity="0.7"/>
      {/* Inner highlight triangle */}
      <polygon points="50,22 82,78 18,78" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      {/* Sparkles */}
      <clipPath id={`clip${id}`}><polygon points="50,8 94,88 6,88"/></clipPath>
      <g clipPath={`url(#clip${id})`}><Sparkles id={id} count={18} glow={glow}/></g>
      {/* Number */}
      <text x="50" y="76" textAnchor="middle" fontSize="22" fontWeight="bold"
        fontFamily="Cinzel,serif" fill={num} style={{ filter: `drop-shadow(0 0 3px ${glow})` }}>
        {label}
      </text>
    </svg>
  );
}

// d6 — square with bevelled look
function D6Shape({ id, pal, label }: { id: number; pal: string[]; label: string }) {
  const [c1, c2, glow, num] = pal;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id={`g${id}`} cx="40%" cy="40%" r="65%">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </radialGradient>
        <filter id={`glow${id}`}><feGaussianBlur stdDeviation="1"/></filter>
      </defs>
      {/* Shadow */}
      <rect x="14" y="14" width="74" height="74" rx="8" fill="rgba(0,0,0,0.4)" transform="translate(3,3)"/>
      {/* Main face */}
      <rect x="14" y="14" width="74" height="74" rx="8" fill={`url(#g${id})`} stroke={glow} strokeWidth="1.5" strokeOpacity="0.8"/>
      {/* Top-left highlight bevel */}
      <rect x="14" y="14" width="74" height="74" rx="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" strokeDasharray="40 200" strokeDashoffset="-5"/>
      {/* Inner frame */}
      <rect x="20" y="20" width="62" height="62" rx="5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      {/* Sparkles */}
      <clipPath id={`clip${id}`}><rect x="14" y="14" width="74" height="74" rx="8"/></clipPath>
      <g clipPath={`url(#clip${id})`}><Sparkles id={id} count={22} glow={glow}/></g>
      {/* Number */}
      <text x="51" y="58" textAnchor="middle" fontSize="28" fontWeight="bold"
        fontFamily="Cinzel,serif" fill={num} style={{ filter: `drop-shadow(0 0 4px ${glow})` }}>
        {label}
      </text>
    </svg>
  );
}

// d8 — diamond / octahedron top-view
function D8Shape({ id, pal, label }: { id: number; pal: string[]; label: string }) {
  const [c1, c2, glow, num] = pal;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id={`g${id}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </radialGradient>
        <filter id={`glow${id}`}><feGaussianBlur stdDeviation="1"/></filter>
      </defs>
      {/* Shadow */}
      <polygon points="50,7 93,50 50,93 7,50" fill="rgba(0,0,0,0.35)" transform="translate(3,3)"/>
      {/* Main diamond */}
      <polygon points="50,7 93,50 50,93 7,50" fill={`url(#g${id})`} stroke={glow} strokeWidth="1.5" strokeOpacity="0.8"/>
      {/* Cross dividers — octahedron face lines */}
      <line x1="50" y1="7" x2="50" y2="93" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <line x1="7" y1="50" x2="93" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      {/* Inner diamond */}
      <polygon points="50,22 78,50 50,78 22,50" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      {/* Sparkles */}
      <clipPath id={`clip${id}`}><polygon points="50,7 93,50 50,93 7,50"/></clipPath>
      <g clipPath={`url(#clip${id})`}><Sparkles id={id} count={20} glow={glow}/></g>
      {/* Number */}
      <text x="50" y="56" textAnchor="middle" fontSize="22" fontWeight="bold"
        fontFamily="Cinzel,serif" fill={num} style={{ filter: `drop-shadow(0 0 3px ${glow})` }}>
        {label}
      </text>
    </svg>
  );
}

// d10 — elongated kite
function D10Shape({ id, pal, label }: { id: number; pal: string[]; label: string }) {
  const [c1, c2, glow, num] = pal;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id={`g${id}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </radialGradient>
        <filter id={`glow${id}`}><feGaussianBlur stdDeviation="1"/></filter>
      </defs>
      {/* Shadow */}
      <polygon points="50,5 90,42 50,95 10,42" fill="rgba(0,0,0,0.35)" transform="translate(3,3)"/>
      {/* Main kite */}
      <polygon points="50,5 90,42 50,95 10,42" fill={`url(#g${id})`} stroke={glow} strokeWidth="1.5" strokeOpacity="0.8"/>
      {/* Divider lines */}
      <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <line x1="10" y1="42" x2="90" y2="42" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* Sparkles */}
      <clipPath id={`clip${id}`}><polygon points="50,5 90,42 50,95 10,42"/></clipPath>
      <g clipPath={`url(#clip${id})`}><Sparkles id={id} count={18} glow={glow}/></g>
      {/* Number */}
      <text x="50" y="57" textAnchor="middle" fontSize="20" fontWeight="bold"
        fontFamily="Cinzel,serif" fill={num} style={{ filter: `drop-shadow(0 0 3px ${glow})` }}>
        {label}
      </text>
    </svg>
  );
}

// d12 — pentagon
function D12Shape({ id, pal, label }: { id: number; pal: string[]; label: string }) {
  const [c1, c2, glow, num] = pal;
  // Regular pentagon points
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * Math.PI / 180;
    return `${50 + 44 * Math.cos(a)},${50 + 44 * Math.sin(a)}`;
  }).join(' ');
  const innerPts = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * Math.PI / 180;
    return `${50 + 32 * Math.cos(a)},${50 + 32 * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id={`g${id}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </radialGradient>
        <filter id={`glow${id}`}><feGaussianBlur stdDeviation="1"/></filter>
      </defs>
      <polygon points={pts} fill="rgba(0,0,0,0.35)" transform="translate(3,3)"/>
      <polygon points={pts} fill={`url(#g${id})`} stroke={glow} strokeWidth="1.5" strokeOpacity="0.8"/>
      <polygon points={innerPts} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      <clipPath id={`clip${id}`}><polygon points={pts}/></clipPath>
      <g clipPath={`url(#clip${id})`}><Sparkles id={id} count={22} glow={glow}/></g>
      <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold"
        fontFamily="Cinzel,serif" fill={num} style={{ filter: `drop-shadow(0 0 3px ${glow})` }}>
        {label}
      </text>
    </svg>
  );
}

// d20 — irregular hexagon (icosahedron top view)
function D20Shape({ id, pal, label }: { id: number; pal: string[]; label: string }) {
  const [c1, c2, glow, num] = pal;
  // Slightly irregular hexagon (more like a d20 face)
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * Math.PI / 180;
    const r = i % 2 === 0 ? 45 : 42;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
  const innerPts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * Math.PI / 180;
    const r = i % 2 === 0 ? 32 : 29;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id={`g${id}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </radialGradient>
        <filter id={`glow${id}`}><feGaussianBlur stdDeviation="1"/></filter>
      </defs>
      <polygon points={pts} fill="rgba(0,0,0,0.35)" transform="translate(3,3)"/>
      <polygon points={pts} fill={`url(#g${id})`} stroke={glow} strokeWidth="1.5" strokeOpacity="0.8"/>
      {/* Triangular face lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 - 30) * Math.PI / 180;
        const r = i % 2 === 0 ? 45 : 42;
        return <line key={i} x1="50" y1="50" x2={50 + r * Math.cos(a)} y2={50 + r * Math.sin(a)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>;
      })}
      <polygon points={innerPts} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      <clipPath id={`clip${id}`}><polygon points={pts}/></clipPath>
      <g clipPath={`url(#clip${id})`}><Sparkles id={id} count={24} glow={glow}/></g>
      <text x="50" y="56" textAnchor="middle" fontSize="22" fontWeight="bold"
        fontFamily="Cinzel,serif" fill={num} style={{ filter: `drop-shadow(0 0 4px ${glow})` }}>
        {label}
      </text>
    </svg>
  );
}

// ── Die config & floating animation ───────────────────────────────────────────

type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

interface DieConfig {
  id: number;
  type: DieType;
  left: number;
  size: number;
  driftX: number;
  duration: number;
  delay: number;
  startRot: number;
  rotSpeed: number;
  palIdx: number;
}

const DIE_TYPES: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
const DIE_LABELS_MAP: Record<DieType, string[]> = {
  d4:  ['3', '4', '2'],
  d6:  ['4', '6', '5', '1'],
  d8:  ['7', '8', '3', '5'],
  d10: ['10', '7', '4', '0'],
  d12: ['11', '12', '6', '9'],
  d20: ['20', '17', '13', '8'],
};

const DICE_DATA: DieConfig[] = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  type:      DIE_TYPES[Math.abs(Math.floor(sr(i * 3,  0, 100))) % DIE_TYPES.length],
  left:      sr(i * 1,  2, 97),
  size:      sr(i * 7,  48, 92),
  driftX:    sr(i * 4, -70, 70),
  duration:  sr(i * 5,  22, 45),
  delay:    -sr(i * 6,  0, 44),   // negative = start mid-animation
  startRot:  sr(i * 8,  0, 360),
  rotSpeed:  sr(i * 9, 25, 80) * (i % 2 === 0 ? 1 : -1),
  palIdx:    Math.abs(Math.floor(sr(i * 11, 0, 100))) % PALETTES.length,
}));

function FloatingDie({ die }: { die: DieConfig }) {
  const pal     = PALETTES[die.palIdx];
  const labels  = DIE_LABELS_MAP[die.type];
  const label   = labels[Math.abs(Math.floor(sr(die.id * 17, 0, 100))) % labels.length];
  const opacity = sr(die.id * 13, 0.30, 0.55);
  const animId  = `fdie${die.id}`;
  const rotId   = `rdie${die.id}`;

  const ShapeComp = { d4: D4Shape, d6: D6Shape, d8: D8Shape, d10: D10Shape, d12: D12Shape, d20: D20Shape }[die.type];

  return (
    <>
      <style>{`
        @keyframes ${animId} {
          0%   { transform: translateX(0)                    translateY(110vh); }
          100% { transform: translateX(${die.driftX}px)      translateY(-20vh); }
        }
        @keyframes ${rotId} {
          from { transform: rotate(${die.startRot}deg); }
          to   { transform: rotate(${die.startRot + die.rotSpeed * (die.duration / 10) * 360}deg); }
        }
      `}</style>
      <div style={{
        position: 'absolute',
        left: `${die.left}%`,
        bottom: 0,
        width:  die.size,
        height: die.size,
        opacity,
        animation: `${animId} ${die.duration}s ${die.delay}s linear infinite`,
        willChange: 'transform',
        filter: `drop-shadow(0 0 6px ${pal[2]}88)`,
      }}>
        <div style={{
          width: '100%', height: '100%',
          animation: `${rotId} ${die.duration * 0.9}s ${die.delay}s linear infinite`,
          willChange: 'transform',
        }}>
          <ShapeComp id={die.id} pal={pal} label={label} />
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
      pointerEvents: 'none',
      zIndex: 2,
    }}>
      {DICE_DATA.map(die => <FloatingDie key={die.id} die={die} />)}
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

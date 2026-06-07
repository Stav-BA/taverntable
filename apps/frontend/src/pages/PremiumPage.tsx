import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BillingCycle = 'monthly' | 'yearly';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHLY_PRICE = 4.99;
const YEARLY_PRICE = 39.99;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeatureRow({ included, label }: { included: boolean; label: string }) {
  return (
    <div
      className="flex items-center gap-2 py-1.5"
      style={{ borderBottom: '1px solid rgba(92,61,30,0.15)' }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
        }}
      >
        {included ? '✅' : '❌'}
      </span>
      <span
        className="font-crimson text-sm"
        style={{ color: included ? '#2d1b00' : 'rgba(45,27,0,0.45)' }}
      >
        {label}
      </span>
    </div>
  );
}

interface CosmenticCardProps {
  icon: string;
  title: string;
  description: string;
  previews: string[];
}

function CosmeticCard({ icon, title, description, previews }: CosmenticCardProps) {
  return (
    <div
      className="flex flex-col rounded-sm overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E8D5A0 100%)',
        border: '2px solid #5c3d1e',
        boxShadow: '0 4px 16px rgba(45,27,0,0.3)',
      }}
    >
      {/* Preview thumbnails */}
      <div
        className="relative grid grid-cols-2 gap-0.5 p-0.5"
        style={{ background: '#2d1b00', minHeight: 120 }}
      >
        {previews.map((label, i) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.04)',
              aspectRatio: '1',
              fontSize: '1.8rem',
              filter: 'blur(2px)',
              position: 'relative',
            }}
          >
            <span role="img" aria-hidden="true">{label}</span>
          </div>
        ))}

        {/* Lock badge overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(1px)',
          }}
        >
          <span style={{ fontSize: '2rem' }}>👑</span>
          <span
            className="font-cinzel text-xs uppercase tracking-wider"
            style={{ color: '#c9a227', marginTop: 4 }}
          >
            Premium
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span role="img" aria-hidden="true" style={{ fontSize: '1.3rem' }}>{icon}</span>
          <h3 className="font-cinzel font-bold text-base" style={{ color: '#2d1b00' }}>
            {title}
          </h3>
        </div>
        <p className="font-crimson text-sm" style={{ color: '#5c3d1e' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function PremiumPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing }),
      });
      if (!res.ok) throw new Error('Checkout failed');
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      console.error('[PremiumPage] Stripe checkout error:', err);
      setIsUpgrading(false);
    }
  };

  const freeFeatures: { label: string; included: boolean }[] = [
    { label: t('premium.feature_gameplay'), included: true },
    { label: t('premium.feature_classes'), included: true },
    { label: t('premium.feature_ai'), included: true },
    { label: t('premium.feature_sessions'), included: true },
    { label: t('premium.feature_multiplayer'), included: true },
    { label: t('premium.feature_portraits'), included: false },
    { label: t('premium.feature_dice'), included: false },
    { label: t('premium.feature_themes'), included: false },
  ];

  const cosmeticPacks: CosmenticCardProps[] = [
    {
      icon: '🖼️',
      title: t('premium.portraits'),
      description: t('premium.portraits_desc'),
      previews: ['🧙', '⚔️', '🏹', '🛡️'],
    },
    {
      icon: '🎲',
      title: t('premium.dice_skins'),
      description: t('premium.dice_skins_desc'),
      previews: ['🖤', '💎', '🐉', '📜'],
    },
    {
      icon: '🗺️',
      title: t('premium.table_themes'),
      description: t('premium.table_themes_desc'),
      previews: ['💀', '🌲', '⚓', '👑'],
    },
  ];

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #3d2408 0%, #1a0f00 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-10">

        {/* Hero */}
        <div className="text-center flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-gold"
            style={{
              background: 'radial-gradient(circle, #5c3d1e 0%, #2d1b00 100%)',
              boxShadow: '0 0 20px rgba(201,162,39,0.4)',
            }}
          >
            <span style={{ fontSize: '2rem' }} role="img" aria-label="crown">👑</span>
          </div>

          <h1
            className="font-cinzel font-black text-4xl md:text-5xl"
            style={{
              background: 'linear-gradient(135deg, #c9a227 0%, #f0d060 50%, #a8831a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('premium.title')}
          </h1>

          <p className="font-cinzel text-base" style={{ color: 'rgba(244,228,188,0.8)' }}>
            {t('premium.subtitle')}
          </p>

          {/* Free-forever reassurance */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(20,80,30,0.4)',
              border: '1px solid #2a9d3a',
            }}
          >
            <span>✅</span>
            <span className="font-crimson text-sm" style={{ color: '#a8f0b0' }}>
              {t('premium.free_forever')}
            </span>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <span
            className="font-cinzel text-sm"
            style={{ color: billing === 'monthly' ? '#c9a227' : 'rgba(244,228,188,0.4)' }}
          >
            {t('premium.monthly')}
          </span>

          <button
            type="button"
            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-7 rounded-full transition-colors"
            style={{
              background: billing === 'yearly' ? '#c9a227' : '#5c3d1e',
              border: '2px solid',
              borderColor: billing === 'yearly' ? '#a8831a' : '#3d2408',
            }}
            aria-label="Toggle billing cycle"
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full"
              style={{
                background: '#F4E4BC',
                left: billing === 'yearly' ? '1.85rem' : '0.1rem',
                transition: 'left 0.2s ease',
              }}
            />
          </button>

          <span
            className="font-cinzel text-sm flex items-center gap-1.5"
            style={{ color: billing === 'yearly' ? '#c9a227' : 'rgba(244,228,188,0.4)' }}
          >
            {t('premium.yearly')}
            {billing === 'yearly' && (
              <span
                className="font-cinzel text-xs uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid #c9a227', color: '#c9a227' }}
              >
                {t('premium.save')}
              </span>
            )}
          </span>
        </div>

        {/* Pricing row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Free plan */}
          <div
            className="rounded-sm p-6 flex flex-col gap-4"
            style={{
              background: 'linear-gradient(135deg, #F4E4BC 0%, #E8D5A0 100%)',
              border: '2px solid #5c3d1e',
              boxShadow: '0 4px 16px rgba(45,27,0,0.3)',
            }}
          >
            <div>
              <p className="font-cinzel text-xs uppercase tracking-widest mb-1" style={{ color: '#5c3d1e' }}>
                {t('premium.current_plan')}
              </p>
              <h2 className="font-cinzel font-bold text-2xl" style={{ color: '#2d1b00' }}>
                {t('premium.plan_free')}
              </h2>
              <p className="font-cinzel text-3xl font-black mt-1" style={{ color: '#2d1b00' }}>
                $0
              </p>
            </div>

            <div className="flex flex-col gap-0">
              {freeFeatures.map((f) => (
                <FeatureRow key={f.label} included={f.included} label={f.label} />
              ))}
            </div>

            <button
              type="button"
              disabled
              className="btn-tavern-ghost py-3 rounded-sm w-full"
              style={{ opacity: 0.5, cursor: 'default', fontFamily: 'Cinzel, serif' }}
            >
              {t('premium.current_plan')}
            </button>
          </div>

          {/* Premium plan */}
          <div
            className="rounded-sm p-6 flex flex-col gap-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2d1b00 0%, #3d2408 100%)',
              border: '2px solid #c9a227',
              boxShadow: '0 4px 24px rgba(201,162,39,0.25)',
            }}
          >
            {/* Glow accent */}
            <div
              style={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'rgba(201,162,39,0.08)',
                pointerEvents: 'none',
              }}
            />

            <div>
              <p className="font-cinzel text-xs uppercase tracking-widest mb-1" style={{ color: '#c9a227' }}>
                {t('premium.plan_premium')}
              </p>
              <h2 className="font-cinzel font-bold text-2xl" style={{ color: '#F4E4BC' }}>
                TavernTable Premium
              </h2>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-cinzel text-3xl font-black" style={{ color: '#c9a227' }}>
                  ${billing === 'monthly' ? MONTHLY_PRICE.toFixed(2) : YEARLY_PRICE.toFixed(2)}
                </span>
                <span className="font-cinzel text-sm" style={{ color: 'rgba(244,228,188,0.6)' }}>
                  {billing === 'monthly' ? t('premium.per_month') : t('premium.per_year')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-0">
              {freeFeatures.map((f) => (
                <FeatureRow key={f.label} included={true} label={f.label} />
              ))}
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="btn-tavern py-3 rounded-sm w-full"
              style={{ opacity: isUpgrading ? 0.7 : 1, fontFamily: 'Cinzel, serif' }}
            >
              {isUpgrading ? '⏳ Redirecting…' : `👑 ${t('premium.upgrade')}`}
            </button>
          </div>
        </div>

        {/* Cosmetic packs */}
        <div>
          <h2
            className="font-cinzel font-bold text-2xl text-center mb-6"
            style={{ color: '#F4E4BC' }}
          >
            Cosmetic Packs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cosmeticPacks.map((pack) => (
              <CosmeticCard key={pack.title} {...pack} />
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-cinzel text-xs uppercase tracking-wider opacity-40 hover:opacity-70 transition-opacity"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F4E4BC' }}
          >
            ← Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

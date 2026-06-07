import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PremiumBadgeProps {
  /** If true, renders a larger badge. Default is compact inline badge. */
  large?: boolean;
}

export default function PremiumBadge({ large = false }: PremiumBadgeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => navigate('/premium')}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={t('premium.unlock_tooltip')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: large ? '0.3rem 0.7rem' : '0.15rem 0.45rem',
          background: 'linear-gradient(135deg, #c9a227 0%, #e8c84a 50%, #a8831a 100%)',
          border: '1.5px solid #a8831a',
          borderRadius: '9999px',
          color: '#2d1b00',
          fontFamily: 'Cinzel, serif',
          fontSize: large ? '0.75rem' : '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          boxShadow: '0 1px 6px rgba(201,162,39,0.4)',
          whiteSpace: 'nowrap',
          transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <span role="img" aria-hidden="true" style={{ fontSize: large ? '0.85rem' : '0.75rem' }}>
          👑
        </span>
        <span>{t('premium.premium')}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(20,10,0,0.95)',
            border: '1px solid #c9a227',
            borderRadius: '4px',
            color: '#F4E4BC',
            fontFamily: 'Crimson Text, serif',
            fontSize: '0.8rem',
            padding: '0.35rem 0.65rem',
            whiteSpace: 'nowrap',
            zIndex: 9000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {t('premium.unlock_tooltip')}
          {/* Caret */}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #c9a227',
            }}
          />
        </div>
      )}
    </div>
  );
}

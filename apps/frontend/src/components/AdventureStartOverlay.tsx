import { useEffect, useState } from 'react';

interface Props {
  campaignName: string;
  lore: string;
  onDismiss: () => void;
}

export default function AdventureStartOverlay({ campaignName, lore, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 600);
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    setVisible(false);
    setTimeout(onDismiss, 600);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10,5,0,0.92)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        cursor: 'pointer',
      }}
    >
      <style>{`
        @keyframes scrollUnfurl {
          from { transform: scaleY(0.2) scaleX(0.85); opacity: 0; }
          to   { transform: scaleY(1) scaleX(1); opacity: 1; }
        }
        @keyframes fadeInText {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .adventure-scroll {
          animation: scrollUnfurl 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .adventure-title {
          animation: fadeInText 0.6s ease 0.6s forwards;
          opacity: 0;
        }
        .adventure-subtitle {
          animation: fadeInText 0.6s ease 0.9s forwards;
          opacity: 0;
        }
        .adventure-lore {
          animation: fadeInText 0.6s ease 1.2s forwards;
          opacity: 0;
        }
        .adventure-hint {
          animation: fadeInText 0.6s ease 1.8s forwards;
          opacity: 0;
        }
      `}</style>

      {/* Parchment scroll */}
      <div
        className="adventure-scroll"
        style={{
          background: 'linear-gradient(160deg, #2d1b00 0%, #1a0f00 40%, #0d0700 100%)',
          border: '3px solid #c9a227',
          boxShadow: '0 0 60px rgba(201,162,39,0.4), inset 0 0 30px rgba(201,162,39,0.05)',
          borderRadius: 4,
          maxWidth: 640,
          width: '90vw',
          padding: '48px 48px',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        {/* Scroll top curl decoration */}
        <div style={{
          position: 'absolute',
          top: -2,
          left: 32,
          right: 32,
          height: 6,
          background: '#c9a227',
          borderRadius: '0 0 50% 50%',
          opacity: 0.6,
        }} />
        <div style={{
          position: 'absolute',
          bottom: -2,
          left: 32,
          right: 32,
          height: 6,
          background: '#c9a227',
          borderRadius: '50% 50% 0 0',
          opacity: 0.6,
        }} />

        {/* Decorative divider top */}
        <div style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, #c9a227, transparent)',
          marginBottom: 24,
        }} />

        {/* Campaign name */}
        <h1
          className="adventure-title"
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
            fontWeight: 700,
            color: '#c9a227',
            textShadow: '0 0 20px rgba(201,162,39,0.7), 0 2px 4px rgba(0,0,0,0.8)',
            marginBottom: 8,
            letterSpacing: '0.08em',
          }}
        >
          {campaignName || 'A New Adventure'}
        </h1>

        <p
          className="adventure-subtitle"
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '0.9rem',
            color: 'rgba(201,162,39,0.7)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Your adventure begins...
        </p>

        {/* Decorative divider middle */}
        <div style={{
          width: '60%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent)',
          margin: '0 auto 24px',
        }} />

        {/* Lore text */}
        {lore && (
          <p
            className="adventure-lore"
            style={{
              fontFamily: '"Crimson Text", Georgia, serif',
              fontSize: '1.05rem',
              fontStyle: 'italic',
              color: '#f4e4bc',
              lineHeight: 1.7,
              maxHeight: 200,
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            {lore}
          </p>
        )}

        {/* Decorative divider bottom */}
        <div style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, #c9a227, transparent)',
          marginTop: lore ? 0 : 8,
          marginBottom: 16,
        }} />

        <p
          className="adventure-hint"
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '0.65rem',
            color: 'rgba(201,162,39,0.4)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
}

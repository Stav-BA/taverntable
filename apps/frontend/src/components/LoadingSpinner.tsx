interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const SIZE_MAP = {
  sm: { outer: 32, fontSize: '1.1rem', textClass: 'text-xs' },
  md: { outer: 52, fontSize: '1.8rem', textClass: 'text-sm' },
  lg: { outer: 80, fontSize: '2.8rem', textClass: 'text-base' },
};

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const { outer, fontSize, textClass } = SIZE_MAP[size];

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-label={message ?? 'Loading…'}
    >
      <div
        style={{
          width: outer,
          height: outer,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Spinning gold ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `3px solid rgba(201,162,39,0.2)`,
            borderTopColor: '#c9a227',
            borderRightColor: '#e8c84a',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        {/* d20 face */}
        <span
          style={{ fontSize, lineHeight: 1, userSelect: 'none' }}
          aria-hidden="true"
        >
          🎲
        </span>
      </div>

      {message && (
        <p
          className={`font-cinzel ${textClass} uppercase tracking-wider`}
          style={{ color: 'rgba(201,162,39,0.85)' }}
        >
          {message}
        </p>
      )}

      {/* Keyframe injected inline so this component is self-contained */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

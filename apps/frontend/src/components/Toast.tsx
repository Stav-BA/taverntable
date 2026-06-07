import { useToastStore, type ToastType } from '@/stores/toastStore';

const ICON: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: '⚔️',
  warning: '⚠️',
};

const STYLES: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: {
    bg: 'rgba(20,80,30,0.95)',
    border: '#2a9d3a',
    color: '#a8f0b0',
  },
  error: {
    bg: 'rgba(90,15,15,0.95)',
    border: '#c0392b',
    color: '#f5a0a0',
  },
  info: {
    bg: 'rgba(45,27,0,0.95)',
    border: '#c9a227',
    color: '#F4E4BC',
  },
  warning: {
    bg: 'rgba(90,45,0,0.95)',
    border: '#e67e22',
    color: '#f5c880',
  },
};

function ToastItem({
  id,
  type,
  message,
}: {
  id: string;
  type: ToastType;
  message: string;
}) {
  const remove = useToastStore((s) => s.remove);
  const style = STYLES[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={() => remove(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.65rem 1rem',
        borderRadius: '4px',
        border: `1.5px solid ${style.border}`,
        background: style.bg,
        color: style.color,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        maxWidth: 360,
        animation: 'toastSlideIn 0.25s ease-out',
        backdropFilter: 'blur(6px)',
        fontFamily: 'Crimson Text, Georgia, serif',
        fontSize: '1rem',
        lineHeight: 1.4,
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }} aria-hidden="true">
        {ICON[type]}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); remove(id); }}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          opacity: 0.5,
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

/**
 * ToastContainer — mount once near the root. Renders all active toasts
 * in the top-right corner.
 */
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        aria-label="Notifications"
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem id={t.id} type={t.type} message={t.message} />
          </div>
        ))}
      </div>
    </>
  );
}

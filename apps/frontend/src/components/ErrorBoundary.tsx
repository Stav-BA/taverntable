import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would ship to Sentry / error tracking
    console.error('[TavernTable] Render error caught by boundary:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, #3d2408 0%, #2d1b00 40%, #1a0f00 100%)',
          }}
        >
          <div
            className="max-w-md w-full p-8 rounded-sm text-center relative"
            style={{
              background: 'linear-gradient(135deg, #F4E4BC 0%, #E8D5A0 100%)',
              border: '3px solid #5c3d1e',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,162,39,0.3)',
            }}
          >
            {/* Corner ornaments */}
            {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
              <div key={pos} className={`absolute ${pos} text-gold opacity-40 font-cinzel`}>✦</div>
            ))}

            <div className="text-5xl mb-4">🍺💥</div>

            <h2
              className="font-cinzel font-bold text-2xl mb-2"
              style={{ color: '#2d1b00' }}
            >
              Something went wrong at the tavern
            </h2>

            <div
              className="ornament-divider mb-4"
              style={{ borderColor: '#5c3d1e' }}
            >
              <span className="font-crimson italic text-sm" style={{ color: '#5c3d1e' }}>
                Even the finest taverns have their troubles
              </span>
            </div>

            {this.state.error && (
              <details
                className="mb-4 text-left"
                style={{
                  background: 'rgba(45,27,0,0.08)',
                  border: '1px solid #5c3d1e',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '2px',
                }}
              >
                <summary
                  className="font-cinzel text-xs uppercase tracking-wider cursor-pointer"
                  style={{ color: '#5c3d1e' }}
                >
                  Error details
                </summary>
                <pre
                  className="font-mono text-xs mt-2 whitespace-pre-wrap break-all"
                  style={{ color: '#8B1A1A' }}
                >
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              type="button"
              onClick={this.handleRetry}
              className="btn-tavern px-8 py-3 rounded-sm"
              style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem' }}
            >
              🎲 Try Again
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="block w-full mt-3 font-cinzel text-xs uppercase tracking-wider opacity-50 hover:opacity-80 transition-opacity"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d1b00' }}
            >
              ← Return to Landing
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

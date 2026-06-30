import { Component } from 'react';

/**
 * ErrorBoundary — catches unexpected React rendering errors and shows a
 * friendly fallback UI instead of a blank screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console for debugging; replace with Sentry / logging service in production
    console.error('[ErrorBoundary] Caught a rendering error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Navigate to home as a recovery action
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Illustration */}
          <div
            style={{
              fontSize: '4rem',
              marginBottom: '1.5rem',
              lineHeight: 1,
            }}
          >
            😞
          </div>

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1a1a2e',
              marginBottom: '0.75rem',
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: '#6b7280',
              fontSize: '1rem',
              maxWidth: '400px',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            We ran into an unexpected issue. Your data is safe. Please try
            refreshing the page or going back to the home screen.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#ff385c',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Go to Home
            </button>
          </div>

          {/* Show error details in development */}
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop: '2rem',
                textAlign: 'left',
                maxWidth: '600px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontSize: '0.75rem',
                color: '#dc2626',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '0.5rem' }}>
                Error details (dev only)
              </summary>
              <pre style={{ overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

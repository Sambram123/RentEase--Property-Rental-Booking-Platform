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
    // In production, replace this with your monitoring service (e.g. Sentry)
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Rendering error:', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-white px-6 text-center">
          {/* Illustration */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <span className="text-4xl" role="img" aria-label="Error">😞</span>
          </div>

          <h1 className="text-2xl font-bold text-secondary">Something went wrong</h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            We ran into an unexpected issue. Your data is safe — please try
            refreshing the page or going back to the home screen.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Refresh page
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-secondary transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Go to home
            </button>
          </div>

          {/* Error details — dev only */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-8 w-full max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-left">
              <summary className="cursor-pointer text-xs font-semibold text-red-600">
                Error details (dev only)
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-red-700">
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

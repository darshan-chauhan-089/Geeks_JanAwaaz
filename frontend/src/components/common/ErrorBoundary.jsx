import { Component } from 'react';

/**
 * ErrorBoundary — catches unhandled render errors anywhere in the subtree.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * Optional `fallback` prop for a custom error UI.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Replace with your analytics/error tracking (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) return children;

    if (fallback) return fallback({ error, reset: this.handleReset });

    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
          Something went wrong
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          {error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={this.handleReset}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}

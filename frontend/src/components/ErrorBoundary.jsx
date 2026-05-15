import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '50vh', gap: '1rem',
          padding: '2rem', textAlign: 'center', background: 'var(--bg-primary)'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '900' }}>
            Algo salió mal
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
            style={{ padding: '0.8rem 2rem', borderRadius: '16px', cursor: 'pointer' }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

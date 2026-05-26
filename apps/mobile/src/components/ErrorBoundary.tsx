import type React from 'react';
import { Component } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            gap: '16px',
            textAlign: 'center',
            fontFamily: 'Inter',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fdecea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1d1d1d',
              margin: 0,
            }}
          >
            Algo sali\u00f3 mal
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#605f64',
              margin: 0,
              maxWidth: '300px',
            }}
          >
            {this.state.error?.message || 'Ha ocurrido un error inesperado.'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: '8px',
              padding: '12px 24px',
              backgroundColor: '#605f64',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Inter',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

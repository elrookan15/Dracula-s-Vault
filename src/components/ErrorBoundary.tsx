import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unknown interface error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PromptVault Studio boundary captured an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-vault-radial p-6 text-slate-100">
          <section className="glass-panel max-w-xl rounded-3xl p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-vault-orange" aria-hidden="true" />
            <h1 className="text-2xl font-black text-white">PromptVault recovered from a UI fault.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-vault-orange px-4 py-2.5 text-sm font-black text-white shadow-orange"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload Studio
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

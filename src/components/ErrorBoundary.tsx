import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 h-full w-full bg-[#1e1e1e] text-[#cccccc] border border-rose-900/40 rounded">
          <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
          <h3 className="font-semibold text-rose-300 text-sm mb-1">
            {this.props.fallbackTitle || 'Component Render Failed'}
          </h3>
          <p className="text-xs text-rose-400/80 mb-4 max-w-sm text-center font-mono">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#333333] hover:bg-[#444444] text-white rounded text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Recovering</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

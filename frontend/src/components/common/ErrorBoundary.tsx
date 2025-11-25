import { Component, type ReactNode } from 'react';
import ErrorAlert from './ErrorAlert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const message = this.state.error?.message || 'An unexpected error occurred';

      return (
        <ErrorAlert
          title="Something went wrong"
          message={message}
          onAction={this.handleReset}
          actionLabel="Reset"
          showDetails={import.meta.env.DEV}
        />
      );
    }

    return this.props.children;
  }
}

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ApiErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ApiErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error boundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      // Default API error fallback UI
      const isNetworkError = this.state.error.message.includes('Network') || 
                           this.state.error.message.includes('fetch');
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-[200px] flex items-center justify-center bg-orange-50 border border-orange-200 rounded-lg p-6 m-4">
          <div className="text-center">
            <div className="text-orange-600 text-4xl mb-3">
              {isNetworkError ? '📡' : '🔌'}
            </div>
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              {isNetworkError ? 'Connection Error' : 'Service Error'}
            </h3>
            <p className="text-orange-600 mb-4 max-w-sm text-sm">
              {isNetworkError 
                ? 'Unable to connect to the server. Please check your internet connection.'
                : 'The service is currently unavailable. Please try again later.'
              }
            </p>
            <div className="space-x-2">
              {canRetry && (
                <button
                  onClick={this.retry}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-sm transition-colors duration-200"
                >
                  Try Again ({this.maxRetries - this.state.retryCount} remaining)
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm transition-colors duration-200"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
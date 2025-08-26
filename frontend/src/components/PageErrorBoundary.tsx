'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<PageErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substring(2, 15),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Page Error boundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error with additional context
    console.error('Error Context:', {
      pageName: this.props.pageName,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  render() {
    if (this.state.hasError) {
      const pageName = this.props.pageName || 'this page';
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 text-8xl mb-6">💥</div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              We encountered an error while loading {pageName}. 
              Don&apos;t worry, it&apos;s not your fault.
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200"
              >
                Try Again
              </button>
              
              <Link href="/">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-md transition-colors duration-200">
                  Go Home
                </button>
              </Link>
            </div>

            {this.state.errorId && (
              <div className="text-xs text-gray-400 border-t pt-4">
                <p>Error ID: {this.state.errorId}</p>
                <p>If this problem persists, please contact support with this ID.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
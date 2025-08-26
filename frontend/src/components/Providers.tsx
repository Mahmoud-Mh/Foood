'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { PageErrorBoundary } from './PageErrorBoundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PageErrorBoundary>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // Log to external service if needed
          console.error('Global error boundary:', error, errorInfo);
        }}
      >
        {children}
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </ErrorBoundary>
    </PageErrorBoundary>
  );
}
import React from 'react';
import { HttpError } from '@/services/base/http.service';

interface ErrorDisplayProps {
  error: string | Error | HttpError | null;
  onRetry?: () => void;
  title?: string;
  showRetry?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  showRetry = true,
  className = ''
}) => {
  if (!error) return null;

  const getErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (error instanceof HttpError) {
      if (error.isAuthenticationError()) {
        return 'Please log in to continue.';
      }
      if (error.isAuthorizationError()) {
        return 'You do not have permission to access this resource.';
      }
      if (error.isNotFoundError()) {
        return 'The requested resource was not found.';
      }
      if (error.isServerError()) {
        return 'A server error occurred. Please try again later.';
      }
      if (error.isRateLimitError()) {
        return 'Too many requests. Please wait a moment before trying again.';
      }
      return error.message;
    }
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred.';
  };

  const getErrorIcon = () => {
    if (error instanceof HttpError && error.isAuthenticationError()) {
      return (
        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{getErrorMessage()}</p>
          </div>
          {showRetry && onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PageErrorDisplay: React.FC<ErrorDisplayProps> = (props) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <ErrorDisplay {...props} className="shadow-lg" />
      </div>
    </div>
  );
};

export const InlineErrorDisplay: React.FC<ErrorDisplayProps> = (props) => {
  return (
    <div className="py-4">
      <ErrorDisplay {...props} />
    </div>
  );
};

export const FormErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
      {error}
    </div>
  );
};
'use client';

import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  throwError?: boolean;
  customMessage?: string;
}

export const useErrorHandler = () => {
  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logToConsole = true,
      throwError = false,
      customMessage
    } = options;

    // Normalize error
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    
    // Log to console
    if (logToConsole) {
      console.error('Error handled:', normalizedError);
    }

    // Show toast notification
    if (showToast) {
      const message = customMessage || getErrorMessage(normalizedError);
      toast.error(message);
    }

    // Re-throw if requested
    if (throwError) {
      throw normalizedError;
    }

    return normalizedError;
  }, []);

  const handleApiError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    let message = 'An unexpected error occurred';
    
    // Handle API errors
    if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }

    // Handle network errors
    if (error && typeof error === 'object' && 'status' in error) {
      const status = Number(error.status);
      switch (status) {
        case 401:
          message = 'You are not authorized. Please log in again.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = `Request failed with status ${status}`;
      }
    }

    return handleError(new Error(message), {
      ...options,
      customMessage: options.customMessage || message,
    });
  }, [handleError]);

  const handleAsyncError = useCallback(
    <T>(
      asyncFn: () => Promise<T>,
      options: ErrorHandlerOptions = {}
    ): Promise<T | undefined> => {
      return asyncFn().catch((error) => {
        handleError(error, options);
        return undefined;
      });
    },
    [handleError]
  );

  return {
    handleError,
    handleApiError,
    handleAsyncError,
  };
};

function getErrorMessage(error: Error): string {
  // Common error patterns
  if (error.message.includes('Network')) {
    return 'Network connection failed. Please check your internet connection.';
  }
  
  if (error.message.includes('fetch')) {
    return 'Failed to connect to server. Please try again.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (error.message.includes('JSON')) {
    return 'Invalid server response. Please try again.';
  }
  
  // Return original message if it's user-friendly, otherwise generic message
  const message = error.message || 'An unexpected error occurred';
  return message.length > 100 ? 'An unexpected error occurred' : message;
}
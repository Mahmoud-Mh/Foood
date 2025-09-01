import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ApiErrorBoundary } from '../ApiErrorBoundary';

const ThrowError: React.FC<{ shouldThrow: boolean; error?: Error }> = ({ shouldThrow, error }) => {
  if (shouldThrow) {
    throw error || new Error('Test error');
  }
  return <div>No Error</div>;
};

describe('ApiErrorBoundary', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should render children when no error occurs', () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ApiErrorBoundary>
    );

    expect(screen.getByText('No Error')).toBeInTheDocument();
  });

  it('should render default error UI when error occurs', async () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Test error')} />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Service Error')).toBeInTheDocument();
      expect(screen.getByText('The service is currently unavailable. Please try again later.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'API Error boundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should render network error UI for network-related errors', async () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Network connection failed')} />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('📡')).toBeInTheDocument();
    });
  });

  it('should render network error UI for fetch-related errors', async () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Failed to fetch data from server')} />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection.')).toBeInTheDocument();
    });
  });

  it('should handle retry functionality', async () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Test error')} />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again \(3 remaining\)/i })).toBeInTheDocument();
    });

    // Click retry button
    fireEvent.click(screen.getByRole('button', { name: /try again \(3 remaining\)/i }));

    // After retry, the error boundary will reset and try to render children again
    // Since we're still using the same error-throwing component, it will error again
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again \(2 remaining\)/i })).toBeInTheDocument();
    });
  });

  it('should limit retry attempts', async () => {
    const ErrorComponent = () => {
      throw new Error('Persistent error');
    };

    render(
      <ApiErrorBoundary>
        <ErrorComponent />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again \(3 remaining\)/i })).toBeInTheDocument();
    });

    // Retry 3 times
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      await waitFor(() => {
        if (i < 2) {
          expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        }
      });
    }

    // After 3 retries, retry button should not be available
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    // But refresh page button should still be available
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });

  it('should call refresh page when button is clicked', async () => {
    const reloadSpy = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Test error')} />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /refresh page/i }));

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should render custom fallback when provided', async () => {
    const customFallback = (error: Error, retry: () => void) => (
      <div>
        <h1>Custom Error: {error.message}</h1>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <ApiErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} error={new Error('Custom test error')} />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Error: Custom test error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Retry' })).toBeInTheDocument();
    });
  });

  it('should call onError callback when error occurs', async () => {
    const onError = jest.fn();

    render(
      <ApiErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} error={new Error('Callback test error')} />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  it('should use custom fallback retry functionality', async () => {
    let retryCount = 0;
    const customFallback = (error: Error, retry: () => void) => (
      <div>
        <p>Custom Error: {error.message}</p>
        <button onClick={() => {
          retryCount++;
          retry();
        }}>
          Custom Retry (count: {retryCount})
        </button>
      </div>
    );

    render(
      <ApiErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} error={new Error('Custom error')} />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Error: Custom error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom retry \(count: 0\)/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /custom retry/i }));

    // After retry click, the component should try to render again but will still error
    await waitFor(() => {
      // The retry count should have increased and error boundary should show error again
      expect(screen.getByText('Custom Error: Custom error')).toBeInTheDocument();
    });

    expect(retryCount).toBe(1);
  });

  it('should handle multiple retry attempts', async () => {
    const ErrorComponent = () => {
      throw new Error('Persistent error');
    };

    render(
      <ApiErrorBoundary>
        <ErrorComponent />
      </ApiErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Service Error')).toBeInTheDocument();
    });

    // First retry
    fireEvent.click(screen.getByRole('button', { name: /try again \(3 remaining\)/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again \(2 remaining\)/i })).toBeInTheDocument();
    });

    // Second retry 
    fireEvent.click(screen.getByRole('button', { name: /try again \(2 remaining\)/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again \(1 remaining\)/i })).toBeInTheDocument();
    });
  });
});
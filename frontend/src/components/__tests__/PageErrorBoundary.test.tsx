import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PageErrorBoundary } from '../PageErrorBoundary';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const ThrowError: React.FC<{ shouldThrow: boolean; error?: Error }> = ({ shouldThrow, error }) => {
  if (shouldThrow) {
    throw error || new Error('Test page error');
  }
  return <div>Page Content</div>;
};

// Mock window.location and navigator
const mockLocation = {
  href: 'http://localhost:3000/test-page',
  reload: jest.fn(),
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('PageErrorBoundary', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    consoleSpy.mockClear();
    mockLocation.reload.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should render children when no error occurs', () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={false} />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('should render default error UI when error occurs', async () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Test page error')} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('We encountered an error while loading this page. Don\'t worry, it\'s not your fault.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
      expect(screen.getByText('💥')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Page Error boundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should display custom page name in error message', async () => {
    render(
      <PageErrorBoundary pageName="Recipe Details">
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('We encountered an error while loading Recipe Details. Don\'t worry, it\'s not your fault.')).toBeInTheDocument();
    });
  });

  it('should generate and display error ID', async () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
      expect(screen.getByText('If this problem persists, please contact support with this ID.')).toBeInTheDocument();
    });

    // Check that error ID is a valid format (alphanumeric string)
    const errorIdElement = screen.getByText(/Error ID:/).textContent;
    const errorId = errorIdElement?.replace('Error ID: ', '');
    expect(errorId).toMatch(/^[a-z0-9]+$/);
  });

  it('should call window.location.reload when Try Again is clicked', async () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(mockLocation.reload).toHaveBeenCalledTimes(1);
  });

  it('should render Go Home link with correct href', async () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      const homeLink = screen.getByRole('link', { name: /go home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  it('should call onError callback when error occurs', async () => {
    const onError = jest.fn();

    render(
      <PageErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} error={new Error('Callback test error')} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Callback test error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  it('should log comprehensive error context', async () => {
    const testError = new Error('Context test error');
    
    render(
      <PageErrorBoundary pageName="Test Page">
        <ThrowError shouldThrow={true} error={testError} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Page Error boundary caught an error:',
        testError,
        expect.any(Object)
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error Context:',
        expect.objectContaining({
          pageName: 'Test Page',
          errorId: expect.any(String),
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          userAgent: 'Mozilla/5.0 (Test Browser)',
          url: 'http://localhost:3000/test-page',
        })
      );
    });
  });

  it('should handle errors with different messages', async () => {
    const customError = new Error('Custom error message for testing');
    
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} error={customError} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Page Error boundary caught an error:',
      customError,
      expect.any(Object)
    );
  });

  it('should generate error ID for errors', async () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Test error')} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    });

    const errorIdText = screen.getByText(/Error ID:/).textContent;
    const errorId = errorIdText?.replace('Error ID: ', '');
    
    // Check that error ID is a valid format (alphanumeric string)
    expect(errorId).toMatch(/^[a-z0-9]+$/);
    expect(errorId?.length).toBeGreaterThan(5); // Should be reasonably long
  });

  it('should handle empty page name gracefully', async () => {
    render(
      <PageErrorBoundary pageName="">
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('We encountered an error while loading this page. Don\'t worry, it\'s not your fault.')).toBeInTheDocument();
    });
  });

  it('should have correct styling classes', async () => {
    const { container } = render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      const errorContainer = container.querySelector('.min-h-screen');
      expect(errorContainer).toHaveClass(
        'min-h-screen',
        'bg-gray-50',
        'flex',
        'items-center',
        'justify-center',
        'p-4'
      );

      const errorCard = container.querySelector('.bg-white');
      expect(errorCard).toHaveClass(
        'max-w-md',
        'w-full',
        'bg-white',
        'rounded-lg',
        'shadow-lg',
        'p-8',
        'text-center'
      );
    });
  });

  it('should handle component unmounting gracefully', async () => {
    const { unmount } = render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    // Should not throw error when unmounting
    expect(() => unmount()).not.toThrow();
  });

  it('should handle multiple errors correctly', async () => {
    const FirstError = () => {
      throw new Error('First component error');
    };

    render(
      <PageErrorBoundary>
        <FirstError />
        <div>This won't render</div>
      </PageErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('This won\'t render')).not.toBeInTheDocument();
    });
  });
});
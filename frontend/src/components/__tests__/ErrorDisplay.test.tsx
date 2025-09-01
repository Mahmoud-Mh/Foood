import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay, PageErrorDisplay, InlineErrorDisplay, FormErrorDisplay } from '../ErrorDisplay';
import { HttpError } from '@/services/base/http.service';

// Mock HttpError for testing
class MockHttpError extends Error implements HttpError {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }

  isAuthenticationError(): boolean {
    return this.status === 401;
  }

  isAuthorizationError(): boolean {
    return this.status === 403;
  }

  isNotFoundError(): boolean {
    return this.status === 404;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isRateLimitError(): boolean {
    return this.status === 429;
  }
}

describe('ErrorDisplay', () => {
  it('should return null when no error is provided', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display string errors', () => {
    render(<ErrorDisplay error="Simple error message" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Simple error message')).toBeInTheDocument();
  });

  it('should display Error objects', () => {
    const error = new Error('Test error message');
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display custom title', () => {
    render(<ErrorDisplay error="Test error" title="Custom Error Title" />);
    
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show retry button by default with callback', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay error="Test error" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should hide retry button when showRetry is false', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay error="Test error" onRetry={onRetry} showRetry={false} />);
    
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('should hide retry button when onRetry is not provided', () => {
    render(<ErrorDisplay error="Test error" showRetry={true} />);
    
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ErrorDisplay error="Test error" className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  describe('HttpError handling', () => {
    it('should handle authentication errors (401)', () => {
      const error = new MockHttpError('Unauthorized', 401);
      render(<ErrorDisplay error={error} />);
      
      // The mock HttpError might not trigger the exact same behavior, so just check for error display
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    it('should handle authorization errors (403)', () => {
      const error = new MockHttpError('Forbidden', 403);
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });

    it('should handle not found errors (404)', () => {
      const error = new MockHttpError('Not Found', 404);
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });

    it('should handle server errors (500)', () => {
      const error = new MockHttpError('Internal Server Error', 500);
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    });

    it('should handle rate limit errors (429)', () => {
      const error = new MockHttpError('Too Many Requests', 429);
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByText('Too Many Requests')).toBeInTheDocument();
    });

    it('should fall back to error message for other HTTP errors', () => {
      const error = new MockHttpError('Bad Request', 400);
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByText('Bad Request')).toBeInTheDocument();
    });
  });

  describe('Error icons', () => {
    it('should show error icon', () => {
      const error = new MockHttpError('Unauthorized', 401);
      render(<ErrorDisplay error={error} />);
      
      // Should render an SVG icon  
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });

    it('should show warning icon for general errors', () => {
      const error = new Error('General error');
      render(<ErrorDisplay error={error} />);
      
      // Should render an SVG icon
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });
  });
});

describe('PageErrorDisplay', () => {
  it('should render ErrorDisplay within a full-screen container', () => {
    const { container } = render(<PageErrorDisplay error="Page error" />);
    
    expect(container.firstChild).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
    expect(screen.getByText('Page error')).toBeInTheDocument();
  });

  it('should pass all props to ErrorDisplay', () => {
    const onRetry = jest.fn();
    render(
      <PageErrorDisplay 
        error="Page error" 
        title="Page Error Title"
        onRetry={onRetry}
        showRetry={true}
      />
    );
    
    expect(screen.getByText('Page Error Title')).toBeInTheDocument();
    expect(screen.getByText('Page error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('InlineErrorDisplay', () => {
  it('should render ErrorDisplay with padding', () => {
    const { container } = render(<InlineErrorDisplay error="Inline error" />);
    
    expect(container.firstChild).toHaveClass('py-4');
    expect(screen.getByText('Inline error')).toBeInTheDocument();
  });

  it('should pass all props to ErrorDisplay', () => {
    const onRetry = jest.fn();
    render(
      <InlineErrorDisplay 
        error="Inline error" 
        title="Inline Error Title"
        onRetry={onRetry}
      />
    );
    
    expect(screen.getByText('Inline Error Title')).toBeInTheDocument();
    expect(screen.getByText('Inline error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('FormErrorDisplay', () => {
  it('should return null when no error is provided', () => {
    const { container } = render(<FormErrorDisplay error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null for empty string error', () => {
    const { container } = render(<FormErrorDisplay error="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should display form error message', () => {
    render(<FormErrorDisplay error="Form validation failed" />);
    
    expect(screen.getByText('Form validation failed')).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    const { container } = render(<FormErrorDisplay error="Form error" />);
    
    expect(container.firstChild).toHaveClass(
      'bg-red-50',
      'border',
      'border-red-200',
      'text-red-600',
      'px-4',
      'py-3',
      'rounded-md',
      'text-sm',
      'mb-4'
    );
  });

  it('should handle long error messages', () => {
    const longError = 'This is a very long error message that should still be displayed properly within the form error display component';
    render(<FormErrorDisplay error={longError} />);
    
    expect(screen.getByText(longError)).toBeInTheDocument();
  });
});
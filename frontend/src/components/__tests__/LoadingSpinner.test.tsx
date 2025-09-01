import { render, screen } from '@testing-library/react';
import React from 'react';
import { LoadingSpinner, PageLoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading spinner with default size', () => {
    render(<LoadingSpinner />);
    
    // Check if the spinner element is rendered
    const spinnerElement = screen.getByRole('status');
    expect(spinnerElement).toBeInTheDocument();
  });

  it('renders loading spinner with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
  });

  it('renders loading spinner with message', () => {
    render(<LoadingSpinner message="Loading content..." />);
    
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('renders loading spinner without message', () => {
    render(<LoadingSpinner />);
    
    // Should not have any text content
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
  });
});

describe('PageLoadingSpinner', () => {
  it('renders page loading spinner with default message', () => {
    render(<PageLoadingSpinner />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders page loading spinner with custom message', () => {
    render(<PageLoadingSpinner message="Loading recipes..." />);
    
    expect(screen.getByText('Loading recipes...')).toBeInTheDocument();
  });

  it('has full screen layout classes', () => {
    render(<PageLoadingSpinner />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('min-h-screen');
  });
});
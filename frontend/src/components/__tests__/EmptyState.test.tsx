import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EmptyState, SearchEmptyState } from '../EmptyState';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, className, ...props }: any) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    );
  };
});

describe('EmptyState', () => {
  const defaultProps = {
    title: 'No items found',
    description: 'There are no items to display at this time.',
  };

  it('renders title and description', () => {
    render(<EmptyState {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('No items found');
    expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
  });

  it('renders default icon when no custom icon provided', () => {
    render(<EmptyState {...defaultProps} />);

    // Check for default SVG icon
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const customIcon = <div data-testid="custom-icon">🎨</div>;
    
    render(<EmptyState {...defaultProps} icon={customIcon} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByTestId('custom-icon')).toHaveTextContent('🎨');
  });

  it('renders link action when actionHref is provided', () => {
    render(
      <EmptyState 
        {...defaultProps} 
        actionLabel="Create New Item" 
        actionHref="/create"
      />
    );

    const link = screen.getByRole('link', { name: 'Create New Item' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/create');
    expect(link).toHaveClass('bg-indigo-600', 'text-white');
  });

  it('renders button action when actionOnClick is provided', () => {
    const mockOnClick = jest.fn();
    
    render(
      <EmptyState 
        {...defaultProps} 
        actionLabel="Try Again" 
        actionOnClick={mockOnClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Try Again' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-indigo-600', 'text-white');
  });

  it('handles button click action', () => {
    const mockOnClick = jest.fn();
    
    render(
      <EmptyState 
        {...defaultProps} 
        actionLabel="Click Me" 
        actionOnClick={mockOnClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action when no actionLabel provided', () => {
    render(<EmptyState {...defaultProps} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('prioritizes link action when both actionHref and actionOnClick provided', () => {
    const mockOnClick = jest.fn();
    
    render(
      <EmptyState 
        {...defaultProps} 
        actionLabel="Action" 
        actionHref="/link"
        actionOnClick={mockOnClick}
      />
    );

    // Should render link, not button
    expect(screen.getByRole('link', { name: 'Action' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<EmptyState {...defaultProps} className="custom-class" />);

    const container = screen.getByRole('heading', { level: 3 }).closest('.text-center');
    expect(container).toHaveClass('custom-class');
  });

  it('has proper semantic HTML structure', () => {
    render(<EmptyState {...defaultProps} actionLabel="Action" actionHref="/test" />);

    // Check for heading
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    
    // Check for descriptive text
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
    
    // Check for action link
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});

describe('SearchEmptyState', () => {
  it('renders with search term', () => {
    render(<SearchEmptyState searchTerm="pizza" />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('No results found');
    expect(screen.getByText(/No results found for "pizza"/)).toBeInTheDocument();
  });

  it('renders without search term', () => {
    render(<SearchEmptyState />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('No results found');
    expect(screen.getByText(/No items match your current filters/)).toBeInTheDocument();
  });

  it('renders clear filters button when onClear provided', () => {
    const mockOnClear = jest.fn();
    
    render(<SearchEmptyState onClear={mockOnClear} />);

    const button = screen.getByRole('button', { name: 'Clear filters' });
    expect(button).toBeInTheDocument();
  });

  it('handles clear filters click', () => {
    const mockOnClear = jest.fn();
    
    render(<SearchEmptyState searchTerm="test" onClear={mockOnClear} />);

    const button = screen.getByRole('button', { name: 'Clear filters' });
    fireEvent.click(button);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('does not render clear button when onClear not provided', () => {
    render(<SearchEmptyState searchTerm="test" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders search icon', () => {
    render(<SearchEmptyState />);

    // Check for search icon SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Check for search-specific path (magnifying glass icon)
    const searchPath = document.querySelector('path[d*="21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"]');
    expect(searchPath).toBeInTheDocument();
  });

  it('combines search term and clear functionality', () => {
    const mockOnClear = jest.fn();
    
    render(<SearchEmptyState searchTerm="nonexistent" onClear={mockOnClear} />);

    expect(screen.getByText(/No results found for "nonexistent"/)).toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: 'Clear filters' });
    fireEvent.click(button);
    
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });
});
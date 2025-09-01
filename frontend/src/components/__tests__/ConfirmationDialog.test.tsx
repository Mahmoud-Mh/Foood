import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ConfirmationDialog from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('renders dialog when isOpen is true', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('renders default button text', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders custom button text', () => {
    render(
      <ConfirmationDialog 
        {...defaultProps} 
        confirmText="Delete" 
        cancelText="Keep" 
      />
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const backdrop = document.querySelector('.bg-black.bg-opacity-50');
    fireEvent.click(backdrop!);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('shows warning icon for non-dangerous actions', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const warningIcon = document.querySelector('.text-yellow-600');
    expect(warningIcon).toBeInTheDocument();
    
    const dangerIcon = document.querySelector('.text-red-600');
    expect(dangerIcon).not.toBeInTheDocument();
  });

  it('shows danger icon for dangerous actions', () => {
    render(<ConfirmationDialog {...defaultProps} isDangerous={true} />);

    const dangerIcon = document.querySelector('.text-red-600');
    expect(dangerIcon).toBeInTheDocument();
    
    const warningIcon = document.querySelector('.text-yellow-600');
    expect(warningIcon).not.toBeInTheDocument();
  });

  it('applies danger styling to confirm button when isDangerous is true', () => {
    render(<ConfirmationDialog {...defaultProps} isDangerous={true} />);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('applies normal styling to confirm button when isDangerous is false', () => {
    render(<ConfirmationDialog {...defaultProps} isDangerous={false} />);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveClass('bg-indigo-600');
  });

  it('shows loading state when isLoading is true', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: /processing/i });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveClass('opacity-50', 'cursor-not-allowed');

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeDisabled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading={true} />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('prevents body scroll when dialog is open', () => {
    const originalOverflow = document.body.style.overflow;
    
    render(<ConfirmationDialog {...defaultProps} isOpen={true} />);

    expect(document.body.style.overflow).toBe('hidden');

    // Cleanup is handled by useEffect cleanup
  });

  it('restores body scroll when dialog is closed', () => {
    const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={true} />);
    
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);

    // The cleanup function should restore overflow
    expect(document.body.style.overflow).toBe('unset');
  });

  it('has proper accessibility attributes', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    // Check for heading
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Confirm Action');

    // Check for buttons
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('handles focus management correctly', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    // Both buttons should be focusable
    expect(confirmButton).not.toHaveAttribute('tabindex', '-1');
    expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
  });

  it('prevents action when loading', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading={true} />);

    const confirmButton = screen.getByRole('button', { name: /processing/i });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    fireEvent.click(confirmButton);
    fireEvent.click(cancelButton);

    // Neither should be called because buttons are disabled
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('renders with long text content', () => {
    const longMessage = 'This is a very long message that should still be displayed properly within the dialog boundaries and should not break the layout or cause any visual issues.';
    
    render(
      <ConfirmationDialog 
        {...defaultProps} 
        message={longMessage}
      />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});
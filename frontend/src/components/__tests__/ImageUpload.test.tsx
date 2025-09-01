import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ImageUpload from '../ImageUpload';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, onLoadStart, fill, className, unoptimized, ...props }: any) {
    // Don't pass unoptimized to DOM element
    const { unoptimized: _unoptimized, ...domProps } = props;
    
    return (
      <img 
        src={src} 
        alt={alt} 
        onLoad={onLoad}
        onError={onError}
        onLoadStart={onLoadStart}
        className={className}
        style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : undefined}
        {...domProps} 
      />
    );
  };
});

// Mock services
jest.mock('@/services', () => ({
  httpService: {
    post: jest.fn(),
  },
  authService: {
    isAuthenticated: jest.fn(() => true),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
});
Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
});

describe('ImageUpload', () => {
  const mockOnImageChange = jest.fn();
  const mockOnError = jest.fn();
  
  const defaultProps = {
    onImageChange: mockOnImageChange,
    onError: mockOnError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:test-url');
  });

  it('renders upload area with default props', () => {
    render(<ImageUpload {...defaultProps} />);

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument(); // Hidden file input
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<ImageUpload {...defaultProps} size="sm" />);
    let uploadDiv = document.querySelector('.w-16.h-16');
    expect(uploadDiv).toBeInTheDocument();

    rerender(<ImageUpload {...defaultProps} size="md" />);
    uploadDiv = document.querySelector('.w-24.h-24');
    expect(uploadDiv).toBeInTheDocument();

    rerender(<ImageUpload {...defaultProps} size="lg" />);
    uploadDiv = document.querySelector('.w-32.h-32');
    expect(uploadDiv).toBeInTheDocument();
  });

  it('shows current image when provided', () => {
    render(<ImageUpload {...defaultProps} currentImageUrl="/test-image.jpg" />);

    const image = screen.getByAltText('Upload preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('shows remove button when image is present', () => {
    render(<ImageUpload {...defaultProps} currentImageUrl="/test-image.jpg" />);

    const removeButton = screen.getByTitle('Remove image');
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent('×');
  });

  it('handles remove button click', () => {
    render(<ImageUpload {...defaultProps} currentImageUrl="/test-image.jpg" />);

    const removeButton = screen.getByTitle('Remove image');
    fireEvent.click(removeButton);

    expect(mockOnImageChange).toHaveBeenCalledWith('');
  });

  it('opens file dialog when upload area is clicked', () => {
    const clickSpy = jest.spyOn(HTMLInputElement.prototype, 'click');
    render(<ImageUpload {...defaultProps} />);

    const uploadArea = screen.getByText('Upload').closest('div');
    fireEvent.click(uploadArea!);

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('handles file selection via input', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { httpService } = require('@/services');
    httpService.post.mockResolvedValue({
      success: true,
      data: { url: '/uploaded/test.jpg' }
    });

    render(<ImageUpload {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(httpService.post).toHaveBeenCalledWith(
        '/uploads/avatar',
        expect.any(FormData)
      );
    });

    expect(mockOnImageChange).toHaveBeenCalledWith('/uploaded/test.jpg');
  });

  it('validates file type', () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    render(<ImageUpload {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(mockOnError).toHaveBeenCalledWith('Please select an image file');
  });

  it('validates file size', () => {
    const mockFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { 
      type: 'image/jpeg' 
    });
    
    render(<ImageUpload {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(mockOnError).toHaveBeenCalledWith('File size must be less than 5MB');
  });

  it('handles drag and drop events', () => {
    render(<ImageUpload {...defaultProps} />);

    // Find the actual drag target (the upload area div)
    const uploadArea = screen.getByText('Upload').closest('div')?.parentElement;

    // Test drag over
    fireEvent.dragOver(uploadArea!);
    expect(uploadArea).toHaveClass('border-indigo-500', 'bg-indigo-50');

    // Test drag leave
    fireEvent.dragLeave(uploadArea!);
    expect(uploadArea).toHaveClass('border-gray-300');
  });

  it('handles file drop', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { httpService } = require('@/services');
    httpService.post.mockResolvedValue({
      success: true,
      data: { url: '/dropped/test.jpg' }
    });

    render(<ImageUpload {...defaultProps} />);

    const uploadArea = screen.getByText('Upload').closest('div')?.parentElement!;
    
    fireEvent.drop(uploadArea, {
      dataTransfer: { files: [mockFile] }
    });

    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith('/dropped/test.jpg');
    });
  });

  it('shows loading state during upload', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { httpService } = require('@/services');
    
    // Mock delayed response
    httpService.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { url: '/test.jpg' }
      }), 100))
    );

    render(<ImageUpload {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Check for loading state elements
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
    
    const uploadArea = document.querySelector('.opacity-50.pointer-events-none');
    expect(uploadArea).toBeInTheDocument();
  });

  it('handles upload error', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { httpService } = require('@/services');
    httpService.post.mockRejectedValue(new Error('Upload failed'));

    render(<ImageUpload {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Upload failed');
    });
  });

  it('uses correct endpoint for recipe type', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { httpService } = require('@/services');
    httpService.post.mockResolvedValue({
      success: true,
      data: { url: '/recipe.jpg' }
    });

    render(<ImageUpload {...defaultProps} type="recipe" />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(httpService.post).toHaveBeenCalledWith(
        '/uploads/recipe',
        expect.any(FormData)
      );
    });
  });

  it('uses public endpoint when not authenticated', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { httpService, authService } = require('@/services');
    authService.isAuthenticated.mockReturnValue(false);
    httpService.post.mockResolvedValue({
      success: true,
      data: { url: '/public-avatar.jpg' }
    });

    render(<ImageUpload {...defaultProps} type="avatar" />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(httpService.post).toHaveBeenCalledWith(
        '/uploads/avatar/public',
        expect.any(FormData)
      );
    });
  });

  it('prevents recipe upload when not authenticated', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { authService } = require('@/services');
    authService.isAuthenticated.mockReturnValue(false);

    render(<ImageUpload {...defaultProps} type="recipe" />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(mockOnError).toHaveBeenCalledWith('You must be logged in to upload recipe images');
  });

  it('handles image load error', () => {
    render(<ImageUpload {...defaultProps} currentImageUrl="/broken-image.jpg" />);

    const image = screen.getByAltText('Upload preview');
    fireEvent.error(image);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(mockOnError).toHaveBeenCalledWith('Failed to load image: /broken-image.jpg');
  });

  it('shows file format info for large size', () => {
    render(<ImageUpload {...defaultProps} size="lg" />);

    expect(screen.getByText('Supports JPG, PNG, GIF, WebP up to 5MB')).toBeInTheDocument();
  });

  it('cleans up blob URLs on unmount', async () => {
    // First create a blob URL by uploading a file
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { httpService } = require('@/services');
    httpService.post.mockResolvedValue({
      success: true,
      data: { url: '/test.jpg' }
    });

    const { unmount } = render(<ImageUpload {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Wait for the upload process to start (creates blob URL)
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    unmount();

    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
});
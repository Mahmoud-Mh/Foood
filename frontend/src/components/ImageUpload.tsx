'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { httpService, authService } from '@/services';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  onError?: (error: string) => void;
  type?: 'avatar' | 'recipe';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface UploadResponse {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  onError,
  type = 'avatar',
  className = '',
  size = 'md',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setImageLoadError(false);

    // Clean up previous blob URL
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }

    // Create new blob URL for preview
    const blobUrl = URL.createObjectURL(file);
    currentBlobUrlRef.current = blobUrl;
    setPreviewUrl(blobUrl);

    try {
      const formData = new FormData();
      // Backend expects 'image' for recipe uploads, 'avatar' for avatar uploads
      const fieldName = type === 'recipe' ? 'image' : type;
      formData.append(fieldName, file);

      // Use public endpoint for registration (when not authenticated)
      const isAuthenticated = authService.isAuthenticated();
      const endpoint = isAuthenticated
        ? `/uploads/${type}`
        : type === 'avatar'
          ? `/uploads/avatar/public`
          : (() => {
              throw new Error('You must be logged in to upload recipe images');
            })();

      const response = await httpService.post<UploadResponse>(endpoint, formData);

      if (response.success && response.data) {
        onImageChange(response.data.url);
        // Clear preview and cleanup blob URL
        setPreviewUrl(null);
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setPreviewUrl(null);
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onError, onImageChange, type]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      void uploadFile(files[0]);
    }
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      void uploadFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayImageUrl = previewUrl || currentImageUrl;

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  // Reset error state when image URL changes
  useEffect(() => {
    setImageLoadError(false);
    setIsImageLoading(false);
  }, [displayImageUrl]);

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          ${sizeClasses[size]} 
          relative cursor-pointer rounded-full border-2 border-dashed
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'} 
          ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-400 hover:bg-gray-50'} 
          transition-colors duration-200 flex items-center justify-center overflow-hidden
        `}
      >
        {displayImageUrl && !imageLoadError ? (
          <>
            <Image
              src={displayImageUrl}
              alt="Upload preview"
              fill
              className="object-cover rounded-full"
              onLoad={() => setIsImageLoading(false)}
              onLoadStart={() => setIsImageLoading(true)}
              onError={() => {
                console.error('Image failed to load:', displayImageUrl);
                setImageLoadError(true);
                setIsImageLoading(false);
                onError?.(`Failed to load image: ${displayImageUrl}`);
              }}
              unoptimized={displayImageUrl.startsWith('blob:')} // Don't optimize blob URLs (preview)
            />
            
            {/* Loading overlay */}
            {isImageLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            {imageLoadError ? (
              <>
                <svg
                  className="mx-auto h-8 w-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="mt-1 text-xs text-red-500">
                  {size === 'lg' ? 'Failed to load. Click to retry' : 'Error'}
                </p>
              </>
            ) : (
              <>
                <svg
                  className="mx-auto h-8 w-8 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-1 text-xs text-gray-500">
                  {size === 'lg' ? 'Click or drag to upload' : 'Upload'}
                </p>
              </>
            )}
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {/* Remove button - only show if there's an image and not uploading */}
      {displayImageUrl && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onImageChange(''); // Clear the image
          }}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors z-10 shadow-md"
          title="Remove image"
        >
          ×
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {size === 'lg' && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">Supports JPG, PNG, GIF, WebP up to 5MB</p>
        </div>
      )}
    </div>
  );
} 
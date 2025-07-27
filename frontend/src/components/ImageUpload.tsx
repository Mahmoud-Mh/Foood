'use client';

import { useState, useRef, useCallback } from 'react';
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
  size = 'md'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const uploadFile = async (file: File) => {
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
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append(type, file);

      // Use public endpoint for registration (when not authenticated)
      const isAuthenticated = authService.isAuthenticated();
      const endpoint = isAuthenticated 
        ? `/uploads/${type}` 
        : `/uploads/${type}/public`;

      const response = await httpService.post<UploadResponse>(
        endpoint,
        formData
        // Don't set Content-Type manually - let browser set it with boundary
      );

      if (response.success && response.data) {
        onImageChange(response.data.url);
        setPreviewUrl(null); // Clear preview since we have the real URL
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setPreviewUrl(null);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
  }, []);

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
      uploadFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayImageUrl = previewUrl || currentImageUrl;

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
        {displayImageUrl ? (
          <>
            {/* Use Next.js Image for all images now that CORS is fixed */}
            <Image
              src={displayImageUrl}
              alt="Upload preview"
              fill
              className="object-cover rounded-full"
              onError={(e) => {
                console.error('Image failed to load:', displayImageUrl);
                onError?.(`Failed to load image: ${displayImageUrl}`);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', displayImageUrl);
              }}
              unoptimized={displayImageUrl.startsWith('blob:')} // Don't optimize blob URLs (preview)
            />
            {/* Temporarily remove hover overlay - it's covering the image */}
            {/* {!isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center rounded-full">
                <svg 
                  className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </div>
            )} */}
          </>
        ) : (
          <div className="text-center">
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
          <p className="text-xs text-gray-500">
            Supports JPG, PNG, GIF, WebP up to 5MB
          </p>
        </div>
      )}
    </div>
  );
} 
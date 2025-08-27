import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]}`}></div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
};

export const PageLoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
};

export const InlineLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" message={message} />
    </div>
  );
};

export const ButtonLoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
    </div>
  );
};
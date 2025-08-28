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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative">
          {/* Floating recipe icons - responsive sizes */}
          <div className="absolute -top-12 -left-12 sm:-top-20 sm:-left-20 w-10 h-10 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '0s' }}>
            <span className="text-lg sm:text-2xl">🍳</span>
          </div>
          <div className="absolute -top-10 -right-16 sm:-top-16 sm:-right-24 w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
            <span className="text-sm sm:text-xl">🥗</span>
          </div>
          <div className="absolute -bottom-12 -left-10 sm:-bottom-20 sm:-left-16 w-10 h-10 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '2s' }}>
            <span className="text-base sm:text-xl">🍕</span>
          </div>
          <div className="absolute -bottom-10 -right-12 sm:-bottom-16 sm:-right-20 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '1.5s' }}>
            <span className="text-sm sm:text-lg">🧁</span>
          </div>
          
          {/* Main loading content */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-12 border border-gray-100 max-w-sm sm:max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6">
              <div className="animate-spin rounded-full border-3 sm:border-4 border-gray-200">
                <div className="w-full h-full rounded-full border-3 sm:border-4 border-transparent border-t-indigo-600 border-r-purple-600 animate-spin"></div>
              </div>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3">
              Recipe Hub
            </h2>
            <p className="text-gray-600 animate-pulse text-sm sm:text-base">
              {message}
            </p>
            
            {/* Loading dots */}
            <div className="flex justify-center mt-4 sm:mt-6 space-x-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
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
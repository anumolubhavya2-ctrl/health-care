import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <div
    className={`${sizes[size]} ${className} rounded-full border-2 border-gray-200 border-t-primary-600 animate-spin`}
    role="status"
    aria-label="Loading"
  />
);

export const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Loading CareSync...</p>
    </div>
  </div>
);

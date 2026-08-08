import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-doan-100 border-t-doan-600 animate-spin`}
        role="status"
        aria-label="loading"
      />
      {label && <span className="text-sm font-medium text-slate-600 animate-pulse">{label}</span>}
    </div>
  );
};

export const ButtonSpinner: React.FC<{ label?: string }> = ({ label = 'Đang xử lý...' }) => {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg
        className="animate-spin -ml-1 h-4 w-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {label}
    </span>
  );
};

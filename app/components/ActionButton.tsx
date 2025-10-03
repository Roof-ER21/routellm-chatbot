'use client';

/**
 * ActionButton Component
 *
 * Reusable button component that triggers actual actions instead of message prefills
 */

import { useState, ReactNode } from 'react';

export interface ActionButtonProps {
  type: 'template' | 'photo' | 'email' | 'storm' | 'company' | 'export' | 'voice' | 'custom';
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onAction: () => Promise<void> | void;
  className?: string;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white',
  secondary: 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
  success: 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white',
  danger: 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white',
  warning: 'bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white',
};

const sizeStyles = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

export default function ActionButton({
  type,
  label,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onAction,
  className = '',
  fullWidth = false,
}: ActionButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleClick = async () => {
    if (disabled || isExecuting || loading) return;

    setIsExecuting(true);
    try {
      await onAction();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const isDisabled = disabled || isExecuting || loading;
  const showLoading = isExecuting || loading;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-[1.02]'}
        rounded-xl font-semibold transition-all duration-200
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {showLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="text-xl">{icon}</span>}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

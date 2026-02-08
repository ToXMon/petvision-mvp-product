'use client';

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AuthButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    MotionProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText = 'Loading...',
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const getVariantStyles = (): string => {
      switch (variant) {
        case 'primary':
          return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-transparent';
        case 'secondary':
          return 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-transparent';
        case 'ghost':
          return 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent';
        case 'outline':
          return 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500';
        default:
          return 'bg-blue-600 hover:bg-blue-700 text-white border-transparent';
      }
    };

    const getSizeStyles = (): string => {
      switch (size) {
        case 'sm':
          return 'px-4 py-2 text-sm font-semibold';
        case 'md':
          return 'px-6 py-3 text-base font-semibold';
        case 'lg':
          return 'px-8 py-4 text-lg font-semibold';
        default:
          return 'px-6 py-3 text-base font-semibold';
      }
    };

    const getDisabledStyles = (): string => {
      if (isLoading || disabled) {
        return 'opacity-60 cursor-not-allowed pointer-events-none';
      }
      return 'cursor-pointer';
    };

    const isDisabled = isLoading || disabled;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${getVariantStyles()} ${getSizeStyles()} ${getDisabledStyles()} ${fullWidth ? 'w-full' : ''} ${className}`}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}

        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        <span className={isLoading ? 'opacity-70' : ''}>
          {isLoading ? loadingText : children}
        </span>

        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

AuthButton.displayName = 'AuthButton';

export default AuthButton;

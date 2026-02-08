'use client';

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle } from 'lucide-react';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'url';

interface AuthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  type?: InputType;
  error?: string;
  helperText?: string;
  icon?: 'email' | 'password' | 'name' | 'lock' | 'custom';
  showPasswordToggle?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  containerClassName?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({
    label,
    type = 'text',
    error,
    helperText,
    icon,
    showPasswordToggle = false,
    rightIcon,
    onRightIconClick,
    containerClassName = '',
    className = '',
    id,
    required = false,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const getInputType = () => {
      if (type === 'password') {
        return showPassword ? 'text' : 'password';
      }
      return type;
    };

    const getIcon = () => {
      switch (icon) {
        case 'email':
          return <Mail className="w-5 h-5" />;
        case 'password':
        case 'lock':
          return <Lock className="w-5 h-5" />;
        case 'name':
          return <User className="w-5 h-5" />;
        default:
          return null;
      }
    };

    const getIconColor = () => {
      if (error) {
        return 'text-red-500 dark:text-red-400';
      }
      if (isFocused) {
        return 'text-blue-500 dark:text-blue-400';
      }
      return 'text-gray-400 dark:text-gray-500';
    };

    const getBorderColor = () => {
      if (error) {
        return 'border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500';
      }
      if (isFocused) {
        return 'border-blue-500 focus:border-blue-500 dark:border-blue-500 dark:focus:border-blue-500';
      }
      return 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500';
    };

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {icon && (
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${getIconColor()}`}
            >
              {getIcon()}
            </div>
          )}

          {/* Input Field */}
          <motion.input
            ref={ref}
            id={inputId}
            type={getInputType()}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`w-full px-${icon ? '12' : '4'} py-3 pr-${
              showPasswordToggle || rightIcon ? '12' : '4'
    } bg-white dark:bg-gray-800 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${getBorderColor()} ${className}`}
            {...props}
          />

          {/* Right Side Icons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}

            {rightIcon && (
              <button
                type="button"
                onClick={onRightIconClick}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
              >
                {rightIcon}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helper Text */}
        {!error && helperText && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';

export default AuthInput;

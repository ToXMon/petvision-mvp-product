'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FormFeedbackProps {
  type: FeedbackType;
  message: string;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FormFeedback: React.FC<FormFeedbackProps> = ({
  type,
  message,
  title,
  dismissible = false,
  onDismiss,
  showIcon = true,
  className = '',
  size = 'md',
}) => {
  const getFeedbackConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-500',
          textColor: 'text-green-900 dark:text-green-100',
          icon: <CheckCircle className="w-5 h-5" />,
          iconColor: 'text-green-500',
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-500',
          textColor: 'text-red-900 dark:text-red-100',
          icon: <XCircle className="w-5 h-5" />,
          iconColor: 'text-red-500',
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-900 dark:text-yellow-100',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-yellow-500',
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-900 dark:text-blue-100',
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-blue-500',
        };
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-900 dark:text-gray-100',
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-gray-500',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'p-3 text-sm';
      case 'lg':
        return 'p-5 text-lg';
      default:
        return 'p-4 text-base';
    }
  };

  const config = getFeedbackConfig();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl ${getSizeStyles()} ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          {showIcon && (
            <div className={`flex-shrink-0 ${config.iconColor}`}>
              {config.icon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`font-bold ${config.textColor} mb-1`}>
                {title}
              </h4>
            )}
            <p className={config.textColor}>{message}</p>
          </div>

          {dismissible && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Inline form feedback component for field-level messages
export interface InlineFeedbackProps {
  type: FeedbackType;
  message: string;
  className?: string;
}

export const InlineFeedback: React.FC<InlineFeedbackProps> = ({
  type,
  message,
  className = '',
}) => {
  const getFeedbackConfig = () => {
    switch (type) {
      case 'success':
        return {
          textColor: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle className="w-4 h-4" />,
        };
      case 'error':
        return {
          textColor: 'text-red-600 dark:text-red-400',
          icon: <XCircle className="w-4 h-4" />,
        };
      case 'warning':
        return {
          textColor: 'text-yellow-600 dark:text-yellow-400',
          icon: <AlertCircle className="w-4 h-4" />,
        };
      case 'info':
        return {
          textColor: 'text-blue-600 dark:text-blue-400',
          icon: <Info className="w-4 h-4" />,
        };
      default:
        return {
          textColor: 'text-gray-600 dark:text-gray-400',
          icon: <Info className="w-4 h-4" />,
        };
    }
  };

  const config = getFeedbackConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-2 mt-1 text-sm ${config.textColor} ${className}`}
      >
        <span className="flex-shrink-0">{config.icon}</span>
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default FormFeedback;

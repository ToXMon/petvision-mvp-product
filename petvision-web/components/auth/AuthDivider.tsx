'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AuthDividerProps {
  text?: string;
  className?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({
  text = 'OR',
  className = '',
}) => {
  return (
    <div className={`relative my-6 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t-2 border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-sm">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold"
        >
          {text}
        </motion.span>
      </div>
    </div>
  );
};

// Alternative divider with custom content
export interface AuthDividerWithContentProps {
  children?: React.ReactNode;
  className?: string;
}

export const AuthDividerWithContent: React.FC<AuthDividerWithContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`relative my-6 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t-2 border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="px-4 bg-white dark:bg-gray-800"
        >
          {children}
        </motion.span>
      </div>
    </div>
  );
};

export default AuthDivider;

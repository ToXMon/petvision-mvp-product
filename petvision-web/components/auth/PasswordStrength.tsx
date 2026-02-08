'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Shield } from 'lucide-react';
import { PasswordStrength as PasswordStrengthType } from '@/lib/auth/types';

interface PasswordStrengthProps {
  password: string;
  showDetails?: boolean;
  className?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showDetails = true,
  className = '',
}) => {
  const strength = useMemo((): PasswordStrengthType => {
    if (!password) {
      return {
        score: 0,
        label: 'Weak',
        color: '#EF4444',
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumber: false,
          hasSpecial: false,
        },
      };
    }

    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    const getStrengthInfo = (score: number) => {
      switch (score) {
        case 0:
          return { label: 'Weak', color: '#EF4444' };
        case 1:
          return { label: 'Weak', color: '#EF4444' };
        case 2:
          return { label: 'Fair', color: '#F59E0B' };
        case 3:
          return { label: 'Good', color: '#3B82F6' };
        case 4:
          return { label: 'Strong', color: '#10B981' };
        case 5:
          return { label: 'Excellent', color: '#10B981' };
        default:
          return { label: 'Weak', color: '#EF4444' };
      }
    };

    const { label, color } = getStrengthInfo(score);

    return {
      score,
      label,
      color,
      requirements,
    };
  }, [password]);

  const getStrengthLevel = () => {
    if (strength.score === 0) return 'Enter password';
    if (strength.score <= 1) return 'Weak';
    if (strength.score <= 2) return 'Fair';
    if (strength.score <= 3) return 'Good';
    if (strength.score <= 4) return 'Strong';
    return 'Excellent';
  };

  const RequirementItem: React.FC<{
    met: boolean;
    label: string;
  }> = ({ met, label }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 text-sm"
    >
      {met ? (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <X className="w-3 h-3 text-gray-400" />
        </div>
      )}
      <span className={met ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
        {label}
      </span>
    </motion.div>
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Strength Bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={strength.score}
              initial={{ width: 0 }}
              animate={{ width: `${(strength.score / 5) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: strength.color }}
            />
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-2">
          <Shield
            className="w-5 h-5"
            style={{ color: password ? strength.color : '#9CA3AF' }}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={strength.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-semibold"
              style={{ color: password ? strength.color : '#9CA3AF' }}
            >
              {getStrengthLevel()}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Requirements List */}
      <AnimatePresence>
        {showDetails && password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <RequirementItem
              met={strength.requirements.minLength}
              label="At least 8 characters"
            />
            <RequirementItem
              met={strength.requirements.hasUppercase}
              label="Contains uppercase letter"
            />
            <RequirementItem
              met={strength.requirements.hasLowercase}
              label="Contains lowercase letter"
            />
            <RequirementItem
              met={strength.requirements.hasNumber}
              label="Contains number"
            />
            <RequirementItem
              met={strength.requirements.hasSpecial}
              label="Contains special character"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PasswordStrength;

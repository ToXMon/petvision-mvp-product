'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthCard, AuthInput, AuthButton, PasswordStrength, FormFeedback } from '@/components/auth';
import { setNewPassword } from '@/lib/auth/actions';
import { getErrorMessage, AuthErrors } from '@/lib/auth/errors';
import { Lock, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function NewPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = AuthErrors.PASSWORD_MISMATCH.message;
    }

    if (!token) {
      newErrors.token = AuthErrors.INVALID_RESET_TOKEN.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!token) {
      setFormFeedback({ type: 'error', message: 'Invalid reset link. Please request a new one.' });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await setNewPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      
      setIsSuccess(true);
      setFormFeedback({ type: 'success', message: 'Password updated successfully!' });
      
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (error) {
      const authError = getErrorMessage(error);
      setFormFeedback({ type: 'error', message: authError.message });
      
      if (authError.field) {
        setErrors({ [authError.field]: authError.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Set New Password"
      subtitle="Create a strong password for your account"
      illustration="reset"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Icon Animation */}
        {!isSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex justify-center mb-4"
          >
            <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Lock className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex justify-center mb-4"
          >
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </motion.div>
        )}

        {/* Security Tips */}
        {!isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Security Tips</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Use a unique password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form Feedback */}
        <AnimatePresence mode="wait">
          {formFeedback && (
            <FormFeedback
              type={formFeedback.type}
              message={formFeedback.message}
              dismissible
              onDismiss={() => setFormFeedback(null)}
            />
          )}
        </AnimatePresence>

        {!isSuccess && (
          <>
            {/* New Password Input */}
            <div>
              <AuthInput
                type="password"
                label="New Password"
                name="password"
                placeholder="••••••••"
                icon="password"
                showPasswordToggle
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                required
                autoComplete="new-password"
              />
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3">
                  <PasswordStrength password={formData.password} showDetails />
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <AuthInput
              type="password"
              label="Confirm New Password"
              name="confirmPassword"
              placeholder="••••••••"
              icon="password"
              showPasswordToggle
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            {/* Update Password Button */}
            <AuthButton
              type="submit"
              isLoading={isLoading}
              loadingText="Updating password..."
              fullWidth
              leftIcon={<ShieldCheck className="w-5 h-5" />}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Update Password
            </AuthButton>
          </>
        )}

        {isSuccess && (
          <AuthButton
            type="button"
            onClick={() => router.push('/auth/signin')}
            fullWidth
            variant="primary"
          >
            Go to Sign In
          </AuthButton>
        )}

        {/* Back to Sign In Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/auth/signin"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            ← Back to Sign In
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

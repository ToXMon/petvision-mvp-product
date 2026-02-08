'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthCard, AuthInput, AuthButton, FormFeedback } from '@/components/auth';
import { requestPasswordReset } from '@/lib/auth/actions';
import { getErrorMessage, AuthErrors } from '@/lib/auth/errors';
import { Mail, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = AuthErrors.INVALID_EMAIL.message;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = AuthErrors.INVALID_EMAIL.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await requestPasswordReset({ email });
      setIsSuccess(true);
      setFormFeedback({ type: 'success', message: 'Password reset email sent! Check your inbox.' });
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  return (
    <AuthCard
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link"
      illustration="reset"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Icon Animation */}
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

        {/* Instructions */}
        <p className="text-center text-gray-600 dark:text-gray-400">
          {isSuccess
            ? `We've sent a password reset link to ${email}. The link will expire in 1 hour.`
            : 'Enter the email address associated with your account'
          }
        </p>

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
            {/* Email Input */}
            <AuthInput
              type="email"
              label="Email address"
              name="email"
              placeholder="your@email.com"
              icon="email"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              required
              autoComplete="email"
            />

            {/* Send Reset Link Button */}
            <AuthButton
              type="submit"
              isLoading={isLoading}
              loadingText="Sending..."
              fullWidth
              leftIcon={<Mail className="w-5 h-5" />}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Send Reset Link
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
            Back to Sign In
          </AuthButton>
        )}

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link
            href="/auth/signin"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

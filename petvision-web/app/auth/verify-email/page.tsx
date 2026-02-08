'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthCard, AuthInput, AuthButton, FormFeedback } from '@/components/auth';
import { verifyEmail, resendVerificationEmail } from '@/lib/auth/actions';
import { getErrorMessage, AuthErrors } from '@/lib/auth/errors';
import { Mail, Clock, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendCode = async () => {
    if (!email || countdown > 0) return;
    
    setIsResending(true);
    setFormFeedback(null);

    try {
      await resendVerificationEmail(email);
      setFormFeedback({ type: 'success', message: 'New verification code sent!' });
      setCountdown(60);
    } catch (error) {
      const authError = getErrorMessage(error);
      setFormFeedback({ type: 'error', message: authError.message });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const newErrors: Record<string, string> = {};
    if (!code) {
      newErrors.code = 'Verification code is required';
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.code = 'Please enter a valid 6-digit code';
    }

    if (!email) {
      newErrors.email = 'Email is missing. Please start over from sign up.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await verifyEmail({ email, code });
      setFormFeedback({ type: 'success', message: 'Email verified! Redirecting...' });
      
      setTimeout(() => {
        router.push('/dashboard');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (errors.code) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.code;
        return newErrors;
      });
    }
  };

  return (
    <AuthCard
      title="Verify Your Email"
      subtitle={`We've sent a 6-digit code to ${email || 'your email'}`}
      illustration="signin"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Icon Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Mail className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        {/* Instructions */}
        <p className="text-center text-gray-600 dark:text-gray-400">
          Enter the verification code from your email to activate your account.
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

        {/* Verification Code Input */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative w-full max-w-xs">
            <AuthInput
              type="text"
              label="Verification Code"
              name="code"
              placeholder="000000"
              value={code}
              onChange={handleInputChange}
              error={errors.code}
              required
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]*"
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          {/* Resend Code Button */}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={countdown > 0 || isResending}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
            {countdown > 0 ? (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Resend in {countdown}s
              </span>
            ) : (
              'Resend code'
            )}
          </button>
        </div>

        {/* Verify Button */}
        <AuthButton
          type="submit"
          isLoading={isLoading}
          loadingText="Verifying..."
          fullWidth
          leftIcon={formFeedback?.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : undefined}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Verify Email
        </AuthButton>

        {/* Back to Sign In */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already verified?{' '}
          <button
            type="button"
            onClick={() => router.push('/auth/signin')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            Sign in
          </button>
        </p>
      </form>
    </AuthCard>
  );
}

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AuthCard, 
  AuthInput, 
  AuthButton, 
  SocialLoginButtons, 
  FormFeedback, 
  AuthDivider 
} from '@/components/auth';
import { signIn } from '@/lib/auth/actions';
import { getErrorMessage, AuthErrors } from '@/lib/auth/errors';
import type { AuthProvider } from '@/lib/auth/types';
import { ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<AuthProvider | null>(null);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = AuthErrors.INVALID_EMAIL.message;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = AuthErrors.INVALID_EMAIL.message;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signIn({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      
      setFormFeedback({ type: 'success', message: 'Sign in successful! Redirecting...' });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
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

  const handleSocialLogin = async (provider: AuthProvider) => {
    setSocialLoading(provider);
    setFormFeedback(null);

    try {
      // In a real implementation, this would redirect to OAuth provider
      window.location.href = `/api/auth/oauth/${provider}`;
    } catch (error) {
      const authError = getErrorMessage(error);
      setFormFeedback({ type: 'error', message: authError.message });
      setSocialLoading(null);
    }
  };

  return (
    <AuthCard
      title="Sign In"
      subtitle="Welcome back! Please enter your details."
      illustration="signin"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Social Login */}
        <SocialLoginButtons
          onProviderClick={handleSocialLogin}
          loadingProvider={socialLoading}
        />

        <AuthDivider text="or continue with email" />

        {/* Email Input */}
        <AuthInput
          type="email"
          label="Email address"
          name="email"
          placeholder="your@email.com"
          icon="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          required
          autoComplete="email"
        />

        {/* Password Input */}
        <AuthInput
          type="password"
          label="Password"
          name="password"
          placeholder="••••••••"
          icon="password"
          showPasswordToggle
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          required
          autoComplete="current-password"
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              Remember me
            </span>
          </label>
          
          <Link
            href="/auth/reset-password"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <AuthButton
          type="submit"
          isLoading={isLoading}
          loadingText="Signing in..."
          fullWidth
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Sign In
        </AuthButton>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

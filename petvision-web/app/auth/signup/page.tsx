'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AuthCard, 
  AuthInput, 
  AuthButton, 
  SocialLoginButtons, 
  PasswordStrength,
  FormFeedback, 
  AuthDivider 
} from '@/components/auth';
import { signUp } from '@/lib/auth/actions';
import { getErrorMessage, AuthErrors } from '@/lib/auth/errors';
import type { AuthProvider } from '@/lib/auth/types';
import { UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<AuthProvider | null>(null);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = AuthErrors.INVALID_EMAIL.message;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = AuthErrors.INVALID_EMAIL.message;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = AuthErrors.WEAK_PASSWORD.message;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = AuthErrors.TERMS_REQUIRED.message;
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
      await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        agreeToTerms: formData.agreeToTerms,
      });
      
      setFormFeedback({ type: 'success', message: 'Account created! Please verify your email.' });
      
      setTimeout(() => {
        router.push('/auth/verify-email');
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

  const handleSocialLogin = async (provider: AuthProvider) => {
    setSocialLoading(provider);
    setFormFeedback(null);

    try {
      window.location.href = `/api/auth/oauth/${provider}`;
    } catch (error) {
      const authError = getErrorMessage(error);
      setFormFeedback({ type: 'error', message: authError.message });
      setSocialLoading(null);
    }
  };

  const isPasswordValid = formData.password.length >= 8 &&
    /[A-Z]/.test(formData.password) &&
    /[a-z]/.test(formData.password) &&
    /[0-9]/.test(formData.password) &&
    /[^A-Za-z0-9]/.test(formData.password);

  return (
    <AuthCard
      title="Create Account"
      subtitle="Start your pet's health journey today"
      illustration="signup"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <AuthDivider text="or sign up with email" />

        {/* Name Input */}
        <AuthInput
          type="text"
          label="Full Name"
          name="name"
          placeholder="John Doe"
          icon="name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          required
          autoComplete="name"
        />

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
        <div>
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
            autoComplete="new-password"
          />
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-3">
              <PasswordStrength password={formData.password} />
            </div>
          )}
        </div>

        {/* Confirm Password Input */}
        <AuthInput
          type="password"
          label="Confirm Password"
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

        {/* Terms and Conditions */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className={`w-5 h-5 mt-0.5 rounded border-2 cursor-pointer transition-colors ${
                errors.agreeToTerms
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            <span className={`text-sm ${
              errors.agreeToTerms ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              I agree to the{' '}
              <Link
                href="/terms"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link
                href="/privacy"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.agreeToTerms}</p>
          )}
        </div>

        {/* Sign Up Button */}
        <AuthButton
          type="submit"
          isLoading={isLoading}
          loadingText="Creating account..."
          fullWidth
          leftIcon={<UserPlus className="w-5 h-5" />}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Create Account
        </AuthButton>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
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

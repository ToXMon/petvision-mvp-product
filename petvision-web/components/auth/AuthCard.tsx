'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, Heart } from 'lucide-react';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  illustration?: 'signin' | 'signup' | 'reset';
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  title,
  subtitle,
  illustration = 'signin',
  className = '',
}) => {
  const getIllustration = () => {
    switch (illustration) {
      case 'signin':
        return (
          <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl overflow-hidden">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)"/>
              </svg>
            </div>
            
            {/* Floating elements */}
            <div className="absolute top-12 left-12 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm" />
            <div className="absolute top-32 right-8 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm" />
            <div className="absolute bottom-20 left-8 w-24 h-24 bg-white/10 rounded-xl backdrop-blur-sm" />
            
            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center"
              >
                <div className="w-32 h-32 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center mb-6 mx-auto">
                  <Shield className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
                <p className="text-white/80 text-sm px-8">Your pet's health journey continues here</p>
              </motion.div>
            </div>
          </div>
        );
      case 'signup':
        return (
          <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-green-600 to-green-800 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)"/>
              </svg>
            </div>
            
            <div className="absolute top-12 right-12 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm" />
            <div className="absolute bottom-32 left-8 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center"
              >
                <div className="w-32 h-32 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center mb-6 mx-auto">
                  <Heart className="w-16 h-16 text-white" fill="white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Join Us</h3>
                <p className="text-white/80 text-sm px-8">Start protecting your pet's health today</p>
              </motion.div>
            </div>
          </div>
        );
      case 'reset':
        return (
          <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)"/>
              </svg>
            </div>
            
            <div className="absolute top-20 left-16 w-24 h-24 bg-white/10 rounded-xl backdrop-blur-sm" />
            <div className="absolute bottom-24 right-12 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center"
              >
                <div className="w-32 h-32 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center mb-6 mx-auto">
                  <Mail className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Reset Password</h3>
                <p className="text-white/80 text-sm px-8">We'll help you get back in</p>
              </motion.div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 lg:p-8 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-6xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          {/* Left side - Illustration (hidden on mobile) */}
          <div className="hidden lg:block lg:w-1/2 p-8">
            {getIllustration()}
          </div>

          {/* Right side - Form */}
          <div className="w-full lg:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            >
              {/* Mobile Illustration */}
              <div className="lg:hidden mb-6">
                {getIllustration()}
              </div>

              {/* Header */}
              <div className="mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  {title}
                </motion.h1>
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>

              {/* Form Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>© 2025 PetVision. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthCard;

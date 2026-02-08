'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Chrome, Github, Facebook, Apple } from 'lucide-react';
import { AuthProvider } from '@/lib/auth/types';

export interface SocialProvider {
  id: AuthProvider;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverColor: string;
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: <Chrome className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-white',
    hoverColor: 'hover:bg-gray-50',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: <Github className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-gray-900',
    hoverColor: 'hover:bg-gray-800',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: <Apple className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-black',
    hoverColor: 'hover:bg-gray-900',
  },
];

interface SocialLoginButtonsProps {
  onProviderClick?: (provider: AuthProvider) => void;
  loadingProvider?: AuthProvider | null;
  excludedProviders?: AuthProvider[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  fullWidth?: boolean;
  showLabels?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onProviderClick,
  loadingProvider = null,
  excludedProviders = [],
  layout = 'vertical',
  fullWidth = false,
  showLabels = true,
}) => {
  const visibleProviders = socialProviders.filter(
    (provider) => !excludedProviders.includes(provider.id)
  );

  const handleProviderClick = (provider: SocialProvider) => {
    if (loadingProvider) return;
    onProviderClick?.(provider.id);
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-row gap-3';
      case 'vertical':
        return 'flex flex-col gap-3';
      case 'grid':
        return 'grid grid-cols-2 gap-3';
      default:
        return 'flex flex-col gap-3';
    }
  };

  return (
    <div className={`w-full ${getLayoutClasses()}`}>
      {visibleProviders.map((provider, index) => {
        const isLoading = loadingProvider === provider.id;

        return (
          <motion.button
            key={provider.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => handleProviderClick(provider)}
            disabled={!!loadingProvider}
            className={`${
              fullWidth ? 'w-full' : 'w-full'
    } flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-all duration-200 ${
              provider.bgColor
    } ${provider.hoverColor} hover:shadow-lg ${
              isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
    } active:scale-[0.98]`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className={provider.color}>{provider.icon}</span>
            )}
            
            {showLabels && (
              <span className={`font-semibold ${provider.color}`}>
                {isLoading ? 'Connecting...' : `Continue with ${provider.name}`}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

// Individual Social Button Component
export interface SocialButtonProps {
  provider: SocialProvider;
  isLoading?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  showLabel?: boolean;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  isLoading = false,
  onClick,
  fullWidth = true,
  showLabel = true,
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      disabled={isLoading}
      className={`${
        fullWidth ? 'w-full' : 'w-auto'
      } flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        provider.bgColor
      } ${provider.hoverColor} hover:shadow-lg ${
        isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
      } active:scale-[0.98]`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className={provider.color}>{provider.icon}</span>
      )}
      
      {showLabel && (
        <span className={`font-semibold ${provider.color}`}>
          {isLoading ? 'Connecting...' : `Continue with ${provider.name}`}
        </span>
      )}
    </motion.button>
  );
};

export default SocialLoginButtons;

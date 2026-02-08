// Auth Types for PetVision

export type AuthProvider = 'email' | 'google' | 'github' | 'facebook' | 'apple';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
  agreeToTerms: boolean;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface NewPasswordCredentials {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerificationData {
  email: string;
  code?: string;
  expiresAt?: string;
}

export interface SocialAuthResponse {
  provider: AuthProvider;
  accessToken: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
}

export interface PasswordStrength {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Excellent';
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SocialProviderConfig {
  id: AuthProvider;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

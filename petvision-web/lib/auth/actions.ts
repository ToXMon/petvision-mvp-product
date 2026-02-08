import { 
  SignInCredentials, 
  SignUpCredentials, 
  AuthSession, 
  User, 
  EmailVerificationData,
  ResetPasswordRequest,
  NewPasswordCredentials,
  SocialAuthResponse
} from './types';
import { AuthException, getErrorMessage } from './errors';

// API base URL - adjust based on your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AuthException(
        data.message || 'Request failed',
        data.code || 'API_ERROR',
        data.field
      );
    }

    return data;
  } catch (error) {
    if (error instanceof AuthException) {
      throw error;
    }
    throw getErrorMessage(error);
  }
}

// Sign in with email and password
export async function signIn(credentials: SignInCredentials): Promise<AuthSession> {
  return apiCall<AuthSession>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Sign up with email and password
export async function signUp(credentials: SignUpCredentials): Promise<AuthSession> {
  return apiCall<AuthSession>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Sign out
export async function signOut(): Promise<void> {
  return apiCall<void>('/api/auth/signout', {
    method: 'POST',
  });
}

// Get current user
export async function getCurrentUser(): Promise<User> {
  return apiCall<User>('/api/auth/me');
}

// Verify email with code
export async function verifyEmail(data: EmailVerificationData): Promise<AuthSession> {
  return apiCall<AuthSession>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Resend verification email
export async function resendVerificationEmail(email: string): Promise<void> {
  return apiCall<void>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Request password reset
export async function requestPasswordReset(data: ResetPasswordRequest): Promise<void> {
  return apiCall<void>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Set new password
export async function setNewPassword(credentials: NewPasswordCredentials): Promise<AuthSession> {
  return apiCall<AuthSession>('/api/auth/new-password', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Social authentication (OAuth flow)
export async function authenticateWithSocialProvider(
  provider: 'google' | 'github' | 'facebook' | 'apple'
): Promise<SocialAuthResponse> {
  // This would typically redirect to the OAuth provider
  // For now, return a placeholder implementation
  window.location.href = `${API_BASE_URL}/api/auth/oauth/${provider}`;
  
  return new Promise((resolve, reject) => {
    // This promise will be resolved by the OAuth callback
    // The actual implementation depends on your OAuth flow
    setTimeout(() => {
      reject(new AuthException('OAUTH_CANCELLED', 'Authentication cancelled'));
    }, 30000);
  });
}

// Handle OAuth callback
export async function handleOAuthCallback(code: string, state: string): Promise<AuthSession> {
  return apiCall<AuthSession>('/api/auth/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
}

// Refresh access token
export async function refreshAccessToken(): Promise<AuthSession> {
  return apiCall<AuthSession>('/api/auth/refresh', {
    method: 'POST',
  });
}

// Update user profile
export async function updateProfile(data: Partial<User>): Promise<User> {
  return apiCall<User>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Delete account
export async function deleteAccount(): Promise<void> {
  return apiCall<void>('/api/auth/account', {
    method: 'DELETE',
  });
}

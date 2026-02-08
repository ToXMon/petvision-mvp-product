import { AuthError } from './types';

export class AuthException extends Error {
  code: string;
  field?: string;

  constructor(message: string, code: string, field?: string) {
    super(message);
    this.name = 'AuthException';
    this.code = code;
    this.field = field;
  }
}

export const AuthErrors = {
  // General errors
  NETWORK_ERROR: new AuthError('NETWORK_ERROR', 'Network error. Please check your connection.'),
  UNKNOWN_ERROR: new AuthError('UNKNOWN_ERROR', 'An unexpected error occurred. Please try again.'),
  
  // Sign in errors
  INVALID_CREDENTIALS: new AuthError('INVALID_CREDENTIALS', 'Invalid email or password.'),
  EMAIL_NOT_VERIFIED: new AuthError('EMAIL_NOT_VERIFIED', 'Please verify your email before signing in.'),
  ACCOUNT_LOCKED: new AuthError('ACCOUNT_LOCKED', 'Account temporarily locked due to too many failed attempts. Please reset your password.'),
  ACCOUNT_DISABLED: new AuthError('ACCOUNT_DISABLED', 'This account has been disabled.'),
  
  // Sign up errors
  EMAIL_ALREADY_EXISTS: new AuthError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists.'),
  WEAK_PASSWORD: new AuthError('WEAK_PASSWORD', 'Password does not meet security requirements.'),
  INVALID_EMAIL: new AuthError('INVALID_EMAIL', 'Please enter a valid email address.', 'email'),
  TERMS_REQUIRED: new AuthError('TERMS_REQUIRED', 'You must agree to the Terms of Service.', 'terms'),
  
  // Verification errors
  INVALID_VERIFICATION_CODE: new AuthError('INVALID_VERIFICATION_CODE', 'Invalid verification code.', 'code'),
  VERIFICATION_CODE_EXPIRED: new AuthError('VERIFICATION_CODE_EXPIRED', 'Verification code has expired. Please request a new one.'),
  TOO_MANY_ATTEMPTS: new AuthError('TOO_MANY_ATTEMPTS', 'Too many attempts. Please wait before trying again.'),
  
  // Password reset errors
  INVALID_RESET_TOKEN: new AuthError('INVALID_RESET_TOKEN', 'Invalid or expired reset token.'),
  PASSWORD_MISMATCH: new AuthError('PASSWORD_MISMATCH', 'Passwords do not match.', 'confirmPassword'),
  SAME_PASSWORD: new AuthError('SAME_PASSWORD', 'New password must be different from the current password.'),
  
  // Social auth errors
  OAUTH_CANCELLED: new AuthError('OAUTH_CANCELLED', 'Authentication was cancelled.'),
  OAUTH_FAILED: new AuthError('OAUTH_FAILED', 'Authentication failed. Please try again.'),
  EMAIL_MISMATCH: new AuthError('EMAIL_MISMATCH', 'The email from your social account does not match your account email.'),
  
  // Session errors
  SESSION_EXPIRED: new AuthError('SESSION_EXPIRED', 'Your session has expired. Please sign in again.'),
  UNAUTHORIZED: new AuthError('UNAUTHORIZED', 'You are not authorized to perform this action.'),
};

export const getErrorMessage = (error: unknown): AuthError => {
  if (error instanceof AuthException) {
    return { code: error.code, message: error.message, field: error.field };
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return AuthErrors.NETWORK_ERROR;
    }
    if (message.includes('invalid credentials') || message.includes('wrong password')) {
      return AuthErrors.INVALID_CREDENTIALS;
    }
    if (message.includes('already exists') || message.includes('duplicate')) {
      return AuthErrors.EMAIL_ALREADY_EXISTS;
    }
    if (message.includes('expired')) {
      return AuthErrors.VERIFICATION_CODE_EXPIRED;
    }
  }
  
  return AuthErrors.UNKNOWN_ERROR;
};

export const getFieldError = (error: AuthError, fieldName: string): string | undefined => {
  if (error.field === fieldName) {
    return error.message;
  }
  return undefined;
};

// ============================================================================
// SignupScreen - Step-by-step registration screen for mobile app
// ============================================================================

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface SignupScreenProps {
  navigation: StackNavigationProp<any>;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

type SignupStep = 'name' | 'email' | 'password' | 'terms' | 'complete';

type SocialProvider = 'google' | 'github' | 'facebook' | 'apple';

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<SignupStep>('name');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; strength: number } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return { valid: score >= 4, strength: score };
  };

  const validateStep = (): boolean => {
    const newErrors: Errors = {};

    switch (step) {
      case 'name':
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        break;
      case 'email':
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        break;
      case 'password':
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else {
          const { valid } = validatePassword(formData.password);
          if (!valid) {
            newErrors.password = 'Password is too weak';
          }
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
      case 'terms':
        if (!formData.agreeToTerms) {
          newErrors.agreeToTerms = 'You must agree to the terms';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!validateStep()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const steps: SignupStep[] = ['name', 'email', 'password', 'terms', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const steps: SignupStep[] = ['name', 'email', 'password', 'terms', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateStep()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call - replace with actual auth service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('complete');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ email: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSocialLoading(provider);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('PetList');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSocialLoading(null);
    }
  };

  const SocialButton = ({ provider, name, icon, bgColor }: {
    provider: SocialProvider;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    bgColor: string;
  }) => (
    <TouchableOpacity
      style={[styles.socialButton, { backgroundColor: bgColor }]}
      onPress={() => handleSocialLogin(provider)}
      disabled={socialLoading !== null}
      activeOpacity={0.8}
    >
      {socialLoading === provider ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name={icon} size={24} color="#FFFFFF" style={styles.socialIcon} />
          <Text style={styles.socialButtonText}>Continue with {name}</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    const { strength } = validatePassword(password);
    const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#3B82F6', '#3B82F6', '#10B981'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const color = colors[Math.min(strength, 5)];
    
    return (
      <View style={styles.strengthContainer}>
        <View style={styles.strengthBar}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.strengthSegment,
                { backgroundColor: i < strength ? color : 'rgba(255,255,255,0.2)' },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.strengthLabel, { color }]}>{labels[strength]}</Text>
      </View>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <>
            <Animated.View entering={SlideInUp.duration(400)}>
              <Text style={styles.stepTitle}>What's your name?</Text>
              <Text style={styles.stepSubtitle}>We'll use this to personalize your experience</Text>
            </Animated.View>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={errors.name ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
              <TextInputWrapper
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter your full name"
                placeholderTextColor="#6B7280"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </>
        );

      case 'email':
        return (
          <>
            <Animated.View entering={SlideInUp.duration(400)}>
              <Text style={styles.stepTitle}>What's your email?</Text>
              <Text style={styles.stepSubtitle}>We'll send verification and updates to this address</Text>
            </Animated.View>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={errors.email ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
              <TextInputWrapper
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#6B7280"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </>
        );

      case 'password':
        return (
          <>
            <Animated.View entering={SlideInUp.duration(400)}>
              <Text style={styles.stepTitle}>Create a password</Text>
              <Text style={styles.stepSubtitle}>Use 8+ characters with a mix of letters, numbers & symbols</Text>
            </Animated.View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={errors.password ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
              <View style={styles.passwordContainer}>
                <TextInputWrapper
                  style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="Enter password"
                  placeholderTextColor="#6B7280"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
            {formData.password && <PasswordStrengthIndicator password={formData.password} />}
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={errors.confirmPassword ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
              <View style={styles.passwordContainer}>
                <TextInputWrapper
                  style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm password"
                  placeholderTextColor="#6B7280"
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.passwordToggle}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </>
        );

      case 'terms':
        return (
          <>
            <Animated.View entering={SlideInUp.duration(400)}>
              <Text style={styles.stepTitle}>Almost there!</Text>
              <Text style={styles.stepSubtitle}>Please review and accept our terms</Text>
            </Animated.View>
            
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.termsCheckbox}
                onPress={() => handleInputChange('agreeToTerms', !formData.agreeToTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, formData.agreeToTerms && styles.checkboxChecked]}>
                  {formData.agreeToTerms && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                </View>
                <View style={styles.termsText}>
                  <Text style={styles.termsTitle}>I agree to the Terms of Service</Text>
                  <Text style={styles.termsSubtitle}>and Privacy Policy</Text>
                </View>
              </TouchableOpacity>
              {errors.agreeToTerms && <Text style={styles.errorText}>{errors.agreeToTerms}</Text>}
            </View>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Account Summary</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Name:</Text>
                <Text style={styles.summaryValue}>{formData.name}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Email:</Text>
                <Text style={styles.summaryValue}>{formData.email}</Text>
              </View>
            </View>
          </>
        );

      case 'complete':
        return (
          <Animated.View entering={FadeIn.duration(600)} style={styles.completeContainer}>
            <View style={styles.completeIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.completeTitle}>Account Created!</Text>
            <Text style={styles.completeSubtitle}>Check your email to verify your account</Text>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800' }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <LinearGradient colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']} style={styles.gradientOverlay}>
              {/* Progress Bar */}
              {step !== 'complete' && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(step === 'name' ? 25 : step === 'email' ? 50 : step === 'password' ? 75 : 100)}%` }]} />
                </View>
              )}

              {/* Logo */}
              <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
                <Ionicons name="paw" size={48} color="#3B82F6" />
              </Animated.View>

              {/* Form Steps */}
              <View style={styles.formContainer}>
                {renderStep()}

                {/* Navigation Buttons */}
                {step !== 'complete' && (
                  <>
                    <TouchableOpacity
                      style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                      onPress={step === 'terms' ? handleSignUp : handleNext}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>
                            {step === 'terms' ? 'Create Account' : 'Continue'}
                          </Text>
                          <Ionicons name={step === 'terms' ? 'person-add' : 'arrow-forward'} size={20} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>

                    {step !== 'name' && (
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleBack}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.secondaryButtonText}>Back</Text>
                      </TouchableOpacity>
                    )}

                    {/* Social Login - Only show on first step */}
                    {step === 'name' && (
                      <>
                        <View style={styles.dividerContainer}>
                          <View style={styles.dividerLine} />
                          <Text style={styles.dividerText}>OR</Text>
                          <View style={styles.dividerLine} />
                        </View>
                        <SocialButton provider="google" name="Google" icon="logo-google" bgColor="#FFFFFF" />
                        <SocialButton provider="github" name="GitHub" icon="logo-github" bgColor="#111827" />
                        <SocialButton provider="facebook" name="Facebook" icon="logo-facebook" bgColor="#1877F2" />
                        <SocialButton provider="apple" name="Apple" icon="logo-apple" bgColor="#000000" />
                      </>
                    )}

                    {/* Sign In Link */}
                    <View style={styles.footerContainer}>
                      <Text style={styles.footerText}>Already have an account? </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('Signin')}>
                        <Text style={styles.footerLink}>Sign in</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Complete Step Navigation */}
                {step === 'complete' && (
                  <>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => navigation.navigate('VerifyEmail')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.primaryButtonText}>Continue to Verification</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => navigation.navigate('Signin')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.secondaryButtonText}>Go to Sign In</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </LinearGradient>
          </ImageBackground>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const TextInputWrapper = (props: any) => {
  const { TextInput } = require('react-native');
  return <TextInput {...props} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  keyboardContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  backgroundImage: { width: '100%', height: '100%' },
  gradientOverlay: { flex: 1, padding: 24 },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 32,
  },
  inputContainer: { marginBottom: 8 },
  inputIcon: { position: 'absolute', left: 16, top: 16, zIndex: 1 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 14, marginTop: 4, marginBottom: 24 },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  passwordToggle: { position: 'absolute', right: 16, top: 16 },
  strengthContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: { marginBottom: 32 },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  termsText: {
    flex: 1,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  termsSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    width: 80,
  },
  summaryValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completeIcon: {
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 16,
    gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  socialButton: {
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
    gap: 12,
  },
  socialIcon: { width: 24 },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: { fontSize: 14, color: '#9CA3AF' },
  footerLink: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
});

export default SignupScreen;

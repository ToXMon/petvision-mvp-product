// ============================================================================
// SigninScreen - Authentication screen for mobile app
// ============================================================================

import React, { useState, useCallback } from 'react';
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

interface SigninScreenProps {
  navigation: StackNavigationProp<any>;
}

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface Errors {
  email?: string;
  password?: string;
}

type SocialProvider = 'google' | 'github' | 'facebook' | 'apple';

export const SigninScreen: React.FC<SigninScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call - replace with actual auth service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigate to dashboard after successful signin
      navigation.navigate('PetList');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ email: 'Invalid credentials' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSocialLoading(provider);
    
    try {
      // Simulate OAuth flow - replace with actual implementation
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Image with Overlay */}
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800' }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']}
              style={styles.gradientOverlay}
            >
              {/* Logo and Title */}
              <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.headerContainer}>
                <View style={styles.logoContainer}>
                  <Ionicons name="paw" size={64} color="#3B82F6" />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue your pet's health journey</Text>
              </Animated.View>

              {/* Form Container */}
              <Animated.View entering={SlideInUp.duration(600).delay(200)} style={styles.formContainer}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={errors.email ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInputWrapper
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="your@email.com"
                    placeholderTextColor="#6B7280"
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={errors.password ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInputWrapper
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="••••••••"
                      placeholderTextColor="#6B7280"
                      value={formData.password}
                      onChangeText={(text) => handleInputChange('password', text)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                {/* Remember Me & Forgot Password */}
                <View style={styles.rowContainer}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => handleInputChange('rememberMe', !formData.rememberMe)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, formData.rememberMe && styles.checkboxChecked]}>
                      {formData.rememberMe && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Remember me</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSignIn}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Social Login Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <SocialButton provider="google" name="Google" icon="logo-google" bgColor="#FFFFFF" />
                <SocialButton provider="github" name="GitHub" icon="logo-github" bgColor="#111827" />
                <SocialButton provider="facebook" name="Facebook" icon="logo-facebook" bgColor="#1877F2" />
                <SocialButton provider="apple" name="Apple" icon="logo-apple" bgColor="#000000" />

                {/* Sign Up Link */}
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                    <Text style={styles.footerLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </LinearGradient>
          </ImageBackground>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Temporary TextInput wrapper until actual import is needed
const TextInputWrapper = (props: any) => {
  const { TextInput } = require('react-native');
  return <TextInput {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 46,
    zIndex: 1,
  },
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
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 46,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 24,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
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
  socialIcon: {
    width: 24,
  },
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
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  footerLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default SigninScreen;

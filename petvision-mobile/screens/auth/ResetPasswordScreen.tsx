// ============================================================================
// ResetPasswordScreen - Password reset request screen with touch-friendly inputs
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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface ResetPasswordScreenProps {
  navigation: StackNavigationProp<any>;
}

interface Errors {
  email?: string;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetRequest = async () => {
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
      setIsSuccess(true);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ email: 'Email not found. Please check and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors({});
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradientContainer}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Logo */}
            <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Ionicons name="paw" size={48} color="#3B82F6" />
              </View>
            </Animated.View>

            {/* Icon */}
            <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.iconContainer}>
              <View style={[styles.iconWrapper, isSuccess && styles.iconWrapperSuccess]}>
                <Ionicons
                  name={isSuccess ? 'checkmark' : 'lock-closed-outline'}
                  size={48}
                  color={isSuccess ? '#FFFFFF' : '#3B82F6'}
                />
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={SlideInUp.duration(600).delay(300)} style={styles.titleContainer}>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                {isSuccess
                  ? 'Reset link sent!'
                  : 'No worries, we\'ll send you reset instructions.'
                }
              </Text>
              {isSuccess && (
                <Text style={styles.emailSentText}>Check {email} for the reset link</Text>
              )}
            </Animated.View>

            {/* Form */}
            {!isSuccess && (
              <Animated.View entering={SlideInUp.duration(600).delay(400)} style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={errors.email ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                  <TextInputWrapper
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="#6B7280"
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    onSubmitEditing={handleResetRequest}
                    returnKeyType="send"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                {/* Reset Button - Touch friendly */}
                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                  onPress={handleResetRequest}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={22} color="#FFFFFF" />
                      <Text style={styles.resetButtonText}>Send Reset Link</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Success State */}
            {isSuccess && (
              <Animated.View entering={FadeIn.duration(600)} style={styles.successContainer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => navigation.navigate('Signin')}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.resetButtonText}>Back to Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResetRequest}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
                  <Text style={styles.resendButtonText}>Resend Link</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Remember Password */}
            <Animated.View entering={FadeIn.duration(600).delay(500)} style={styles.footerContainer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Signin')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
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
  gradientContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  iconWrapperSuccess: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emailSentText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 22,
    zIndex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 48,
    paddingVertical: 20, // Touch friendly - larger height
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    paddingLeft: 48,
  },
  resetButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20, // Touch friendly - larger height
    gap: 12,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  successContainer: {
    width: '100%',
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  resendButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  footerLink: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;

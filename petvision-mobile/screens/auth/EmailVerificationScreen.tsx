// ============================================================================
// EmailVerificationScreen - Email verification with pull-to-refresh for mobile app
// ============================================================================

import React, { useState, useCallback, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp, Pulse } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface EmailVerificationScreenProps {
  navigation: StackNavigationProp<any>;
}

interface VerificationFormData {
  email: string;
  code: string;
}

interface Errors {
  email?: string;
  code?: string;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<VerificationFormData>({
    email: 'user@example.com', // In production, get from route params
    code: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateCode = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    }

    if (!formData.code) {
      newErrors.code = 'Verification code is required';
    } else if (!validateCode(formData.code)) {
      newErrors.code = 'Please enter a valid 6-digit code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async () => {
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
      
      setTimeout(() => {
        navigation.navigate('PetList');
      }, 2000);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ code: 'Invalid or expired code' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsResending(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCountdown(60);
      setFormData(prev => ({ ...prev, code: '' }));
      setErrors({});
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsResending(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRefreshing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleInputChange = (field: keyof VerificationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const CodeInput = ({ index, value, onChange }: { index: number; value: string; onChange: (val: string) => void }) => {
    const inputRef = React.useRef<any>(null);
    
    const handleChange = (text: string) => {
      // Only allow numbers
      const numericText = text.replace(/\D/g, '').slice(0, 1);
      onChange(numericText);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (numericText && index < 5) {
        // Focus next input
        // In a real implementation, you'd use ref to focus the next input
      }
    };

    return (
      <View style={styles.codeInputContainer}>
        <TextInputWrapper
          ref={inputRef}
          style={[styles.codeInput, errors.code && styles.codeInputError]}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          selectTextOnFocus
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
    );
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradientContainer}>
            {/* Logo */}
            <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Ionicons name="paw" size={64} color="#3B82F6" />
              </View>
            </Animated.View>

            {!isSuccess && (
              <Animated.View entering={FadeIn.duration(600).delay(200)}>
                <Ionicons name="mail-unread-outline" size={80} color="#3B82F6" style={styles.iconLarge} />
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit code to
                </Text>
                <Text style={styles.emailText}>{formData.email}</Text>
              </Animated.View>
            )}

            {isSuccess && (
              <Animated.View entering={FadeIn.duration(600)}>
                <View style={styles.successIconContainer}>
                  <Animated.View entering={Pulse.duration(1000).repeat()}>
                    <Ionicons name="checkmark-circle" size={100} color="#10B981" />
                  </Animated.View>
                </View>
                <Text style={styles.title}>Verified!</Text>
                <Text style={styles.subtitle}>
                  Your email has been verified successfully
                </Text>
              </Animated.View>
            )}

            {/* Code Input */}
            {!isSuccess && (
              <Animated.View entering={SlideInUp.duration(600).delay(300)} style={styles.codeContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = formData.code[index] || '';
                  return (
                    <View key={index} style={styles.codeInputWrapper}>
                      <TextInputWrapper
                        style={[styles.codeInput, errors.code && styles.codeInputError]}
                        value={digit}
                        onChangeText={(text) => {
                          const newCode = formData.code.split('');
                          newCode[index] = text.replace(/\D/g, '').slice(0, 1);
                          setFormData(prev => ({ ...prev, code: newCode.join('') }));
                          if (errors.code) setErrors({});
                        }}
                        keyboardType="number-pad"
                        maxLength={1}
                        textAlign="center"
                        selectTextOnFocus
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                    </View>
                  );
                })}
              </Animated.View>
            )}

            {errors.code && !isSuccess && (
              <Text style={styles.errorText}>{errors.code}</Text>
            )}

            {/* Resend Button */}
            {!isSuccess && (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={countdown > 0 || isResending}
                activeOpacity={0.8}
              >
                {isResending ? (
                  <ActivityIndicator color="#3B82F6" />
                ) : (
                  <>
                    <Ionicons name={countdown > 0 ? 'time-outline' : 'refresh-outline'} size={20} color="#3B82F6" />
                    <Text style={styles.resendButtonText}>
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Verify Button */}
            {!isSuccess && (
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify Email</Text>
                    <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Success Button */}
            {isSuccess && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('PetList')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Continue to Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Back Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>

            {/* Pull to refresh hint */}
            <View style={styles.hintContainer}>
              <Ionicons name="arrow-down" size={16} color="#6B7280" />
              <Text style={styles.hintText}>Pull down to refresh</Text>
            </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  iconLarge: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 32,
  },
  successIconContainer: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  codeInputWrapper: {
    width: 48,
    height: 64,
  },
  codeInput: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  codeInputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  codeInputContainer: {
    width: 48,
    height: 64,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    paddingVertical: 16,
  },
  resendButtonText: {
    fontSize: 16,
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
    marginBottom: 16,
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
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 24,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  hintContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default EmailVerificationScreen;

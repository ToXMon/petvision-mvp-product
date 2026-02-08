// ============================================================================
// BiometricPrompt - Face ID/Touch ID biometric authentication component
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface BiometricPromptProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onError?: (error: string) => void;
  title?: string;
  subtitle?: string;
  fallbackEnabled?: boolean;
}

type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  visible,
  onSuccess,
  onCancel,
  onError,
  title = 'Authenticate',
  subtitle = 'Use Face ID or Touch ID to continue',
  fallbackEnabled = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasEnrolled, setHasEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulseValue] = useState(new Animated.Value(1));

  // Check biometric availability
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
          setBiometricType('none');
          setIsAvailable(false);
          return;
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasEnrolled(enrolled);
        setIsAvailable(true);

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('face');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        } else {
          setBiometricType('none');
        }
      } catch (err) {
        console.error('Error checking biometrics:', err);
        setIsAvailable(false);
      }
    };

    if (visible) {
      checkAvailability();
    }
  }, [visible]);

  // Pulse animation
  useEffect(() => {
    if (visible && !isLoading) {
      const pulse = Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
      ]);
      return () => pulse.stop();
    }
  }, [visible, isLoading, pulseValue]);

  // Handle biometric authentication
  const handleBiometricAuth = useCallback(async () => {
    if (!isAvailable || !hasEnrolled) {
      if (fallbackEnabled) {
        onCancel();
      }
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: title,
        fallbackLabel: fallbackEnabled ? 'Use Passcode' : undefined,
        cancelLabel: 'Cancel',
        disableDeviceFallback: !fallbackEnabled,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMsg = result.error === 'user_cancel' 
          ? 'Authentication cancelled' 
          : result.error === 'not_enrolled'
          ? 'No biometrics enrolled'
          : result.error === 'lockout'
          ? 'Too many attempts. Try again later.'
          : 'Authentication failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg = 'Authentication error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, hasEnrolled, title, fallbackEnabled, onSuccess, onCancel, onError]);

  // Auto-trigger when modal opens
  useEffect(() => {
    if (visible && isAvailable && hasEnrolled) {
      const timer = setTimeout(() => handleBiometricAuth(), 500);
      return () => clearTimeout(timer);
    }
  }, [visible, isAvailable, hasEnrolled, handleBiometricAuth]);

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (biometricType) {
      case 'face':
        return 'scan-outline';
      case 'fingerprint':
        return 'finger-print-outline';
      default:
        return 'lock-closed-outline';
    }
  };

  const getBiometricLabel = (): string => {
    switch (biometricType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Touch ID';
      default:
        return 'Biometrics';
    }
  };

  const handleRetry = () => {
    setError(null);
    handleBiometricAuth();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.touchableBackground}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <View style={styles.spacer} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.touchableBackground}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <View style={styles.bottomSheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Icon with Pulse Animation */}
            <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
              <View style={styles.iconContainer}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#3B82F6" />
                ) : error ? (
                  <Ionicons name="close-circle" size={64} color="#EF4444" />
                ) : (
                  <Ionicons
                    name={getBiometricIcon()}
                    size={64}
                    color={isAvailable ? '#3B82F6' : '#9CA3AF'}
                  />
                )}
              </View>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {error
                ? error
                : !isAvailable
                ? 'Biometric authentication is not available on this device'
                : !hasEnrolled
                ? 'Please enroll in biometrics first in device settings'
                : subtitle
              }
            </Text>

            {/* Biometric Type Label */}
            {isAvailable && hasEnrolled && !error && (
              <View style={styles.badge}>
                <Ionicons name={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'} size={14} color="#3B82F6" />
                <Text style={styles.badgeText}>{getBiometricLabel()}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {error && isAvailable && hasEnrolled && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Fallback */}
            {fallbackEnabled && !error && isAvailable && hasEnrolled && (
              <TouchableOpacity
                style={styles.fallbackButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCancel();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.fallbackButtonText}>Use Passcode Instead</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  touchableBackground: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 24,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 8,
    marginBottom: 32,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 16,
    paddingVertical: 18,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fallbackButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  fallbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});

export default BiometricPrompt;

/**
 * CameraCapture Component
 * Full-screen camera with AR overlay, focus frame, lighting indicator
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  AccessibilityInfo
} from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useCameraCapture } from '../hooks/useCameraCapture';
import { ScanType, SCAN_INSTRUCTIONS, QualityTier, QUALITY_COLORS } from '../types/camera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraCaptureProps {
  scanType: ScanType;
  onCapture?: (photo: any) => void;
  onError?: (error: any) => void;
}

/**
 * Focus Frame with pulsing animation
 */
const FocusFrame = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    // Pulsing animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  return (
    <Animated.View style={[styles.focusFrame, animatedStyle]}>
      <CornerGuide position="top-left" />
      <CornerGuide position="top-right" />
      <CornerGuide position="bottom-left" />
      <CornerGuide position="bottom-right" />
    </Animated.View>
  );
};

/**
 * Corner guide with spring animation
 */
const CornerGuide = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const size = useSharedValue(0);

  useEffect(() => {
    size.value = withSpring(24, {
      mass: 0.5,
      damping: 12,
      stiffness: 200
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: any = {
      width: size.value,
      height: size.value,
      position: 'absolute',
      backgroundColor: '#3B82F6'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: 0, left: 0, borderTopLeftRadius: 4 };
      case 'top-right':
        return { ...baseStyle, top: 0, right: 0, borderTopRightRadius: 4 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 0, left: 0, borderBottomLeftRadius: 4 };
      case 'bottom-right':
        return { ...baseStyle, bottom: 0, right: 0, borderBottomRightRadius: 4 };
    }
  });

  return <Animated.View style={animatedStyle} />;
};

/**
 * Lighting indicator with tier-based colors
 */
const LightingIndicator = ({ tier }: { tier: QualityTier }) => {
  const color = QUALITY_COLORS[tier];
  const icon = tier === QualityTier.GOOD ? 'sunny' : 
                tier === QualityTier.FAIR ? 'cloud' : 'cloudy-night';
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <View style={styles.lightingIndicator}>
      <View style={[styles.lightingIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Animated.Text style={[styles.lightingLabel, { color }]}>
        {label}
      </Animated.Text>
    </View>
  );
};

/**
 * Flash control button
 */
const FlashControl = ({ 
  mode, 
  onPress 
}: { 
  mode: FlashMode;
  onPress: () => void;
}) => {
  const iconName = mode === FlashMode.on ? 'flash' : 
                   mode === FlashMode.off ? 'flash-off' : 'flash-outline';

  return (
    <Pressable
      style={styles.iconButton}
      onPress={onPress}
      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      accessibilityLabel={
        mode === FlashMode.on ? 'Flash on' : 
        mode === FlashMode.off ? 'Flash off' : 'Flash auto'
      }
      accessibilityRole="button"
      accessible={true}
    >
      <Ionicons name={iconName as any} size={24} color="white" />
    </Pressable>
  );
};

/**
 * Camera toggle button
 */
const CameraToggle = ({ onPress }: { onPress: () => void }) => {
  return (
    <Pressable
      style={styles.iconButton}
      onPress={onPress}
      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      accessibilityLabel="Toggle camera"
      accessibilityRole="button"
      accessible={true}
    >
      <Ionicons name="camera-reverse" size={24} color="white" />
    </Pressable>
  );
};

/**
 * Capture button with pulse animation
 */
const CaptureButton = ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    onPress();
  }, [disabled, onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.captureButton,
        disabled && styles.captureButtonDisabled
      ]}
      accessibilityLabel="Capture photo"
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessible={true}
    >
      <Animated.View style={[styles.captureButtonInner, animatedStyle]}>
        <View style={styles.captureButtonOuter} />
      </Animated.View>
    </Pressable>
  );
};

/**
 * Main CameraCapture Component
 */
export const CameraCapture: React.FC<CameraCaptureProps> = ({
  scanType,
  onCapture,
  onError
}) => {
  const {
    state,
    config,
    cameraRef,
    initialize,
    requestPermissions,
    capturePhoto,
    toggleCamera,
    setFlashMode,
    permissions
  } = useCameraCapture({
    scanType,
    onCapture,
    onError
  });

  // Simulated lighting tier (in production, use actual camera light meter)
  const lightingTier = QualityTier.GOOD;

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle capture
  const handleCapture = useCallback(async () => {
    await capturePhoto();
  }, [capturePhoto]);

  // Handle permission request
  const handleRequestPermissions = useCallback(async () => {
    const granted = await requestPermissions();
    if (granted) {
      initialize();
    }
  }, [requestPermissions, initialize]);

  // Permission denied state
  if (permissions.camera === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={['#111827', '#1F2937']}
          style={styles.permissionGradient}
        >
          <Ionicons name="camera-outline" size={64} color="#EF4444" />
          <Animated.Text style={styles.permissionTitle}>
            Camera Permission Required
          </Animated.Text>
          <Animated.Text style={styles.permissionText}>
            Please enable camera access to capture photos of your pet.
          </Animated.Text>
          <Pressable
            style={styles.permissionButton}
            onPress={handleRequestPermissions}
          >
            <Animated.Text style={styles.permissionButtonText}>Grant Permission</Animated.Text>
          </Pressable>
        </LinearGradient>
      </View>
    );
  }

  // Loading state
  if (state === 'initializing') {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#111827', '#1F2937']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <Ionicons name="camera" size={48} color="#3B82F6" />
          <Animated.Text style={styles.loadingText}>Initializing Camera...</Animated.Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={config.type}
        flashMode={config.flash}
        onCameraReady={() => {
          AccessibilityInfo.announceForAccessibility('Camera is ready');
        }}
      >
        {/* Dark overlay */}
        <LinearGradient
          colors={['rgba(17, 24, 39, 0.4)', 'transparent', 'rgba(17, 24, 39, 0.6)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Top controls */}
        <View style={styles.topControls}>
          <CameraToggle onPress={toggleCamera} />
          <LightingIndicator tier={lightingTier} />
          <FlashControl mode={config.flash} onPress={() => setFlashMode(
            config.flash === FlashMode.off ? FlashMode.auto :
            config.flash === FlashMode.auto ? FlashMode.on : FlashMode.off
          )} />
        </View>

        {/* AR Overlay */}
        <View style={styles.overlayContainer}>
          <FocusFrame />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Animated.Text style={styles.instructionsText}>
            {SCAN_INSTRUCTIONS[scanType]}
          </Animated.Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <CaptureButton
            onPress={handleCapture}
            disabled={state !== 'ready'}
          />
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  camera: {
    flex: 1
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.2
  },
  focusFrame: {
    width: '100%',
    aspectRatio: 3/4,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 24
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  lightingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  lightingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  lightingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981'
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureButtonDisabled: {
    opacity: 0.5
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureButtonOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#3B82F6'
  },
  instructionsContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12
  },
  permissionContainer: {
    flex: 1
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center'
  },
  permissionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  loadingContainer: {
    flex: 1
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF'
  }
});

export default CameraCapture;

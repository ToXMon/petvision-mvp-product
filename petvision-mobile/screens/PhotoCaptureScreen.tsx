/**
 * PhotoCaptureScreen
 * Modal-style photo capture with preview, quality badge, upload progress
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Text as RNText,
  Modal,
  ScrollView,
  AccessibilityInfo
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  FadeInDown,
  FadeInUp,
  FadeOut
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PanGestureHandler } from 'react-native-gesture-handler';

import { CameraCapture } from '../components/CameraCapture';
import { useCameraCapture } from '../hooks/useCameraCapture';
import { QualityTier, QUALITY_COLORS, ScanType } from '../types/camera';
import { getQualityBadgeProps, isAcceptableQuality } from '../utils/imageQualityValidator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedText = Animated.createAnimatedComponent(RNText);

interface PhotoCaptureScreenProps {
  visible: boolean;
  scanType: ScanType;
  petId: string;
  onClose: () => void;
  onSuccess?: (photoUrl: string) => void;
}

/**
 * Quality badge with animation
 */
const QualityBadge = ({ tier }: { tier: QualityTier }) => {
  const props = getQualityBadgeProps(tier);
  const scale = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withSpring(1, { mass: 0.5, damping: 12, stiffness: 200 });
  }, [tier]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[styles.qualityBadge, animatedStyle]}>
      <View style={[styles.qualityBadgeIcon, { backgroundColor: `${props.color}20` }]}>
        <Ionicons name={props.icon as any} size={20} color={props.color} />
      </View>
      <AnimatedText style={[styles.qualityBadgeText, { color: props.color }]}>
        {props.label}
      </AnimatedText>
    </Animated.View>
  );
};

/**
 * Upload progress indicator
 */
const UploadProgress = ({ progress }: { progress: number }) => {
  const animatedProgress = useSharedValue(0);
  
  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 300 });
  }, [progress]);

  const animatedWidthStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`
  }));

  return (
    <View style={styles.uploadProgressContainer}>
      <Animated.View style={[styles.uploadProgressBar, animatedWidthStyle]} />
      <AnimatedText style={styles.uploadProgressText}>
        Uploading... {progress}%
      </AnimatedText>
    </View>
  );
};

/**
 * Success animation
 */
const SuccessAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { mass: 0.5, damping: 8, stiffness: 200 }),
      withSpring(1, { mass: 0.5, damping: 12, stiffness: 200 })
    );
    
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(onComplete)();
      });
    }, 2000);
  }, [onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  return (
    <Animated.View style={[styles.successAnimation, animatedStyle]}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={48} color="#10B981" />
      </View>
      <AnimatedText style={styles.successText}>Photo Uploaded!</AnimatedText>
    </Animated.View>
  );
};

/**
 * Error state with retry
 */
const ErrorState = ({ error, onRetry }: { error: any; onRetry: () => void }) => {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#EF4444" />
      <AnimatedText style={styles.errorTitle}>
        Upload Failed
      </AnimatedText>
      <AnimatedText style={styles.errorMessage}>
        {error?.message || 'Something went wrong'}
      </AnimatedText>
      <Pressable
        style={styles.retryButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onRetry();
        }}
        accessibilityLabel="Retry upload"
        accessibilityRole="button"
      >
        <Ionicons name="refresh" size={20} color="white" />
        <AnimatedText style={styles.retryButtonText}>Retry</AnimatedText>
      </Pressable>
    </View>
  );
};

/**
 * Loading skeleton
 */
const LoadingSkeleton = () => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmer.value * 0.4
  }));

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonPreview, animatedStyle]} />
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonBadge, animatedStyle]} />
        <Animated.View style={[styles.skeletonProgress, animatedStyle]} />
      </View>
    </View>
  );
};

/**
 * Main PhotoCaptureScreen Component
 */
export const PhotoCaptureScreen: React.FC<PhotoCaptureScreenProps> = ({
  visible,
  scanType,
  petId,
  onClose,
  onSuccess
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const {
    state,
    capturedPhoto,
    uploadProgress,
    error,
    initialize,
    capturePhoto,
    retakePhoto,
    uploadPhoto
  } = useCameraCapture({
    scanType,
    petId,
    onCapture: () => {
      setShowPreview(true);
    },
    onUpload: (result) => {
      if (result.success && result.url) {
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess?.(result.url);
        }, 2500);
      }
    },
    onError: (err) => {
      console.error('Camera error:', err);
    }
  });

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { mass: 1, damping: 15, stiffness: 150 });
      initialize();
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    }
  }, [visible, translateY, initialize]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  // Handle capture
  const handleCapture = async () => {
    await capturePhoto();
  };

  // Handle retake
  const handleRetake = () => {
    setShowPreview(false);
    retakePhoto();
  };

  // Handle confirm/upload
  const handleConfirm = async () => {
    if (capturedPhoto) {
      await uploadPhoto(capturedPhoto);
    }
  };

  // Handle retry
  const handleRetry = async () => {
    if (capturedPhoto) {
      await uploadPhoto(capturedPhoto);
    }
  };

  // Handle close
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      setShowPreview(false);
      setShowSuccess(false);
    }, 300);
  };

  // Handle swipe to dismiss
  const handleGesture = (event: any) => {
    const { translationY } = event;
    if (translationY < -100) {
      handleClose();
    }
  };

  if (!visible) return null;

  const isAcceptable = capturedPhoto?.qualityMetrics 
    ? isAcceptableQuality(capturedPhoto.qualityMetrics)
    : false;

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      transparent
    >
      <PanGestureHandler onGestureEvent={handleGesture}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          {/* Backdrop blur */}
          <BlurView intensity={50} style={styles.backdrop}>
            <LinearGradient
              colors={['rgba(17, 24, 39, 0.9)', 'rgba(31, 41, 55, 0.9)']}
              style={StyleSheet.absoluteFill}
            />
          </BlurView>

          {/* Camera or Preview View */}
          {(!showPreview && state !== 'uploading' && state !== 'success') ? (
            <View style={StyleSheet.absoluteFill}>
              <CameraCapture
                scanType={scanType}
                onCapture={() => setShowPreview(true)}
              />
              {/* Close button */}
              <Pressable
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityLabel="Close camera"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
            </View>
          ) : (
            <View style={StyleSheet.absoluteFill}>
              {/* Blurred background with preview image */}
              {capturedPhoto && (
                <>
                  <Animated.Image
                    source={{ uri: capturedPhoto.uri }}
                    style={styles.previewBackground}
                    blurRadius={10}
                  />
                  <BlurView intensity={80} style={StyleSheet.absoluteFill} />
                </>
              )

              {/* Content based on state */}
              <View style={styles.contentContainer}>
                {/* Loading state */}
                {state === 'processing' && (
                  <FadeInDown>
                    <LoadingSkeleton />
                  </FadeInDown>
                )}

                {/* Upload progress */}
                {state === 'uploading' && uploadProgress && (
                  <FadeInDown>
                    <UploadProgress progress={uploadProgress.percentage} />
                  </FadeInDown>
                )}

                {/* Error state */}
                {state === 'error' && error && (
                  <FadeInDown>
                    <ErrorState error={error} onRetry={handleRetry} />
                  </FadeInDown>
                )}

                {/* Success animation */}
                {state === 'success' && showSuccess && (
                  <SuccessAnimation onComplete={handleClose} />
                )}

                {/* Preview with quality badge */}
                {showPreview && state === 'ready' && capturedPhoto && (
                  <>
                    {/* Close button */}
                    <Pressable
                      style={styles.closeButton}
                      onPress={handleClose}
                      accessibilityLabel="Close preview"
                      accessibilityRole="button"
                    >
                      <Ionicons name="close" size={28} color="white" />
                    </Pressable>

                    <FadeInUp>
                      <View style={styles.previewContainer}>
                        {/* Preview image */}
                        <View style={styles.imageContainer}>
                          <Animated.Image
                            source={{ uri: capturedPhoto.uri }}
                            style={styles.previewImage}
                          />
                          {/* Quality badge */}
                          <View style={styles.badgeContainer}>
                            <QualityBadge 
                              tier={capturedPhoto.qualityMetrics.overall.tier} 
                            />
                          </View>
                        </View>

                        {/* Quality issues */}
                        {capturedPhoto.qualityMetrics.issues.length > 0 && (
                          <View style={styles.issuesContainer}>
                            {capturedPhoto.qualityMetrics.issues.slice(0, 2).map((issue, index) => (
                              <View key={index} style={styles.issueItem}>
                                <Ionicons 
                                  name={issue.severity === 'error' ? 'alert-circle' : 'information-circle'} 
                                  size={16} 
                                  color={issue.severity === 'error' ? '#EF4444' : '#F59E0B'} 
                                />
                                <AnimatedText style={styles.issueText}>
                                  {issue.message}
                                </AnimatedText>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Action buttons */}
                        <View style={styles.actionButtons}>
                          {/* Retake button */}
                          <Pressable
                            style={styles.retakeButton}
                            onPress={handleRetake}
                            accessibilityLabel="Retake photo"
                            accessibilityRole="button"
                          >
                            <Ionicons name="camera-reverse" size={24} color="#6B7280" />
                            <AnimatedText style={styles.retakeButtonText}>Retake</AnimatedText>
                          </Pressable>

                          {/* Confirm button */}
                          <Pressable
                            style={[
                              styles.confirmButton,
                              !isAcceptable && styles.confirmButtonDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!isAcceptable}
                            accessibilityLabel={isAcceptable ? 'Confirm and upload' : 'Photo quality is too low'}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !isAcceptable }}
                          >
                            <Ionicons name="checkmark" size={24} color="white" />
                            <AnimatedText style={styles.confirmButtonText}>
                              Confirm
                            </AnimatedText>
                          </Pressable>
                        </View>
                      </View>
                    </FadeInUp>
                  </>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  previewBackground: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover'
  },
  previewContainer: {
    width: '100%',
    gap: 24
  },
  imageContainer: {
    alignItems: 'center'
  },
  previewImage: {
    width: SCREEN_WIDTH * 0.8,
    aspectRatio: 3/4,
    borderRadius: 16
  },
  badgeContainer: {
    marginTop: -20,
    alignItems: 'center'
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8
  },
  qualityBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qualityBadgeText: {
    fontSize: 16,
    fontWeight: '600'
  },
  issuesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    gap: 8
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  issueText: {
    flex: 1,
    fontSize: 14,
    color: '#374151'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 20
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  uploadProgressContainer: {
    width: '80%',
    alignItems: 'center'
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2
  },
  uploadProgressText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  successAnimation: {
    alignItems: 'center',
    gap: 16
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  skeletonContainer: {
    alignItems: 'center',
    gap: 16
  },
  skeletonPreview: {
    width: SCREEN_WIDTH * 0.6,
    aspectRatio: 3/4,
    borderRadius: 16
  },
  skeletonContent: {
    width: '60%',
    gap: 12
  },
  skeletonBadge: {
    height: 40,
    borderRadius: 20,
    alignSelf: 'center'
  },
  skeletonProgress: {
    height: 8,
    borderRadius: 4
  }
});

export default PhotoCaptureScreen;

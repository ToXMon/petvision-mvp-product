/**
 * ScanGuidanceIcons Component
 * Scan-type specific guidance with animated icons and instructions
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScanType, QualityTier, QUALITY_COLORS } from '../../types/camera';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedText = Animated.createAnimatedComponent(Animated.Text);

interface ScanGuidanceIconsProps {
  scanType: ScanType;
  qualityTier?: QualityTier;
  showInstructions?: boolean;
  compact?: boolean;
}

interface GuidanceStep {
  icon: string;
  label: string;
  detail: string;
  delay: number;
}

const SCAN_GUIDANCE: Record<ScanType, GuidanceStep[]> = {
  [ScanType.EYE]: [
    { icon: 'eye-outline', label: 'Position', detail: 'Hold 6-8 inches from pet\'s eye', delay: 0 },
    { icon: 'sunny-outline', label: 'Lighting', detail: 'Ensure bright, even lighting', delay: 200 },
    { icon: 'eye-sharp', label: 'Focus', detail: 'Wait for focus to lock', delay: 400 }
  ],
  [ScanType.SKIN]: [
    { icon: 'hand-left-outline', label: 'Position', detail: 'Capture the affected area', delay: 0 },
    { icon: 'leaf-outline', label: 'Steady', detail: 'Hold steady, avoid blur', delay: 200 },
    { icon: 'camera-outline', label: 'Capture', detail: 'Take clear, close-up photo', delay: 400 }
  ],
  [ScanType.TEETH]: [
    { icon: 'paw-outline', label: 'Approach', detail: 'Gently open pet\'s mouth', delay: 0 },
    { icon: 'scan-outline', label: 'Position', detail: 'Align camera with teeth', delay: 200 },
    { icon: 'flashlight-outline', label: 'Light', detail: 'Use light for clarity', delay: 400 }
  ],
  [ScanType.GAIT]: [
    { icon: 'walk-outline', label: 'Position', detail: 'Stand to the side of pet', delay: 0 },
    { icon: 'videocam-outline', label: 'Motion', detail: 'Capture walking gait', delay: 200 },
    { icon: 'speedometer-outline', label: 'Pace', detail: 'Normal walking speed', delay: 400 }
  ],
  [ScanType.MULTI]: [
    { icon: 'camera-reverse', label: 'Angles', detail: 'Capture front, side, back views', delay: 0 },
    { icon: 'layers-outline', label: 'Multiple', detail: 'Take 3-5 photos', delay: 200 },
    { icon: 'checkmark-circle', label: 'Quality', detail: 'Ensure clear, bright images', delay: 400 }
  ]
};

const SCAN_TIPS: Record<ScanType, string> = {
  [ScanType.EYE]: 'Tip: Use treats to keep pet focused',
  [ScanType.SKIN]: 'Tip: Use good lighting for accurate analysis',
  [ScanType.TEETH]: 'Tip: Be gentle and patient',
  [ScanType.GAIT]: 'Tip: Capture full body and movement',
  [ScanType.MULTI]: 'Tip: Change angles for complete view'
};

export const ScanGuidanceIcons: React.FC<ScanGuidanceIconsProps> = ({
  scanType,
  qualityTier = QualityTier.FAIR,
  showInstructions = true,
  compact = false
}) => {
  const guidance = SCAN_GUIDANCE[scanType];
  const tip = SCAN_TIPS[scanType];
  
  // Animated progress
  const progress = useSharedValue(0);
  
  useEffect(() => {
    progress.value = withTiming(1, { duration: 2000 });
  }, [scanType, progress]);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  const containerStyle = compact ? styles.compactContainer : styles.fullContainer;

  if (compact) {
    return (
      <Animated.View style={containerStyle} entering={FadeInDown.duration(300)}>
        <View style={styles.compactHeader}>
          <Ionicons name="information-circle-outline" size={20} color={QUALITY_COLORS[qualityTier]} />
          <AnimatedText style={[styles.compactTitle, { color: QUALITY_COLORS[qualityTier] }]}>
            {scanType.charAt(0).toUpperCase() + scanType.slice(1)} Scan Tips
          </AnimatedText>
        </View>
        <AnimatedText style={styles.compactTip}>
          {tip}
        </AnimatedText>
      </Animated.View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Header with tip */}
      {showInstructions && (
        <Animated.View 
          style={styles.headerContainer} 
          entering={FadeInDown.duration(400).delay(100)}
        >
          <LinearGradient
            colors={[`${QUALITY_COLORS[qualityTier]}20`, `${QUALITY_COLORS[qualityTier]}10`]}
            style={styles.tipCard}
          >
            <View style={styles.tipContent}>
              <Ionicons name="lightbulb-outline" size={20} color={QUALITY_COLORS[qualityTier]} />
              <AnimatedText style={[styles.tipText, { color: QUALITY_COLORS[qualityTier] }]}>
                {tip}
              </AnimatedText>
            </View>
            <View style={styles.progressContainer}>
              <Animated.View style={[styles.progressBar, progressStyle]} />
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Guidance steps */}
      <View style={styles.stepsContainer}>
        {guidance.map((step, index) => {
          const stepOpacity = useSharedValue(0);
          const stepScale = useSharedValue(0.8);
          
          useEffect(() => {
            stepOpacity.value = withDelay(
              step.delay,
              withTiming(1, { duration: 300 })
            );
            stepScale.value = withDelay(
              step.delay,
              withSpring(1, { mass: 0.5, damping: 12, stiffness: 150 })
            );
          }, [scanType, step.delay]);
          
          const stepStyle = useAnimatedStyle(() => ({
            opacity: stepOpacity.value,
            transform: [{ scale: stepScale.value }]
          }));

          return (
            <Animated.View 
              key={index} 
              style={[styles.stepCard, stepStyle]}
              entering={FadeInUp.duration(300).delay(step.delay)}
            >
              {/* Step number */}
              <View style={styles.stepNumber}>
                <AnimatedText style={styles.stepNumberText}>{index + 1}</AnimatedText>
              </View>
              
              {/* Icon */}
              <View style={[styles.stepIcon, { backgroundColor: `${QUALITY_COLORS[qualityTier]}20` }]}>
                <Ionicons 
                  name={step.icon as any} 
                  size={28} 
                  color={QUALITY_COLORS[qualityTier]} 
                />
              </View>
              
              {/* Content */}
              <View style={styles.stepContent}>
                <AnimatedText style={styles.stepLabel}>{step.label}</AnimatedText>
                <AnimatedText style={styles.stepDetail}>{step.detail}</AnimatedText>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    padding: 16,
    gap: 16
  },
  compactContainer: {
    padding: 12,
    gap: 8
  },
  headerContainer: {
    marginBottom: 8
  },
  tipCard: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden'
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500'
  },
  progressContainer: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
    marginTop: 12,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 1
  },
  stepsContainer: {
    gap: 12
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white'
  },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepContent: {
    flex: 1
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  stepDetail: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  compactTip: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginLeft: 28
  }
});

export default ScanGuidanceIcons;

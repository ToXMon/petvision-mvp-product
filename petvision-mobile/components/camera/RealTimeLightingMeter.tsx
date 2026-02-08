/**
 * RealTimeLightingMeter Component
 * Real-time lighting indicator with dynamic tier updates
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { QualityTier, QUALITY_COLORS } from '../../types/camera';

const AnimatedText = Animated.createAnimatedComponent(Animated.Text);

interface RealTimeLightingMeterProps {
  brightness: number;
  minBrightness?: number;
  maxBrightness?: number;
  optimalMin?: number;
  optimalMax?: number;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const RealTimeLightingMeter: React.FC<RealTimeLightingMeterProps> = ({
  brightness,
  minBrightness = 60,
  maxBrightness = 200,
  optimalMin = 100,
  optimalMax = 180,
  showLabel = true,
  size = 'medium'
}) => {
  const tier = useSharedValue<QualityTier>(QualityTier.FAIR);
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    let newTier: QualityTier;
    if (brightness >= optimalMin && brightness <= optimalMax) {
      newTier = QualityTier.GOOD;
    } else if (brightness >= minBrightness && brightness <= maxBrightness) {
      newTier = QualityTier.FAIR;
    } else {
      newTier = QualityTier.POOR;
    }

    tier.value = withSpring(newTier, { mass: 0.5, damping: 15, stiffness: 150 });

    pulse.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );

    const brightnessRatio = Math.max(0, Math.min(1, (brightness - minBrightness) / (maxBrightness - minBrightness)));
    const targetRotation = brightnessRatio * 180 - 90;
    rotation.value = withSpring(targetRotation, { damping: 15, stiffness: 100 });
  }, [brightness, minBrightness, maxBrightness, optimalMin, optimalMax, tier, pulse, rotation]);

  const animatedColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      tier.value,
      [QualityTier.GOOD, QualityTier.FAIR, QualityTier.POOR],
      [QUALITY_COLORS[QualityTier.GOOD], QUALITY_COLORS[QualityTier.FAIR], QUALITY_COLORS[QualityTier.POOR]]
    );
    return { color };
  });

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));

  const animatedRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: withSpring(tier.value === QualityTier.GOOD ? 1 : 0.7, { damping: 15 }),
  }));

  const sizeConfig = {
    small: { container: 32, icon: 16, text: 10 },
    medium: { container: 48, icon: 24, text: 12 },
    large: { container: 64, icon: 32, text: 14 }
  }[size];

  const getIconName = () => {
    if (brightness < minBrightness) return 'moon';
    if (brightness > maxBrightness) return 'sunny';
    return tier.value === QualityTier.GOOD ? 'sunny' : 'partly-sunny';
  };

  const getLabel = () => {
    if (brightness < minBrightness) return 'Too Dark';
    if (brightness > maxBrightness) return 'Too Bright';
    if (brightness >= optimalMin && brightness <= optimalMax) return 'Good';
    return 'Fair';
  };

  return (
    <Animated.View style={[styles.container, animatedScaleStyle]}>
      <LinearGradient
        colors={[`${QUALITY_COLORS[QualityTier.GOOD]}00`, `${QUALITY_COLORS[QualityTier.GOOD]}20`, `${QUALITY_COLORS[QualityTier.GOOD]}00`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.glow}
      />

      <View style={[styles.indicator, { width: sizeConfig.container, height: sizeConfig.container, borderRadius: sizeConfig.container / 2 }]}>
        <Animated.View style={[styles.indicatorBackground, { width: sizeConfig.container, height: sizeConfig.container, borderRadius: sizeConfig.container / 2 }, animatedColorStyle]} />
        <Animated.View style={[animatedIconStyle, styles.iconContainer]}>
          <Ionicons name={getIconName() as any} size={sizeConfig.icon} color="white" />
        </Animated.View>
      </View>

      {showLabel && (
        <AnimatedText style={[styles.label, animatedColorStyle, { fontSize: sizeConfig.text }]}>
          {getLabel()}
        </AnimatedText>
      )}

      <View style={styles.meterArc}>
        <Animated.View style={[styles.meterIndicator, animatedRotationStyle]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: -1
  },
  indicator: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  indicatorBackground: {
    position: 'absolute'
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  label: {
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  meterArc: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: -1
  },
  meterIndicator: {
    position: 'absolute',
    top: -3,
    left: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    marginLeft: -2
  }
});

export default RealTimeLightingMeter;

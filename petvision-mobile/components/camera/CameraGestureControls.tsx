/**
 * CameraGestureControls Component
 * Gesture-based camera controls: pinch-to-zoom, tap-to-focus
 */

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
  Gesture,
  GestureDetector
} from 'react-native-reanimated';
import { PinchGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { CameraConfig } from '../../types/camera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraGestureControlsProps {
  config: CameraConfig;
  onConfigChange: (config: Partial<CameraConfig>) => void;
  cameraRef: React.RefObject<any>;
  disabled?: boolean;
  showZoomIndicator?: boolean;
  onZoomChange?: (zoom: number) => void;
}

interface FocusPoint {
  x: number;
  y: number;
}

export const CameraGestureControls: React.FC<CameraGestureControlsProps> = ({
  config,
  onConfigChange,
  cameraRef,
  disabled = false,
  showZoomIndicator = true,
  onZoomChange
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const zoom = useSharedValue(config.zoom);
  const focusX = useSharedValue(0);
  const focusY = useSharedValue(0);
  const focusOpacity = useSharedValue(0);
  const focusScale = useSharedValue(1);
  
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle pinch to zoom
  const handlePinch = useCallback(
    async (event: any) => {
      if (disabled) return;

      if (event.nativeEvent.state === State.ACTIVE) {
        scale.value = savedScale.value * event.nativeEvent.scale;
        
        // Clamp zoom between 0 and 1
        const newZoom = Math.max(0, Math.min(1, scale.value - 1));
        zoom.value = newZoom;
        
        onConfigChange({ zoom: newZoom });
        onZoomChange?.(newZoom);
        
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      if (event.nativeEvent.state === State.END) {
        savedScale.value = scale.value;
      }
    },
    [disabled, onConfigChange, onZoomChange, scale, savedScale, zoom]
  );

  // Handle tap to focus
  const handleTap = useCallback(
    async (event: any) => {
      if (disabled) return;
      
      const { x, y } = event.nativeEvent;
      focusX.value = x;
      focusY.value = y;
      
      // Show focus animation
      focusOpacity.value = withTiming(1, { duration: 100 });
      focusScale.value = withSpring(1, { mass: 0.5, damping: 15, stiffness: 200 });
      
      // Auto-focus on camera
      if (cameraRef.current) {
        try {
          await cameraRef.current.focus({ x, y });
        } catch (error) {
          console.warn('Focus failed:', error);
        }
      }
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Accessibility announcement
      AccessibilityInfo.announceForAccessibility('Focus adjusted');
      
      // Clear previous timeout
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      
      // Hide focus ring after delay
      focusTimeoutRef.current = setTimeout(() => {
        focusOpacity.value = withTiming(0, { duration: 300 });
      }, 1000);
    },
    [disabled, cameraRef, focusX, focusY, focusOpacity, focusScale]
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Animated styles
  const focusRingStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: focusX.value - 35,
    top: focusY.value - 35,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFD700',
    opacity: focusOpacity.value,
    transform: [{ scale: focusScale.value }]
  }));

  const focusCornerStyle = (position: 'tl' | 'tr' | 'bl' | 'br') => {
    const positions = {
      tl: { top: 0, left: 0, borderBottomRightRadius: 0 },
      tr: { top: 0, right: 0, borderBottomLeftRadius: 0 },
      bl: { bottom: 0, left: 0, borderTopRightRadius: 0 },
      br: { bottom: 0, right: 0, borderTopLeftRadius: 0 }
    };
    
    return useAnimatedStyle(() => ({
      position: 'absolute',
      width: 20,
      height: 20,
      borderWidth: 3,
      borderColor: '#FFD700',
      borderRadius: 4,
      opacity: focusOpacity.value,
      ...positions[position]
    }));
  };

  const zoomIndicatorStyle = useAnimatedStyle(() => ({
    opacity: showZoomIndicator ? 1 : 0
  }));

  const zoomLabelStyle = useAnimatedStyle(() => {
    const zoomLevel = Math.round(zoom.value * 100);
    return {
      opacity: zoomLevel > 0 ? 1 : 0.5
    };
  });

  return (
    <GestureDetector gesture={Gesture.Pinch().onUpdate(handlePinch)}>
      <GestureDetector gesture={Gesture.Tap().onEnd(handleTap)}>
        <View style={StyleSheet.absoluteFill}>
          {/* Focus ring animation */}
          <Animated.View style={focusRingStyle}>
            <Animated.View style={focusCornerStyle('tl')} />
            <Animated.View style={focusCornerStyle('tr')} />
            <Animated.View style={focusCornerStyle('bl')} />
            <Animated.View style={focusCornerStyle('br')} />
          </Animated.View>

          {/* Zoom indicator */}
          {showZoomIndicator && (
            <Animated.View style={[styles.zoomIndicator, zoomIndicatorStyle]}>
              <Ionicons name="search" size={16} color="white" />
              <Animated.Text style={[styles.zoomLabel, zoomLabelStyle]}>
                {Math.round(zoom.value * 100)}%
              </Animated.Text>
              <View style={styles.zoomSlider}>
                <View style={[styles.zoomProgress, { width: `${zoom.value * 100}%` }]} />
              </View>
            </Animated.View>
          )}

          {/* Visual guide for pinch gesture */}
          {!disabled && (
            <View style={styles.gestureGuide}>
              <View style={styles.gestureLine} />
              <View style={styles.gestureArrow}>
                <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.3)" />
                <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          )}
        </View>
      </GestureDetector>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  zoomIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20
  },
  zoomLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    minWidth: 40
  },
  zoomSlider: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  zoomProgress: {
    height: '100%',
    backgroundColor: '#3B82F6'
  },
  gestureGuide: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 40,
    left: 20,
    opacity: 0.3
  },
  gestureLine: {
    width: 60,
    height: 2,
    backgroundColor: 'white',
    marginBottom: 8
  },
  gestureArrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60
  }
});

export default CameraGestureControls;

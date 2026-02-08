# Photo Capture Module - Integration Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install expo-camera expo-haptics react-native-reanimated
npm install react-native-gesture-handler expo-linear-gradient
npm install @expo/vector-icons
```

### 2. Basic Setup

```typescript
import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import { useCameraCapture } from '../hooks/useCameraCapture';
import { CameraGestureControls } from '../components/camera/CameraGestureControls';
import { RealTimeLightingMeter } from '../components/camera/RealTimeLightingMeter';
import { ScanGuidanceIcons } from '../components/camera/ScanGuidanceIcons';
import { ScanType, CameraType, FlashMode } from '../types/camera';

export default function PhotoCaptureScreen() {
  const cameraRef = useRef<Camera>(null);
  const [scanType, setScanType] = useState<ScanType>(ScanType.EYE);
  const [brightness, setBrightness] = useState(128);
  
  const {
    cameraConfig,
    isReady,
    isCapturing,
    capturedPhoto,
    qualityMetrics,
    handleCameraReady,
    handleCapture,
    handleRetake,
    toggleCamera,
    cycleFlash,
    setZoom,
    setFlash,
    setScanType
  } = useCameraCapture();

  return (
    <View style={styles.container}>
      {/* Camera Component */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraConfig.type}
        flashMode={cameraConfig.flash}
        zoom={cameraConfig.zoom}
        onCameraReady={handleCameraReady}
      >
        {/* Real-Time Lighting Meter */}
        <View style={styles.lightingMeter}>
          <RealTimeLightingMeter
            brightness={brightness}
            size="medium"
            showLabel={true}
          />
        </View>

        {/* Scan Guidance */}
        {isReady && (
          <View style={styles.guidance}>
            <ScanGuidanceIcons
              scanType={scanType}
              qualityTier={qualityMetrics?.overall.tier}
              showInstructions={true}
              compact={false}
            />
          </View>
        )}

        {/* Gesture Controls */}
        <CameraGestureControls
          config={cameraConfig}
          onConfigChange={(newConfig) => {
            if (newConfig.zoom !== undefined) setZoom(newConfig.zoom);
          }}
          cameraRef={cameraRef}
          disabled={isCapturing}
          showZoomIndicator={true}
        />
      </Camera>

      {/* Camera Controls */}
      <View style={styles.controls}>
        {/* Flash button */}
        <TouchableOpacity onPress={cycleFlash}>
          <Ionicons 
            name={cameraConfig.flash === 'on' ? 'flash' : 'flash-off'} 
            size={28} 
            color="white" 
          />
        </TouchableOpacity>
        
        {/* Capture button */}
        <TouchableOpacity 
          onPress={() => handleCapture(cameraRef, scanType)}
          disabled={isCapturing}
        >
          <View style={styles.captureButton}>
            <View style={[styles.captureInner, { opacity: isCapturing ? 0.5 : 1 }]} />
          </View>
        </TouchableOpacity>
        
        {/* Camera toggle */}
        <TouchableOpacity onPress={toggleCamera}>
          <Ionicons name="camera-reverse" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  lightingMeter: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10
  },
  guidance: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 5
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white'
  }
});
```

---

## Component Integration Examples

### Example 1: Compact Mode with Real-Time Feedback

```typescript
<View style={styles.compactCamera}>
  <Camera ref={cameraRef} style={StyleSheet.absoluteFill} />
  
  {/* Compact lighting meter */}
  <View style={styles.topBar}>
    <RealTimeLightingMeter
      brightness={brightness}
      size="small"
      showLabel={false}
    />
  </View>
  
  {/* Compact guidance */}
  <View style={styles.bottomBar}>
    <ScanGuidanceIcons
      scanType={scanType}
      compact={true}
    />
  </View>
</View>
```

### Example 2: Full Camera Suite with All Features

```typescript
<Camera ref={cameraRef} style={StyleSheet.absoluteFill}>
  {/* Top Bar */}
  <View style={styles.topBar}>
    <RealTimeLightingMeter
      brightness={brightness}
      minBrightness={60}
      maxBrightness={200}
      optimalMin={100}
      optimalMax={180}
      size="medium"
      showLabel={true}
    />
    
    <CameraControls
      config={cameraConfig}
      onConfigChange={setCameraConfig}
      showZoom={true}
    />
  </View>
  
  {/* Scan Guidance */}
  <ScanGuidanceIcons
    scanType={scanType}
    qualityTier={qualityTier}
    showInstructions={true}
    compact={false}
  />
  
  {/* Gesture Controls */}
  <CameraGestureControls
    config={cameraConfig}
    onConfigChange={setCameraConfig}
    cameraRef={cameraRef}
    disabled={isCapturing}
    showZoomIndicator={true}
  />
  
  {/* Bottom Controls */}
  <CameraControlBar
    onCapture={() => handleCapture(cameraRef, scanType)}
    onToggleCamera={toggleCamera}
    onCycleFlash={cycleFlash}
    isCapturing={isCapturing}
  />
</Camera>
```

---

## Hook Usage Examples

### Basic Hook Usage

```typescript
const {
  isReady,
  isCapturing,
  capturedPhoto,
  qualityMetrics,
  handleCameraReady,
  handleCapture,
  handleRetake,
  toggleCamera,
  cycleFlash,
  setZoom,
  reset
} = useCameraCapture();

// Check camera ready
<Camera onCameraReady={handleCameraReady} />

// Handle capture
await handleCapture(cameraRef, ScanType.EYE);

// Reset state
reset();
```

### Advanced Hook Usage with Custom Handlers

```typescript
const {
  cameraConfig,
  isCapturing,
  error,
  handleCapture,
  setCapturing,
  setError
} = useCameraCapture();

// Custom capture handler
const handleCustomCapture = async () => {
  try {
    setCapturing(true);
    setError(null);
    
    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.9,
      base64: true,
      skipProcessing: false
    });
    
    if (photo) {
      // Process photo
      const metrics = await validateImageQuality(
        photo.uri,
        photo.width,
        photo.height,
        photo.base64
      );
      
      setQualityMetrics(metrics);
      setCapturedPhoto(photo);
    }
  } catch (err) {
    setError('Failed to capture photo');
  } finally {
    setCapturing(false);
  }
};
```

---

## Quality Validator Usage

### Basic Validation

```typescript
import { validateImageQuality, isAcceptableQuality } from '../utils/imageQualityValidator';

const metrics = await validateImageQuality(
  photoUri,
  photoWidth,
  photoHeight,
  photoBase64
);

console.log('Quality Score:', metrics.overall.score);
console.log('Quality Tier:', metrics.overall.tier);
console.log('Issues:', metrics.issues);

if (isAcceptableQuality(metrics)) {
  // Proceed with upload
} else {
  // Show quality issues to user
}
```

### Get Quality Badge Properties

```typescript
import { getQualityBadgeProps } from '../utils/imageQualityValidator';

const badgeProps = getQualityBadgeProps(metrics.overall.tier);

// badgeProps = {
//   color: '#10B981',
//   icon: 'checkmark-circle',
//   label: 'Good Quality'
// }
```

---

## Testing

### Run All Tests

```bash
npm test -- tests/camera/
```

### Run Specific Test File

```bash
npm test -- tests/camera/imageQualityValidator.test.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage tests/camera/
```

---

## Troubleshooting

### Camera Not Showing

- Ensure `expo-camera` is installed
- Check permissions in `app.json`
- Verify `onCameraReady` is called

### Gestures Not Working

- Ensure `react-native-gesture-handler` is linked
- Wrap root component with `GestureHandlerRootView`
- Check that components are not covered by other views

### Animations Choppy

- Use `useSharedValue` instead of state for animated values
- Avoid inline style calculations
- Ensure `react-native-reanimated` is properly configured

### Quality Analysis Issues

- Ensure base64 data is provided
- Check image dimensions are valid
- Verify image format is supported (JPEG, PNG)

---

## Best Practices

1. **Always handle camera permissions** before showing camera
2. **Release camera resources** when screen unmounts
3. **Provide fallback UI** when camera is unavailable
4. **Test on real devices** - emulators don't have cameras
5. **Handle low-memory situations** gracefully
6. **Provide clear feedback** for all user actions
7. **Respect user privacy** - explain why camera access is needed
8. **Test with different lighting conditions**
9. **Support both orientations** when appropriate
10. **Implement proper error boundaries**

---

## Migration Guide

### From Legacy CameraCapture.tsx

```typescript
// OLD
import CameraCapture from '../components/CameraCapture';

<CameraCapture
  onCapture={handlePhotoCapture}
  scanType={scanType}
/>

// NEW
import { CameraGestureControls, RealTimeLightingMeter } from '../components/camera';

<Camera ref={cameraRef} style={StyleSheet.absoluteFill}>
  <RealTimeLightingMeter brightness={brightness} />
  <CameraGestureControls
    config={cameraConfig}
    onConfigChange={setCameraConfig}
    cameraRef={cameraRef}
  />
</Camera>
```

---

## Support

For issues or questions:
1. Check the [Component Specifications](./CAMERA_COMPONENTS_SPEC.md)
2. Review unit test examples
3. Check PetVision documentation
4. Contact development team

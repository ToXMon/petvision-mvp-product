# Photo Capture Module - Component Specifications

## Document Version
- **Version**: 1.0.0
- **Last Updated**: 2025-02-04
- **Author**: Agent Zero
- **Status**: Production Ready

---

## Overview

The Photo Capture Module provides a world-class camera experience for PetVision, featuring:

- **Real-time Quality Feedback**: Instant visual feedback on photo quality
- **Gesture Controls**: Pinch-to-zoom and tap-to-focus support
- **AR Overlay**: Augmented reality guidance for scan types
- **Accessibility**: Full VoiceOver and screen reader support
- **Performance**: 60fps animations with minimal memory usage

---

## Component Library

### 1. RealTimeLightingMeter

**Purpose**: Real-time lighting indicator with dynamic tier updates and visual feedback.

#### Props Interface
```typescript
interface RealTimeLightingMeterProps {
  brightness: number;              // Current brightness value (0-255)
  minBrightness?: number;         // Minimum acceptable brightness (default: 60)
  maxBrightness?: number;         // Maximum acceptable brightness (default: 200)
  optimalMin?: number;            // Optimal minimum brightness (default: 100)
  optimalMax?: number;            // Optimal maximum brightness (default: 180)
  showLabel?: boolean;            // Show text label (default: true)
  size?: 'small' | 'medium' | 'large';  // Component size (default: medium)
}
```

#### Features
- Dynamic color changes based on lighting quality
- Animated meter arc showing brightness level
- Pulse animation on quality tier changes
- Three size variants for different UI contexts
- Gradient glow effect

#### Example Usage
```typescript
<RealTimeLightingMeter
  brightness={brightnessValue}
  minBrightness={60}
  maxBrightness={200}
  optimalMin={100}
  optimalMax={180}
  size="medium"
  showLabel={true}
/>
```

---

### 2. CameraGestureControls

**Purpose**: Gesture-based camera controls for zoom, focus, and pan.

#### Props Interface
```typescript
interface CameraGestureControlsProps {
  config: CameraConfig;              // Current camera configuration
  onConfigChange: (config: Partial<CameraConfig>) => void;
  cameraRef: React.RefObject<any>;   // Reference to Camera component
  disabled?: boolean;                // Disable gestures (default: false)
  showZoomIndicator?: boolean;       // Show zoom level (default: true)
  onZoomChange?: (zoom: number) => void;
}
```

#### Features
- **Pinch-to-Zoom**: Smooth zoom with haptic feedback
- **Tap-to-Focus**: Focus ring animation with corner guides
- **Zoom Indicator**: Real-time zoom percentage display
- **Visual Gesture Guide**: Subtle hints for new users
- **Accessibility**: VoiceOver announcements

#### Example Usage
```typescript
const cameraRef = useRef<Camera>(null);

<CameraGestureControls
  config={cameraConfig}
  onConfigChange={setCameraConfig}
  cameraRef={cameraRef}
  disabled={isCapturing}
  showZoomIndicator={true}
  onZoomChange={(zoom) => console.log('Zoom:', zoom)}
/>
```

---

### 3. ScanGuidanceIcons

**Purpose**: Scan-type specific guidance with animated icons and step-by-step instructions.

#### Props Interface
```typescript
interface ScanGuidanceIconsProps {
  scanType: ScanType;               // Current scan type
  qualityTier?: QualityTier;       // Current quality tier
  showInstructions?: boolean;      // Show detailed instructions (default: true)
  compact?: boolean;               // Compact mode (default: false)
}
```

#### Features
- **Scan-Specific Steps**: Custom guidance per scan type (Eye, Skin, Teeth, Gait, Multi)
- **Animated Transitions**: Smooth enter/exit animations
- **Color-Coded**: Matches quality tier colors
- **Progress Indicator**: Visual progress through steps
- **Tips & Hints**: Contextual tips for each scan type

#### Supported Scan Types
| Scan Type | Icon | Steps |
|-----------|------|-------|
| EYE | eye | Position, Lighting, Focus |
| SKIN | leaf | Position, Steady, Capture |
| TEETH | paw | Approach, Position, Light |
| GAIT | walk | Position, Motion, Pace |
| MULTI | camera-reverse | Angles, Multiple, Quality |

#### Example Usage
```typescript
<ScanGuidanceIcons
  scanType={ScanType.EYE}
  qualityTier={qualityTier}
  showInstructions={true}
  compact={false}
/>
```

---

## API Reference

### Types

```typescript
// camera.ts
export enum CameraType {
  FRONT = 'front',
  BACK = 'back'
}

export enum FlashMode {
  OFF = 'off',
  ON = 'on',
  AUTO = 'auto',
  TORCH = 'torch'
}

export enum QualityTier {
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export enum ScanType {
  EYE = 'eye',
  SKIN = 'skin',
  TEETH = 'teeth',
  GAIT = 'gait',
  MULTI = 'multi'
}

export interface CameraConfig {
  type: CameraType;
  flash: FlashMode;
  zoom: number;
  whiteBalance?: string;
}

export interface QualityMetrics {
  resolution: { width: number; height: number; score: number; };
  brightness: { value: number; score: number; tier: QualityTier; };
  sharpness: { value: number; score: number; tier: QualityTier; };
  overall: { score: number; tier: QualityTier; };
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}
```

---

## Color System

### Quality Tiers
| Tier | Color | Hex | Use Case |
|------|-------|-----|----------|
| GOOD | Emerald | #10B981 | Excellent quality, proceed |
| FAIR | Amber | #F59E0B | Acceptable quality, consider improvement |
| POOR | Red | #EF4444 | Poor quality, retake photo |

### UI Colors
- **Primary**: #3B82F6 (Blue)
- **Background**: rgba(0, 0, 0, 0.6) (Dark overlay)
- **Text**: #FFFFFF (White)
- **Hint**: rgba(255, 255, 255, 0.5)

---

## Changelog

### v1.0.0 (2025-02-04)
- Initial release
- RealTimeLightingMeter component
- CameraGestureControls component
- ScanGuidanceIcons component
- Comprehensive unit tests
- Full TypeScript support
- Accessibility features
- Performance optimizations

/**
 * Camera Module Type Definitions
 * PetVision Mobile App - Photo Capture Module
 */

import { CameraType as ExpoCameraType, FlashMode } from 'expo-camera';

/**
 * Quality tier levels for image analysis
 */
export enum QualityTier {
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

/**
 * Quality tier color mapping
 */
export const QUALITY_COLORS = {
  [QualityTier.GOOD]: '#10B981',
  [QualityTier.FAIR]: '#F59E0B',
  [QualityTier.POOR]: '#EF4444'
} as const;

/**
 * Scan type specific guidance
 */
export enum ScanType {
  EYE = 'eye',
  SKIN = 'skin',
  TEETH = 'teeth',
  GAIT = 'gait',
  MULTI = 'multi'
}

/**
 * Scan type specific instructions
 */
export const SCAN_INSTRUCTIONS = {
  [ScanType.EYE]: 'Hold camera 6-8 inches from pet\'s eye. Ensure good lighting.',
  [ScanType.SKIN]: 'Capture the affected area. Avoid blurry movements.',
  [ScanType.TEETH]: 'Open pet\'s mouth gently. Capture teeth clearly.',
  [ScanType.GAIT]: 'Record pet walking from the side.',
  [ScanType.MULTI]: 'Capture multiple angles. Front, side, and back views.'
} as const;

/**
 * Image quality metrics
 */
export interface QualityMetrics {
  resolution: {
    width: number;
    height: number;
    score: number; // 0-100
  };
  brightness: {
    value: number; // 0-255 average
    score: number;
    tier: QualityTier;
  };
  sharpness: {
    value: number; // Laplacian variance
    score: number;
    tier: QualityTier;
  };
  overall: {
    score: number; // 0-100
    tier: QualityTier;
  };
  issues: QualityIssue[];
}

/**
 * Specific quality issues detected
 */
export interface QualityIssue {
  type: 'low-resolution' | 'too-dark' | 'too-bright' | 'blurry' | 'no-face';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

/**
 * Camera state types
 */
export enum CameraState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  READY = 'ready',
  CAPTURING = 'capturing',
  PROCESSING = 'processing',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  type: ExpoCameraType;
  flash: FlashMode;
  zoom: number;
  focusMode: 'on' | 'off';
  whiteBalance: 'auto' | 'sunny' | 'cloudy' | 'shadow';
}

/**
 * Camera permissions status
 */
export interface PermissionsStatus {
  camera: 'granted' | 'denied' | 'not-determined';
  microphone: 'granted' | 'denied' | 'not-determined';
}

/**
 * Captured photo data
 */
export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: any;
  qualityMetrics: QualityMetrics;
  timestamp: Date;
}

/**
 * Upload progress
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number; // bytes per second
}

/**
 * Camera error types
 */
export enum CameraErrorType {
  PERMISSION_DENIED = 'permission-denied',
  CAMERA_UNAVAILABLE = 'camera-unavailable',
  CAPTURE_FAILED = 'capture-failed',
  PROCESSING_FAILED = 'processing-failed',
  UPLOAD_FAILED = 'upload-failed',
  NETWORK_ERROR = 'network-error',
  UNKNOWN = 'unknown'
}

/**
 * Camera error
 */
export interface CameraError {
  type: CameraErrorType;
  message: string;
  code?: string;
  retryable: boolean;
}

/**
 * Capture result
 */
export interface CaptureResult {
  photo: CapturedPhoto;
  success: boolean;
  error?: CameraError;
}

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: CameraError;
}

/**
 * Camera hook return type
 */
export interface UseCameraCaptureReturn {
  // State
  state: CameraState;
  config: CameraConfig;
  permissions: PermissionsStatus;
  capturedPhoto: CapturedPhoto | null;
  uploadProgress: UploadProgress | null;
  error: CameraError | null;
  
  // Actions
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  capturePhoto: () => Promise<CaptureResult>;
  retakePhoto: () => void;
  uploadPhoto: (photo: CapturedPhoto) => Promise<UploadResult>;
  toggleCamera: () => void;
  setFlashMode: (mode: FlashMode) => void;
  setZoom: (zoom: number) => void;
  reset: () => void;
}

/**
 * Accessibility announcements
 */
export interface AccessibilityAnnouncement {
  event: 'camera-ready' | 'photo-captured' | 'quality-detected' | 'upload-complete' | 'error';
  message: string;
}

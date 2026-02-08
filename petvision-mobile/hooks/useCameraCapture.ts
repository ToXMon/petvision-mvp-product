/**
 * useCameraCapture Hook
 * Camera state management, permissions, capture, and upload
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform, AccessibilityInfo } from 'react-native';

import {
  CameraState,
  CameraConfig,
  PermissionsStatus,
  CapturedPhoto,
  UploadProgress,
  CameraError,
  CameraErrorType,
  CaptureResult,
  UploadResult,
  UseCameraCaptureReturn,
  AccessibilityAnnouncement
} from '../types/camera';

import { validateImageQuality, getQualityAnnouncement } from '../utils/imageQualityValidator';
import { uploadScanPhoto, fileToBase64 } from '../services/storageService';

/**
 * Hook options
 */
interface UseCameraCaptureOptions {
  scanType?: string;
  petId?: string;
  onCapture?: (photo: CapturedPhoto) => void;
  onUpload?: (result: UploadResult) => void;
  onError?: (error: CameraError) => void;
}

/**
 * Default camera configuration
 */
const DEFAULT_CONFIG: CameraConfig = {
  type: CameraType.back,
  flash: FlashMode.auto,
  zoom: 0,
  focusMode: 'on',
  whiteBalance: 'auto'
};

/**
 * useCameraCapture Hook
 */
export function useCameraCapture(options: UseCameraCaptureOptions = {}): UseCameraCaptureReturn {
  const { scanType = 'multi', petId, onCapture, onUpload, onError } = options;

  // State
  const [state, setState] = useState<CameraState>(CameraState.IDLE);
  const [config, setConfig] = useState<CameraConfig>(DEFAULT_CONFIG);
  const [permissions, setPermissions] = useState<PermissionsStatus>({
    camera: 'not-determined',
    microphone: 'not-determined'
  });
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<CameraError | null>(null);

  // Refs
  const cameraRef = useRef<Camera>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  /**
   * Announce to accessibility
   */
  const announce = useCallback(async (announcement: AccessibilityAnnouncement) => {
    if (Platform.OS === 'ios') {
      await AccessibilityInfo.announceForAccessibility(announcement.message);
    }
  }, []);

  /**
   * Update camera configuration
   */
  const updateConfig = useCallback((updates: Partial<CameraConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Initialize camera and request permissions
   */
  const initialize = useCallback(async () => {
    try {
      setState(CameraState.INITIALIZING);
      setError(null);

      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const microphoneStatus = await Camera.requestMicrophonePermissionsAsync();

      setPermissions({
        camera: cameraStatus.granted ? 'granted' : 'denied',
        microphone: microphoneStatus.granted ? 'granted' : 'denied'
      });

      if (!cameraStatus.granted) {
        const error: CameraError = {
          type: CameraErrorType.PERMISSION_DENIED,
          message: 'Camera permission is required to capture photos',
          retryable: true
        };
        setError(error);
        onError?.(error);
        setState(CameraState.ERROR);
        return;
      }

      setState(CameraState.READY);
      await announce({
        event: 'camera-ready',
        message: 'Camera is ready. Tap to capture.'
      });

    } catch (error) {
      const cameraError: CameraError = {
        type: CameraErrorType.CAMERA_UNAVAILABLE,
        message: 'Failed to initialize camera',
        retryable: true
      };
      setError(cameraError);
      onError?.(cameraError);
      setState(CameraState.ERROR);
    }
  }, [announce, onError]);

  /**
   * Request permissions explicitly
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setPermissions(prev => ({ ...prev, camera: cameraStatus.granted ? 'granted' : 'denied' }));
      return cameraStatus.granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  /**
   * Capture photo
   */
  const capturePhoto = useCallback(async (): Promise<CaptureResult> => {
    if (!cameraRef.current) {
      const error: CameraError = {
        type: CameraErrorType.CAPTURE_FAILED,
        message: 'Camera not available',
        retryable: false
      };
      setError(error);
      return { photo: null as any, success: false, error };
    }

    try {
      setState(CameraState.CAPTURING);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
        exif: true
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      setState(CameraState.PROCESSING);

      // Convert to base64 for quality analysis
      let base64: string | undefined;
      try {
        base64 = await fileToBase64(photo.uri);
      } catch (error) {
        console.warn('Failed to convert to base64:', error);
      }

      // Analyze quality
      const qualityMetrics = await validateImageQuality(
        photo.uri,
        photo.width,
        photo.height,
        base64
      );

      const capturedPhoto: CapturedPhoto = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        base64,
        exif: photo.exif,
        qualityMetrics,
        timestamp: new Date()
      };

      setCapturedPhoto(capturedPhoto);
      setState(CameraState.READY);

      await announce({
        event: 'photo-captured',
        message: getQualityAnnouncement(qualityMetrics)
      });

      onCapture?.(capturedPhoto);

      return { photo: capturedPhoto, success: true };

    } catch (error) {
      const cameraError: CameraError = {
        type: CameraErrorType.CAPTURE_FAILED,
        message: error instanceof Error ? error.message : 'Failed to capture photo',
        retryable: true
      };
      setError(cameraError);
      onError?.(cameraError);
      setState(CameraState.READY);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      return { photo: null as any, success: false, error: cameraError };
    }
  }, [announce, onCapture, onError]);

  /**
   * Pick photo from gallery
   */
  const pickPhoto = useCallback(async (): Promise<CaptureResult> => {
    try {
      setState(CameraState.CAPTURING);
      setError(null);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setState(CameraState.PROCESSING);

        // Convert to base64 for quality analysis
        let base64: string | undefined;
        try {
          base64 = await fileToBase64(asset.uri);
        } catch (error) {
          console.warn('Failed to convert to base64:', error);
        }

        // Analyze quality
        const qualityMetrics = await validateImageQuality(
          asset.uri,
          asset.width || 1080,
          asset.height || 1920,
          base64
        );

        const capturedPhoto: CapturedPhoto = {
          uri: asset.uri,
          width: asset.width || 1080,
          height: asset.height || 1920,
          base64,
          exif: {},
          qualityMetrics,
          timestamp: new Date()
        };

        setCapturedPhoto(capturedPhoto);
        setState(CameraState.READY);

        await announce({
          event: 'photo-captured',
          message: getQualityAnnouncement(qualityMetrics)
        });

        onCapture?.(capturedPhoto);

        return { photo: capturedPhoto, success: true };
      }

      setState(CameraState.READY);
      return { photo: null as any, success: false };

    } catch (error) {
      const cameraError: CameraError = {
        type: CameraErrorType.CAPTURE_FAILED,
        message: error instanceof Error ? error.message : 'Failed to pick photo',
        retryable: true
      };
      setError(cameraError);
      onError?.(cameraError);
      setState(CameraState.READY);
      
      return { photo: null as any, success: false, error: cameraError };
    }
  }, [announce, onCapture, onError]);

  /**
   * Retake photo
   */
  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setUploadProgress(null);
    setError(null);
    setState(CameraState.READY);
  }, []);

  /**
   * Upload photo
   */
  const uploadPhoto = useCallback(async (photo: CapturedPhoto): Promise<UploadResult> => {
    if (!petId) {
      const error: CameraError = {
        type: CameraErrorType.UPLOAD_FAILED,
        message: 'Pet ID is required for upload',
        retryable: false
      };
      setError(error);
      return { success: false, error };
    }

    try {
      setState(CameraState.UPLOADING);
      setError(null);

      // Abort previous upload if exists
      if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort();
      }

      uploadAbortControllerRef.current = new AbortController();

      const result = await uploadScanPhoto(
        photo.uri,
        scanType,
        petId,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (result.success) {
        setState(CameraState.SUCCESS);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await announce({
          event: 'upload-complete',
          message: 'Photo uploaded successfully'
        });
      } else {
        setState(CameraState.ERROR);
        setError(result.error || null);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      onUpload?.(result);
      return result;

    } catch (error) {
      const cameraError: CameraError = {
        type: CameraErrorType.UPLOAD_FAILED,
        message: error instanceof Error ? error.message : 'Failed to upload photo',
        retryable: true
      };
      setError(cameraError);
      onError?.(cameraError);
      setState(CameraState.ERROR);
      return { success: false, error: cameraError };
    }
  }, [petId, scanType, announce, onUpload, onError]);

  /**
   * Toggle camera (front/back)
   */
  const toggleCamera = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      type: prev.type === CameraType.back ? CameraType.front : CameraType.back
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  /**
   * Set flash mode
   */
  const setFlashMode = useCallback((mode: FlashMode) => {
    updateConfig({ flash: mode });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateConfig]);

  /**
   * Set zoom level
   */
  const setZoom = useCallback((zoom: number) => {
    updateConfig({ zoom: Math.max(0, Math.min(1, zoom)) });
  }, [updateConfig]);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setCapturedPhoto(null);
    setUploadProgress(null);
    setError(null);
    setState(CameraState.IDLE);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    config,
    permissions,
    capturedPhoto,
    uploadProgress,
    error,
    cameraRef,
    initialize,
    requestPermissions,
    capturePhoto,
    pickPhoto,
    retakePhoto,
    uploadPhoto,
    toggleCamera,
    setFlashMode,
    setZoom,
    reset
  };
}

export default useCameraCapture;

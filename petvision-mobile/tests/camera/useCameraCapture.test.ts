/**
 * Unit Tests for useCameraCapture Hook
 * Testing camera state management, capture logic, and error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCameraCapture } from '../../hooks/useCameraCapture';
import { CameraType, ScanType, QualityTier } from '../../types/camera';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraType: {
    front: 'front',
    back: 'back'
  },
  FlashMode: {
    off: 'off',
    on: 'on',
    auto: 'auto',
    torch: 'torch'
  }
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Rigid: 'rigid',
    Soft: 'soft'
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error'
  },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn()
}));

// Mock storage service
jest.mock('../../services/storageService', () => ({
  uploadImage: jest.fn(() => Promise.resolve({ url: 'mock-url', path: 'mock-path' }))
}));

describe('useCameraCapture Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useCameraCapture());

      expect(result.current.isReady).toBe(false);
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.capturedPhoto).toBeNull();
      expect(result.current.qualityMetrics).toBeNull();
      expect(result.current.cameraConfig.type).toBe(CameraType.BACK);
      expect(result.current.cameraConfig.flash).toBe('auto');
      expect(result.current.cameraConfig.zoom).toBe(0);
    });
  });

  describe('Camera Ready State', () => {
    it('should set isReady to true when camera is ready', async () => {
      const { result } = renderHook(() => useCameraCapture());

      await act(async () => {
        await result.current.handleCameraReady();
      });

      expect(result.current.isReady).toBe(true);
    });
  });

  describe('Camera Toggle', () => {
    it('should toggle between front and back camera', () => {
      const { result } = renderHook(() => useCameraCapture());

      expect(result.current.cameraConfig.type).toBe(CameraType.BACK);

      act(() => {
        result.current.toggleCamera();
      });

      expect(result.current.cameraConfig).toBe(CameraType.FRONT);

      act(() => {
        result.current.toggleCamera();
      });

      expect(result.current.cameraConfig).toBe(CameraType.BACK);
    });

    it('should disable camera toggle while capturing', () => {
      const { result } = renderHook(() => useCameraCapture());

      // Simulate capturing state
      act(() => {
        result.current.setCapturing(true);
      });

      const initialType = result.current.cameraConfig.type;

      act(() => {
        result.current.toggleCamera();
      });

      // Should not toggle while capturing
      expect(result.current.cameraConfig.type).toBe(initialType);
    });
  });

  describe('Flash Control', () => {
    it('should cycle through flash modes', () => {
      const { result } = renderHook(() => useCameraCapture());

      const modes = ['auto', 'on', 'off', 'torch'];

      modes.forEach((mode, index) => {
        expect(result.current.cameraConfig.flash).toBe(mode);

        act(() => {
          result.current.cycleFlash();
        });
      });

      // Should cycle back to first mode
      expect(result.current.cameraConfig.flash).toBe(modes[0]);
    });

    it('should set specific flash mode', () => {
      const { result } = renderHook(() => useCameraCapture());

      act(() => {
        result.current.setFlash('on');
      });

      expect(result.current.cameraConfig.flash).toBe('on');
    });
  });

  describe('Zoom Control', () => {
    it('should set zoom level within bounds', () => {
      const { result } = renderHook(() => useCameraCapture());

      act(() => {
        result.current.setZoom(0.5);
      });

      expect(result.current.cameraConfig.zoom).toBe(0.5);
    });

    it('should clamp zoom to 0 minimum', () => {
      const { result } = renderHook(() => useCameraCapture());

      act(() => {
        result.current.setZoom(-0.5);
      });

      expect(result.current.cameraConfig.zoom).toBe(0);
    });

    it('should clamp zoom to 1 maximum', () => {
      const { result } = renderHook(() => useCameraCapture());

      act(() => {
        result.current.setZoom(1.5);
      });

      expect(result.current.cameraConfig.zoom).toBe(1);
    });
  });

  describe('Capture Logic', () => {
    it('should handle photo capture', async () => {
      const { result } = renderHook(() => useCameraCapture());

      // Mock camera ref with takePicture
      const mockCamera = {
        takePictureAsync: jest.fn(() => Promise.resolve({
          uri: 'mock-uri',
          width: 1920,
          height: 1080,
          base64: 'mock-base64'
        }))
      };

      await act(async () => {
        await result.current.handleCapture(mockCamera as any, ScanType.EYE);
      });

      expect(mockCamera.takePictureAsync).toHaveBeenCalled();
      expect(result.current.capturedPhoto).not.toBeNull();
    });

    it('should set capturing state during capture', async () => {
      const { result } = renderHook(() => useCameraCapture());

      const mockCamera = {
        takePictureAsync: jest.fn(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              uri: 'mock-uri',
              width: 1920,
              height: 1080
            }), 100)
          )
        )
      };

      act(() => {
        result.current.handleCapture(mockCamera as any, ScanType.EYE);
      });

      expect(result.current.isCapturing).toBe(true);

      await waitFor(() => {
        expect(result.current.isCapturing).toBe(false);
      });
    });

    it('should handle capture errors gracefully', async () => {
      const { result } = renderHook(() => useCameraCapture());

      const mockCamera = {
        takePictureAsync: jest.fn(() => Promise.reject(new Error('Capture failed')))
      };

      await act(async () => {
        await result.current.handleCapture(mockCamera as any, ScanType.EYE);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.capturedPhoto).toBeNull();
    });
  });

  describe('Retake Logic', () => {
    it('should reset state on retake', () => {
      const { result } = renderHook(() => useCameraCapture());

      // Set captured state
      act(() => {
        result.current.setCapturedPhoto({
          uri: 'test-uri',
          width: 1920,
          height: 1080
        } as any);
      });

      act(() => {
        result.current.handleRetake();
      });

      expect(result.current.capturedPhoto).toBeNull();
      expect(result.current.qualityMetrics).toBeNull();
      expect(result.current.isCapturing).toBe(false);
    });
  });

  describe('Scan Type Selection', () => {
    it('should set scan type', () => {
      const { result } = renderHook(() => useCameraCapture());

      act(() => {
        result.current.setScanType(ScanType.TEETH);
      });

      expect(result.current.scanType).toBe(ScanType.TEETH);
    });

    it('should clear scan type', () => {
      const { result } = renderHook(() => useCameraCapture());

      act(() => {
        result.current.setScanType(ScanType.EYE);
      });

      act(() => {
        result.current.clearScanType();
      });

      expect(result.current.scanType).toBeNull();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useCameraCapture());

      // Set various states
      act(() => {
        result.current.setCapturedPhoto({ uri: 'test' } as any);
        result.current.setCapturing(true);
        result.current.setError('Test error');
        result.current.setScanType(ScanType.SKIN);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.capturedPhoto).toBeNull();
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.scanType).toBeNull();
    });
  });
});

// Test helper constants
const MOCK_CAMERA_CONFIG = {
  type: 'back' as const,
  flash: 'auto' as const,
  zoom: 0.5,
  whiteBalance: 'auto' as const
};

const MOCK_PHOTO = {
  uri: 'file:///mock-photo.jpg',
  width: 1920,
  height: 1080,
  base64: 'mock-base64-string'
};

const MOCK_QUALITY_METRICS = {
  resolution: { width: 1920, height: 1080, score: 90 },
  brightness: { value: 150, score: 85, tier: QualityTier.GOOD },
  sharpness: { value: 500, score: 80, tier: QualityTier.FAIR },
  overall: { score: 85, tier: QualityTier.FAIR },
  issues: []
};

export { MOCK_CAMERA_CONFIG, MOCK_PHOTO, MOCK_QUALITY_METRICS };

/**
 * Storage Service - Enhanced for Photo Capture Module
 * Optimized uploads with progress tracking and error handling
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Storage as AmplifyStorage } from 'aws-amplify';
import { UploadProgress, CameraError, CameraErrorType } from '../types/camera';

/**
 * Upload configuration
 */
interface UploadConfig {
  key: string;
  fileUri: string;
  contentType: string;
  onProgress?: (progress: UploadProgress) => void;
  compressionQuality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Upload result
 */
interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: CameraError;
}

/**
 * Compression options
 */
interface CompressionOptions {
  quality: number; // 0-100
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png';
}

/**
 * Default compression settings
 */
const DEFAULT_COMPRESSION: CompressionOptions = {
  quality: 85,
  maxWidth: 1920,
  maxHeight: 1920,
  format: 'jpeg'
};

/**
 * Generate unique file key
 */
function generateKey(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}/${timestamp}-${random}.${extension}`;
}

/**
 * Compress image using expo-image-manipulator
 */
export async function compressImage(
  uri: string,
  options: CompressionOptions = DEFAULT_COMPRESSION
): Promise<string> {
  try {
    const { ImageManipulator } = await import('expo-image-manipulator');
    
    let actions: any[] = [];
    
    if (options.maxWidth || options.maxHeight) {
      actions.push({
        resize: {
          width: options.maxWidth,
          height: options.maxHeight
        }
      });
    }

    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress: options.quality / 100,
        format: options.format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Compression failed:', error);
    return uri; // Return original if compression fails
  }
}

/**
 * Calculate file size
 */
export async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && info.size) {
      return info.size;
    }
    return 0;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return 0;
  }
}\n/**
 * Convert file to base64
 */
export async function fileToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64
    });
    return base64;
  } catch (error) {
    console.error('Failed to convert to base64:', error);
    throw error;
  }
}

/**
 * Upload file with progress tracking
 */
export async function uploadFile(config: UploadConfig): Promise<UploadResult> {
  let compressedUri = config.fileUri;
  let startTime = Date.now();
  let loadedBytes = 0;

  try {
    // Compress image if needed
    if (config.compressionQuality || config.maxWidth || config.maxHeight) {
      const compressionOptions: CompressionOptions = {
        quality: config.compressionQuality || DEFAULT_COMPRESSION.quality,
        maxWidth: config.maxWidth,
        maxHeight: config.maxHeight,
        format: 'jpeg'
      };
      compressedUri = await compressImage(config.fileUri, compressionOptions);
    }

    // Get file size for progress calculation
    const fileSize = await getFileSize(compressedUri);
    const totalBytes = fileSize > 0 ? fileSize : 1;

    // Initialize progress
    config.onProgress?.({
      loaded: 0,
      total: totalBytes,
      percentage: 0
    });

    // Simulate upload progress (replace with actual S3 upload)
    // In production, use Amplify Storage with proper progress tracking
    const uploadPromise = simulateUpload(compressedUri, config.key, config.contentType);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(0.95, elapsed / 2000); // Complete in ~2 seconds
      const newLoaded = Math.round(progress * totalBytes);
      
      loadedBytes = newLoaded;
      
      config.onProgress?.({
        loaded: newLoaded,
        total: totalBytes,
        percentage: Math.round(progress * 100)
      });
    }, 100);

    // Wait for upload
    const result = await uploadPromise;
    
    clearInterval(progressInterval);

    // Final progress update
    const elapsed = Date.now() - startTime;
    const speed = elapsed > 0 ? Math.round(totalBytes / (elapsed / 1000)) : 0;

    config.onProgress?.({
      loaded: totalBytes,
      total: totalBytes,
      percentage: 100,
      speed
    });

    // Clean up compressed file if different from original
    if (compressedUri !== config.fileUri) {
      try {
        await FileSystem.deleteAsync(compressedUri, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete compressed file:', error);
      }
    }

    return {
      success: true,
      url: result.url,
      key: result.key
    };

  } catch (error) {
    console.error('Upload failed:', error);
    
    // Clean up compressed file on error
    if (compressedUri !== config.fileUri) {
      try {
        await FileSystem.deleteAsync(compressedUri, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete compressed file:', error);
      }
    }

    return {
      success: false,
      error: {
        type: CameraErrorType.UPLOAD_FAILED,
        message: 'Failed to upload photo. Please try again.',
        retryable: true
      }
    };
  }
}

/**
 * Simulate upload (replace with actual S3 upload in production)
 */
async function simulateUpload(
  uri: string,
  key: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  // In production, use:
  // const result = await Storage.put(key, file, {
  //   contentType,
  //   progressCallback: (progress) => { ... }
  // });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // Simulate occasional failures for testing
  if (Math.random() < 0.05) {
    throw new Error('Network error');
  }
  
  return {
    url: `https://storage.petvision.com/${key}`,
    key
  };
}

/**
 * Delete file from storage
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    // In production:
    // await Storage.remove(key);
    console.log('Deleted file:', key);
    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

/**
 * Get signed URL for file
 */
export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
  try {
    // In production:
    // const url = await Storage.get(key, { expiresIn });
    // return url;
    return `https://storage.petvision.com/${key}?expires=${expiresIn}`;
  } catch (error) {
    console.error('Failed to get signed URL:', error);
    return null;
  }
}

/**
 * Batch upload multiple files
 */
export async function batchUpload(
  files: Array<{
    uri: string;
    key: string;
    contentType: string;
  }>,
  onProgress?: (progress: { completed: number; total: number; percentage: number }) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  let completed = 0;

  for (const file of files) {
    const result = await uploadFile({
      key: file.key,
      fileUri: file.uri,
      contentType: file.contentType
    });

    results.push(result);
    completed++;

    onProgress?.({
      completed,
      total: files.length,
      percentage: Math.round((completed / files.length) * 100)
    });
  }

  return results;
}

/**
 * Upload photo for scan result
 */
export async function uploadScanPhoto(
  photoUri: string,
  scanType: string,
  petId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const key = generateKey(`scans/${scanType}/${petId}`, 'jpg');
  
  return uploadFile({
    key,
    fileUri: photoUri,
    contentType: 'image/jpeg',
    onProgress,
    compressionQuality: 85,
    maxWidth: 1920,
    maxHeight: 1920
  });
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(
  photoUri: string,
  petId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const key = generateKey(`profiles/${petId}`, 'jpg');
  
  return uploadFile({
    key,
    fileUri: photoUri,
    contentType: 'image/jpeg',
    onProgress,
    compressionQuality: 90,
    maxWidth: 512,
    maxHeight: 512
  });
}

export default {
  uploadFile,
  deleteFile,
  getSignedUrl,
  batchUpload,
  uploadScanPhoto,
  uploadProfilePhoto,
  compressImage,
  getFileSize,
  fileToBase64
};

/**
 * Image Processor for Vision Analysis
 * Story 5: PetVision AI-powered pet health screening
 */

import sharp from 'sharp';
import { createHash } from 'crypto';
import { ImageProcessingOptions, ImageQuality } from '../../types/vision-analysis';

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 85,
  format: 'jpeg',
};

export class ImageProcessor {
  private options: Required<ImageProcessingOptions>;

  constructor(options: ImageProcessingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Process image from buffer - resize, convert format, optimize
   */
  async processImage(imageBuffer: Buffer): Promise<Buffer> {
    let processor = sharp(imageBuffer);

    // Get image metadata
    const metadata = await processor.metadata();

    // Resize only if image is larger than max dimensions
    if (
      metadata.width &&
      metadata.width > this.options.maxWidth &&
      metadata.height &&
      metadata.height > this.options.maxHeight
    ) {
      processor = processor.resize(this.options.maxWidth, this.options.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    } else if (metadata.width && metadata.width > this.options.maxWidth) {
      processor = processor.resize(this.options.maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    } else if (metadata.height && metadata.height > this.options.maxHeight) {
      processor = processor.resize(null, this.options.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert format based on options
    switch (this.options.format) {
      case 'jpeg':
        processor = processor.jpeg({
          quality: this.options.quality,
          progressive: true,
        });
        break;
      case 'png':
        processor = processor.png({
          quality: this.options.quality,
          progressive: true,
          compressionLevel: 9,
        });
        break;
      case 'webp':
        processor = processor.webp({
          quality: this.options.quality,
        });
        break;
    }

    return processor.toBuffer();
  }

  /**
   * Convert image to base64 string
   */
  async toBase64(imageBuffer: Buffer): Promise<string> {
    return imageBuffer.toString('base64');
  }

  /**
   * Get media type for API request
   */
  getMediaType(): string {
    switch (this.options.format) {
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Generate image hash for caching
   */
  async generateHash(imageBuffer: Buffer): Promise<string> {
    const hash = createHash('sha256');
    hash.update(imageBuffer);
    return hash.digest('hex');
  }

  /**
   * Validate image - check if it's a valid image file
   */
  async validateImage(imageBuffer: Buffer): Promise<{ valid: boolean; error?: string }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();

      if (!metadata.format) {
        return { valid: false, error: 'Unknown image format' };
      }

      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'Invalid image dimensions' };
      }

      if (metadata.width < 100 || metadata.height < 100) {
        return { valid: false, error: 'Image too small (minimum 100x100)' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Assess image quality based on various factors
   */
  async assessImageQuality(imageBuffer: Buffer): Promise<ImageQuality> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();

      let qualityScore = 100;

      // Check resolution
      const minResolution = 800;
      if (metadata.width && metadata.width < minResolution) {
        qualityScore -= 30;
      }
      if (metadata.height && metadata.height < minResolution) {
        qualityScore -= 30;
      }

      // Check for blur (simplified - using standard deviation)
      // Lower std dev indicates potential blur
      const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;
      if (avgStdDev < 30) {
        qualityScore -= 25;
      }

      // Check for brightness (very dark or very bright images)
      const avgBrightness = stats.channels[0].mean; // Using red channel as proxy
      if (avgBrightness < 30 || avgBrightness > 225) {
        qualityScore -= 20;
      }

      // Determine quality rating
      if (qualityScore >= 70) {
        return 'good';
      } else if (qualityScore >= 40) {
        return 'fair';
      } else {
        return 'poor';
      }
    } catch (error) {
      // If we can't assess, assume fair quality
      return 'fair';
    }
  }

  /**
   * Process image for API - complete pipeline
   */
  async processForAPI(imageBuffer: Buffer): Promise<{
    base64: string;
    mediaType: string;
    hash: string;
    quality: ImageQuality;
  }> {
    // Validate image
    const validation = await this.validateImage(imageBuffer);
    if (!validation.valid) {
      throw new Error(`Image validation failed: ${validation.error}`);
    }

    // Generate hash before processing (for cache key)
    const hash = await this.generateHash(imageBuffer);

    // Process image
    const processed = await this.processImage(imageBuffer);

    // Convert to base64
    const base64 = await this.toBase64(processed);

    // Get media type
    const mediaType = this.getMediaType();

    // Assess quality
    const quality = await this.assessImageQuality(processed);

    return {
      base64,
      mediaType,
      hash,
      quality,
    };
  }

  /**
   * Load image from URL (requires fetch)
   */
  async loadImageFromUrl(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Prepare image from input (URL or Buffer)
   */
  async prepareImage(imageUrl: string | Buffer): Promise<{
    base64: string;
    mediaType: string;
    hash: string;
    quality: ImageQuality;
  }> {
    let buffer: Buffer;

    if (Buffer.isBuffer(imageUrl)) {
      buffer = imageUrl;
    } else if (typeof imageUrl === 'string') {
      // Check if it's a URL or a base64 string
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        buffer = await this.loadImageFromUrl(imageUrl);
      } else if (imageUrl.startsWith('data:image')) {
        // Extract base64 from data URL
        const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid data URL format');
        }
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        throw new Error('Invalid image input: must be URL, data URL, or Buffer');
      }
    } else {
      throw new Error('Invalid image input type');
    }

    return this.processForAPI(buffer);
  }
}

/**
 * Create a singleton instance with default options
 */
export const imageProcessor = new ImageProcessor();

/**
 * Create a custom image processor with specific options
 */
export const createImageProcessor = (options: ImageProcessingOptions): ImageProcessor => {
  return new ImageProcessor(options);
};

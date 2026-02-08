/**
 * Unit Tests for Image Processor
 * Story 5: PetVision AI-powered pet health screening
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import sharp from 'sharp';
import { ImageProcessor, imageProcessor, createImageProcessor } from '../imageProcessor';

describe('ImageProcessor', () => {
  let processor: ImageProcessor;

  beforeEach(() => {
    processor = new ImageProcessor();
  });

  describe('processImage', () => {
    it('should resize large images to max dimensions', async () => {
      // Create a large test image
      const largeImage = await sharp({
        create: {
          width: 4000,
          height: 3000,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const processed = await processor.processImage(largeImage);
      const metadata = await sharp(processed).metadata();

      expect(metadata.width).toBeLessThanOrEqual(2048);
      expect(metadata.height).toBeLessThanOrEqual(2048);
    });

    it('should not resize small images', async () => {
      const smallImage = await sharp({
        create: {
          width: 500,
          height: 400,
          channels: 3,
          background: { r: 0, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const processed = await processor.processImage(smallImage);
      const metadata = await sharp(processed).metadata();

      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(400);
    });

    it('should convert to JPEG format', async () => {
      const pngImage = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 0, g: 0, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const processed = await processor.processImage(pngImage);
      const metadata = await sharp(processed).metadata();

      expect(metadata.format).toBe('jpeg');
    });
  });

  describe('toBase64', () => {
    it('should convert buffer to base64 string', async () => {
      const testBuffer = Buffer.from('test data');
      const base64 = await processor.toBase64(testBuffer);

      expect(base64).toBe('dGVzdCBkYXRh');
      expect(typeof base64).toBe('string');
    });
  });

  describe('getMediaType', () => {
    it('should return correct media type for JPEG', () => {
      const jpegProcessor = new ImageProcessor({ format: 'jpeg' });
      expect(jpegProcessor.getMediaType()).toBe('image/jpeg');
    });

    it('should return correct media type for PNG', () => {
      const pngProcessor = new ImageProcessor({ format: 'png' });
      expect(pngProcessor.getMediaType()).toBe('image/png');
    });

    it('should return correct media type for WebP', () => {
      const webpProcessor = new ImageProcessor({ format: 'webp' });
      expect(webpProcessor.getMediaType()).toBe('image/webp');
    });
  });

  describe('generateHash', () => {
    it('should generate consistent hash for same image', async () => {
      const testImage = Buffer.from('test image data');
      const hash1 = await processor.generateHash(testImage);
      const hash2 = await processor.generateHash(testImage);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 format
    });

    it('should generate different hashes for different images', async () => {
      const image1 = Buffer.from('image 1');
      const image2 = Buffer.from('image 2');

      const hash1 = await processor.generateHash(image1);
      const hash2 = await processor.generateHash(image2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateImage', () => {
    it('should validate a valid image', async () => {
      const validImage = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await processor.validateImage(validImage);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject images that are too small', async () => {
      const smallImage = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await processor.validateImage(smallImage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should reject invalid image buffers', async () => {
      const invalidImage = Buffer.from('not an image');
      const result = await processor.validateImage(invalidImage);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid image file');
    });
  });

  describe('assessImageQuality', () => {
    it('should assess quality of high-resolution image as good', async () => {
      const highQualityImage = await sharp({
        create: {
          width: 1920,
          height: 1080,
          channels: 3,
          background: { r: 128, g: 128, b: 128 },
        },
      })
        .jpeg()
        .toBuffer();

      const quality = await processor.assessImageQuality(highQualityImage);
      expect(['good', 'fair']).toContain(quality);
    });

    it('should assess quality of low-resolution image', async () => {
      const lowResImage = await sharp({
        create: {
          width: 300,
          height: 200,
          channels: 3,
          background: { r: 128, g: 128, b: 128 },
        },
      })
        .jpeg()
        .toBuffer();

      const quality = await processor.assessImageQuality(lowResImage);
      expect(['fair', 'poor']).toContain(quality);
    });
  });

  describe('processForAPI', () => {
    it('should process image for API with all required fields', async () => {
      const testImage = await sharp({
        create: {
          width: 1200,
          height: 800,
          channels: 3,
          background: { r: 100, g: 150, b: 200 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await processor.processForAPI(testImage);

      expect(result).toHaveProperty('base64');
      expect(result).toHaveProperty('mediaType');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('quality');
      expect(result.mediaType).toBe('image/jpeg');
      expect(['good', 'fair', 'poor']).toContain(result.quality);
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should throw error for invalid image', async () => {
      const invalidImage = Buffer.from('invalid image data');

      await expect(processor.processForAPI(invalidImage)).rejects.toThrow(
        'Image validation failed'
      );
    });
  });

  describe('prepareImage', () => {
    it('should prepare image from Buffer', async () => {
      const testImage = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await processor.prepareImage(testImage);

      expect(result).toHaveProperty('base64');
      expect(result).toHaveProperty('mediaType');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('quality');
    });

    it('should throw error for invalid URL string', async () => {
      await expect(processor.prepareImage('invalid-url')).rejects.toThrow();
    });

    it('should throw error for invalid data URL', async () => {
      await expect(processor.prepareImage('data:invalid')).rejects.toThrow();
    });

    it('should handle valid data URL', async () => {
      const testImage = await sharp({
        create: {
          width: 400,
          height: 300,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const dataUrl = `data:image/jpeg;base64,${testImage.toString('base64')}`;

      const result = await processor.prepareImage(dataUrl);

      expect(result).toHaveProperty('base64');
      expect(result).toHaveProperty('hash');
    });
  });
});

describe('createImageProcessor', () => {
  it('should create processor with custom options', async () => {
    const customProcessor = createImageProcessor({
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 90,
      format: 'png',
    });

    const testImage = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    const processed = await customProcessor.processImage(testImage);
    const metadata = await sharp(processed).metadata();

    expect(metadata.width).toBeLessThanOrEqual(1024);
    expect(metadata.height).toBeLessThanOrEqual(1024);
    expect(metadata.format).toBe('png');
  });
});

/**
 * Unit Tests for Cache Layer
 * Story 5: PetVision AI-powered pet health screening
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  InMemoryCache, 
  NoOpCache, 
  CacheFactory, 
  visionCache, 
  generateCacheKey 
} from '../cache';
import { VisionAnalysisResult } from '../../../types/vision-analysis';

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache(1000); // 1 second TTL for testing
  });

  afterEach(async () => {
    await cache.clear();
    (cache as any).destroy();
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      const result: VisionAnalysisResult = {
        analysisId: 'test-1',
        analysisSummary: 'Test analysis',
        overallSeverity: 'green',
        findings: [],
        confidenceScore: 95,
        imageQualityAssessment: 'good',
        recommendations: [],
        processedAt: new Date().toISOString(),
      };

      await cache.set('test-key', result);
      const retrieved = await cache.get('test-key');

      expect(retrieved).toEqual(result);
    });

    it('should return null for non-existent keys', async () => {
      const retrieved = await cache.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should expire entries after TTL', async () => {
      const result: VisionAnalysisResult = {
        analysisId: 'test-2',
        analysisSummary: 'Test analysis',
        overallSeverity: 'yellow',
        findings: [],
        confidenceScore: 85,
        imageQualityAssessment: 'fair',
        recommendations: [],
        processedAt: new Date().toISOString(),
      };

      await cache.set('expiring-key', result);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const retrieved = await cache.get('expiring-key');
      expect(retrieved).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing keys', async () => {
      const result: VisionAnalysisResult = {
        analysisId: 'test-3',
        analysisSummary: 'Test analysis',
        overallSeverity: 'green',
        findings: [],
        confidenceScore: 90,
        imageQualityAssessment: 'good',
        recommendations: [],
        processedAt: new Date().toISOString(),
      };

      await cache.set('delete-key', result);
      await cache.delete('delete-key');

      const retrieved = await cache.get('delete-key');
      expect(retrieved).toBeNull();
    });

    it('should not throw when deleting non-existent keys', async () => {
      await expect(cache.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      const result: VisionAnalysisResult = {
        analysisId: 'test-4',
        analysisSummary: 'Test analysis',
        overallSeverity: 'green',
        findings: [],
        confidenceScore: 90,
        imageQualityAssessment: 'good',
        recommendations: [],
        processedAt: new Date().toISOString(),
      };

      await cache.set('key1', result);
      await cache.set('key2', result);
      await cache.set('key3', result);

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', async () => {
      const result: VisionAnalysisResult = {
        analysisId: 'test-5',
        analysisSummary: 'Test analysis',
        overallSeverity: 'green',
        findings: [],
        confidenceScore: 90,
        imageQualityAssessment: 'good',
        recommendations: [],
        processedAt: new Date().toISOString(),
      };

      await cache.set('exists-key', result);
      const exists = await cache.has('exists-key');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await cache.has('non-existent');
      expect(exists).toBe(false);
    });

    it('should return false for expired keys', async () => {
      const result: VisionAnalysisResult = {
        analysisId: 'test-6',
        analysisSummary: 'Test analysis',
        overallSeverity: 'green',
        findings: [],
        confidenceScore: 90,
        imageQualityAssessment: 'good',
        recommendations: [],
        processedAt: new Date().toISOString(),
      };

      await cache.set('expiring-key', result);
      await new Promise(resolve => setTimeout(resolve, 1100));

      const exists = await cache.has('expiring-key');
      expect(exists).toBe(false);
    });
  });
});

describe('NoOpCache', () => {
  let cache: NoOpCache;

  beforeEach(() => {
    cache = new NoOpCache();
  });

  it('should always return null from get', async () => {
    const retrieved = await cache.get('any-key');
    expect(retrieved).toBeNull();
  });

  it('should not store values', async () => {
    const result: VisionAnalysisResult = {
      analysisId: 'test-7',
      analysisSummary: 'Test analysis',
      overallSeverity: 'green',
      findings: [],
      confidenceScore: 90,
      imageQualityAssessment: 'good',
      recommendations: [],
      processedAt: new Date().toISOString(),
    };

    await cache.set('any-key', result);
    const retrieved = await cache.get('any-key');
    expect(retrieved).toBeNull();
  });

  it('should always return false from has', async () => {
    const exists = await cache.has('any-key');
    expect(exists).toBe(false);
  });
});

describe('CacheFactory', () => {
  afterEach(() => {
    CacheFactory.reset();
  });

  it('should create InMemoryCache when enabled', () => {
    const cache = CacheFactory.create({ enabled: true, ttl: 5000 });
    expect(cache).toBeInstanceOf(InMemoryCache);
  });

  it('should create NoOpCache when disabled', () => {
    const cache = CacheFactory.create({ enabled: false });
    expect(cache).toBeInstanceOf(NoOpCache);
  });

  it('should return singleton instance', () => {
    const cache1 = CacheFactory.create();
    const cache2 = CacheFactory.create();
    expect(cache1).toBe(cache2);
  });

  it('should allow resetting singleton', () => {
    const cache1 = CacheFactory.create();
    CacheFactory.reset();
    const cache2 = CacheFactory.create();
    expect(cache1).not.toBe(cache2);
  });
});

describe('visionCache', () => {
  it('should be a singleton instance', () => {
    const cache1 = visionCache;
    const cache2 = visionCache;
    expect(cache1).toBe(cache2);
  });
});

describe('generateCacheKey', () => {
  it('should generate cache key from hash and scan type', () => {
    const key = generateCacheKey('abc123', 'eye');
    expect(key).toBe('vision:eye:abc123');
  });

  it('should handle different scan types', () => {
    const eyeKey = generateCacheKey('hash1', 'eye');
    const skinKey = generateCacheKey('hash1', 'skin');
    const teethKey = generateCacheKey('hash1', 'teeth');

    expect(eyeKey).not.toBe(skinKey);
    expect(skinKey).not.toBe(teethKey);
    expect(eyeKey).not.toBe(teethKey);
  });

  it('should handle same hash with different scan types', () => {
    const key1 = generateCacheKey('samehash', 'eye');
    const key2 = generateCacheKey('samehash', 'skin');
    const key3 = generateCacheKey('different', 'eye');

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key2).not.toBe(key3);
  });
});

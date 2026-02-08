/**
 * Cache Layer for Vision Analysis
 * Story 5: PetVision AI-powered pet health screening
 */

import { CacheEntry, VisionAnalysisResult } from '../../types/vision-analysis';

export interface CacheOptions {
  enabled?: boolean;
  ttl?: number; // Time to live in milliseconds
}

export interface ICache {
  get(key: string): Promise<VisionAnalysisResult | null>;
  set(key: string, value: VisionAnalysisResult, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory cache implementation
 */
class InMemoryCache implements ICache {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(defaultTTL: number = 24 * 60 * 60 * 1000) { // 24 hours default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = null;
    this.startCleanup();
  }

  async get(key: string): Promise<VisionAnalysisResult | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  async set(key: string, value: VisionAnalysisResult, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      result: value,
      timestamp: Date.now(),
    };
    
    this.cache.set(key, entry);
    
    // Store TTL for cleanup
    if (ttl) {
      entry.timestamp = Date.now();
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + this.defaultTTL) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  private startCleanup(): void {
    // Clean up expired entries every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Redis cache implementation (placeholder - requires ioredis package)
 * Uncomment and implement if Redis is available
 */
/*
import Redis from 'ioredis';

class RedisCache implements ICache {
  private client: Redis;
  private defaultTTL: number;

  constructor(redisUrl: string, defaultTTL: number = 24 * 60 * 60 * 1000) {
    this.client = new Redis(redisUrl);
    this.defaultTTL = defaultTTL;
  }

  async get(key: string): Promise<VisionAnalysisResult | null> {
    const value = await this.client.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as VisionAnalysisResult;
    } catch {
      return null;
    }
  }

  async set(key: string, value: VisionAnalysisResult, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.client.set(key, serialized, 'PX', ttl || this.defaultTTL);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
  }

  async has(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
*/

/**
 * No-op cache implementation (when caching is disabled)
 */
class NoOpCache implements ICache {
  async get(_key: string): Promise<VisionAnalysisResult | null> {
    return null;
  }

  async set(_key: string, _value: VisionAnalysisResult, _ttl?: number): Promise<void> {
    // Do nothing
  }

  async delete(_key: string): Promise<void> {
    // Do nothing
  }

  async clear(): Promise<void> {
    // Do nothing
  }

  async has(_key: string): Promise<boolean> {
    return false;
  }
}

/**
 * Cache factory - creates the appropriate cache implementation
 */
export class CacheFactory {
  private static instance: ICache | null = null;

  static create(options: CacheOptions = {}): ICache {
    if (this.instance) {
      return this.instance;
    }

    const { enabled = true, ttl = 24 * 60 * 60 * 1000 } = options;

    if (!enabled) {
      this.instance = new NoOpCache();
    } else {
      // Use in-memory cache by default
      // Switch to Redis by setting REDIS_URL environment variable
      const redisUrl = process.env.REDIS_URL;
      
      /*
      if (redisUrl) {
        this.instance = new RedisCache(redisUrl, ttl);
      } else {
        this.instance = new InMemoryCache(ttl);
      }
      */
     
     this.instance = new InMemoryCache(ttl);
    }

    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

/**
 * Default cache instance
 */
export const visionCache: ICache = CacheFactory.create({
  enabled: process.env.VISION_CACHE_ENABLED !== 'false',
  ttl: parseInt(process.env.VISION_CACHE_TTL || '86400000', 10), // 24 hours default
});

/**
 * Generate cache key from image hash and scan type
 */
export const generateCacheKey = (imageHash: string, scanType: string): string => {
  return `vision:${scanType}:${imageHash}`;
};

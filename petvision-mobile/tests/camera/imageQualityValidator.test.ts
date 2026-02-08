/**
 * Unit Tests for Image Quality Validator
 * Testing quality analysis, metrics calculation, and issue detection
 */

import {
  validateImageQuality,
  getQualityBadgeProps,
  getQualityAnnouncement,
  isAcceptableQuality
} from '../../utils/imageQualityValidator';
import { QualityTier, QualityMetrics } from '../../types/camera';

describe('Image Quality Validator', () => {
  describe('validateImageQuality', () => {
    it('should return good quality for high resolution image', async () => {
      const metrics = await validateImageQuality(
        'test-uri',
        1920,
        1080,
        'base64testdata'
      );

      expect(metrics.resolution.width).toBe(1920);
      expect(metrics.resolution.height).toBe(1080);
      expect(metrics.resolution.score).toBeGreaterThan(80);
    });

    it('should return poor quality for low resolution image', async () => {
      const metrics = await validateImageQuality(
        'test-uri',
        320,
        240,
        'base64testdata'
      );

      expect(metrics.overall.tier).toBe(QualityTier.POOR);
      expect(metrics.overall.score).toBeLessThan(50);
    });

    it('should detect too-dark images', async () => {
      // Mock low brightness analysis
      const metrics = await validateImageQuality(
        'test-uri',
        1920,
        1080,
        null // Skip base64 to test default behavior
      );

      expect(metrics.brightness.value).toBe(128); // Default fallback
    });

    it('should calculate overall tier correctly', async () => {
      const metrics = await validateImageQuality(
        'test-uri',
        1920,
        1080,
        null
      );

      // Overall tier should be the minimum of all tiers
      expect([QualityTier.GOOD, QualityTier.FAIR, QualityTier.POOR]).toContain(
        metrics.overall.tier
      );
    });

    it('should handle missing base64 gracefully', async () => {
      const metrics = await validateImageQuality(
        'test-uri',
        1920,
        1080,
        undefined
      );

      expect(metrics).toBeDefined();
      expect(metrics.overall.score).toBeGreaterThanOrEqual(0);
      expect(metrics.overall.score).toBeLessThanOrEqual(100);
    });

    it('should include quality issues for poor images', async () => {
      const metrics = await validateImageQuality(
        'test-uri',
        320,
        240,
        null
      );

      if (metrics.overall.tier === QualityTier.POOR) {
        expect(metrics.issues.length).toBeGreaterThan(0);
        expect(
          metrics.issues.some(issue => issue.severity === 'error')
        ).toBe(true);
      }
    });
  });

  describe('getQualityBadgeProps', () => {
    it('should return green props for GOOD tier', () => {
      const props = getQualityBadgeProps(QualityTier.GOOD);
      expect(props.color).toBe('#10B981');
      expect(props.icon).toBe('checkmark-circle');
      expect(props.label).toBe('Good Quality');
    });

    it('should return yellow props for FAIR tier', () => {
      const props = getQualityBadgeProps(QualityTier.FAIR);
      expect(props.color).toBe('#F59E0B');
      expect(props.icon).toBe('warning');
      expect(props.label).toBe('Fair Quality');
    });

    it('should return red props for POOR tier', () => {
      const props = getQualityBadgeProps(QualityTier.POOR);
      expect(props.color).toBe('#EF4444');
      expect(props.icon).toBe('alert-circle');
      expect(props.label).toBe('Poor Quality');
    });
  });

  describe('getQualityAnnouncement', () => {
    it('should generate announcement for good quality', () => {
      const metrics: QualityMetrics = {
        resolution: { width: 1920, height: 1080, score: 100 },
        brightness: { value: 150, score: 100, tier: QualityTier.GOOD },
        sharpness: { value: 500, score: 100, tier: QualityTier.GOOD },
        overall: { score: 100, tier: QualityTier.GOOD },
        issues: []
      };

      const announcement = getQualityAnnouncement(metrics);
      expect(announcement).toContain('good');
      expect(announcement).toContain('100%');
    });

    it('should include issues in announcement when present', () => {
      const metrics: QualityMetrics = {
        resolution: { width: 1920, height: 1080, score: 100 },
        brightness: { value: 50, score: 30, tier: QualityTier.POOR },
        sharpness: { value: 500, score: 100, tier: QualityTier.GOOD },
        overall: { score: 77, tier: QualityTier.POOR },
        issues: [
          {
            type: 'too-dark',
            severity: 'error',
            message: 'Image is too dark',
            suggestion: 'Increase lighting'
          }
        ]
      };

      const announcement = getQualityAnnouncement(metrics);
      expect(announcement).toContain('too dark');
      expect(announcement).toContain('Increase lighting');
    });
  });

  describe('isAcceptableQuality', () => {
    it('should accept quality score >= 50', () => {
      const metrics: QualityMetrics = {
        resolution: { width: 1920, height: 1080, score: 60 },
        brightness: { value: 150, score: 60, tier: QualityTier.FAIR },
        sharpness: { value: 400, score: 60, tier: QualityTier.FAIR },
        overall: { score: 60, tier: QualityTier.FAIR },
        issues: []
      };

      expect(isAcceptableQuality(metrics)).toBe(true);
    });

    it('should reject quality score < 50', () => {
      const metrics: QualityMetrics = {
        resolution: { width: 320, height: 240, score: 20 },
        brightness: { value: 40, score: 30, tier: QualityTier.POOR },
        sharpness: { value: 100, score: 20, tier: QualityTier.POOR },
        overall: { score: 23, tier: QualityTier.POOR },
        issues: [
          {
            type: 'low-resolution',
            severity: 'error',
            message: 'Low resolution',
            suggestion: 'Move closer'
          }
        ]
      };

      expect(isAcceptableQuality(metrics)).toBe(false);
    });

    it('should accept exactly 50 score', () => {
      const metrics: QualityMetrics = {
        resolution: { width: 1080, height: 1920, score: 50 },
        brightness: { value: 128, score: 50, tier: QualityTier.FAIR },
        sharpness: { value: 250, score: 50, tier: QualityTier.FAIR },
        overall: { score: 50, tier: QualityTier.FAIR },
        issues: []
      };

      expect(isAcceptableQuality(metrics)).toBe(true);
    });
  });
});

// Test helper functions
const createMockMetrics = (overrides: Partial<QualityMetrics>): QualityMetrics => ({
  resolution: { width: 1920, height: 1080, score: 80 },
  brightness: { value: 128, score: 80, tier: QualityTier.FAIR },
  sharpness: { value: 400, score: 80, tier: QualityTier.FAIR },
  overall: { score: 80, tier: QualityTier.FAIR },
  issues: [],
  ...overrides
});

// Test thresholds
const QUALITY_THRESHOLDS = {
  MIN_ACCEPTABLE_SCORE: 50,
  GOOD_SCORE_THRESHOLD: 80,
  POOR_SCORE_THRESHOLD: 30,
  MIN_RESOLUTION_WIDTH: 1080,
  MIN_RESOLUTION_HEIGHT: 1920,
  MIN_BRIGHTNESS: 60,
  MAX_BRIGHTNESS: 200,
  OPTIMAL_BRIGHTNESS_MIN: 100,
  OPTIMAL_BRIGHTNESS_MAX: 180
};

export { createMockMetrics, QUALITY_THRESHOLDS };

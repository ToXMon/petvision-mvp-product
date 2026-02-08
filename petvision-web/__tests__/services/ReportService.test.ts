// ============================================================================
// Tests: ReportService
// Unit tests for report data service
// ============================================================================

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ReportService } from '@/services/ReportService';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    vi.clearAllMocks();
    reportService = new ReportService();
  });

  describe('getReportData', () => {
    it('should fetch and combine pet and scan data', async () => {
      const mockPetData = {
        id: 'pet-1',
        name: 'Max',
        breed: 'Golden Retriever',
        age_years: 3,
        species: 'dog',
        avatar_url: 'https://example.com/max.jpg',
      };

      const mockScanData = {
        id: 'scan-1',
        pet_id: 'pet-1',
        scan_type: 'eye',
        severity: 'green',
        findings: [
          {
            condition: 'Clear Eyes',
            description: 'No abnormalities detected',
            severity: 'green',
            confidence: 0.98,
            area: 'left eye',
          },
        ],
        image_url: 'https://example.com/scan.jpg',
        created_at: new Date().toISOString(),
      };

      const mockPreviousScans = [
        {
          id: 'scan-0',
          severity: 'yellow',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      // Mock Supabase chain
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockPreviousScans,
        error: null,
      });

      (supabase.from as Mock).mockReturnValue(mockFrom);
      mockFrom.select.mockReturnValue(mockSelect);
      mockSelect.eq.mockReturnValue(mockEq);
      mockEq.order.mockReturnValue(mockOrder);
      mockOrder.limit.mockReturnValue(mockLimit);

      // Mock scan result query
      mockFrom.select.mockReturnValueOnce(mockSelect);
      mockSelect.eq.mockReturnValueOnce(mockEq);
      mockEq.single.mockResolvedValueOnce({
        data: mockScanData,
        error: null,
      });

      // Mock pet profile query
      mockFrom.select.mockReturnValueOnce(mockSelect);
      mockSelect.eq.mockReturnValueOnce(mockEq);
      mockEq.single.mockResolvedValueOnce({
        data: mockPetData,
        error: null,
      });

      const result = await reportService.getReportData('scan-1');

      expect(result).toBeDefined();
      expect(result.pet.name).toBe('Max');
      expect(result.scan.id).toBe('scan-1');
      expect(result.findings).toHaveLength(1);
      expect(result.recommendations).toBeDefined();
    });

    it('should return error when scan not found', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Scan not found' },
      });

      (supabase.from as Mock).mockReturnValue(mockFrom);
      mockFrom.select.mockReturnValue(mockSelect);
      mockSelect.eq.mockReturnValue(mockEq);
      mockEq.single.mockReturnValue(mockSingle);

      await expect(reportService.getReportData('invalid-scan')).rejects.toThrow(
        'Scan not found'
      );
    });
  });

  describe('getVetRecommendations', () => {
    it('should return recommendations for green severity', () => {
      const findings = [
        {
          condition: 'Clear Eyes',
          description: 'No abnormalities',
          severity: 'green' as const,
          confidence: 0.98,
          area: 'left eye',
        },
      ];

      const recommendations = reportService.getVetRecommendations(findings, 'eye');

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].priority).toBe('routine');
    });

    it('should return urgent recommendations for red severity', () => {
      const findings = [
        {
          condition: 'Cataracts',
          description: 'Lens opacity detected',
          severity: 'red' as const,
          confidence: 0.95,
          area: 'both eyes',
        },
      ];

      const recommendations = reportService.getVetRecommendations(findings, 'eye');

      expect(recommendations).toBeDefined();
      expect(recommendations.some((r) => r.priority === 'urgent')).toBe(true);
    });

    it('should return moderate recommendations for yellow severity', () => {
      const findings = [
        {
          condition: 'Mild Irritation',
          description: 'Slight redness',
          severity: 'yellow' as const,
          confidence: 0.85,
          area: 'left eye',
        },
      ];

      const recommendations = reportService.getVetRecommendations(findings, 'eye');

      expect(recommendations).toBeDefined();
      expect(recommendations.some((r) => r.priority === 'moderate')).toBe(true);
    });
  });

  describe('calculateTrend', () => {
    it('should identify improvement trend', () => {
      const currentScan = {
        severity: 'green' as const,
        created_at: new Date().toISOString(),
      };

      const previousScans = [
        {
          severity: 'red' as const,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          severity: 'yellow' as const,
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const trend = reportService.calculateTrend(currentScan, previousScans);

      expect(trend.direction).toBe('improvement');
      expect(trend.severityChange).toBeDefined();
    });

    it('should identify decline trend', () => {
      const currentScan = {
        severity: 'red' as const,
        created_at: new Date().toISOString(),
      };

      const previousScans = [
        {
          severity: 'green' as const,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const trend = reportService.calculateTrend(currentScan, previousScans);

      expect(trend.direction).toBe('decline');
    });

    it('should identify stable trend', () => {
      const currentScan = {
        severity: 'green' as const,
        created_at: new Date().toISOString(),
      };

      const previousScans = [
        {
          severity: 'green' as const,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const trend = reportService.calculateTrend(currentScan, previousScans);

      expect(trend.direction).toBe('stable');
    });

    it('should return no trend for single scan', () => {
      const currentScan = {
        severity: 'green' as const,
        created_at: new Date().toISOString(),
      };

      const trend = reportService.calculateTrend(currentScan, []);

      expect(trend.direction).toBe('none');
    });
  });
});

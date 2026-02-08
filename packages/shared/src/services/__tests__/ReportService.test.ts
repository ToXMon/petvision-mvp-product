// ============================================================================
// Unit Tests: ReportService
// ============================================================================

import { ReportService } from '../ReportService';
import {
  Severity,
  Finding,
  TrendData,
} from '../../types/pdf';
import { TimelineService } from '../TimelineService';

// ----------------------------------------------------------------------------
// Mock Data
// ----------------------------------------------------------------------------

const mockPetProfile = {
  id: 'pet-123',
  name: 'Buddy',
  species: 'dog',
  breed: 'Golden Retriever',
  date_of_birth: '2020-05-15',
  avatar_url: 'https://example.com/avatar.jpg',
  created_at: '2020-05-15T00:00:00Z',
};

const mockFindingsRed: Finding[] = [
  {
    id: 'finding-red-1',
    condition: 'Severe inflammation',
    description: 'Significant swelling and redness',
    confidence: 0.9,
    severity: Severity.RED,
  },
];

const mockFindingsYellow: Finding[] = [
  {
    id: 'finding-yellow-1',
    condition: 'Mild irritation',
    description: 'Slight redness observed',
    confidence: 0.85,
    severity: Severity.YELLOW,
  },
];

const mockFindingsGreen: Finding[] = [
  {
    id: 'finding-green-1',
    condition: 'Normal tissue',
    description: 'No issues detected',
    confidence: 0.95,
    severity: Severity.GREEN,
  },
];

const mockScanResultRed = {
  id: 'scan-red-1',
  pet_id: 'pet-123',
  scan_type: 'eye',
  severity: Severity.RED,
  findings: mockFindingsRed,
  image_url: 'https://example.com/scan-red.jpg',
  created_at: '2024-02-04T12:00:00Z',
};

const mockScanResultYellow = {
  id: 'scan-yellow-1',
  pet_id: 'pet-123',
  scan_type: 'eye',
  severity: Severity.YELLOW,
  findings: mockFindingsYellow,
  image_url: 'https://example.com/scan-yellow.jpg',
  created_at: '2024-02-04T11:00:00Z',
};

const mockScanResultGreen = {
  id: 'scan-green-1',
  pet_id: 'pet-123',
  scan_type: 'eye',
  severity: Severity.GREEN,
  findings: mockFindingsGreen,
  image_url: 'https://example.com/scan-green.jpg',
  created_at: '2024-02-04T10:00:00Z',
};

const mockMixedScanResult = {
  id: 'scan-mixed-1',
  pet_id: 'pet-123',
  scan_type: 'eye',
  severity: Severity.YELLOW,
  findings: [...mockFindingsGreen, ...mockFindingsYellow, ...mockFindingsRed],
  image_url: 'https://example.com/scan-mixed.jpg',
  created_at: '2024-02-04T12:00:00Z',
};

const mockTrendData: TrendData = {
  overallTrend: 'improving',
  percentageChange: 15,
  severityChange: 'improved',
  findingsChange: {
    added: 0,
    resolved: 1,
    improved: 2,
    worsened: 0,
  },
  message: 'Overall improvement observed',
};

// ----------------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------------

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create ReportService instance', () => {
      expect(reportService).toBeInstanceOf(ReportService);
    });

    it('should initialize with config', () => {
      const configService = new ReportService({
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-key',
      });
      expect(configService).toBeInstanceOf(ReportService);
    });
  });

  describe('generateReportId', () => {
    it('should generate unique report IDs', () => {
      const id1 = reportService.generateReportId();
      const id2 = reportService.generateReportId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^RPT-/);
      expect(id2).toMatch(/^RPT-/);
    });

    it('should generate IDs with correct format', () => {
      const id = reportService.generateReportId();
      const parts = id.split('-');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('RPT');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate red severity recommendations', () => {
      const recommendations = reportService.generateRecommendations(mockScanResultRed);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].severity).toBe(Severity.RED);
      expect(recommendations[0].priority).toBe('immediate');
    });

    it('should generate yellow severity recommendations', () => {
      const recommendations = reportService.generateRecommendations(mockScanResultYellow);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].severity).toBe(Severity.YELLOW);
      expect(recommendations[0].priority).toBe('urgent');
    });

    it('should generate green severity recommendations', () => {
      const recommendations = reportService.generateRecommendations(mockScanResultGreen);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].severity).toBe(Severity.GREEN);
      expect(recommendations[0].priority).toBe('routine');
    });

    it('should add specific recommendations for red findings', () => {
      const recommendations = reportService.generateRecommendations(mockScanResultRed);

      const findingRecs = recommendations.filter(r => r.category === 'Specific Finding');
      expect(findingRecs.length).toBeGreaterThan(0);
      expect(findingRecs[0].priority).toBe('immediate');
    });

    it('should handle mixed severity findings', () => {
      const recommendations = reportService.generateRecommendations(mockMixedScanResult);

      const hasImmediate = recommendations.some(r => r.priority === 'immediate');
      const hasUrgent = recommendations.some(r => r.priority === 'urgent');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(hasImmediate).toBe(true);
    });

    it('should include action items', () => {
      const recommendations = reportService.generateRecommendations(mockScanResultYellow);

      const recWithActions = recommendations.find(r => r.actionItems && r.actionItems.length > 0);
      expect(recWithActions).toBeDefined();
    });

    it('should include timeframe', () => {
      const recommendations = reportService.generateRecommendations(mockScanResultYellow);

      const recWithTimeframe = recommendations.find(r => r.timeframe);
      expect(recWithTimeframe).toBeDefined();
    });
  });

  describe('Static Utility Methods', () => {
    describe('calculatePetAge', () => {
      it('should calculate age for older pet', () => {
        const age = ReportService.calculatePetAge('2020-05-15');
        expect(age).toContain('year');
      });

      it('should calculate age for young pet', () => {
        const birthDate = new Date();
        birthDate.setMonth(birthDate.getMonth() - 6);
        const age = ReportService.calculatePetAge(birthDate.toISOString());
        expect(age).toContain('month');
      });

      it('should handle missing date of birth', () => {
        const age = ReportService.calculatePetAge(undefined as any);
        expect(age).toBe('Age unknown');
      });

      it('should handle invalid date', () => {
        const age = ReportService.calculatePetAge('invalid-date');
        expect(age).toBe('Age unknown');
      });
    });

    describe('formatDate', () => {
      it('should format date string correctly', () => {
        const formatted = ReportService.formatDate('2024-02-04T12:00:00Z');
        expect(formatted).toContain('2024');
        expect(formatted).toContain('February');
      });

      it('should handle different date formats', () => {
        const formatted = ReportService.formatDate('2024-01-15');
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });

    describe('getScanTypeLabel', () => {
      it('should return label for eye scan', () => {
        const label = ReportService.getScanTypeLabel('eye');
        expect(label).toBe('Eye Examination');
      });

      it('should return label for skin scan', () => {
        const label = ReportService.getScanTypeLabel('skin');
        expect(label).toBe('Skin Analysis');
      });

      it('should return label for teeth scan', () => {
        const label = ReportService.getScanTypeLabel('teeth');
        expect(label).toBe('Dental Check');
      });

      it('should return label for gait scan', () => {
        const label = ReportService.getScanTypeLabel('gait');
        expect(label).toBe('Gait Analysis');
      });

      it('should return original value for unknown scan type', () => {
        const label = ReportService.getScanTypeLabel('unknown');
        expect(label).toBe('unknown');
      });
    });

    describe('getSeverityLabel', () => {
      it('should return label for green severity', () => {
        const label = ReportService.getSeverityLabel(Severity.GREEN);
        expect(label).toBe('Healthy');
      });

      it('should return label for yellow severity', () => {
        const label = ReportService.getSeverityLabel(Severity.YELLOW);
        expect(label).toBe('Attention Needed');
      });

      it('should return label for red severity', () => {
        const label = ReportService.getSeverityLabel(Severity.RED);
        expect(label).toBe('Concerning');
      });
    });

    describe('groupFindingsBySeverity', () => {
      it('should group findings by severity', () => {
        const grouped = ReportService.groupFindingsBySeverity(mockMixedScanResult.findings);

        expect(grouped[Severity.GREEN]).toHaveLength(1);
        expect(grouped[Severity.YELLOW]).toHaveLength(1);
        expect(grouped[Severity.RED]).toHaveLength(1);
      });

      it('should handle empty findings array', () => {
        const grouped = ReportService.groupFindingsBySeverity([]);

        expect(grouped).toEqual({});
      });

      it('should handle findings of single severity', () => {
        const grouped = ReportService.groupFindingsBySeverity(mockFindingsRed);

        expect(grouped[Severity.RED]).toHaveLength(1);
        expect(grouped[Severity.YELLOW]).toBeUndefined();
      });
    });

    describe('getFindingsSummary', () => {
      it('should calculate summary statistics', () => {
        const summary = ReportService.getFindingsSummary(mockMixedScanResult.findings);

        expect(summary.total).toBe(3);
        expect(summary.green).toBe(1);
        expect(summary.yellow).toBe(1);
        expect(summary.red).toBe(1);
      });

      it('should calculate average confidence', () => {
        const summary = ReportService.getFindingsSummary(mockMixedScanResult.findings);

        const expectedAvg = (0.95 + 0.85 + 0.9) / 3;
        expect(summary.averageConfidence).toBeCloseTo(expectedAvg, 2);
      });

      it('should handle empty findings', () => {
        const summary = ReportService.getFindingsSummary([]);

        expect(summary.total).toBe(0);
        expect(summary.green).toBe(0);
        expect(summary.yellow).toBe(0);
        expect(summary.red).toBe(0);
        expect(summary.averageConfidence).toBe(0);
      });
    });
  });

  describe('Data Fetching Methods', () => {
    it('should fetch report data', async () => {
      const data = await reportService.fetchReportData('scan-123');

      expect(data).toHaveProperty('reportId');
      expect(data).toHaveProperty('pet');
      expect(data).toHaveProperty('scan');
      expect(data).toHaveProperty('recommendations');
    });

    it('should fetch pet profile', async () => {
      const pet = await reportService.fetchPetProfile('pet-123');

      expect(pet.id).toBe('pet-123');
      expect(pet.name).toBeDefined();
    });

    it('should fetch scan result', async () => {
      const scan = await reportService.fetchScanResult('scan-123');

      expect(scan.id).toBe('scan-123');
      expect(scan.findings).toBeDefined();
    });

    it('should fetch previous scans', async () => {
      const previousScans = await reportService.fetchPreviousScans('pet-123', 'scan-123');

      expect(Array.isArray(previousScans)).toBe(true);
    });
  });
});

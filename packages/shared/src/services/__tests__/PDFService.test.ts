// ============================================================================
// Unit Tests: PDFService
// ============================================================================

import { PDFService } from '../PDFService';
import { QRCodeService } from '../QRCodeService';
import { ReportService } from '../ReportService';
import {
  PDFReportData,
  PDFReportConfig,
  PDFReportType,
  PDFFormat,
  Severity,
  Finding,
  TrendData,
} from '../../types/pdf';
import * as fs from 'fs';
import * as path from 'path';

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

const mockFindings: Finding[] = [
  {
    id: 'finding-1',
    condition: 'Mild conjunctivitis',
    description: 'Slight redness observed',
    confidence: 0.85,
    severity: Severity.YELLOW,
    location: { x: 100, y: 150, width: 50, height: 50 },
  },
  {
    id: 'finding-2',
    condition: 'Clear eyes',
    description: 'No issues detected',
    confidence: 0.95,
    severity: Severity.GREEN,
    location: { x: 200, y: 200, width: 60, height: 60 },
  },
];

const mockScanResult = {
  id: 'scan-123',
  pet_id: 'pet-123',
  scan_type: 'eye',
  severity: Severity.YELLOW,
  findings: mockFindings,
  image_url: 'https://example.com/scan.jpg',
  created_at: '2024-02-04T12:00:00Z',
};

const mockTrendData: TrendData = {
  overallTrend: 'stable',
  percentageChange: 0,
  severityChange: 'none',
  findingsChange: {
    added: 1,
    resolved: 0,
    improved: 1,
    worsened: 0,
  },
  message: 'No significant change',
};

const mockPDFReportData: PDFReportData = {
  reportId: 'RPT-ABC123',
  generatedAt: '2024-02-04T12:00:00Z',
  pet: mockPetProfile,
  scan: mockScanResult,
  recommendations: [],
  trend: mockTrendData,
};

const mockQRCodeService = {
  generateReportQR: jest.fn().mockResolvedValue('data:image/png;base64,mockqrdata'),
} as any;

const mockReportService = {
  fetchReportData: jest.fn().mockResolvedValue(mockPDFReportData),
} as any;

// ----------------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------------

describe('PDFService', () => {
  let pdfService: PDFService;

  beforeEach(() => {
    pdfService = new PDFService({
      qrCodeService: mockQRCodeService,
      reportService: mockReportService,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create PDFService instance', () => {
      expect(pdfService).toBeInstanceOf(PDFService);
    });

    it('should initialize with default config', () => {
      const defaultService = new PDFService();
      expect(defaultService).toBeInstanceOf(PDFService);
    });
  });

  describe('Cache Management', () => {
    it('should clear template cache', () => {
      expect(() => pdfService.clearTemplateCache()).not.toThrow();
    });

    it('should clear PDF cache', () => {
      expect(() => pdfService.clearPDFCache()).not.toThrow();
    });

    it('should clear all caches', () => {
      expect(() => pdfService.clearAllCaches()).not.toThrow();
    });

    it('should return cache stats', () => {
      const stats = pdfService.getCacheStats();
      expect(stats).toHaveProperty('templateCache');
      expect(stats).toHaveProperty('pdfCache');
      expect(stats).toHaveProperty('pdfCacheSize');
      expect(typeof stats.templateCache).toBe('number');
      expect(typeof stats.pdfCache).toBe('number');
    });
  });

  describe('generateSummary', () => {
    it('should generate summary PDF', async () => {
      const result = await pdfService.generateSummary(mockPDFReportData);
      
      expect(result.success).toBe(true);
      expect(result.reportId).toBe(mockPDFReportData.reportId);
    });

    it('should fail with invalid data', async () => {
      const invalidData = null as any;
      const result = await pdfService.generateSummary(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generateDetailed', () => {
    it('should generate detailed PDF', async () => {
      const result = await pdfService.generateDetailed(mockPDFReportData);
      
      expect(result.success).toBe(true);
      expect(result.reportId).toBe(mockPDFReportData.reportId);
    });

    it('should include trends when configured', async () => {
      const result = await pdfService.generateDetailed(mockPDFReportData);
      
      expect(result.success).toBe(true);
    });
  });

  describe('generatePDFFromScanId', () => {
    it('should fetch data and generate PDF', async () => {
      const scanId = 'scan-123';
      const config: PDFReportConfig = {
        reportType: PDFReportType.SUMMARY,
      };

      const result = await pdfService.generatePDFFromScanId(scanId, config);
      
      expect(mockReportService.fetchReportData).toHaveBeenCalledWith(scanId);
    });

    it('should handle fetch errors', async () => {
      mockReportService.fetchReportData = jest
        .fn()
        .mockRejectedValue(new Error('Fetch failed'));

      const result = await pdfService.generatePDFFromScanId('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generatePDF', () => {
    const defaultConfig: PDFReportConfig = {
      reportType: PDFReportType.DETAILED,
      format: PDFFormat.A4,
      includeTrends: true,
      includeComparison: true,
      includeQRCode: true,
      includeImages: true,
    };

    it('should generate PDF with valid data', async () => {
      const result = await pdfService.generatePDF(mockPDFReportData, defaultConfig);
      
      expect(result.success).toBe(true);
      expect(result.reportId).toBe(mockPDFReportData.reportId);
      expect(mockQRCodeService.generateReportQR).toHaveBeenCalled();
    });

    it('should skip QR code when disabled', async () => {
      const configWithoutQR = {
        ...defaultConfig,
        includeQRCode: false,
      };

      const result = await pdfService.generatePDF(mockPDFReportData, configWithoutQR);
      
      expect(result.success).toBe(true);
      expect(mockQRCodeService.generateReportQR).not.toHaveBeenCalled();
    });

    it('should handle summary format', async () => {
      const summaryConfig: PDFReportConfig = {
        reportType: PDFReportType.SUMMARY,
        format: PDFFormat.A4,
      };

      const result = await pdfService.generatePDF(mockPDFReportData, summaryConfig);
      
      expect(result.success).toBe(true);
    });

    it('should handle invalid report data', async () => {
      const invalidData = { reportId: '', pet: null, scan: null, recommendations: [] } as any;
      
      const result = await pdfService.generatePDF(invalidData, defaultConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Sections Configuration', () => {
    it('should include all sections for detailed report', () => {
      const detailedConfig: PDFReportConfig = {
        reportType: PDFReportType.DETAILED,
        includeTrends: true,
      };

      const sections = (pdfService as any).getSectionsIncluded(detailedConfig);
      
      expect(sections).toContain('cover');
      expect(sections).toContain('findings');
      expect(sections).toContain('recommendations');
      expect(sections).toContain('trends');
    });

    it('should include limited sections for summary report', () => {
      const summaryConfig: PDFReportConfig = {
        reportType: PDFReportType.SUMMARY,
      };

      const sections = (pdfService as any).getSectionsIncluded(summaryConfig);
      
      expect(sections).toContain('cover');
      expect(sections).toContain('findings');
      expect(sections).not.toContain('recommendations');
      expect(sections).not.toContain('trends');
    });
  });

  describe('Context Preparation', () => {
    it('should prepare context with all fields', async () => {
      const config: PDFReportConfig = {
        reportType: PDFReportType.DETAILED,
        includeQRCode: true,
      };

      const context = await (pdfService as any).prepareContext(
        mockPDFReportData,
        config
      );

      expect(context).toHaveProperty('reportId');
      expect(context).toHaveProperty('petName');
      expect(context).toHaveProperty('scanType');
      expect(context).toHaveProperty('severityLabel');
      expect(context).toHaveProperty('findings');
      expect(context).toHaveProperty('recommendations');
    });

    it('should format pet age correctly', async () => {
      const context = await (pdfService as any).prepareContext(
        mockPDFReportData,
        { reportType: PDFReportType.SUMMARY, includeQRCode: false }
      );

      expect(context.petAge).toContain('year');
    });

    it('should format findings with severity labels', async () => {
      const context = await (pdfService as any).prepareContext(
        mockPDFReportData,
        { reportType: PDFReportType.SUMMARY, includeQRCode: false }
      );

      expect(context.findings).toHaveLength(2);
      expect(context.findings[0]).toHaveProperty('severityLabel');
      expect(context.findings[0]).toHaveProperty('confidencePercent');
    });
  });

  describe('Cleanup', () => {
    it('should destroy service and close browser', async () => {
      await expect(pdfService.destroy()).resolves.not.toThrow();
    });
  });
});

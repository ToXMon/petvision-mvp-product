// ============================================================================
// Tests: PDFService
// Unit tests for PDF generation service
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { PDFService } from '@/services/PDFService';
import { ReportService } from '@/services/ReportService';
import { QRCodeService } from '@/services/QRCodeService';
import { PDFReportConfig } from '@petvision/shared';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

vi.mock('@/services/ReportService');
vi.mock('@/services/QRCodeService');
vi.mock('puppeteer');

const mockBrowser = {
  newPage: vi.fn(),
  close: vi.fn(),
};

const mockPage = {
  setContent: vi.fn(),
  setContent: vi.fn(),
  pdf: vi.fn(),
  close: vi.fn(),
};

const puppeteer = require('puppeteer');
puppeteer.launch = vi.fn().mockResolvedValue(mockBrowser);

// ----------------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------------

describe('PDFService', () => {
  let pdfService: PDFService;
  let reportService: ReportService;
  let qrCodeService: QRCodeService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Initialize services
    pdfService = new PDFService();
    reportService = new ReportService();
    qrCodeService = new QRCodeService();

    // Setup browser mock
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockPage.pdf.mockResolvedValue(Buffer.from('mock pdf content'));

    // Setup default report data mock
    (ReportService.prototype.getReportData as Mock).mockResolvedValue({
      reportId: 'test-report-123',
      pet: {
        id: 'pet-1',
        name: 'Max',
        breed: 'Golden Retriever',
        age: '3 years',
        species: 'dog',
        avatarUrl: 'https://example.com/max.jpg',
      },
      scan: {
        id: 'scan-1',
        scanType: 'eye',
        severity: 'green',
        createdAt: new Date().toISOString(),
        imageUrl: 'https://example.com/scan.jpg',
      },
      findings: [
        {
          condition: 'Clear Eyes',
          description: 'No abnormalities detected',
          severity: 'green',
          confidence: 0.98,
          area: 'left eye',
        },
      ],
      recommendations: [
        {
          title: 'Continue Regular Checkups',
          description: 'Schedule next eye exam in 6 months',
          priority: 'routine',
        },
      ],
      trends: null,
    });

    // Setup QR code mock
    (QRCodeService.prototype.generateQRCode as Mock).mockResolvedValue(
      'data:image/svg+xml;base64,phN2Zy4uLz4='
    );
  });

  afterEach(async () => {
    await pdfService.cleanup();
  });

  // ------------------------------------------------------------------------
  // Test: Basic PDF Generation
  // ------------------------------------------------------------------------

  describe('generatePDFFromScanId', () => {
    it('should generate a PDF successfully from scan ID', async () => {
      const config: PDFReportConfig = {
        reportType: 'detailed',
        includeQRCode: true,
        includeTrends: false,
        includeComparison: false,
        format: 'A4',
      };

      const result = await pdfService.generatePDFFromScanId('scan-1', config);

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toBeDefined();
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.reportId).toBe('test-report-123');
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should include QR code when configured', async () => {
      const config: PDFReportConfig = {
        reportType: 'summary',
        includeQRCode: true,
        includeTrends: false,
        includeComparison: false,
        format: 'A4',
      };

      await pdfService.generatePDFFromScanId('scan-1', config);

      expect(qrCodeService.generateQRCode).toHaveBeenCalledWith(
        expect.stringContaining('test-report-123')
      );
    });

    it('should not include QR code when disabled', async () => {
      const config: PDFReportConfig = {
        reportType: 'summary',
        includeQRCode: false,
        includeTrends: false,
        includeComparison: false,
        format: 'A4',
      };

      await pdfService.generatePDFFromScanId('scan-1', config);

      expect(qrCodeService.generateQRCode).not.toHaveBeenCalled();
    });

    it('should handle errors when scan data fetch fails', async () => {
      (ReportService.prototype.getReportData as Mock).mockRejectedValue(
        new Error('Scan not found')
      );

      const config: PDFReportConfig = {
        reportType: 'detailed',
        includeQRCode: true,
        includeTrends: false,
        includeComparison: false,
        format: 'A4',
      };

      const result = await pdfService.generatePDFFromScanId('invalid-scan', config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Scan not found');
      expect(result.pdfBuffer).toBeNull();
    });

    it('should handle errors when Puppeteer fails', async () => {
      mockPage.pdf.mockRejectedValue(new Error('PDF generation failed'));

      const config: PDFReportConfig = {
        reportType: 'detailed',
        includeQRCode: true,
        includeTrends: false,
        includeComparison: false,
        format: 'A4',
      };

      const result = await pdfService.generatePDFFromScanId('scan-1', config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('PDF generation failed');
    });
  });

  // ------------------------------------------------------------------------
  // Test: Report Types
  // ------------------------------------------------------------------------

  describe('report types', () => {
    it('should generate summary report (1 page)', async () => {
      const config: PDFReportConfig = {
        reportType: 'summary',
        includeQRCode: false,
        includeTrends: false,
        includeComparison: false,
        format: 'A4',
      };

      const result = await pdfService.generatePDFFromScanId('scan-1', config);

      expect(result.success).toBe(true);
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'A4',
        })
      );
    });

    it('should generate detailed report with trends', async () => {
      const config: PDFReportConfig = {
        reportType: 'detailed',
        includeQRCode: true,
        includeTrends: true,
        includeComparison: true,
        format: 'A4',
      };

      const result = await pdfService.generatePDFFromScanId('scan-1', config);

      expect(result.success).toBe(true);
    });
  });

  // ------------------------------------------------------------------------
  // Test: Page Formats
  // ------------------------------------------------------------------------

  describe('page formats', () => {
    it('should support A4 format', async () => {
      const config: PDFReportConfig = {
        reportType: 'detailed',
        includeQRCode: true,
        format: 'A4',
      };

      await pdfService.generatePDFFromScanId('scan-1', config);

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'A4' })
      );
    });

    it('should support Letter format', async () => {
      const config: PDFReportConfig = {
        reportType: 'detailed',
        includeQRCode: true,
        format: 'Letter',
      };

      await pdfService.generatePDFFromScanId('scan-1', config);

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'Letter' })
      );
    });
  });

  // ------------------------------------------------------------------------
  // Test: Browser Lifecycle
  // ------------------------------------------------------------------------

  describe('browser lifecycle', () => {
    it('should initialize browser on first use', async () => {
      expect(puppeteer.launch).not.toHaveBeenCalled();

      await pdfService.generatePDFFromScanId('scan-1', {
        reportType: 'summary',
      });

      expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    });

    it('should reuse browser for multiple requests', async () => {
      await pdfService.generatePDFFromScanId('scan-1', { reportType: 'summary' });
      await pdfService.generatePDFFromScanId('scan-2', { reportType: 'summary' });

      expect(puppeteer.launch).toHaveBeenCalledTimes(1);
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
    });

    it('should close browser on cleanup', async () => {
      await pdfService.generatePDFFromScanId('scan-1', { reportType: 'summary' });
      await pdfService.cleanup();

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});

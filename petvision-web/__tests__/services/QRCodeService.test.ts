// ============================================================================
// Tests: QRCodeService
// Unit tests for QR code generation service
// ============================================================================

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { QRCodeService } from '@/services/QRCodeService';

// Mock qrcode library
vi.mock('qrcode', () => ({
  toDataURL: vi.fn(),
  toSVG: vi.fn(),
}));

import * as qrcode from 'qrcode';

describe('QRCodeService', () => {
  let qrCodeService: QRCodeService;

  beforeEach(() => {
    vi.clearAllMocks();
    qrCodeService = new QRCodeService();

    // Setup default mock response
    (qrcode.toDataURL as Mock).mockResolvedValue(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );

    (qrcode.toSVG as Mock).mockReturnValue(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>'
    );
  });

  describe('generateQRCode', () => {
    it('should generate QR code as data URL', async () => {
      const url = 'https://petvision.ai/reports/test-123';
      const result = await qrCodeService.generateQRCode(url);

      expect(result).toBeDefined();
      expect(result).toContain('data:image');
      expect(qrcode.toDataURL).toHaveBeenCalledWith(url, expect.any(Object));
    });

    it('should support PNG format', async () => {
      const url = 'https://petvision.ai/reports/test-123';
      await qrCodeService.generateQRCode(url, 'png');

      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ type: 'image/png' })
      );
    });

    it('should support JPEG format', async () => {
      const url = 'https://petvision.ai/reports/test-123';
      await qrCodeService.generateQRCode(url, 'jpeg');

      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ type: 'image/jpeg' })
      );
    });

    it('should support SVG format', async () => {
      const url = 'https://petvision.ai/reports/test-123';
      const result = await qrCodeService.generateQRCode(url, 'svg');

      expect(result).toContain('<svg');
      expect(qrcode.toSVG).toHaveBeenCalledWith(url, expect.any(Object));
    });

    it('should support custom size', async () => {
      const url = 'https://petvision.ai/reports/test-123';
      const size = 300;
      await qrCodeService.generateQRCode(url, 'png', size);

      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ width: size })
      );
    });

    it('should support custom error correction level', async () => {
      const url = 'https://petvision.ai/reports/test-123';
      await qrCodeService.generateQRCode(url, 'png', 200, 'H');

      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ errorCorrectionLevel: 'H' })
      );
    });

    it('should handle errors gracefully', async () => {
      (qrcode.toDataURL as Mock).mockRejectedValue(
        new Error('QR code generation failed')
      );

      const url = 'https://petvision.ai/reports/test-123';

      await expect(qrCodeService.generateQRCode(url)).rejects.toThrow(
        'QR code generation failed'
      );
    });
  });

  describe('generateReportQRCode', () => {
    it('should generate QR code for report URL', async () => {
      const reportId = 'report-123';
      const baseUrl = 'https://petvision.ai';

      const result = await qrCodeService.generateReportQRCode(reportId, baseUrl);

      expect(result).toBeDefined();
      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        `${baseUrl}/reports/${reportId}`,
        expect.any(Object)
      );
    });

    it('should use default base URL if not provided', async () => {
      const reportId = 'report-123';

      await qrCodeService.generateReportQRCode(reportId);

      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining(reportId),
        expect.any(Object)
      );
    });
  });
});

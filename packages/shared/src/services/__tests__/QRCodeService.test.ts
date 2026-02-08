// ============================================================================
// Unit Tests: QRCodeService
// ============================================================================

import { QRCodeService } from '../QRCodeService';
import { QRCodeData, QRCodeOptions } from '../../types/pdf';
import QRCode from 'qrcode';

jest.mock('qrcode');

const mockedQRCode = QRCode as jest.Mocked<typeof QRCode>;

const mockQRData: QRCodeData = {
  reportId: 'RPT-ABC123',
  url: 'https://app.petvision.ai/reports/RPT-ABC123',
  expiresAt: '2024-03-05T12:00:00Z',
  accessKey: 'key-xyz',
};

const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';

describe('QRCodeService', () => {
  let qrCodeService: QRCodeService;

  beforeEach(() => {
    qrCodeService = new QRCodeService({ baseUrl: 'https://app.petvision.ai' });
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create QRCodeService instance', () => {
      expect(qrCodeService).toBeInstanceOf(QRCodeService);
    });
  });

  describe('generateQRCode', () => {
    beforeEach(() => {
      mockedQRCode.toDataURL.mockResolvedValue(mockDataUrl);
    });

    it('should generate QR code as data URL', async () => {
      const result = await qrCodeService.generateQRCode(mockQRData);
      expect(result).toBe(mockDataUrl);
    });

    it('should generate QR code without access key', async () => {
      const dataWithoutKey: QRCodeData = {
        ...mockQRData,
        accessKey: undefined,
      };
      const result = await qrCodeService.generateQRCode(dataWithoutKey);
      expect(result).toBe(mockDataUrl);
    });
  });

  describe('generateReportQR', () => {
    beforeEach(() => {
      mockedQRCode.toDataURL.mockResolvedValue(mockDataUrl);
    });

    it('should generate QR code for report', async () => {
      const result = await qrCodeService.generateReportQR('RPT-ABC123');
      expect(result).toBe(mockDataUrl);
    });
  });

  describe('getReportUrl', () => {
    it('should generate report URL', () => {
      const url = qrCodeService.getReportUrl('RPT-ABC123');
      expect(url).toBe('https://app.petvision.ai/reports/RPT-ABC123');
    });
  });
});

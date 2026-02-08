// ============================================================================
// QRCodeService - QR Code Generation for Digital Reports
// ============================================================================

import { QRCodeData, QRCodeOptions, IQrCodeService } from '../types/pdf';
import QRCode from 'qrcode';

// ----------------------------------------------------------------------------
// Default Options
// ----------------------------------------------------------------------------

const DEFAULT_QR_OPTIONS: Required<QRCodeOptions> = {
  size: 200,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
  errorCorrectionLevel: 'M',
};

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function generateQRDataUrl(data: QRCodeData): string {
  const qrData = {
    reportId: data.reportId,
    url: data.url,
    expiresAt: data.expiresAt,
    accessKey: data.accessKey,
  };
  
  // Encode as JSON and base64 for compact storage
  return Buffer.from(JSON.stringify(qrData)).toString('base64');
}

function validateQRStructure(qrData: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(qrData, 'base64').toString());
    return !!decoded.reportId && !!decoded.url;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Main Service Class
// ----------------------------------------------------------------------------

export class QRCodeService implements IQrCodeService {
  private baseUrl: string;

  constructor(config?: { baseUrl?: string }) {
    this.baseUrl = config?.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://app.petvision.ai';
  }

  // ========================================================================
  // Public Interface Methods
  // ========================================================================

  /**
   * Generate QR code as data URL (base64 image)
   */
  async generateQRCode(data: QRCodeData, options?: QRCodeOptions): Promise<string> {
    const mergedOptions = { ...DEFAULT_QR_OPTIONS, ...options };
    
    // Create the report URL
    const reportUrl = data.url || `${this.baseUrl}/reports/${data.reportId}`;
    
    // Add access key if provided
    const urlWithKey = data.accessKey 
      ? `${reportUrl}?key=${data.accessKey}`
      : reportUrl;
    
    try {
      const dataUrl = await QRCode.toDataURL(urlWithKey, {
        width: mergedOptions.size,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
      });
      
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code specifically for a report
   */
  async generateReportQR(reportId: string, url?: string): Promise<string> {
    const reportUrl = url || `${this.baseUrl}/reports/${reportId}`;
    
    const data: QRCodeData = {
      reportId,
      url: reportUrl,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    
    return this.generateQRCode(data);
  }

  /**
   * Validate QR code data
   */
  async validateQRCode(qrData: string): Promise<boolean> {
    return validateQRStructure(qrData);
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Generate QR code as buffer
   */
  async generateQRBuffer(data: QRCodeData, options?: QRCodeOptions): Promise<Buffer> {
    const mergedOptions = { ...DEFAULT_QR_OPTIONS, ...options };
    
    const reportUrl = data.url || `${this.baseUrl}/reports/${data.reportId}`;
    const urlWithKey = data.accessKey 
      ? `${reportUrl}?key=${data.accessKey}`
      : reportUrl;
    
    try {
      const buffer = await QRCode.toBuffer(urlWithKey, {
        width: mergedOptions.size,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
      });
      
      return buffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Generate SVG QR code
   */
  async generateQRSVG(data: QRCodeData, options?: QRCodeOptions): Promise<string> {
    const mergedOptions = { ...DEFAULT_QR_OPTIONS, ...options };
    
    const reportUrl = data.url || `${this.baseUrl}/reports/${data.reportId}`;
    const urlWithKey = data.accessKey 
      ? `${reportUrl}?key=${data.accessKey}`
      : reportUrl;
    
    try {
      const svg = await QRCode.toString(urlWithKey, {
        type: 'svg',       width: mergedOptions.size,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
      });
      
      return svg;
    } catch (error) {
      console.error('Error generating SVG QR code:', error);
      throw new Error('Failed to generate SVG QR code');
    }
  }

  /**
   * Generate QR code with custom text overlay
   */
  async generateQRWithOverlay(
    data: QRCodeData,
    options?: QRCodeOptions & { overlayText?: string }
  ): Promise<string> {
    const qrDataUrl = await this.generateQRCode(data, options);
    
    if (!options?.overlayText) {
      return qrDataUrl;
    }
    
    // Create a canvas-like SVG with QR code and text
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${options.size || 200}" height="${(options.size || 200) + 30}">
        <image href="${qrDataUrl}" width="${options.size || 200}" height="${options.size || 200}" />
        <text x="50%" y="${(options.size || 200) + 20}" text-anchor="middle" font-size="12" font-family="Arial, sans-serif">
          ${options.overlayText}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Get report URL from QR code
   */
  getReportUrl(reportId: string, accessKey?: string): string {
    const url = `${this.baseUrl}/reports/${reportId}`;
    return accessKey ? `${url}?key=${accessKey}` : url;
  }
}

// Export helper functions
export { generateQRDataUrl, validateQRStructure };

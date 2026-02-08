// ============================================================================
// PDF Report Generation Types
// ============================================================================

import { ScanResult, PetProfile, Severity, TrendData } from '../index';

// ----------------------------------------------------------------------------
// PDF Types
// ----------------------------------------------------------------------------

export enum PDFReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  VET_FULL = 'vet_full',
}

export enum PDFFormat {
  A4 = 'a4',
  LETTER = 'letter',
}

export interface PDFReportConfig {
  reportType: PDFReportType;
  format?: PDFFormat;
  includeTrends?: boolean;
  includeComparison?: boolean;
  includeQRCode?: boolean;
  includeImages?: boolean;
  language?: string;
  customBranding?: boolean;
}

export interface PDFReportData {
  reportId: string;
  generatedAt: string;
  pet: PetProfile;
  scan: ScanResult;
  previousScan?: ScanResult;
  trend?: TrendData;
  allScans?: ScanResult[];
  recommendations: VetRecommendation[];
  qrCodeUrl?: string;
}

export interface VetRecommendation {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  priority: 'immediate' | 'urgent' | 'routine' | 'monitor';
  timeframe?: string;
  actionItems?: string[];
}

export interface PDFGenerationOptions {
  landscape?: boolean;
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
}

// ----------------------------------------------------------------------------
// PDF Generation Result
// ----------------------------------------------------------------------------

export interface PDFGenerationResult {
  success: boolean;
  pdfBuffer?: Buffer;
  filePath?: string;
  storageUrl?: string;
  reportId: string;
  sizeBytes?: number;
  pageCount?: number;
  error?: string;
}

// ----------------------------------------------------------------------------
// Template Types
// ----------------------------------------------------------------------------

export interface PDFTemplateContext {
  data: PDFReportData;
  config: PDFReportConfig;
  baseUrl: string;
  assetUrls: {
    logo: string;
    fonts: string[];
    icons: Record<string, string>;
  };
}

export interface PDFSectionConfig {
  enabled: boolean;
  order?: number;
  title?: string;
  customContent?: string;
}

export interface PDFReportSections {
  cover: PDFSectionConfig;
  executiveSummary: PDFSectionConfig;
  findings: PDFSectionConfig;
  recommendations: PDFSectionConfig;
  trends: PDFSectionConfig;
  comparison: PDFSectionConfig;
  disclaimer: PDFSectionConfig;
}

// ----------------------------------------------------------------------------
// Mobile PDF Specific
// ----------------------------------------------------------------------------

export interface MobilePDFConfig {
  html: string;
  fileName: string;
  directory?: string;
  maxSize?: number;
}

export interface MobilePDFResult {
  success: boolean;
  filePath?: string;
  uri?: string;
  error?: string;
}

// ----------------------------------------------------------------------------
// QR Code Types
// ----------------------------------------------------------------------------

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface QRCodeData {
  reportId: string;
  url: string;
  expiresAt?: string;
  accessKey?: string;
}

// ----------------------------------------------------------------------------
// Service Interfaces
// ----------------------------------------------------------------------------

export interface IPDFService {
  generatePDF(data: PDFReportData, config: PDFReportConfig): Promise<PDFGenerationResult>;
  generatePDFFromScanId(scanId: string, config: PDFReportConfig): Promise<PDFGenerationResult>;
  generateSummary(data: PDFReportData): Promise<PDFGenerationResult>;
  generateDetailed(data: PDFReportData): Promise<PDFGenerationResult>;
}

export interface IMobilePDFService {
  generatePDF(data: PDFReportData, config: PDFReportConfig): Promise<MobilePDFResult>;
  generateFromHTML(html: string, fileName: string): Promise<MobilePDFResult>;
  saveToDevice(buffer: Buffer, fileName: string): Promise<MobilePDFResult>;
  sharePDF(filePath: string): Promise<boolean>;
}

export interface IQrCodeService {
  generateQRCode(data: QRCodeData, options?: QRCodeOptions): Promise<string>;
  generateReportQR(reportId: string, url: string): Promise<string>;
  validateQRCode(qrData: string): Promise<boolean>;
}

export interface IReportService {
  fetchReportData(scanId: string): Promise<PDFReportData>;
  fetchPetProfile(petId: string): Promise<PetProfile>;
  fetchScanResult(scanId: string): Promise<ScanResult>;
  fetchPreviousScans(petId: string, scanId: string): Promise<ScanResult[]>;
  generateRecommendations(scan: ScanResult): VetRecommendation[];
  generateReportId(): string;
}

// ----------------------------------------------------------------------------
// Recommendation Rules
// ----------------------------------------------------------------------------

export interface RecommendationRule {
  severity: Severity;
  scanType?: string;
  condition?: string;
  confidenceThreshold?: number;
  recommendations: VetRecommendation[];
}

// ----------------------------------------------------------------------------
// API Request/Response Types
// ----------------------------------------------------------------------------

export interface GeneratePDFRequest {
  scanId: string;
  reportType?: PDFReportType;
  format?: PDFFormat;
  options?: PDFGenerationOptions;
}

export interface GeneratePDFResponse {
  success: boolean;
  reportId: string;
  downloadUrl?: string;
  streamUrl?: string;
  size?: number;
  error?: string;
}

export interface StreamPDFRequest {
  reportId: string;
}

export interface EmailPDFRequest {
  reportId: string;
  recipientEmail: string;
  subject?: string;
  message?: string;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

export const DEFAULT_PDF_CONFIG: PDFReportConfig = {
  reportType: PDFReportType.DETAILED,
  format: PDFFormat.A4,
  includeTrends: true,
  includeComparison: true,
  includeQRCode: true,
  includeImages: true,
  language: 'en',
  customBranding: false,
};

export const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  landscape: false,
  displayHeaderFooter: true,
  printBackground: true,
  margin: {
    top: '0.5in',
    bottom: '0.5in',
    left: '0.5in',
    right: '0.5in',
  },
};

export const DEFAULT_SECTIONS: PDFReportSections = {
  cover: { enabled: true, order: 1 },
  executiveSummary: { enabled: true, order: 2 },
  findings: { enabled: true, order: 3 },
  recommendations: { enabled: true, order: 4 },
  trends: { enabled: true, order: 5 },
  comparison: { enabled: true, order: 6 },
  disclaimer: { enabled: true, order: 7 },
};

// ============================================================================
// MobilePDFService - PDF Generation for React Native
// ============================================================================

import RNHTMLtoPDF from 'react-native-html-to-pdf';
import {
  PDFReportData,
  PDFReportConfig,
  PDFGenerationResult,
  DEFAULT_PDF_CONFIG,
  IPDFService,
  MobilePDFOptions,
  DEFAULT_MOBILE_PDF_OPTIONS,
} from '@petvision/shared';
import { ReportService } from '@petvision/shared';
import { QRCodeService } from '@petvision/shared';
import { Platform, Share, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

async function requestWriteStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting storage permission:', error);
    return false;
  }
}

function getDownloadDirectory(): string {
  if (Platform.OS === 'android') {
    return Platform.Version >= 33
      ? RNFS.DownloadDirectoryPath
      : RNFS.ExternalStorageDirectoryPath;
  }
  return RNFS.DocumentDirectoryPath;
}

// ----------------------------------------------------------------------------
// Main Service Class
// ----------------------------------------------------------------------------

export class MobilePDFService implements IPDFService {
  private reportService: ReportService;
  private qrCodeService: QRCodeService;

  constructor() {
    this.reportService = new ReportService();
    this.qrCodeService = new QRCodeService();
  }

  // ========================================================================
  // Public Interface Methods
  // ========================================================================

  /**
   * Generate PDF from report data and configuration
   */
  async generatePDF(
    data: PDFReportData,
    config: PDFReportConfig = DEFAULT_PDF_CONFIG,
    options?: MobilePDFOptions
  ): Promise<PDFGenerationResult> {
    try {
      // Request storage permission
      const hasPermission = await requestWriteStoragePermission();
      if (!hasPermission) {
        return {
          success: false,
          reportId: data.reportId,
          error: 'Storage permission not granted',
        };
      }

      // Generate QR code if enabled
      if (config.includeQRCode) {
        data.qrCodeUrl = await this.qrCodeService.generateReportQR(
          data.reportId,
          data.qrCodeUrl
        );
      }

      // Compile template data
      const templateData = this.compileTemplateData(data);

      // Generate HTML content
      const htmlContent = await this.generateHTMLContent(data, config, templateData);

      // Configure mobile options
      const mergedOptions: MobilePDFOptions = {
        ...DEFAULT_MOBILE_PDF_OPTIONS,
        ...options,
        fileName: options?.fileName || `${data.reportId}.pdf`,
        html: htmlContent,
      };

      // Set download directory
      mergedOptions.directory = mergedOptions.directory || getDownloadDirectory();

      // Generate PDF
      const result = await RNHTMLtoPDF.convert(mergedOptions);

      if (result.filePath) {
        return {
          success: true,
          reportId: data.reportId,
          filePath: result.filePath,
          sizeBytes: result.fileSize || 0,
        };
      }

      return {
        success: false,
        reportId: data.reportId,
        error: 'Failed to generate PDF file',
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        reportId: data.reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate PDF from scan ID
   */
  async generatePDFFromScanId(
    scanId: string,
    config: PDFReportConfig = DEFAULT_PDF_CONFIG,
    options?: MobilePDFOptions
  ): Promise<PDFGenerationResult> {
    try {
      const data = await this.reportService.fetchReportData(scanId);
      return this.generatePDF(data, config, options);
    } catch (error) {
      console.error('Error generating PDF from scan ID:', error);
      return {
        success: false,
        reportId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate summary PDF (1 page)
   */
  async generateSummary(
    data: PDFReportData,
    options?: MobilePDFOptions
  ): Promise<PDFGenerationResult> {
    const config: PDFReportConfig = {
      ...DEFAULT_PDF_CONFIG,
      reportType: 'summary' as any,
      includeTrends: false,
      includeComparison: false,
    };
    return this.generatePDF(data, config, options);
  }

  /**
   * Generate detailed PDF (multi-page)
   */
  async generateDetailed(
    data: PDFReportData,
    options?: MobilePDFOptions
  ): Promise<PDFGenerationResult> {
    const config: PDFReportConfig = {
      ...DEFAULT_PDF_CONFIG,
      reportType: 'detailed' as any,
      includeTrends: true,
      includeComparison: true,
    };
    return this.generatePDF(data, config, options);
  }

  /**
   * Share PDF file
   */
  async sharePDF(filePath: string, message?: string): Promise<boolean> {
    try {
      await Share.share({
        url: `file://${filePath}`,
        message: message || 'PetVision Health Report',
      });
      return true;
    } catch (error) {
      console.error('Error sharing PDF:', error);
      return false;
    }
  }

  /**
   * Email PDF file
   */
  async emailPDF(
    filePath: string,
    email: string,
    subject?: string,
    body?: string
  ): Promise<boolean> {
    try {
      // This would require react-native-mail or similar library
      console.log('Emailing PDF to:', email);
      console.log('File:', filePath);
      console.log('Subject:', subject || 'PetVision Health Report');
      return true;
    } catch (error) {
      console.error('Error emailing PDF:', error);
      return false;
    }
  }

  /**
   * Delete PDF file
   */
  async deletePDF(filePath: string): Promise<boolean> {
    try {
      await RNFS.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Compile template data from report data
   */
  private compileTemplateData(data: PDFReportData): Record<string, any> {
    const findingsSummary = ReportService.getFindingsSummary(data.scan.findings);
    const age = ReportService.calculatePetAge(data.pet.date_of_birth);

    return {
      // Report metadata
      reportId: data.reportId,
      generatedAt: ReportService.formatDate(data.generatedAt),

      // Pet information
      petName: data.pet.name,
      petSpecies: data.pet.species,
      petBreed: data.pet.breed || 'Mixed Breed',
      petAge: age,
      petAvatar: data.pet.avatar_url,

      // Scan information
      scanType: ReportService.getScanTypeLabel(data.scan.scan_type),
      scanDate: ReportService.formatDate(data.scan.created_at),
      severity: data.scan.severity,
      severityLabel: ReportService.getSeverityLabel(data.scan.severity),
      scanImageUrl: data.scan.image_url,

      // Findings
      totalFindings: findingsSummary.total,
      greenFindings: findingsSummary.green,
      yellowFindings: findingsSummary.yellow,
      redFindings: findingsSummary.red,
      hasFindings: data.scan.findings.length > 0,
      findings: data.scan.findings.map((finding) => ({
        ...finding,
        severityLabel: ReportService.getSeverityLabel(finding.severity),
        confidencePercent: Math.round(finding.confidence * 100),
        hasArea: !!finding.location,
        areaLabel: finding.location ? 'Region detected' : '',
      })),

      // Recommendations
      recommendations: data.recommendations.map((rec) => ({
        ...rec,
        priorityLabel: rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1),
        hasActionItems: !!rec.actionItems && rec.actionItems.length > 0,
      })),
      hasUrgentRecommendations: data.recommendations.some(
        (rec) => rec.priority === 'immediate' || rec.priority === 'urgent'
      ),

      // Trend data
      hasTrendData: !!data.trend,
      trend: data.trend,
      trendType: data.trend?.type,
      trendIcon: data.trend?.type === 'improvement' ? '↑' : data.trend?.type === 'decline' ? '↓' : '→',
      trendLabel: data.trend?.type ? data.trend.type.charAt(0).toUpperCase() + data.trend.type.slice(1) : '',
      trendMessage: data.trend?.message || '',
      trendPercentage: data.trend?.percentageChange ? `${Math.abs(data.trend.percentageChange)}%` : '',
      trendDirection: data.trend?.percentageChange && data.trend.percentageChange > 0 ? 'improvement' : 'decline',
      hasPercentageChange: !!data.trend?.percentageChange,
      hasSeverityChange: !!data.trend?.severityChange,
      previousScanDate: data.previousScan
        ? ReportService.formatDate(data.previousScan.created_at)
        : '',
      currentScanDate: ReportService.formatDate(data.scan.created_at),
      previousSeverity: data.trend?.severityChange?.from || '',
      currentSeverity: data.scan.severity,
      previousSeverityLabel: data.trend?.severityChange
        ? ReportService.getSeverityLabel(data.trend.severityChange.from)
        : '',
      currentSeverityLabel: ReportService.getSeverityLabel(data.scan.severity),
      hasFindingsChange: !!data.trend?.findingsChange,
      addedFindings: data.trend?.findingsChange?.added || 0,
      resolvedFindings: data.trend?.findingsChange?.removed || 0,
      improvedFindings: data.trend?.findingsChange?.improved || 0,
      worsenedFindings: data.trend?.findingsChange?.worsened || 0,

      // QR code
      qrCodeUrl: data.qrCodeUrl || '',
    };
  }

  /**
   * Generate HTML content for mobile
   */
  private async generateHTMLContent(
    data: PDFReportData,
    config: PDFReportConfig,
    templateData: Record<string, any>
  ): Promise<string> {
    // For mobile, we inline all templates
    const sections: string[] = [];

    // Always include cover page
    sections.push(this.getMobileCoverTemplate(templateData));

    // Add findings section for detailed reports
    if (config.reportType === 'detailed') {
      sections.push(this.getMobileFindingsTemplate(templateData));
    }

    // Add recommendations section
    sections.push(this.getMobileRecommendationsTemplate(templateData));

    // Add trends section if enabled
    if (config.includeTrends && data.trend) {
      sections.push(this.getMobileTrendsTemplate(templateData));
    }

    return sections.join('\n');
  }

  // Mobile HTML templates (simplified versions)
  private getMobileCoverTemplate(data: any): string {
    return `
<div style="padding: 20px; font-family: sans-serif;">
  <h1 style="color: #1e40af; text-align: center;">PetVision Health Report</h1>
  <p style="text-align: center;">Report ID: ${data.reportId}</p>
  <p style="text-align: center;">Generated: ${data.generatedAt}</p>
  
  <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 10px;">
    <h2 style="color: #1e40af;">${data.petName}</h2>
    <p><strong>Species:</strong> ${data.petSpecies}</p>
    <p><strong>Breed:</strong> ${data.petBreed}</p>
    <p><strong>Age:</strong> ${data.petAge}</p>
  </div>
  
  <div style="margin-top: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 10px;">
    <h3 style="margin-bottom: 10px;">Scan Information</h3>
    <p><strong>Type:</strong> ${data.scanType}</p>
    <p><strong>Date:</strong> ${data.scanDate}</p>
    <p><strong>Severity:</strong> ${data.severityLabel}</p>
  </div>
  
  <div style="margin-top: 20px; padding: 15px; background: #fef9c3; border-radius: 10px;">
    <h3>Summary</h3>
    <p>This scan identified <strong>${data.totalFindings}</strong> finding(s).</p>
  </div>
  
  <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Generated by PetVision AI Health Screening System</p>
    <p><em>Disclaimer: This AI analysis is not a substitute for professional veterinary care.</em></p>
  </div>
</div>`;
  }

  private getMobileFindingsTemplate(data: any): string {
    let findingsHTML = data.hasFindings
      ? data.findings
          .map(
            (f: any) => `
<div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 10px;">
  <h4 style="color: ${f.severity === 'red' ? '#dc2626' : f.severity === 'yellow' ? '#f59e0b' : '#22c55e'};">${f.condition}</h4>
  <p>${f.description}</p>
  <p><strong>Confidence:</strong> ${f.confidencePercent}%</p>
</div>`
          )
          .join('')
      : '<p style="text-align: center; color: #22c55e;">No concerning findings detected.</p>';

    return `
<div style="padding: 20px; font-family: sans-serif; page-break-before: always;">
  <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Detailed Findings</h2>
  <div style="margin-top: 20px;">${findingsHTML}</div>
</div>`;
  }

  private getMobileRecommendationsTemplate(data: any): string {
    const recsHTML = data.recommendations
      .map(
        (r: any) => `
<div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-left: 5px solid ${r.priority === 'immediate' ? '#dc2626' : r.priority === 'urgent' ? '#f59e0b' : '#22c55e'}; border-radius: 10px;">
  <h4>${r.title}</h4>
  <p>${r.description}</p>
  ${r.timeframe ? `<p><strong>Timeframe:</strong> ${r.timeframe}</p>` : ''}
  ${r.hasActionItems
    ? `<ul style="margin-top: 10px;">${r.actionItems.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
    : ''}
</div>`
      )
      .join('');

    return `
<div style="padding: 20px; font-family: sans-serif; page-break-before: always;">
  <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Veterinarian Recommendations</h2>
  <div style="margin-top: 20px;">${recsHTML}</div>
</div>`;
  }

  private getMobileTrendsTemplate(data: any): string {
    if (!data.hasTrendData) {
      return `
<div style="padding: 20px; font-family: sans-serif; page-break-before: always;">
  <h2 style="color: #1e40af;">Trend Analysis</h2>
  <p style="text-align: center; padding: 30px; background: #f3f4f6; border-radius: 10px;">
    Insufficient data for trend analysis. Continue scanning to track progress.
  </p>
</div>`;
    }

    return `
<div style="padding: 20px; font-family: sans-serif; page-break-before: always;">
  <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Trend Analysis</h2>
  <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 10px;">
    <h3>${data.trendLabel} ${data.trendIcon}</h3>
    <p>${data.trendMessage}</p>
  </div>
</div>`;
  }
}

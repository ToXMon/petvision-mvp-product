// ============================================================================
// PDFService - PDF Generation for Web (Next.js + Puppeteer)
// ============================================================================

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import {
  PDFReportData,
  PDFReportConfig,
  PDFGenerationResult,
  DEFAULT_PDF_CONFIG,
  DEFAULT_PDF_OPTIONS,
  PDFFormat,
  IPDFService,
} from '@petvision/shared';
import { ReportService } from '@petvision/shared';
import { QRCodeService } from '@petvision/shared';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

// ----------------------------------------------------------------------------
// Template Loading
// ----------------------------------------------------------------------------

const TEMPLATE_DIR = path.join(
  process.cwd(),
  '..',
  'packages',
  'shared',
  'src',
  'templates',
  'reports'
);

async function loadTemplate(templateName: string): Promise<string> {
  try {
    const templatePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load template: ${templateName}`);
  }
}

// ----------------------------------------------------------------------------
// Template Rendering
// ----------------------------------------------------------------------------

function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : '';
  });
}

function renderConditionalSections(template: string, data: Record<string, any>): string {
  // Handle {{#condition}}...{{/condition}} blocks
  template = template.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, condition, content) => {
    return data[condition] ? content : '';
  });

  // Handle {{^condition}}...{{/condition}} blocks (inverted)
  template = template.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, condition, content) => {
    return !data[condition] ? content : '';
  });

  return template;
}

function renderLists(template: string, data: Record<string, any>): string {
  // Handle {{#items}}...{{/items}} list blocks
  return template.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (match, listName, itemTemplate) => {
      if (Array.isArray(data[listName])) {
        return data[listName]
          .map((item: any) => {
            let rendered = itemTemplate;
            // Replace simple placeholders
            rendered = rendered.replace(/\{\{(\w+)\}\}/g, (_, key) => {
              return item[key] !== undefined ? String(item[key]) : '';
            });
            // Handle nested conditionals
            rendered = rendered.replace(
              /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
              (_, condition, content) => {
                return item[condition] ? content : '';
              }
            );
            return rendered;
          })
          .join('');
      }
      return '';
    }
  );
}

function compileTemplate(template: string, data: Record<string, any>): string {
  let compiled = template;
  compiled = renderConditionalSections(compiled, data);
  compiled = renderLists(compiled, data);
  compiled = renderTemplate(compiled, data);
  return compiled;
}

// ----------------------------------------------------------------------------
// Browser Management
// ----------------------------------------------------------------------------

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });
  }
  return browserInstance;
}

async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// ----------------------------------------------------------------------------
// Main Service Class
// ----------------------------------------------------------------------------

export class PDFService implements IPDFService {
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
    config: PDFReportConfig = DEFAULT_PDF_CONFIG
  ): Promise<PDFGenerationResult> {
    try {
      // Generate QR code if enabled
      if (config.includeQRCode) {
        data.qrCodeUrl = await this.qrCodeService.generateReportQR(
          data.reportId,
          data.qrCodeUrl
        );
      }

      // Compile template data
      const templateData = this.compileTemplateData(data);

      // Generate HTML content based on report type
      const htmlContent = await this.generateHTMLContent(data, config, templateData);

      // Generate PDF using Puppeteer
      const pdfBuffer = await this.renderPDFFromHTML(htmlContent, config);

      return {
        success: true,
        pdfBuffer,
        reportId: data.reportId,
        sizeBytes: pdfBuffer.length,
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
    config: PDFReportConfig = DEFAULT_PDF_CONFIG
  ): Promise<PDFGenerationResult> {
    try {
      const data = await this.reportService.fetchReportData(scanId);
      return this.generatePDF(data, config);
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
  async generateSummary(data: PDFReportData): Promise<PDFGenerationResult> {
    const config: PDFReportConfig = {
      ...DEFAULT_PDF_CONFIG,
      reportType: 'summary' as any,
      includeTrends: false,
      includeComparison: false,
    };
    return this.generatePDF(data, config);
  }

  /**
   * Generate detailed PDF (multi-page)
   */
  async generateDetailed(data: PDFReportData): Promise<PDFGenerationResult> {
    const config: PDFReportConfig = {
      ...DEFAULT_PDF_CONFIG,
      reportType: 'detailed' as any,
      includeTrends: true,
      includeComparison: true,
    };
    return this.generatePDF(data, config);
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
   * Generate HTML content from templates
   */
  private async generateHTMLContent(
    data: PDFReportData,
    config: PDFReportConfig,
    templateData: Record<string, any>
  ): Promise<string> {
    const sections: string[] = [];

    // Always include cover page
    const coverTemplate = await loadTemplate('cover');
    sections.push(compileTemplate(coverTemplate, templateData));

    // Add findings section for detailed reports
    if (config.reportType === 'detailed') {
      const findingsTemplate = await loadTemplate('findings');
      sections.push(compileTemplate(findingsTemplate, templateData));
    }

    // Add recommendations section
    const recommendationsTemplate = await loadTemplate('recommendations');
    sections.push(compileTemplate(recommendationsTemplate, templateData));

    // Add trends section if enabled and data available
    if (config.includeTrends && data.trend) {
      const trendsTemplate = await loadTemplate('trends');
      sections.push(compileTemplate(trendsTemplate, templateData));
    }

    // Combine all sections
    return sections.join('\n');
  }

  /**
   * Render PDF from HTML using Puppeteer
   */
  private async renderPDFFromHTML(
    html: string,
    config: PDFReportConfig
  ): Promise<Buffer> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Set HTML content
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 30000,
      });

      // Configure PDF options
      const pdfOptions: PDFOptions = {
        format: (config.format || PDFFormat.A4) as any,
        printBackground: true,
        margin: DEFAULT_PDF_OPTIONS.margin as any,
        displayHeaderFooter: DEFAULT_PDF_OPTIONS.displayHeaderFooter,
      };

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  // ========================================================================
  // Static Utility Methods
  // ========================================================================

  /**
   * Close browser instance (for cleanup)
   */
  static async cleanup(): Promise<void> {
    await closeBrowser();
  }
}

// Export helper functions
export { loadTemplate, compileTemplate, getBrowser, closeBrowser };

// ============================================================================
// PDFService - PDF Generation using Puppeteer
// ============================================================================

import puppeteer, { Browser, Page } from 'puppeteer';
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import {
  PDFReportData,
  PDFReportConfig,
  PDFGenerationResult,
  PDFReportType,
  PDFFormat,
  DEFAULT_PDF_CONFIG,
  DEFAULT_PDF_OPTIONS,
  IPDFService,
  Severity,
  TrendData,
  Finding,
} from '../types/pdf';
import { QRCodeService } from './QRCodeService';
import { ReportService } from './ReportService';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface TemplateCache {
  [key: string]: HandlebarsTemplateDelegate;
}

interface PDFCacheEntry {
  buffer: Buffer;
  timestamp: number;
  reportId: string;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const TEMPLATES_DIR = path.join(__dirname, '../../templates/reports');
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const PDF_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 100;

const TEMPLATE_FILES = {
  cover: 'cover.html',
  findings: 'findings.html',
  recommendations: 'recommendations.html',
  trends: 'trends.html',
} as const;

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function generateCacheKey(data: PDFReportData, config: PDFReportConfig): string {
  const hashInput = `${data.reportId}-${config.reportType}-${data.generatedAt}-${data.scan.id}`;
  return createHash('md5').update(hashInput).digest('hex');
}

function getSeverityIcon(severity: Severity): string {
  switch (severity) {
    case Severity.GREEN:
      return '✅';
    case Severity.YELLOW:
      return '⚠️';
    case Severity.RED:
      return '🚨';
    default:
      return '❓';
  }
}

function getTrendIcon(trend?: TrendData): string {
  if (!trend) return '📊';
  if (trend.overallTrend === 'improving') return '📈';
  if (trend.overallTrend === 'stable') return '➡️';
  return '📉';
}

function getTrendLabel(trend?: TrendData): string {
  if (!trend) return 'No Trend Data';
  const labels: Record<string, string> = {
    improving: 'Improving',
    stable: 'Stable',
    worsening: 'Worsening',
  };
  return labels[trend.overallTrend] || 'Unknown';
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    immediate: 'Immediate',
    urgent: 'Urgent',
    routine: 'Routine',
    monitor: 'Monitor',
  };
  return labels[priority] || priority;
}

function calculateSeverityChanges(
  currentFindings: Finding[],
  previousFindings: Finding[]
): {
  added: number;
  resolved: number;
  improved: number;
  worsened: number;
} {
  const currentMap = new Map(currentFindings.map(f => [f.id, f]));
  const previousMap = new Map(previousFindings.map(f => [f.id, f]));

  let added = 0;
  let resolved = 0;
  let improved = 0;
  let worsened = 0;

  // Check for added findings
  currentFindings.forEach(finding => {
    if (!previousMap.has(finding.id)) {
      added++;
    }
  });

  // Check for resolved findings
  previousFindings.forEach(finding => {
    if (!currentMap.has(finding.id)) {
      resolved++;
    } else {
      const current = currentMap.get(finding.id)!;
      if (current.severity < finding.severity) {
        improved++;
      } else if (current.severity > finding.severity) {
        worsened++;
      }
    }
  });

  return { added, resolved, improved, worsened };
}

// ----------------------------------------------------------------------------
// Main Service Class
// ----------------------------------------------------------------------------

export class PDFService implements IPDFService {
  private browser: Browser | null = null;
  private templateCache: TemplateCache = {};
  private pdfCache: Map<string, PDFCacheEntry> = new Map();
  private qrCodeService: QRCodeService;
  private reportService: ReportService;
  private templatesDir: string;

  constructor(config?: {
    templatesDir?: string;
    qrCodeService?: QRCodeService;
    reportService?: ReportService;
  }) {
    this.templatesDir = config?.templatesDir || TEMPLATES_DIR;
    this.qrCodeService = config?.qrCodeService || new QRCodeService();
    this.reportService = config?.reportService || new ReportService();
  }

  // ========================================================================
  // Browser Management
  // ========================================================================

  /**
   * Initialize Puppeteer browser instance
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ========================================================================
  // Template Management
  // ========================================================================

  /**
   * Load and compile a Handlebars template
   */
  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    // Check cache first
    if (this.templateCache[templateName]) {
      return this.templateCache[templateName];
    }

    const templatePath = path.join(this.templatesDir, TEMPLATE_FILES[templateName as keyof typeof TEMPLATE_FILES]);
    
    try {
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);
      this.templateCache[templateName] = template;
      return template;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Failed to load template: ${templateName}`);
    }
  }

  /**
   * Prepare template context with all required data
   */
  private async prepareContext(data: PDFReportData, config: PDFReportConfig): Promise<any> {
    const age = ReportService.calculatePetAge(data.pet.date_of_birth);
    const scanDate = ReportService.formatDate(data.scan.created_at);
    const severityLabel = ReportService.getSeverityLabel(data.scan.severity);
    const scanTypeLabel = ReportService.getScanTypeLabel(data.scan.scan_type);
    
    // Generate QR code if needed
    let qrCodeUrl = data.qrCodeUrl;
    if (config.includeQRCode && !qrCodeUrl) {
      qrCodeUrl = await this.qrCodeService.generateReportQR(data.reportId);
    }

    // Process findings
    const findingsSummary = ReportService.getFindingsSummary(data.scan.findings);
    const groupedFindings = ReportService.groupFindingsBySeverity(data.scan.findings);

    // Prepare trend data
    const hasTrendData = !!data.trend;
    let trendMessage = '';
    let findingsChange: any = null;

    if (data.trend) {
      trendMessage = data.trend.message || getTrendLabel(data.trend);
      
      if (data.previousScan) {
        findingsChange = calculateSeverityChanges(
          data.scan.findings,
          data.previousScan.findings
        );
      }
    }

    return {
      reportId: data.reportId,
      generatedAt: ReportService.formatDate(data.generatedAt),
      petName: data.pet.name,
      petSpecies: data.pet.species,
      petBreed: data.pet.breed,
      petAge: age,
      petAvatar: data.pet.avatar_url,
      scanType: scanTypeLabel,
      scanDate: scanDate,
      severityLabel: severityLabel,
      severityIcon: getSeverityIcon(data.scan.severity),
      severity: data.scan.severity,
      scanImageUrl: data.scan.image_url,
      qrCodeUrl: qrCodeUrl,
      totalFindings: data.scan.findings.length,
      greenFindings: findingsSummary.green,
      yellowFindings: findingsSummary.yellow,
      redFindings: findingsSummary.red,
      findings: data.scan.findings.map(f => ({
        ...f,
        severityLabel: ReportService.getSeverityLabel(f.severity),
        confidencePercent: Math.round(f.confidence * 100),
        hasArea: !!f.location,
        areaLabel: f.location ? `x: ${f.location.x}, y: ${f.location.y}` : '',
      })),
      hasFindings: data.scan.findings.length > 0,
      recommendations: data.recommendations.map(r => ({
        ...r,
        priorityLabel: getPriorityLabel(r.priority),
        hasActionItems: r.actionItems && r.actionItems.length > 0,
        hasUrgentRecommendations: r.priority === 'immediate' || r.priority === 'urgent',
      })),
      hasTrendData,
      trendIcon: hasTrendData ? getTrendIcon(data.trend) : '',
      trendLabel: hasTrendData ? getTrendLabel(data.trend) : '',
      trendMessage,
      hasPercentageChange: !!data.trend?.percentageChange,
      trendPercentage: data.trend?.percentageChange
        ? `${data.trend.percentageChange > 0 ? '+' : ''}${data.trend.percentageChange.toFixed(1)}%`
        : '',
      hasSeverityChange: !!data.previousScan,
      previousScanDate: data.previousScan
        ? ReportService.formatDate(data.previousScan.created_at)
        : '',
      previousSeverityLabel: data.previousScan
        ? ReportService.getSeverityLabel(data.previousScan.severity)
        : '',
      currentSeverityLabel,
      hasFindingsChange: !!findingsChange,
      addedFindings: findingsChange?.added || 0,
      resolvedFindings: findingsChange?.resolved || 0,
      improvedFindings: findingsChange?.improved || 0,
      worsenedFindings: findingsChange?.worsened || 0,
    };
  }

  // ========================================================================
  // PDF Generation
  // ========================================================================

  /**
   * Generate HTML from template and context
   */
  private async generateHTML(
    templateName: string,
    context: any
  ): Promise<string> {
    const template = await this.loadTemplate(templateName);
    return template(context);
  }

  /**
   * Convert HTML to PDF using Puppeteer
   */
  private async htmlToPDF(
    html: string,
    options: PDFReportConfig
  ): Promise<{ buffer: Buffer; pageCount: number }> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const pdfOptions: any = {
        format: options.format || PDFFormat.A4,
        printBackground: true,
        margin: DEFAULT_PDF_OPTIONS.margin,
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      const pageCount = pdfBuffer.length / 10000; // Rough estimate

      return { buffer: pdfBuffer, pageCount };
    } finally {
      await page.close();
    }
  }

  /**
   * Main PDF generation method
   */
  async generatePDF(
    data: PDFReportData,
    config: PDFReportConfig = DEFAULT_PDF_CONFIG
  ): Promise<PDFGenerationResult> {
    try {
      // Check cache first
      const cacheKey = generateCacheKey(data, config);
      const cached = this.pdfCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < PDF_CACHE_TTL) {
        return {
          success: true,
          pdfBuffer: cached.buffer,
          reportId: data.reportId,
          sizeBytes: cached.buffer.length,
        };
      }

      // Prepare context
      const context = await this.prepareContext(data, config);

      // Generate HTML based on report type
      let html = '';
      const sections = this.getSectionsIncluded(config);

      for (const section of sections) {
        const sectionHTML = await this.generateHTML(section, context);
        html += sectionHTML;
        
        // Add page break between sections (except last)
        if (section !== sections[sections.length - 1]) {
          html += '<div style="page-break-after: always;"></div>';
        }
      }

      // Convert to PDF
      const { buffer, pageCount } = await this.htmlToPDF(html, config);

      // Update cache
      if (this.pdfCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = this.pdfCache.keys().next().value;
        this.pdfCache.delete(oldestKey);
      }
      this.pdfCache.set(cacheKey, {
        buffer,
        timestamp: Date.now(),
        reportId: data.reportId,
      });

      return {
        success: true,
        pdfBuffer: buffer,
        reportId: data.reportId,
        sizeBytes: buffer.length,
        pageCount,
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
   * Get sections to include based on config
   */
  private getSectionsIncluded(config: PDFReportConfig): string[] {
    const sections: string[] = ['cover'];
    
    if (config.reportType === PDFReportType.SUMMARY) {
      // Summary includes only cover and findings
      sections.push('findings');
    } else {
      // Detailed includes all sections
      sections.push('findings');
      sections.push('recommendations');
      if (config.includeTrends) {
        sections.push('trends');
      }
    }
    
    return sections;
  }

  /**
   * Generate PDF from scan ID (fetches data and generates PDF)
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
   * Generate summary PDF (1-page)
   */
  async generateSummary(data: PDFReportData): Promise<PDFGenerationResult> {
    const config: PDFReportConfig = {
      ...DEFAULT_PDF_CONFIG,
      reportType: PDFReportType.SUMMARY,
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
      reportType: PDFReportType.DETAILED,
      includeTrends: true,
      includeComparison: true,
    };
    return this.generatePDF(data, config);
  }

  // ========================================================================
  // Cache Management
  // ========================================================================

  /**
   * Clear template cache
   */
  clearTemplateCache(): void {
    this.templateCache = {};
  }

  /**
   * Clear PDF cache
   */
  clearPDFCache(): void {
    this.pdfCache.clear();
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.clearTemplateCache();
    this.clearPDFCache();
  }

  /**
   * Clean up expired cache entries
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.pdfCache.entries()) {
      if (now - entry.timestamp > PDF_CACHE_TTL) {
        this.pdfCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    templateCache: number;
    pdfCache: number;
    pdfCacheSize: string;
  } {
    let pdfCacheSize = 0;
    for (const entry of this.pdfCache.values()) {
      pdfCacheSize += entry.buffer.length;
    }

    return {
      templateCache: Object.keys(this.templateCache).length,
      pdfCache: this.pdfCache.size,
      pdfCacheSize: formatFileSize(pdfCacheSize),
    };
  }

  /**
   * Cleanup on service destruction
   */
  async destroy(): Promise<void> {
    await this.closeBrowser();
    this.clearAllCaches();
  }
}

// Export singleton instance
export const pdfService = new PDFService();

// Export for testing
export { PDFService };

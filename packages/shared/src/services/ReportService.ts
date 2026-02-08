// ============================================================================
// ReportService - Data Fetching & Formatting for PDF Reports
// ============================================================================

import {
  PDFReportData,
  PDFReportConfig,
  VetRecommendation,
  IReportService,
  ScanResult,
  PetProfile,
  TrendData,
  Severity,
  Finding,
} from '../types/pdf';
import { TimelineService } from './TimelineService';

// ----------------------------------------------------------------------------
// Recommendation Rules
// ----------------------------------------------------------------------------

const RECOMMENDATION_RULES: {
  severity: Severity;
  recommendations: Partial<VetRecommendation>[];
}[] = [
  {
    severity: Severity.RED,
    recommendations: [
      {
        category: 'Urgent Care',
        title: 'Immediate Veterinary Attention Required',
        description:
          'This scan detected concerning findings that require immediate professional evaluation. Please contact your veterinarian or an emergency veterinary clinic as soon as possible.',
        priority: 'immediate',
        timeframe: 'Within 24 hours',
        actionItems: [
          'Schedule an emergency veterinary appointment',
          'Bring this report and any previous scan results',
          'Document any symptoms or behavioral changes',
          'Follow all veterinary instructions carefully',
        ],
      },
    ],
  },
  {
    severity: Severity.YELLOW,
    recommendations: [
      {
        category: 'Follow-up Care',
        title: 'Veterinary Consultation Recommended',
        description:
          'This scan detected findings that warrant professional attention. Schedule a consultation with your veterinarian to discuss these findings.',
        priority: 'urgent',
        timeframe: 'Within 2 weeks',
        actionItems: [
          'Schedule a veterinary appointment',
          'Bring this report for review',
          'Monitor for any changes in condition',
          'Document any new symptoms',
        ],
      },
    ],
  },
  {
    severity: Severity.GREEN,
    recommendations: [
      {
        category: 'Preventive Care',
        title: 'Continue Regular Monitoring',
        description:
          'This scan shows no concerning findings. Continue with regular health monitoring and preventive care routines.',
        priority: 'routine',
        timeframe: 'Next scheduled checkup',
        actionItems: [
          'Maintain regular veterinary checkups',
          'Continue preventive care routines',
          'Monitor for any changes between scans',
          'Keep records of all health activities',
        ],
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function generateReportId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `RPT-${timestamp}-${randomStr}`.toUpperCase();
}

function calculateAge(dateOfBirth?: string): { years: number; months: number } | null {
  if (!dateOfBirth) return null;
  
  const birth = new Date(dateOfBirth);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months };
}

// ----------------------------------------------------------------------------
// Main Service Class
// ----------------------------------------------------------------------------

export class ReportService implements IReportService {
  private supabaseUrl?: string;
  private supabaseKey?: string;

  constructor(config?: { supabaseUrl?: string; supabaseKey?: string }) {
    this.supabaseUrl = config?.supabaseUrl;
    this.supabaseKey = config?.supabaseKey;
  }

  // ========================================================================
  // Public Interface Methods
  // ========================================================================

  /**
   * Fetch all data needed for a PDF report from a scan ID
   */
  async fetchReportData(scanId: string): Promise<PDFReportData> {
    // In a real implementation, this would fetch from Supabase
    // For now, we'll use mock data structure that matches the expected format
    
    const scan = await this.fetchScanResult(scanId);
    const pet = await this.fetchPetProfile(scan.pet_id);
    const previousScans = await this.fetchPreviousScans(pet.id, scanId);
    const recommendations = this.generateRecommendations(scan);
    
    // Calculate trend if previous scans exist
    let trend: TrendData | undefined;
    let previousScan: ScanResult | undefined;
    
    if (previousScans.length > 0) {
      const sameTypePrevious = previousScans
        .filter(s => s.scan_type === scan.scan_type)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      if (sameTypePrevious) {
        previousScan = sameTypePrevious;
        trend = TimelineService.calculateTrend(scan, sameTypePrevious);
      }
    }
    
    return {
      reportId: this.generateReportId(),
      generatedAt: new Date().toISOString(),
      pet,
      scan,
      previousScan,
      trend,
      allScans: previousScans,
      recommendations,
    };
  }

  /**
   * Fetch pet profile by ID
   */
  async fetchPetProfile(petId: string): Promise<PetProfile> {
    // Mock implementation - replace with actual Supabase query
    return {
      id: petId,
      name: 'Buddy',
      species: 'dog' as any,
      breed: 'Golden Retriever',
      date_of_birth: '2020-05-15',
      avatar_url: '',
      created_at: '2020-05-15T00:00:00Z',
    };
  }

  /**
   * Fetch scan result by ID
   */
  async fetchScanResult(scanId: string): Promise<ScanResult> {
    // Mock implementation - replace with actual Supabase query
    return {
      id: scanId,
      pet_id: 'pet-123',
      scan_type: 'eye' as any,
      severity: 'yellow' as any,
      findings: [
        {
          id: 'finding-1',
          condition: 'Mild conjunctivitis',
          description: 'Slight redness and discharge observed in the left eye',
          confidence: 0.85,
          severity: 'yellow' as any,
          location: { x: 100, y: 150, width: 50, height: 50 },
        },
      ],
      image_url: '',
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Fetch all previous scans for a pet
   */
  async fetchPreviousScans(petId: string, currentScanId: string): Promise<ScanResult[]> {
    // Mock implementation - replace with actual Supabase query
    return [];
  }

  /**
   * Generate vet recommendations based on scan severity and findings
   */
  generateRecommendations(scan: ScanResult): VetRecommendation[] {
    const recommendations: VetRecommendation[] = [];
    
    // Get base recommendations based on severity
    const rule = RECOMMENDATION_RULES.find(r => r.severity === scan.severity);
    if (rule) {
      rule.recommendations.forEach((rec, index) => {
        recommendations.push({
          id: `rec-${scan.id}-${index}`,
          severity: scan.severity,
          category: rec.category || 'General',
          title: rec.title || 'Recommendation',
          description: rec.description || '',
          priority: rec.priority || 'routine',
          timeframe: rec.timeframe,
          actionItems: rec.actionItems || [],
        });
      });
    }
    
    // Add specific recommendations for findings
    scan.findings.forEach((finding, index) => {
      if (finding.severity === Severity.RED) {
        recommendations.push({
          id: `rec-finding-${finding.id}`,
          severity: finding.severity,
          category: 'Specific Finding',
          title: `Attention Required: ${finding.condition}`,
          description: finding.description,
          priority: 'immediate',
          timeframe: 'As soon as possible',
          actionItems: [
            'Monitor this area closely',
            'Document any changes',
            'Discuss with veterinarian',
          ],
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Generate a unique report ID
   */
  generateReportId(): string {
    return generateReportId();
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Calculate pet age from date of birth
   */
  static calculatePetAge(dateOfBirth?: string): string {
    const age = calculateAge(dateOfBirth);
    if (!age) return 'Age unknown';
    
    const parts: string[] = [];
    if (age.years > 0) parts.push(`${age.years} year${age.years > 1 ? 's' : ''}`);
    if (age.months > 0) parts.push(`${age.months} month${age.months > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Newborn';
  }

  /**
   * Format scan date for display
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get scan type display label
   */
  static getScanTypeLabel(scanType: string): string {
    const labels: Record<string, string> = {
      eye: 'Eye Examination',
      skin: 'Skin Analysis',
      teeth: 'Dental Check',
      gait: 'Gait Analysis',
      multi: 'Multi-System Scan',
    };
    return labels[scanType] || scanType;
  }

  /**
   * Get severity label
   */
  static getSeverityLabel(severity: Severity): string {
    const labels: Record<Severity, string> = {
      [Severity.GREEN]: 'Healthy',
      [Severity.YELLOW]: 'Attention Needed',
      [Severity.RED]: 'Concerning',
    };
    return labels[severity];
  }

  /**
   * Group findings by severity
   */
  static groupFindingsBySeverity(findings: Finding[]): Record<Severity, Finding[]> {
    return findings.reduce(
      (acc, finding) => {
        if (!acc[finding.severity]) {
          acc[finding.severity] = [];
        }
        acc[finding.severity].push(finding);
        return acc;
      },
      {} as Record<Severity, Finding[]>
    );
  }

  /**
   * Calculate findings summary statistics
   */
  static getFindingsSummary(findings: Finding[]) {
    const bySeverity = this.groupFindingsBySeverity(findings);
    return {
      total: findings.length,
      green: bySeverity[Severity.GREEN]?.length || 0,
      yellow: bySeverity[Severity.YELLOW]?.length || 0,
      red: bySeverity[Severity.RED]?.length || 0,
      averageConfidence:
        findings.length > 0
          ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length
          : 0,
    };
  }
}

// Export utility functions
export { calculateAge, generateReportId };

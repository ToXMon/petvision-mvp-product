// ============================================================================
// Vet Recommendation Service
// Intelligent recommendation engine for PetVision
// ============================================================================

import {
  VetRecommendation,
  RecommendationInput,
  FindingsAnalysis,
  SpecificAction,
  IVetRecommendationService,
  RecommendationRules,
  UrgencyLevel,
  Severity,
  FindingCategory,
  DEFAULT_URGENCY_TIMEFRAMES,
  CONFIDENCE_THRESHOLDS
} from '../types/vet-recommendation';

import {
  ScanResult,
  PetProfile,
  Finding,
  TrendType,
  ScanType
} from '../index';

import {
  DEFAULT_RECOMMENDATION_RULES,
  validateRules
} from '../types/recommendation-rules';

// ============================================================================
// VetRecommendationService Class
// ============================================================================

export class VetRecommendationService implements IVetRecommendationService {
  private rules: RecommendationRules;

  constructor(rules?: RecommendationRules) {
    this.rules = rules || DEFAULT_RECOMMENDATION_RULES;
    this.validateConfiguration();
  }

  // --------------------------------------------------------------------------
  // Main Recommendation Generation
  // --------------------------------------------------------------------------

  /**
   * Generate a veterinary recommendation based on scan analysis
   */
  async generateRecommendation(input: RecommendationInput): Promise<VetRecommendation> {
    const { scanResult, petProfile, previousScans, trendData } = input;

    // Analyze findings
    const findingsAnalysis = this.analyzeFindings(scanResult.findings);

    // Determine overall severity considering all factors
    const overallSeverity = this.determineOverallSeverity(
      scanResult,
      findingsAnalysis,
      trendData
    );

    // Calculate urgency level
    const urgencyLevel = this.determineUrgencyLevel(
      overallSeverity,
      findingsAnalysis
    );

    // Generate specific actions for each finding
    const specificActions = this.generateSpecificActions(
    scanResult.findings,
    scanResult.scan_type
    );

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(scanResult.findings);

    // Generate risk factors based on pet profile
    const riskFactors = this.generateRiskFactors(petProfile, findingsAnalysis);

    // Apply trend-based adjustments
    const trendAdjustment = this.applyTrendAdjustments(trendData, urgencyLevel);

    // Build the complete recommendation
    const recommendation: VetRecommendation = {
      overall_severity: overallSeverity,
      urgency_level: trendAdjustment.urgencyLevel,
      timeframe: this.getTimeframe(trendAdjustment.urgencyLevel),
      primary_recommendation: this.generatePrimaryRecommendation(
        trendAdjustment.urgencyLevel,
        findingsAnalysis,
        specificActions
      ),
      secondary_recommendations: this.generateSecondaryRecommendations(
        trendAdjustment.urgencyLevel,
        specificActions,
        riskFactors
      ),
      findings_analysis: findingsAnalysis,
      specific_actions: specificActions,
      risk_factors: [...riskFactors, ...trendAdjustment.riskFactors],
      confidence_score: confidenceScore,
      escalation_path: this.rules.escalationPaths[trendAdjustment.urgencyLevel],
      vet_consultation_required: this.requiresVetConsultation(
        trendAdjustment.urgencyLevel,
        confidenceScore
      ),
      emergency_warning: trendAdjustment.urgencyLevel === UrgencyLevel.EMERGENCY
        ? this.generateEmergencyWarning(findingsAnalysis, petProfile)
        : undefined
    };

    return recommendation;
  }

  /**
   * Generate recommendations for multiple scans (batch processing)
   */
  async generateBatchRecommendations(
    inputs: RecommendationInput[]
  ): Promise<VetRecommendation[]> {
    const recommendations: VetRecommendation[] = [];

    for (const input of inputs) {
      try {
        const recommendation = await this.generateRecommendation(input);
        recommendations.push(recommendation);
      } catch (error) {
        console.error(`Error generating recommendation for scan ${input.scanResult.id}:`, error);
        // Continue with other scans even if one fails
      }
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Findings Analysis
  // --------------------------------------------------------------------------

  /**
   * Analyze findings and generate statistics
   */
  private analyzeFindings(findings: Finding[]): FindingsAnalysis {
    const analysis: FindingsAnalysis = {
      total_findings: findings.length,
      green_count: 0,
      yellow_count: 0,
      red_count: 0,
      by_category: {
        eye: { total: 0, green: 0, yellow: 0, red: 0 },
        skin: { total: 0, green: 0, yellow: 0, red: 0 },
        teeth: { total: 0, green: 0, yellow: 0, red: 0 },
        gait: { total: 0, green: 0, yellow: 0, red: 0 },
      }
    };

    for (const finding of findings) {
      // Count by severity
      switch (finding.severity) {
        case Severity.GREEN:
          analysis.green_count++;
          break;
        case Severity.YELLOW:
          analysis.yellow_count++;
          break;
        case Severity.RED:
          analysis.red_count++;
          break;
      }

      // Determine category and count
      const category = this.determineFindingCategory(finding);
      if (category && analysis.by_category[category]) {
        analysis.by_category[category].total++;
        analysis.by_category[category][finding.severity]++;
      }
    }

    return analysis;
  }

  /**
   * Determine the category of a finding based on its condition
   */
  private determineFindingCategory(finding: Finding): FindingCategory | null {
    const condition = finding.condition.toLowerCase();

    // Eye-related keywords
    const eyeKeywords = [
      'eye', 'eye', 'vision', 'sight', 'cornea', 'iris', 'pupil',
      'conjunctiv', 'discharge', 'tear', 'red eye', 'cloudy', 'ulcer'
    ];

    // Skin-related keywords
    const skinKeywords = [
      'skin', 'dermat', 'rash', 'lesion', 'sore', 'wound', 'hair',
      'coat', 'alopecia', 'dry', 'flak', 'hot spot', 'abscess'
    ];

    // Teeth-related keywords
    const teethKeywords = [
      'tooth', 'teeth', 'dental', 'gum', 'tartar', 'plaque', 'breath',
      'oral', 'mouth', 'cavity', 'gingiv'
    ];

    // Gait-related keywords
    const gaitKeywords = [
      'gait', 'limp', 'walk', 'mobility', 'leg', 'paw', 'joint',
      'lameness', 'stiff', 'fracture', 'injury', 'trauma'
    ];

    if (eyeKeywords.some(keyword => condition.includes(keyword))) {
      return FindingCategory.EYE;
    }
    if (skinKeywords.some(keyword => condition.includes(keyword))) {
      return FindingCategory.SKIN;
    }
    if (teethKeywords.some(keyword => condition.includes(keyword))) {
      return FindingCategory.TEETH;
    }
    if (gaitKeywords.some(keyword => condition.includes(keyword))) {
      return FindingCategory.GAIT;
    }

    return null;
  }

  // --------------------------------------------------------------------------
  // Severity and Urgency Determination
  // --------------------------------------------------------------------------

  /**
   * Determine the overall severity considering scan severity and findings
   */
  private determineOverallSeverity(
    scanResult: ScanResult,
    findingsAnalysis: FindingsAnalysis,
    trendData?: any
  ): 'green' | 'yellow' | 'red' {
    const scanSeverity = scanResult.severity;

    // Start with scan severity
    let overallSeverity = scanSeverity;

    // Escalate based on red findings count
    if (findingsAnalysis.red_count > 0) {
      // Any red finding pushes severity to red
      overallSeverity = Severity.RED;
    }
    // Check for mixed severities
    else if (findingsAnalysis.yellow_count >= this.rules.severityThresholds.maxGreenYellowMixed) {
      // Too many yellow findings - escalate to yellow or red
      overallSeverity = Severity.YELLOW;
    }
    // Apply trend adjustments
    else if (trendData && trendData.type === TrendType.DECLINE) {
      // Declining trend - escalate severity
      if (overallSeverity === Severity.GREEN) {
        overallSeverity = Severity.YELLOW;
      } else if (overallSeverity === Severity.YELLOW) {
        overallSeverity = Severity.RED;
      }
    }
    // Check for critical conditions regardless of count
    else {
      const hasCriticalCondition = scanResult.findings.some(finding =>
        this.isCriticalCondition(finding)
      );

      if (hasCriticalCondition) {
        overallSeverity = Severity.RED;
      }
    }

    return overallSeverity;
  }

  /**
   * Check if a finding represents a critical condition
   */
  private isCriticalCondition(finding: Finding): boolean {
    const criticalKeywords = [
      'trauma', 'bleeding', 'hemorrhage', 'fracture', 'emergency',
      'unable to walk', 'paralysis', 'severe', 'rupture', 'perforation'
    ];

    const condition = finding.condition.toLowerCase();
    return criticalKeywords.some(keyword => condition.includes(keyword)) ||
           finding.severity === Severity.RED;
  }

  /**
   * Determine the urgency level based on severity and findings
   */
  private determineUrgencyLevel(
    severity: 'green' | 'yellow' | 'red',
    findingsAnalysis: FindingsAnalysis
  ): UrgencyLevel {
    switch (severity) {
      case Severity.RED:
        // Check for emergency conditions
        if (findingsAnalysis.red_count > 0) {
          const hasEmergencyFinding = findingsAnalysis.by_category.eye.red > 0 ||
                                       findingsAnalysis.by_category.gait.red > 0;
          return hasEmergencyFinding ? UrgencyLevel.EMERGENCY : UrgencyLevel.URGENT;
        }
        return UrgencyLevel.URGENT;

      case Severity.YELLOW:
        return UrgencyLevel.ROUTINE;

      case Severity.GREEN:
      default:
        // Check if there are any yellow findings that need monitoring
        if (findingsAnalysis.yellow_count > 0) {
          return UrgencyLevel.MONITOR;
        }
        return UrgencyLevel.MONITOR;
    }
  }

  // --------------------------------------------------------------------------
  // Specific Actions Generation
  // --------------------------------------------------------------------------

  /**
   * Generate specific actions for each finding
   */
  private generateSpecificActions(
    findings: Finding[],
    scanType: ScanType
  ): SpecificAction[] {
    const specificActions: SpecificAction[] = [];

    for (const finding of findings) {
      const category = this.determineFindingCategory(finding);
      const recommendation = this.getRecommendationForFinding(finding, category, scanType);

      specificActions.push({
        finding_id: finding.id,
        action: recommendation.primaryAction,
        severity: finding.severity,
        category: category || undefined,
        condition: finding.condition
      });
    }

    return specificActions;
  }

  /**
   * Get recommendation for a specific finding using rule matching
   */
  private getRecommendationForFinding(
    finding: Finding,
    category: FindingCategory | null,
    scanType: ScanType
  ): { primaryAction: string; secondaryActions?: string[] } {
    // If we couldn't determine category, use scanType as fallback
    const targetCategory = category || this.scanTypeToCategory(scanType);

    // Find matching rule for this category
    const categoryRules = this.rules.categoryRules.find(
      cr => cr.category === targetCategory
    );

    if (!categoryRules) {
      return {
        primaryAction: 'Consult veterinarian for evaluation',
        secondaryActions: ['Monitor for changes', 'Document symptoms']
      };
    }

    // Find rule that matches the finding condition
    const condition = finding.condition.toLowerCase();

    for (const rule of categoryRules.rules) {
      const regex = new RegExp(rule.condition, 'i');
      if (regex.test(condition)) {
        return {
          primaryAction: rule.recommendation.primaryAction,
          secondaryActions: rule.recommendation.secondaryActions
        };
      }
    }

    // No matching rule - use severity-based default
    return this.getDefaultRecommendationForSeverity(finding.severity);
  }

  /**
   * Map ScanType to FindingCategory
   */
  private scanTypeToCategory(scanType: ScanType): FindingCategory {
    const mapping: Record<ScanType, FindingCategory> = {
      [ScanType.EYE]: FindingCategory.EYE,
      [ScanType.SKIN]: FindingCategory.SKIN,
      [ScanType.TEETH]: FindingCategory.TEETH,
      [ScanType.GAIT]: FindingCategory.GAIT,
      [ScanType.MULTI]: FindingCategory.SKIN // Default to skin for multi
    };

    return mapping[scanType] || FindingCategory.SKIN;
  }

  /**
   * Get default recommendation based on severity when no rule matches
   */
  private getDefaultRecommendationForSeverity(
    severity: Severity
  ): { primaryAction: string; secondaryActions?: string[] } {
    switch (severity) {
      case Severity.RED:
        return {
          primaryAction: 'Seek veterinary care immediately',
          secondaryActions: ['Document all symptoms', 'Monitor for changes']
        };
      case Severity.YELLOW:
        return {
          primaryAction: 'Schedule veterinary visit within 2 weeks',
          secondaryActions: ['Monitor condition at home', 'Note any changes']
        };
      case Severity.GREEN:
      default:
        return {
          primaryAction: 'Continue routine monitoring',
          secondaryActions: ['Maintain regular check-ups']
        };
    }
  }

  // --------------------------------------------------------------------------
  // Confidence Scoring
  // --------------------------------------------------------------------------

  /**
   * Calculate overall confidence score from all findings
   */
  private calculateConfidenceScore(findings: Finding[]): number {
    if (findings.length === 0) {
      return 0;
    }

    // Calculate average confidence (0-100 scale)
    const totalConfidence = findings.reduce((sum, finding) => {
      return sum + (finding.confidence * 100);
    }, 0);

    const averageConfidence = totalConfidence / findings.length;

    // Round to 2 decimal places
    return Math.round(averageConfidence * 100) / 100;
  }

  // --------------------------------------------------------------------------
  // Risk Factors Generation
  // --------------------------------------------------------------------------

  /**
   * Generate risk factors based on pet profile and findings
   */
  private generateRiskFactors(
    petProfile: PetProfile,
    findingsAnalysis: FindingsAnalysis
  ): string[] {
    const riskFactors: string[] = [];

    // Evaluate pet-specific risk factor rules
    for (const rule of this.rules.riskFactors) {
      try {
        if (rule.condition(petProfile)) {
          riskFactors.push(rule.factor);

          // If risk factor elevates concern, potentially adjust recommendation
          if (rule.impact === 'elevate') {
            // This is handled in urgency determination
          }
        }
      } catch (error) {
        console.warn('Error evaluating risk factor rule:', error);
      }
    }

    // Add findings-based risk factors
    if (findingsAnalysis.red_count > 1) {
      riskFactors.push(`Multiple severe findings detected (${findingsAnalysis.red_count})`);
    }

    if (findingsAnalysis.yellow_count > 3) {
      riskFactors.push(`Multiple moderate findings detected (${findingsAnalysis.yellow_count})`);
    }

    return riskFactors;
  }

  // --------------------------------------------------------------------------
  // Trend-Based Adjustments
  // --------------------------------------------------------------------------

  /**
   * Apply trend-based adjustments to urgency and risk factors
   */
  private applyTrendAdjustments(
    trendData: any,
    currentUrgency: UrgencyLevel
  ): { urgencyLevel: UrgencyLevel; riskFactors: string[] } {
    const riskFactors: string[] = [];
    let adjustedUrgency = currentUrgency;

    if (!trendData) {
      return { urgencyLevel: adjustedUrgency, riskFactors };
    }

    switch (trendData.type) {
      case TrendType.IMPROVEMENT:
        riskFactors.push('Condition showing improvement - continue current approach');
        // May downgrade urgency if not at monitor level
        if (adjustedUrgency === UrgencyLevel.URGENT) {
          adjustedUrgency = UrgencyLevel.ROUTINE;
        }
        break;

      case TrendType.DECLINE:
        riskFactors.push('Condition worsening - escalated monitoring recommended');
        // Escalate urgency
        if (adjustedUrgency === UrgencyLevel.MONITOR) {
          adjustedUrgency = UrgencyLevel.ROUTINE;
        } else if (adjustedUrgency === UrgencyLevel.ROUTINE) {
          adjustedUrgency = UrgencyLevel.URGENT;
        }
        break;

      case TrendType.STABLE:
        riskFactors.push('Condition stable - maintain routine care');
        // No change to urgency
        break;
    }

    return { urgencyLevel: adjustedUrgency, riskFactors };
  }

  // --------------------------------------------------------------------------
  // Recommendation Text Generation
  // --------------------------------------------------------------------------

  /**
   * Generate primary recommendation text
   */
  private generatePrimaryRecommendation(
    urgencyLevel: UrgencyLevel,
    findingsAnalysis: FindingsAnalysis,
    specificActions: SpecificAction[]
  ): string {
    const timeframe = DEFAULT_URGENCY_TIMEFRAMES[urgencyLevel];

    // Count issues by category
    const hasEyeIssues = findingsAnalysis.by_category.eye.total > 0;
    const hasSkinIssues = findingsAnalysis.by_category.skin.total > 0;
    const hasTeethIssues = findingsAnalysis.by_category.teeth.total > 0;
    const hasGaitIssues = findingsAnalysis.by_category.gait.total > 0;

    const issueCategories = [];
    if (hasEyeIssues) issueCategories.push('eye');
    if (hasSkinIssues) issueCategories.push('skin');
    if (hasTeethIssues) issueCategories.push('dental');
    if (hasGaitIssues) issueCategories.push('mobility');

    switch (urgencyLevel) {
      case UrgencyLevel.EMERGENCY:
        return `Seek immediate emergency veterinary care for ${issueCategories.join(', ') || 'detected conditions'}. This requires immediate attention to prevent serious complications.`;

      case UrgencyLevel.URGENT:
        return `Schedule urgent veterinary care within 24-48 hours for ${issueCategories.join(', ') || 'detected conditions'}. Prompt treatment is recommended.`;

      case UrgencyLevel.ROUTINE:
        return `Schedule routine veterinary visit within 2 weeks for ${issueCategories.join(', ') || 'detected conditions'}. Regular monitoring is advised.`;

      case UrgencyLevel.MONITOR:
      default:
        if (findingsAnalysis.total_findings === 0) {
          return 'No significant findings detected. Continue regular health monitoring and routine check-ups.';
        }
        return `Monitor ${issueCategories.join(', ') || 'detected conditions'} at home. Follow secondary recommendations and contact veterinarian if symptoms worsen.`;
    }
  }

  /**
   * Generate secondary recommendations
   */
  private generateSecondaryRecommendations(
    urgencyLevel: UrgencyLevel,
    specificActions: SpecificAction[],
    riskFactors: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Add specific actions for each finding
    for (const action of specificActions) {
      if (!recommendations.includes(action.action)) {
        recommendations.push(action.action);
      }
    }

    // Add context-specific recommendations
    switch (urgencyLevel) {
      case UrgencyLevel.EMERGENCY:
        recommendations.push('Call ahead to emergency clinic to inform them of your arrival');
        recommendations.push('Bring any relevant medical records or medications');
        break;

      case UrgencyLevel.URGENT:
        recommendations.push('Document any changes in symptoms before appointment');
        recommendations.push('Keep pet calm and comfortable');
        break;

      case UrgencyLevel.ROUTINE:
        recommendations.push('Document symptoms with photos if helpful');
        recommendations.push('Monitor for any changes in behavior or appetite');
        break;

      case UrgencyLevel.MONITOR:
        recommendations.push('Set up regular monitoring schedule');
        recommendations.push('Track any changes in condition');
        recommendations.push('Maintain notes for future reference');
        break;
    }

    return recommendations;
  }

  /**
   * Generate emergency warning message
   */
  private generateEmergencyWarning(
    findingsAnalysis: FindingsAnalysis,
    petProfile: PetProfile
  ): string {
    const warnings: string[] = [];

    warnings.push('⚠️ EMERGENCY SITUATION DETECTED');

    // Add specific warnings based on findings
    if (findingsAnalysis.by_category.eye.red > 0) {
      warnings.push('Eye emergencies can lead to permanent vision loss - act immediately.');
    }
    if (findingsAnalysis.by_category.gait.red > 0) {
      warnings.push('Mobility emergencies require immediate attention to prevent further injury.');
    }
    if (findingsAnalysis.by_category.teeth.red > 0) {
      warnings.push('Oral trauma can cause severe pain and infection.');
    }

    // Add pet-specific warnings
    const age = this.calculateAgeInYears(petProfile.date_of_birth);
    if (age !== null && age < 1) {
      warnings.push('Young pets deteriorate quickly - do not delay.');
    } else if (age !== null && age >= 10) {
      warnings.push('Senior pets may have reduced resilience - prompt care essential.');
    }

    warnings.push('Contact your nearest emergency veterinary clinic or animal hospital immediately.');

    return warnings.join(' ');
  }

  /**
   * Get timeframe for urgency level
   */
  private getTimeframe(urgencyLevel: UrgencyLevel): string {
    return DEFAULT_URGENCY_TIMEFRAMES[urgencyLevel];
  }

  /**
   * Determine if veterinary consultation is required
   */
  private requiresVetConsultation(
    urgencyLevel: UrgencyLevel,
    confidenceScore: number
  ): boolean {
    // Always require vet consultation for urgent/emergency cases
    if (urgencyLevel === UrgencyLevel.URGENT || urgencyLevel === UrgencyLevel.EMERGENCY) {
      return true;
    }

    // Require vet consultation for low confidence
    if (confidenceScore < CONFIDENCE_THRESHOLDS.MEDIUM) {
      return true;
    }

    // Medium confidence cases should also have vet consultation suggested
    if (confidenceScore < CONFIDENCE_THRESHOLDS.HIGH) {
      return true;
    }

    // Routine/monitor with high confidence - still recommended but not required
    return true;
  }

  // --------------------------------------------------------------------------
  // Utility Functions
  // --------------------------------------------------------------------------

  /**
   * Calculate pet age in years from date of birth
   */
  private calculateAgeInYears(dateOfBirth?: string): number | null {
    if (!dateOfBirth) return null;

    const birth = new Date(dateOfBirth);
    const now = new Date();

    if (isNaN(birth.getTime())) return null;

    const ageInMs = now.getTime() - birth.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);

    return ageInYears;
  }

  /**
   * Validate the rule configuration
   */
  private validateConfiguration(): void {
    if (!validateRules(this.rules)) {
      throw new Error('Invalid recommendation rules configuration');
    }
  }

  // --------------------------------------------------------------------------
  // Public API Methods
  // --------------------------------------------------------------------------

  /**
   * Validate current rules
   */
  validateRules(): boolean {
    return validateRules(this.rules);
  }

  /**
   * Get current rules
   */
  getRules(): RecommendationRules {
    return { ...this.rules };
  }

  /**
   * Update rules (for testing or configuration)
   */
  updateRules(newRules: RecommendationRules): void {
    if (!validateRules(newRules)) {
      throw new Error('Invalid recommendation rules configuration');
    }
    this.rules = newRules;
  }
}

// ----------------------------------------------------------------------------
// Export Singleton Instance
// ----------------------------------------------------------------------------

export const vetRecommendationService = new VetRecommendationService();

// ----------------------------------------------------------------------------
// Default Export
// ----------------------------------------------------------------------------

export default VetRecommendationService;

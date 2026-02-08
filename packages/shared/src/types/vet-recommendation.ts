// ============================================================================
// Vet Recommendation Engine Types
// ============================================================================

import { Severity, ScanType, Finding, ScanResult, PetProfile, TrendData } from '../index';

// ----------------------------------------------------------------------------
// Enums
// ----------------------------------------------------------------------------

export enum UrgencyLevel {
  MONITOR = 'monitor',
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

export enum FindingCategory {
  EYE = 'eye',
  SKIN = 'skin',
  TEETH = 'teeth',
  GAIT = 'gait',
}

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// ----------------------------------------------------------------------------
// Recommendation Types
// ----------------------------------------------------------------------------

export interface VetRecommendation {
  overall_severity: 'green' | 'yellow' | 'red';
  urgency_level: UrgencyLevel;
  timeframe: string;
  primary_recommendation: string;
  secondary_recommendations?: string[];
  findings_analysis: FindingsAnalysis;
  specific_actions: SpecificAction[];
  risk_factors: string[];
  confidence_score: number;
  escalation_path: string;
  vet_consultation_required: boolean;
  emergency_warning?: string;
}

export interface FindingsAnalysis {
  total_findings: number;
  green_count: number;
  yellow_count: number;
  red_count: number;
  by_category: Record<FindingCategory, {
    total: number;
    green: number;
    yellow: number;
    red: number;
  }>;
}

export interface SpecificAction {
  finding_id: string;
  action: string;
  severity: Severity;
  category?: FindingCategory;
  condition: string;
}

// ----------------------------------------------------------------------------
// Recommendation Engine Input
// ----------------------------------------------------------------------------

export interface RecommendationInput {
  scanResult: ScanResult;
  petProfile: PetProfile;
  previousScans?: ScanResult[];
  trendData?: TrendData;
}

// ----------------------------------------------------------------------------
// Rule Configuration Types
// ----------------------------------------------------------------------------

export interface SeverityRule {
  condition: string;
  minSeverity: Severity;
  recommendation: {
    urgency: UrgencyLevel;
    timeframe: string;
    primaryAction: string;
    secondaryActions?: string[];
  };
}

export interface CategoryRule {
  category: FindingCategory;
  rules: SeverityRule[];
}

export interface ConfidenceRule {
  minConfidence: number;
  maxConfidence: number;
  message: string;
  requiresVetConfirmation: boolean;
}

export interface RiskFactorRule {
  condition: (pet: PetProfile) => boolean;
  factor: string;
  impact: 'elevate' | 'maintain' | 'reduce';
}

export interface RecommendationRules {
  categoryRules: CategoryRule[];
  confidenceRules: ConfidenceRule[];
  riskFactors: RiskFactorRule[];
  escalationPaths: Record<UrgencyLevel, string>;
  severityThresholds: {
    maxGreenYellowMixed: number; // max red findings before upgrading to red
    maxYellowRedMixed: number; // max findings before upgrading
  };
}

// ----------------------------------------------------------------------------
// Service Interface
// ----------------------------------------------------------------------------

export interface IVetRecommendationService {
  generateRecommendation(input: RecommendationInput): Promise<VetRecommendation>;
  generateBatchRecommendations(inputs: RecommendationInput[]): Promise<VetRecommendation[]>;
  validateRules(): boolean;
  getRules(): RecommendationRules;
}

// ----------------------------------------------------------------------------
// Database Types (for schema mapping)
// ----------------------------------------------------------------------------

export interface VetRecommendationDBRecord {
  id: string;
  scan_result_id: string;
  overall_severity: 'green' | 'yellow' | 'red';
  urgency_level: UrgencyLevel;
  timeframe: string;
  primary_recommendation: string;
  secondary_recommendations: string[];
  findings_analysis: FindingsAnalysis;
  specific_actions: SpecificAction[];
  risk_factors: string[];
  confidence_score: number;
  escalation_path: string;
  vet_consultation_required: boolean;
  emergency_warning?: string;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

export const DEFAULT_URGENCY_TIMEFRAMES: Record<UrgencyLevel, string> = {
  [UrgencyLevel.MONITOR]: 'Monitor at home',
  [UrgencyLevel.ROUTINE]: 'Within 2 weeks',
  [UrgencyLevel.URGENT]: 'Within 24-48 hours',
  [UrgencyLevel.EMERGENCY]: 'Immediately',
} as const;

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 90,
  MEDIUM: 70,
} as const;

export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  [FindingCategory.EYE]: 'Eye',
  [FindingCategory.SKIN]: 'Skin',
  [FindingCategory.TEETH]: 'Teeth',
  [FindingCategory.GAIT]: 'Gait',
} as const;

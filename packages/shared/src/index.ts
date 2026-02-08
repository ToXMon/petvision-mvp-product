// ============================================================================
// PetVision Shared Types - Scan Results & Health History Timeline
// ============================================================================

// ----------------------------------------------------------------------------
// Enums
// ----------------------------------------------------------------------------

export enum Species {
  DOG = 'dog',
  CAT = 'cat',
  RABBIT = 'rabbit',
  BIRD = 'bird',
  OTHER = 'other',
}

export enum ScanType {
  EYE = 'eye',
  SKIN = 'skin',
  TEETH = 'teeth',
  GAIT = 'gait',
  MULTI = 'multi',
}

export enum Severity {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}

export enum TrendType {
  IMPROVEMENT = 'improvement',
  DECLINE = 'decline',
  STABLE = 'stable',
}

export enum DateRangeFilter {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_6_MONTHS = 'last_6_months',
  ALL_TIME = 'all_time',
}

export enum SortOption {
  DATE_NEWEST = 'date_newest',
  DATE_OLDEST = 'date_oldest',
  SEVERITY_HIGH = 'severity_high',
  SEVERITY_LOW = 'severity_low',
}

// ----------------------------------------------------------------------------
// Core Types
// ----------------------------------------------------------------------------

export interface Finding {
  id: string;
  condition: string;
  description: string;
  confidence: number; // 0-1
  severity: Severity;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ScanResult {
  id: string;
  pet_id: string;
  scan_type: ScanType;
  severity: Severity;
  findings: Finding[];
  image_url: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface PetProfile {
  id: string;
  name: string;
  species: Species;
  breed?: string;
  date_of_birth?: string;
  avatar_url?: string;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Timeline Types
// ----------------------------------------------------------------------------

export interface TimelineCardData {
  scan: ScanResult;
  trend?: TrendData;
  isExpanded: boolean;
}

export interface TrendData {
  type: TrendType;
  message: string;
  percentageChange?: number;
  comparedScanId?: string;
  severityChange?: {
    from: Severity;
    to: Severity;
  };
  findingsChange?: {
    added: number;
    removed: number;
    improved: number;
    worsened: number;
  };
}

export interface TimelineFilter {
  scanTypes?: ScanType[];
  severities?: Severity[];
  dateRange?: DateRangeFilter;
  startDate?: string;
  endDate?: string;
  sortBy?: SortOption;
}

export interface TimelineState {
  scans: TimelineCardData[];
  filteredScans: TimelineCardData[];
  loading: boolean;
  error?: string;
  filters: TimelineFilter;
  hasMore: boolean;
  totalCount: number;
}

// ----------------------------------------------------------------------------
// Comparison Types
// ----------------------------------------------------------------------------

export interface ScanComparison {
  beforeScan: ScanResult;
  afterScan: ScanResult;
  comparison: {
    timeDifference: {
      days: number;
      hours: number;
    };
    severityChange?: {
      from: Severity;
      to: Severity;
      improved: boolean;
    };
    findingsComparison: {
      newFindings: Finding[];
      resolvedFindings: Finding[];
      persistentFindings: Finding[];
      worsenedFindings: Finding[];
    };
    trend: TrendData;
  };
}

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'improved' | 'worsened' | 'new' | 'resolved';
  findingId?: string;
}

// ----------------------------------------------------------------------------
// UI Component Props Types
// ----------------------------------------------------------------------------

export interface TimelineProps {
  petId: string;
  onScanPress?: (scanId: string) => void;
  onComparePress?: (beforeScanId: string, afterScanId: string) => void;
  showFilters?: boolean;
  initialDateRange?: DateRangeFilter;
}

export interface TimelineCardProps {
  data: TimelineCardData;
  onPress?: () => void;
  onExpand?: () => void;
  onCompare?: () => void;
  isSelected?: boolean;
  isComparing?: boolean;
}

export interface TimelineTrendProps {
  trend: TrendData;
  compact?: boolean;
}

export interface TimelineFiltersProps {
  filters: TimelineFilter;
  onFiltersChange: (filters: TimelineFilter) => void;
  scanCounts: Record<ScanType, number>;
  severityCounts: Record<Severity, number>;
}

export interface ScanComparisonProps {
  comparison: ScanComparison;
  onClose: () => void;
}

export interface TimelineEmptyStateProps {
  onScanNow?: () => void;
  scanType?: ScanType;
}

// ----------------------------------------------------------------------------
// Service Types
// ----------------------------------------------------------------------------

export interface TimelineServiceResponse {
  scans: ScanResult[];
  total: number;
  hasMore: boolean;
}

export interface TrendCalculationOptions {
  compareWithPrevious?: boolean;
  compareWithBaseline?: boolean;
  baselineScanId?: string;
}

export interface ComparisonServiceOptions {
  includeDiffRegions?: boolean;
  diffThreshold?: number;
}

// ----------------------------------------------------------------------------
// Color Constants
// ----------------------------------------------------------------------------

export const SeverityColors = {
  [Severity.GREEN]: '#10B981',
  [Severity.YELLOW]: '#F59E0B',
  [Severity.RED]: '#EF4444',
} as const;

export const SeverityLabels = {
  [Severity.GREEN]: 'Healthy',
  [Severity.YELLOW]: 'Attention Needed',
  [Severity.RED]: 'Concerning',
} as const;

export const ScanTypeLabels = {
  [ScanType.EYE]: 'Eye',
  [ScanType.SKIN]: 'Skin',
  [ScanType.TEETH]: 'Teeth',
  [ScanType.GAIT]: 'Gait',
  [ScanType.MULTI]: 'Multi',
} as const;

export const TrendTypeIcons = {
  [TrendType.IMPROVEMENT]: '↑',
  [TrendType.DECLINE]: '↓',
  [TrendType.STABLE]: '→',
} as const;

export const TrendColors = {
  [TrendType.IMPROVEMENT]: '#10B981',
  [TrendType.DECLINE]: '#EF4444',
  [TrendType.STABLE]: '#6B7280',
} as const;

// ----------------------------------------------------------------------------
// Services Export
// ----------------------------------------------------------------------------

export { TimelineService } from './services/TimelineService';
export { ComparisonService } from './services/ComparisonService';

// ----------------------------------------------------------------------------
// PDF Report Generation Types
// ----------------------------------------------------------------------------

export * from './types/pdf';

export { ReportService } from './services/ReportService';
export { QRCodeService } from './services/QRCodeService';

// ----------------------------------------------------------------------------
// Vet Recommendation Engine Types & Service
// ----------------------------------------------------------------------------

export * from './types/vet-recommendation';
export * from './types/recommendation-rules';
export { VetRecommendationService, vetRecommendationService } from './services/VetRecommendationService';

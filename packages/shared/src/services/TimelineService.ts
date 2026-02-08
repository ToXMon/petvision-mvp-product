// ============================================================================
// TimelineService - Trend Detection & Timeline Management
// ============================================================================

import {
  ScanResult,
  TimelineFilter,
  TrendData,
  TrendType,
  DateRangeFilter,
  SortOption,
  ScanType,
  Severity,
  TrendCalculationOptions,
  TimelineCardData,
  SeverityColors,
  TrendTypeIcons,
  TrendColors,
} from '../index';

// ----------------------------------------------------------------------------
// Severity Scoring
// ----------------------------------------------------------------------------

const SEVERITY_SCORE: Record<Severity, number> = {
  [Severity.GREEN]: 0,
  [Severity.YELLOW]: 1,
  [Severity.RED]: 2,
};

// ----------------------------------------------------------------------------
// Date Filter Utilities
// ----------------------------------------------------------------------------

function getDateRange(range: DateRangeFilter): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case DateRangeFilter.LAST_7_DAYS:
      start.setDate(start.getDate() - 7);
      break;
    case DateRangeFilter.LAST_30_DAYS:
      start.setDate(start.getDate() - 30);
      break;
    case DateRangeFilter.LAST_6_MONTHS:
      start.setMonth(start.getMonth() - 6);
      break;
    case DateRangeFilter.ALL_TIME:
      start.setFullYear(start.getFullYear() - 100);
      break;
  }

  return { start, end };
}

function isInDateRange(scanDate: string, range: DateRangeFilter): boolean {
  const { start, end } = getDateRange(range);
  const date = new Date(scanDate);
  return date >= start && date <= end;
}

// ----------------------------------------------------------------------------
// Trend Calculation
// ----------------------------------------------------------------------------

function calculateTrend(
  currentScan: ScanResult,
  previousScan?: ScanResult,
  options?: TrendCalculationOptions
): TrendData | undefined {
  if (!previousScan) return undefined;

  // Only compare same scan types for meaningful trends
  if (currentScan.scan_type !== previousScan.scan_type) {
    return undefined;
  }

  const currentSeverityScore = SEVERITY_SCORE[currentScan.severity];
  const previousSeverityScore = SEVERITY_SCORE[previousScan.severity];

  const severityChange =
    currentSeverityScore !== previousSeverityScore
      ? {
          from: previousScan.severity,
          to: currentScan.severity,
        }
      : undefined;

  // Calculate findings changes
  const currentFindings = currentScan.findings;
  const previousFindings = previousScan.findings;

  const findingsChange = {
    added: currentFindings.filter(
      (f) => !previousFindings.some((pf) => pf.condition === f.condition)
    ).length,
    removed: previousFindings.filter(
      (pf) => !currentFindings.some((f) => f.condition === pf.condition)
    ).length,
    improved: currentFindings.filter((f) => {
      const previous = previousFindings.find((pf) => pf.condition === f.condition);
      return previous && SEVERITY_SCORE[f.severity] < SEVERITY_SCORE[previous.severity];
    }).length,
    worsened: currentFindings.filter((f) => {
      const previous = previousFindings.find((pf) => pf.condition === f.condition);
      return previous && SEVERITY_SCORE[f.severity] > SEVERITY_SCORE[previous.severity];
    }).length,
  };

  // Calculate percentage change based on findings count and severity
  const previousTotalScore =
    previousFindings.reduce((sum, f) => sum + SEVERITY_SCORE[f.severity], 0) +
    previousSeverityScore;
  const currentTotalScore =
    currentFindings.reduce((sum, f) => sum + SEVERITY_SCORE[f.severity], 0) +
    currentSeverityScore;

  const percentageChange =
    previousTotalScore > 0
      ? ((previousTotalScore - currentTotalScore) / previousTotalScore) * 100
      : 0;

  // Determine trend type
  let trendType: TrendType;
  if (currentSeverityScore < previousSeverityScore) {
    trendType = TrendType.IMPROVEMENT;
  } else if (currentSeverityScore > previousSeverityScore) {
    trendType = TrendType.DECLINE;
  } else if (findingsChange.improved > findingsChange.worsened) {
    trendType = TrendType.IMPROVEMENT;
  } else if (findingsChange.worsened > findingsChange.improved) {
    trendType = TrendType.DECLINE;
  } else {
    trendType = TrendType.STABLE;
  }

  // Generate message
  const daysDiff = Math.floor(
    (new Date(currentScan.created_at).getTime() -
      new Date(previousScan.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  let message = '';
  if (trendType === TrendType.IMPROVEMENT) {
    const scanTypeLabel =
      currentScan.scan_type.charAt(0).toUpperCase() + currentScan.scan_type.slice(1);
    if (Math.abs(percentageChange) > 20) {
      message = `${scanTypeLabel} health improved ${Math.abs(Math.round(percentageChange))}% in ${daysDiff} days`;
    } else {
      message = `${scanTypeLabel} condition improved slightly`;
    }
  } else if (trendType === TrendType.DECLINE) {
    if (severityChange) {
      message = `Severity increased from ${severityChange.from} to ${severityChange.to}`;
      if (currentSeverityScore === 2) {
        message += ', seek vet care';
      }
    } else {
      message = `${
        findingsChange.worsened
      } finding(s) worsened, review recommended`;
    }
  } else {
    message = `No significant change from last scan`;
  }

  return {
    type: trendType,
    message,
    percentageChange: Math.round(percentageChange),
    comparedScanId: previousScan.id,
    severityChange,
    findingsChange,
  };
}

// ----------------------------------------------------------------------------
// Filtering & Sorting
// ----------------------------------------------------------------------------

function applyFilters(
  scans: ScanResult[],
  filters: TimelineFilter
): ScanResult[] {
  let filtered = [...scans];

  // Filter by scan type
  if (filters.scanTypes && filters.scanTypes.length > 0) {
    filtered = filtered.filter((scan) => filters.scanTypes!.includes(scan.scan_type));
  }

  // Filter by severity
  if (filters.severities && filters.severities.length > 0) {
    filtered = filtered.filter((scan) => filters.severities!.includes(scan.severity));
  }

  // Filter by date range
  if (filters.dateRange) {
    filtered = filtered.filter((scan) => isInDateRange(scan.created_at, filters.dateRange!));
  } else if (filters.startDate && filters.endDate) {
    filtered = filtered.filter((scan) => {
      const date = new Date(scan.created_at);
      return date >= new Date(filters.startDate!) && date <= new Date(filters.endDate!);
    });
  }

  // Sort
  switch (filters.sortBy) {
    case SortOption.DATE_NEWEST:
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case SortOption.DATE_OLDEST:
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case SortOption.SEVERITY_HIGH:
      filtered.sort((a, b) => SEVERITY_SCORE[b.severity] - SEVERITY_SCORE[a.severity]);
      break;
    case SortOption.SEVERITY_LOW:
      filtered.sort((a, b) => SEVERITY_SCORE[a.severity] - SEVERITY_SCORE[b.severity]);
      break;
  }

  return filtered;
}

// ----------------------------------------------------------------------------
// Main Service Class
// ----------------------------------------------------------------------------

export class TimelineService {
  /**
   * Build timeline data with trends for display
   */
  static buildTimeline(
    scans: ScanResult[],
    filters?: TimelineFilter,
    options?: TrendCalculationOptions
  ): TimelineCardData[] {
    let filteredScans = filters ? applyFilters(scans, filters) : [...scans];

    // Sort by date descending (newest first) for trend calculation
    filteredScans.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return filteredScans.map((scan, index) => {
      // Find previous scan of same type for trend calculation
      const previousScan = filteredScans
        .slice(index + 1)
        .find((s) => s.scan_type === scan.scan_type);

      const trend = calculateTrend(scan, previousScan, options);

      return {
        scan,
        trend,
        isExpanded: false,
      };
    });
  }

  /**
   * Calculate trend between two specific scans
   */
  static calculateTrend(
    currentScan: ScanResult,
    previousScan: ScanResult,
    options?: TrendCalculationOptions
  ): TrendData {
    return calculateTrend(currentScan, previousScan, options)!;
  }

  /**
   * Get scan counts by type
   */
  static getScanCounts(scans: ScanResult[]): Record<ScanType, number> {
    return scans.reduce(
      (acc, scan) => {
        acc[scan.scan_type] = (acc[scan.scan_type] || 0) + 1;
        return acc;
      },
      {} as Record<ScanType, number>
    );
  }

  /**
   * Get severity counts
   */
  static getSeverityCounts(scans: ScanResult[]): Record<Severity, number> {
    return scans.reduce(
      (acc, scan) => {
        acc[scan.severity] = (acc[scan.severity] || 0) + 1;
        return acc;
      },
      {} as Record<Severity, number>
    );
  }

  /**
   * Get most recent scan by type
   */
  static getMostRecentScan(scans: ScanResult[], scanType: ScanType): ScanResult | undefined {
    return scans
      .filter((s) => s.scan_type === scanType)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }

  /**
   * Get timeline statistics
   */
  static getTimelineStats(scans: ScanResult[]) {
    const scanCounts = this.getScanCounts(scans);
    const severityCounts = this.getSeverityCounts(scans);
    const totalFindings = scans.reduce((sum, scan) => sum + scan.findings.length, 0);
    const averageFindings = scans.length > 0 ? totalFindings / scans.length : 0;

    return {
      totalScans: scans.length,
      scanCounts,
      severityCounts,
      totalFindings,
      averageFindings,
      lastScanDate: scans.length > 0 ? scans[0].created_at : undefined,
    };
  }
}

// Export utilities for use in components
export { SeverityColors, TrendTypeIcons, TrendColors };
export { getDateRange, isInDateRange };

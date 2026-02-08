// ============================================================================
// ComparisonService - Scan Comparison & Diff Analysis
// ============================================================================

import {
  ScanResult,
  ScanComparison,
  TrendData,
  TrendType,
  Finding,
  DiffRegion,
  Severity,
  SEVERITY_SCORE,
  ComparisonServiceOptions,
} from '../index';

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function calculateTimeDifference(beforeDate: string, afterDate: string) {
  const before = new Date(beforeDate);
  const after = new Date(afterDate);
  const diffMs = after.getTime() - before.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days: diffDays, hours: diffHours };
}

function compareFindings(beforeFindings: Finding[], afterFindings: Finding[]) {
  // New findings: conditions that exist in after but not in before
  const newFindings = afterFindings.filter(
    (afterFinding) =>
      !beforeFindings.some((beforeFinding) => beforeFinding.condition === afterFinding.condition)
  );

  // Resolved findings: conditions that exist in before but not in after
  const resolvedFindings = beforeFindings.filter(
    (beforeFinding) =>
      !afterFindings.some((afterFinding) => afterFinding.condition === beforeFinding.condition)
  );

  // Persistent findings: conditions that exist in both
  const persistentFindings = afterFindings.filter((afterFinding) =>
    beforeFindings.some((beforeFinding) => beforeFinding.condition === afterFinding.condition)
  );

  // Worsened findings: persistent findings with increased severity
  const worsenedFindings = persistentFindings.filter((afterFinding) => {
    const beforeFinding = beforeFindings.find(
      (bf) => bf.condition === afterFinding.condition
    );
    return (
      beforeFinding &&
      SEVERITY_SCORE[afterFinding.severity] > SEVERITY_SCORE[beforeFinding.severity]
    );
  });

  // Improved findings: persistent findings with decreased severity
  const improvedFindings = persistentFindings.filter((afterFinding) => {
    const beforeFinding = beforeFindings.find(
      (bf) => bf.condition === afterFinding.condition
    );
    return (
      beforeFinding &&
      SEVERITY_SCORE[afterFinding.severity] < SEVERITY_SCORE[beforeFinding.severity]
    );
  });

  return {
    newFindings,
    resolvedFindings,
    persistentFindings,
    worsenedFindings,
    improvedFindings,
  };
}

function generateComparisonTrend(
  beforeScan: ScanResult,
  afterScan: ScanResult,
  findingsComparison: ReturnType<typeof compareFindings>
): TrendData {
  const beforeSeverityScore = SEVERITY_SCORE[beforeScan.severity];
  const afterSeverityScore = SEVERITY_SCORE[afterScan.severity];

  const severityChange =
    beforeSeverityScore !== afterSeverityScore
      ? {
          from: beforeScan.severity,
          to: afterScan.severity,
        }
      : undefined;

  const findingsChange = {
    added: findingsComparison.newFindings.length,
    removed: findingsComparison.resolvedFindings.length,
    improved: findingsComparison.improvedFindings.length,
    worsened: findingsComparison.worsenedFindings.length,
  };

  // Calculate overall trend
  let trendType: TrendType;
  if (afterSeverityScore < beforeSeverityScore) {
    trendType = TrendType.IMPROVEMENT;
  } else if (afterSeverityScore > beforeSeverityScore) {
    trendType = TrendType.DECLINE;
  } else if (findingsComparison.improvedFindings.length > findingsComparison.worsenedFindings.length) {
    trendType = TrendType.IMPROVEMENT;
  } else if (findingsComparison.worsenedFindings.length > findingsComparison.improvedFindings.length) {
    trendType = TrendType.DECLINE;
  } else {
    trendType = TrendType.STABLE;
  }

  const timeDiff = calculateTimeDifference(beforeScan.created_at, afterScan.created_at);
  let message = '';

  if (trendType === TrendType.IMPROVEMENT) {
    if (severityChange) {
      message = `Severity improved from ${severityChange.from} to ${severityChange.to}`;
    } else if (findingsComparison.improvedFindings.length > 0) {
      message = `${findingsComparison.improvedFindings.length} finding(s) improved`;
    } else {
      message = `Condition improved since ${timeDiff.days} days ago`;
    }
  } else if (trendType === TrendType.DECLINE) {
    if (severityChange) {
      message = `Severity increased from ${severityChange.from} to ${severityChange.to}`;
      if (afterSeverityScore === 2) {
        message += ', seek vet care';
      }
    } else if (findingsComparison.worsenedFindings.length > 0) {
      message = `${findingsComparison.worsenedFindings.length} finding(s) worsened`;
    } else {
      message = `${findingsComparison.newFindings.length} new finding(s) detected`;
    }
  } else {
    const netChange = findingsChange.added - findingsChange.removed;
    if (netChange === 0) {
      message = 'No significant change detected';
    } else if (netChange > 0) {
      message = `${netChange} new finding(s) detected`;
    } else {
      message = `${Math.abs(netChange)} finding(s) resolved`;
    }
  }

  // Calculate percentage change
  const beforeTotalScore =
    beforeScan.findings.reduce((sum, f) => sum + SEVERITY_SCORE[f.severity], 0) + beforeSeverityScore;
  const afterTotalScore =
    afterScan.findings.reduce((sum, f) => sum + SEVERITY_SCORE[f.severity], 0) + afterSeverityScore;
  const percentageChange =
    beforeTotalScore > 0 ? ((beforeTotalScore - afterTotalScore) / beforeTotalScore) * 100 : 0;

  return {
    type: trendType,
    message,
    percentageChange: Math.round(percentageChange),
    comparedScanId: beforeScan.id,
    severityChange,
    findingsChange,
  };
}

function generateDiffRegions(
  beforeScan: ScanResult,
  afterScan: ScanResult,
  findingsComparison: ReturnType<typeof compareFindings>,
  options?: ComparisonServiceOptions
): DiffRegion[] {
  const diffRegions: DiffRegion[] = [];

  // For worsened findings (red overlay)
  for (const finding of findingsComparison.worsenedFindings) {
    if (finding.location) {
      diffRegions.push({
        x: finding.location.x,
        y: finding.location.y,
        width: finding.location.width,
        height: finding.location.height,
        type: 'worsened',
        findingId: finding.id,
      });
    }
  }

  // For new findings (yellow/red overlay)
  for (const finding of findingsComparison.newFindings) {
    if (finding.location) {
      diffRegions.push({
        x: finding.location.x,
        y: finding.location.y,
        width: finding.location.width,
        height: finding.location.height,
        type: 'new',
        findingId: finding.id,
      });
    }
  }

  // For improved findings (green overlay)
  for (const finding of findingsComparison.improvedFindings) {
    if (finding.location) {
      diffRegions.push({
        x: finding.location.x,
        y: finding.location.y,
        width: finding.location.width,
        height: finding.location.height,
        type: 'improved',
        findingId: finding.id,
      });
    }
  }

  // For resolved findings (gray/faded overlay)
  for (const finding of findingsComparison.resolvedFindings) {
    if (finding.location) {
      diffRegions.push({
        x: finding.location.x,
        y: finding.location.y,
        width: finding.location.width,
        height: finding.location.height,
        type: 'resolved',
        findingId: finding.id,
      });
    }
  }

  return diffRegions;
}

// ----------------------------------------------------------------------------
// Main Service Class
// ----------------------------------------------------------------------------

export class ComparisonService {
  /**
   * Compare two scans and return comprehensive comparison data
   */
  static compareScans(
    beforeScan: ScanResult,
    afterScan: ScanResult,
    options?: ComparisonServiceOptions
  ): ScanComparison {
    const timeDifference = calculateTimeDifference(beforeScan.created_at, afterScan.created_at);

    const beforeSeverityScore = SEVERITY_SCORE[beforeScan.severity];
    const afterSeverityScore = SEVERITY_SCORE[afterScan.severity];

    const severityChange =
      beforeSeverityScore !== afterSeverityScore
        ? {
            from: beforeScan.severity,
            to: afterScan.severity,
            improved: afterSeverityScore < beforeSeverityScore,
          }
        : undefined;

    const findingsComparison = compareFindings(beforeScan.findings, afterScan.findings);

    const trend = generateComparisonTrend(beforeScan, afterScan, findingsComparison);

    return {
      beforeScan,
      afterScan,
      comparison: {
        timeDifference,
        severityChange,
        findingsComparison: {
          newFindings: findingsComparison.newFindings,
          resolvedFindings: findingsComparison.resolvedFindings,
          persistentFindings: findingsComparison.persistentFindings,
          worsenedFindings: findingsComparison.worsenedFindings,
        },
        trend,
      },
    };
  }

  /**
   * Generate diff regions for visual comparison overlay
   */
  static generateDiffRegions(
    beforeScan: ScanResult,
    afterScan: ScanResult,
    options?: ComparisonServiceOptions
  ): DiffRegion[] {
    const findingsComparison = compareFindings(beforeScan.findings, afterScan.findings);
    return generateDiffRegions(beforeScan, afterScan, findingsComparison, options);
  }

  /**
   * Get comparison summary text
   */
  static getComparisonSummary(comparison: ScanComparison): string {
    const { timeDifference, findingsComparison, severityChange, trend } = comparison.comparison;
    const parts: string[] = [];

    // Time elapsed
    if (timeDifference.days > 0) {
      parts.push(`${timeDifference.days} days`);
    } else if (timeDifference.hours > 0) {
      parts.push(`${timeDifference.hours} hours`);
    }

    // Severity change
    if (severityChange) {
      parts.push(
        `Severity changed from ${severityChange.from} to ${severityChange.to}`
      );
    }

    // Findings summary
    const changes: string[] = [];
    if (findingsComparison.newFindings.length > 0) {
      changes.push(`${findingsComparison.newFindings.length} new`);
    }
    if (findingsComparison.resolvedFindings.length > 0) {
      changes.push(`${findingsComparison.resolvedFindings.length} resolved`);
    }
    if (findingsComparison.improvedFindings.length > 0) {
      changes.push(`${findingsComparison.improvedFindings.length} improved`);
    }
    if (findingsComparison.worsenedFindings.length > 0) {
      changes.push(`${findingsComparison.worsenedFindings.length} worsened`);
    }

    if (changes.length > 0) {
      parts.push(`${changes.join(', ')} finding(s)`);
    }

    return parts.join(', ');
  }

  /**
   * Get comparable scans (same scan type, different dates)
   */
  static getComparableScans(
    referenceScan: ScanResult,
    allScans: ScanResult[]
  ): ScanResult[] {
    return allScans.filter(
      (scan) =>
        scan.scan_type === referenceScan.scan_type && scan.id !== referenceScan.id
    );
  }

  /**
   * Get the most recent scan before the given scan of the same type
   */
  static getPreviousScan(
    scan: ScanResult,
    allScans: ScanResult[]
  ): ScanResult | undefined {
    const sameTypeScans = allScans
      .filter((s) => s.scan_type === scan.scan_type && s.id !== scan.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const scanDate = new Date(scan.created_at).getTime();
    return sameTypeScans.find((s) => new Date(s.created_at).getTime() < scanDate);
  }

  /**
   * Get the next scan after the given scan of the same type
   */
  static getNextScan(
    scan: ScanResult,
    allScans: ScanResult[]
  ): ScanResult | undefined {
    const sameTypeScans = allScans
      .filter((s) => s.scan_type === scan.scan_type && s.id !== scan.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const scanDate = new Date(scan.created_at).getTime();
    return sameTypeScans.find((s) => new Date(s.created_at).getTime() > scanDate);
  }
}

// Export constants for use in components
export { SEVERITY_SCORE };

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TimelineProps,
  TimelineFilter,
  TimelineCardData,
  DateRangeFilter,
  SortOption,
  TimelineService,
  ComparisonService,
  ScanType,
  Severity,
  ScanComparison as ScanComparisonType,
} from '@petvision/shared';
import { TimelineCard } from './TimelineCard';
import { TimelineFilters } from './TimelineFilters';
import { TimelineEmptyState } from './TimelineEmptyState';
import { ScanComparison } from './ScanComparison';
import { TimelineTrend } from './TimelineTrend';

export const Timeline: React.FC<TimelineProps> = ({
  petId,
  onScanPress,
  onComparePress,
  showFilters = true,
  initialDateRange = DateRangeFilter.LAST_6_MONTHS,
}) => {
  // State
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [timelineCards, setTimelineCards] = useState<TimelineCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [filters, setFilters] = useState<TimelineFilter>({
    dateRange: initialDateRange,
    sortBy: SortOption.DATE_NEWEST,
  });

  // Comparison state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<ScanComparisonType | undefined>();

  // Load scans data (replace with actual Supabase fetch)
  useEffect(() => {
    const fetchScans = async () => {
      setLoading(true);
      setError(undefined);
      try {
        // TODO: Replace with actual Supabase query
        // const { data, error } = await supabase
        //   .from('scan_results')
        //   .select('*')
        //   .eq('pet_id', petId)
        //   .order('created_at', { ascending: false });

        // Mock data for now
        const mockScans = generateMockScans(petId);
        setScans(mockScans);
      } catch (err) {
        setError('Failed to load scan history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [petId]);

  // Build timeline when scans or filters change
  useEffect(() => {
    const timelineData = TimelineService.buildTimeline(scans, filters);
    setTimelineCards(timelineData);
  }, [scans, filters]);

  // Calculate counts for filters
  const scanCounts = TimelineService.getScanCounts(scans);
  const severityCounts = TimelineService.getSeverityCounts(scans);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: TimelineFilter) => {
    setFilters(newFilters);
  }, []);

  // Handle card press
  const handleCardPress = useCallback(
    (scanId: string) => {
      onScanPress?.(scanId);
    },
    [onScanPress]
  );

  // Handle compare button toggle
  const handleCompareToggle = useCallback(
    (scanId: string) => {
      const newSelected = new Set(selectedScanIds);
      if (newSelected.has(scanId)) {
        newSelected.delete(scanId);
      } else {
        newSelected.add(scanId);
      }
      setSelectedScanIds(newSelected);
    },
    [selectedScanIds]
  );

  // Handle compare action
  const handleCompare = useCallback(() => {
    if (selectedScanIds.size === 2) {
      const ids = Array.from(selectedScanIds);
      const beforeScan = scans.find((s) => s.id === ids[0]);
      const afterScan = scans.find((s) => s.id === ids[1]);

      if (beforeScan && afterScan) {
        // Order by date
        const [first, second] =
          new Date(beforeScan.created_at) < new Date(afterScan.created_at)
            ? [beforeScan, afterScan]
            : [afterScan, beforeScan];

        const comparison = ComparisonService.compareScans(first, second);
        setComparisonData(comparison);
        setShowComparison(true);
        onComparePress?.(first.id, second.id);
      }
    }
  }, [selectedScanIds, scans, onComparePress]);

  // Handle expand toggle
  const handleExpandToggle = useCallback(
    (scanId: string) => {
      setTimelineCards((prev) =>
        prev.map((card) =>
          card.scan.id === scanId
            ? { ...card, isExpanded: !card.isExpanded }
            : card
        )
      );
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Unable to load scan history
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (timelineCards.length === 0) {
    return (
      <TimelineEmptyState
        onScanNow={() => onScanPress?.('new')}
        scanType={filters.scanTypes && filters.scanTypes.length === 1 ? filters.scanTypes[0] : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <TimelineFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          scanCounts={scanCounts}
          severityCounts={severityCounts}
        />
      )}

      {/* Comparison Toolbar */}
      {comparisonMode && (
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-2 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Select 2 scans to compare
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs font-semibold">
                {selectedScanIds.size}/2 selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setComparisonMode(false);
                  setSelectedScanIds(new Set());
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCompare}
                disabled={selectedScanIds.size !== 2}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedScanIds.size === 2
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Compare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Mode Toggle */}
      {!comparisonMode && (
        <div className="flex justify-end">
          <button
            onClick={() => setComparisonMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare Scans
          </button>
        </div>
      )}

      {/* Timeline Cards */}
      <div className="relative space-y-4">
        {/* Timeline Connector Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />

        {timelineCards.map((cardData, index) => (
          <div key={cardData.scan.id} className="relative">
            {/* Timeline Marker */}
            <div
              className={`absolute left-4 w-4 h-4 rounded-full border-4 border-white dark:border-gray-800 -z-10 ${
                cardData.scan.severity === Severity.GREEN
                  ? 'bg-green-500'
                  : cardData.scan.severity === Severity.YELLOW
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />

            <TimelineCard
              data={cardData}
              onPress={() => handleCardPress(cardData.scan.id)}
              onExpand={() => handleExpandToggle(cardData.scan.id)}
              onCompare={() => handleCompareToggle(cardData.scan.id)}
              isSelected={selectedScanIds.has(cardData.scan.id)}
              isComparing={comparisonMode}
            />
          </div>
        ))}
      </div>

      {/* Comparison Modal */}
      {showComparison && comparisonData && (
        <ScanComparison
          comparison={comparisonData}
          onClose={() => {
            setShowComparison(false);
            setComparisonData(undefined);
            setSelectedScanIds(new Set());
            setComparisonMode(false);
          }}
        />
      )}
    </div>
  );
};

// Mock data generator (replace with real Supabase data)
function generateMockScans(petId: string): ScanResult[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const mockFindings = [
    {
      id: 'f1',
      condition: 'Redness',
      description: 'Skin redness detected in localized area',
      confidence: 0.92,
      severity: Severity.YELLOW,
    },
    {
      id: 'f2',
      condition: 'Dry patches',
      description: 'Areas of dry, flaky skin observed',
      confidence: 0.85,
      severity: Severity.GREEN,
    },
    {
      id: 'f3',
      condition: 'Inflammation',
      description: 'Signs of inflammation present',
      confidence: 0.78,
      severity: Severity.RED,
    },
  ];

  return [
    {
      id: `${petId}-scan-1`,
      pet_id: petId,
      scan_type: ScanType.SKIN,
      severity: Severity.YELLOW,
      findings: [mockFindings[0]],
      image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
      thumbnail_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100',
      created_at: new Date(now - 2 * dayMs).toISOString(),
      updated_at: new Date(now - 2 * dayMs).toISOString(),
      notes: 'Initial skin check',
      metadata: { device: 'iPhone 14', lighting: 'natural' },
    },
    {
      id: `${petId}-scan-2`,
      pet_id: petId,
      scan_type: ScanType.SKIN,
      severity: Severity.GREEN,
      findings: [mockFindings[1]],
      image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
      thumbnail_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100',
      created_at: new Date(now - 7 * dayMs).toISOString(),
      updated_at: new Date(now - 7 * dayMs).toISOString(),
      notes: 'Follow-up check',
      metadata: { device: 'iPhone 14', lighting: 'indoor' },
    },
    {
      id: `${petId}-scan-3`,
      pet_id: petId,
      scan_type: ScanType.EYE,
      severity: Severity.GREEN,
      findings: [],
      image_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400',
      thumbnail_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100',
      created_at: new Date(now - 14 * dayMs).toISOString(),
      updated_at: new Date(now - 14 * dayMs).toISOString(),
      metadata: { device: 'iPhone 14', lighting: 'bright' },
    },
    {
      id: `${petId}-scan-4`,
      pet_id: petId,
      scan_type: ScanType.TEETH,
      severity: Severity.YELLOW,
      findings: [{ ...mockFindings[2], id: 'f4' }],
      image_url: 'https://images.unsplash.com/photo-1596965398642-45b8878d4971?w=400',
      thumbnail_url: 'https://images.unsplash.com/photo-1596965398642-45b8878d4971?w=100',
      created_at: new Date(now - 21 * dayMs).toISOString(),
      updated_at: new Date(now - 21 * dayMs).toISOString(),
      notes: 'Some tartar buildup detected',
      metadata: { device: 'iPhone 14', lighting: 'flash' },
    },
    {
      id: `${petId}-scan-5`,
      pet_id: petId,
      scan_type: ScanType.GAIT,
      severity: Severity.GREEN,
      findings: [],
      image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      thumbnail_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100',
      created_at: new Date(now - 30 * dayMs).toISOString(),
      updated_at: new Date(now - 30 * dayMs).toISOString(),
      notes: 'Normal gait observed',
      metadata: { device: 'iPhone 14', lighting: 'outdoor' },
    },
  ];
}

export default Timeline;

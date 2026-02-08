import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ScanResult,
} from '@petvision/shared';
import { TimelineCard } from './TimelineCard';
import { TimelineFilters } from './TimelineFilters';
import { TimelineEmptyState } from './TimelineEmptyState';
import { ScanComparison } from './ScanComparison';

export const Timeline: React.FC<TimelineProps> = ({
  petId,
  onScanPress,
  onComparePress,
  showFilters = true,
  initialDateRange = DateRangeFilter.LAST_6_MONTHS,
}) => {
  const insets = useSafeAreaInsets();

  // State
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [timelineCards, setTimelineCards] = useState<TimelineCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<TimelineFilter>({
    dateRange: initialDateRange,
    sortBy: SortOption.DATE_NEWEST,
  });

  // Comparison state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<ScanComparisonType | undefined>();

  // Load scans data
  const loadScans = useCallback(async () => {
    try {
      setError(undefined);
      // TODO: Replace with actual Supabase query
      const mockScans = generateMockScans(petId);
      setScans(mockScans);
    } catch (err) {
      setError('Failed to load scan history');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [petId]);

  useEffect(() => {
    setLoading(true);
    loadScans();
  }, [petId, loadScans]);

  // Build timeline when scans or filters change
  useEffect(() => {
    const timelineData = TimelineService.buildTimeline(scans, filters);
    setTimelineCards(timelineData);
  }, [scans, filters]);

  // Calculate counts for filters
  const scanCounts = TimelineService.getScanCounts(scans);
  const severityCounts = TimelineService.getSeverityCounts(scans);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadScans();
  }, [loadScans]);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to load scan history</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity onPress={loadScans} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
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
          <View style={styles.comparisonToolbar}>
            <View style={styles.comparisonToolbarContent}>
              <Text style={styles.comparisonToolbarText}>
                Select 2 scans to compare
              </Text>
              <View style={styles.comparisonBadge}>
                <Text style={styles.comparisonBadgeText}>
                  {selectedScanIds.size}/2
                </Text>
              </View>
            </View>
            <View style={styles.comparisonToolbarActions}>
              <TouchableOpacity
                onPress={() => {
                  setComparisonMode(false);
                  setSelectedScanIds(new Set());
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCompare}
                disabled={selectedScanIds.size !== 2}
                style={[
                  styles.compareButton,
                  selectedScanIds.size !== 2 && styles.compareButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.compareButtonText,
                    selectedScanIds.size !== 2 && styles.compareButtonTextDisabled,
                  ]}>
                  Compare
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Compare Mode Toggle */}
        {!comparisonMode && (
          <View style={styles.compareModeToggle}>
            <TouchableOpacity
              onPress={() => setComparisonMode(true)}
              style={styles.compareModeButton}
            >
              <Text style={styles.compareModeButtonText}>Compare Scans</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timeline Cards */}
        <View style={styles.timelineContainer}>
          {timelineCards.map((cardData) => (
            <View key={cardData.scan.id} style={styles.timelineItem}>
              {/* Timeline Connector Line */}
              <View style={styles.timelineLine} />
              
              {/* Timeline Marker */}
              <View
                style={[
                  styles.timelineMarker,
                  cardData.scan.severity === Severity.GREEN && styles.markerGreen,
                  cardData.scan.severity === Severity.YELLOW && styles.markerYellow,
                  cardData.scan.severity === Severity.RED && styles.markerRed,
                ]}
              />

              <TimelineCard
                data={cardData}
                onPress={() => handleCardPress(cardData.scan.id)}
                onExpand={() => handleExpandToggle(cardData.scan.id)}
                onCompare={() => handleCompareToggle(cardData.scan.id)}
                isSelected={selectedScanIds.has(cardData.scan.id)}
                isComparing={comparisonMode}
              />
            </View>
          ))}
        </View>
      </ScrollView>

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
    </View>
  );
};

// Mock data generator (replace with real Supabase data)
function generateMockScans(petId: string): ScanResult[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    {
      id: `${petId}-scan-1`,
      pet_id: petId,
      scan_type: ScanType.SKIN,
      severity: Severity.YELLOW,
      findings: [{
        id: 'f1',
        condition: 'Redness',
        description: 'Skin redness detected',
        confidence: 0.92,
        severity: Severity.YELLOW,
      }],
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
      findings: [{
        id: 'f2',
        condition: 'Dry patches',
        description: 'Areas of dry skin',
        confidence: 0.85,
        severity: Severity.GREEN,
      }],
      image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
      thumbnail_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100',
      created_at: new Date(now - 7 * dayMs).toISOString(),
      updated_at: new Date(now - 7 * dayMs).toISOString(),
      notes: 'Follow-up check',
      metadata: { device: 'iPhone 14', lighting: 'indoor' },
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
  },
  comparisonToolbar: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  comparisonToolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  comparisonToolbarText: {
    fontSize: 14,
    fontWeight: '500',
  },
  comparisonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 9999,
  },
  comparisonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  comparisonToolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  compareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  compareButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  compareButtonTextDisabled: {
    color: '#9CA3AF',
  },
  compareModeToggle: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  compareModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  compareModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 16,
    paddingLeft: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 0,
    bottom: -16,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineMarker: {
    position: 'absolute',
    left: 12,
    top: 16,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerGreen: {
    backgroundColor: '#10B981',
  },
  markerYellow: {
    backgroundColor: '#F59E0B',
  },
  markerRed: {
    backgroundColor: '#EF4444',
  },
});

export default Timeline;

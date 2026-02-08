import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  TimelineFilter,
  ScanType,
  Severity,
  DateRangeFilter,
  SortOption,
  ScanTypeLabels,
  SeverityColors,
} from '@petvision/shared';

interface TimelineFiltersProps {
  filters: TimelineFilter;
  onFiltersChange: (filters: TimelineFilter) => void;
  scanCounts: Record<ScanType, number>;
  severityCounts: Record<Severity, number>;
}

export const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  filters,
  onFiltersChange,
  scanCounts,
  severityCounts,
}) => {
  const scanTypes = Object.values(ScanType);
  const severities = Object.values(Severity);

  const handleScanTypeToggle = (type: ScanType) => {
    const currentTypes = filters.scanTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    onFiltersChange({
      ...filters,
      scanTypes: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleSeverityToggle = (severity: Severity) => {
    const currentSeverities = filters.severities || [];
    const newSeverities = currentSeverities.includes(severity)
      ? currentSeverities.filter((s) => s !== severity)
      : [...currentSeverities, severity];

    onFiltersChange({
      ...filters,
      severities: newSeverities.length > 0 ? newSeverities : undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: filters.sortBy,
    });
  };

  const hasActiveFilters =
    (filters.scanTypes && filters.scanTypes.length > 0) ||
    (filters.severities && filters.severities.length > 0) ||
    filters.dateRange !== undefined;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filter & Sort</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Scan Type Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Scan Type</Text>
          <View style={styles.chipsContainer}>
            {scanTypes.map((type) => {
              const isSelected = filters.scanTypes?.includes(type);
              const count = scanCounts[type] || 0;
              const isDisabled = count === 0;

              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => !isDisabled && handleScanTypeToggle(type)}
                  disabled={isDisabled}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                    isDisabled && styles.chipDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                      isDisabled && styles.chipTextDisabled,
                    ]}>
                    {ScanTypeLabels[type]}
                    {count > 0 && (
                      <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
                        ({count})
                      </Text>
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Severity Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Severity Level</Text>
          <View style={styles.chipsContainer}>
            {severities.map((severity) => {
              const isSelected = filters.severities?.includes(severity);
              const count = severityCounts[severity] || 0;
              const isDisabled = count === 0;
              const color = SeverityColors[severity];

              return (
                <TouchableOpacity
                  key={severity}
                  onPress={() => !isDisabled && handleSeverityToggle(severity)}
                  disabled={isDisabled}
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: color }
                      : isDisabled
                      ? styles.chipDisabled
                      : styles.chipDefault,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected
                        ? { color: '#FFFFFF' }
                        : isDisabled
                        ? styles.chipTextDisabled
                        : styles.chipTextDefault,
                    ]}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    {count > 0 && (
                      <Text
                        style={[
                          styles.countText,
                          isSelected && { color: '#FFFFFF' },
                        ]}>
                        ({count})
                      </Text>
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date Range Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Time Period</Text>
          <View style={styles.dateRangeGrid}>
            {(
              [
                { value: DateRangeFilter.LAST_7_DAYS, label: 'Last 7 Days' },
                { value: DateRangeFilter.LAST_30_DAYS, label: 'Last 30 Days' },
                { value: DateRangeFilter.LAST_6_MONTHS, label: 'Last 6 Months' },
                { value: DateRangeFilter.ALL_TIME, label: 'All Time' },
              ] as const
            ).map(({ value, label }) => {
              const isSelected = filters.dateRange === value;

              return (
                <TouchableOpacity
                  key={value}
                  onPress={() =>
                    onFiltersChange({
                      ...filters,
                      dateRange: isSelected ? undefined : value,
                    })
                  }
                  style={[
                    styles.dateButton,
                    isSelected && styles.dateButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateButtonText,
                      isSelected && styles.dateButtonTextSelected,
                    ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sort By</Text>
          <View style={styles.sortContainer}>
            {(
              [
                { value: SortOption.DATE_NEWEST, label: 'Newest First' },
                { value: SortOption.DATE_OLDEST, label: 'Oldest First' },
                { value: SortOption.SEVERITY_HIGH, label: 'Highest Severity' },
                { value: SortOption.SEVERITY_LOW, label: 'Lowest Severity' },
              ] as const
            ).map(({ value, label }) => {
              const isSelected = filters.sortBy === value;

              return (
                <TouchableOpacity
                  key={value}
                  onPress={() =>
                    onFiltersChange({
                      ...filters,
                      sortBy: value,
                    })
                  }
                  style={[
                    styles.sortItem,
                    isSelected && styles.sortItemSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.sortRadio,
                      isSelected && styles.sortRadioSelected,
                    ]}>
                    {isSelected && <View style={styles.sortRadioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.sortItemText,
                      isSelected && styles.sortItemTextSelected,
                    ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  chipDefault: {
    backgroundColor: '#F3F4F6',
  },
  chipSelected: {
    backgroundColor: '#2563EB',
  },
  chipDisabled: {
    backgroundColor: '#F9FAFB',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextDefault: {
    color: '#374151',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextDisabled: {
    color: '#9CA3AF',
  },
  countText: {
    opacity: 0.75,
    fontSize: 13,
  },
  dateRangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  dateButtonSelected: {
    backgroundColor: '#2563EB',
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  dateButtonTextSelected: {
    color: '#FFFFFF',
  },
  sortContainer: {
    gap: 8,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  sortItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  sortRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortRadioSelected: {
    borderColor: '#2563EB',
  },
  sortRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  sortItemText: {
    fontSize: 14,
    color: '#374151',
  },
  sortItemTextSelected: {
    color: '#111827',
    fontWeight: '500',
  },
});

export default TimelineFilters;

'use client';

import React from 'react';
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filter & Sort
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Scan Type Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Scan Type
        </label>
        <div className="flex flex-wrap gap-2">
          {scanTypes.map((type) => {
            const isSelected = filters.scanTypes?.includes(type);
            const count = scanCounts[type] || 0;
            const isDisabled = count === 0;

            return (
              <button
                key={type}
                onClick={() => !isDisabled && handleScanTypeToggle(type)}
                disabled={isDisabled}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isDisabled
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {ScanTypeLabels[type]}
                {count > 0 && (
                  <span className="ml-1 opacity-75">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Severity Level
        </label>
        <div className="flex flex-wrap gap-2">
          {severities.map((severity) => {
            const isSelected = filters.severities?.includes(severity);
            const count = severityCounts[severity] || 0;
            const isDisabled = count === 0;
            const color = SeverityColors[severity];

            return (
              <button
                key={severity}
                onClick={() => !isDisabled && handleSeverityToggle(severity)}
                disabled={isDisabled}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? `${color} text-white`
                    : isDisabled
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
                {count > 0 && (
                  <span className="ml-1 opacity-75">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Time Period
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              <button
                key={value}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    dateRange: isSelected ? undefined : value,
                  })
                }
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sort By
        </label>
        <select
          value={filters.sortBy || SortOption.DATE_NEWEST}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              sortBy: e.target.value as SortOption,
            })
          }
          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={SortOption.DATE_NEWEST}>Newest First</option>
          <option value={SortOption.DATE_OLDEST}>Oldest First</option>
          <option value={SortOption.SEVERITY_HIGH}>Highest Severity</option>
          <option value={SortOption.SEVERITY_LOW}>Lowest Severity</option>
        </select>
      </div>
    </div>
  );
};

export default TimelineFilters;

'use client';

import React from 'react';
import { ScanType } from '@petvision/shared';

interface TimelineEmptyStateProps {
  onScanNow?: () => void;
  scanType?: ScanType;
}

export const TimelineEmptyState: React.FC<TimelineEmptyStateProps> = ({
  onScanNow,
  scanType,
}) => {
  const getIcon = () => {
    switch (scanType) {
      case ScanType.EYE:
        return '👁️';
      case ScanType.SKIN:
        return '🐾';
      case ScanType.TEETH:
        return '🦷';
      case ScanType.GAIT:
        return '🏃';
      default:
        return '📋';
    }
  };

  const getTitle = () => {
    return scanType
      ? `No ${scanType.charAt(0).toUpperCase() + scanType.slice(1)} Scans Yet`
      : 'No Scans Yet';
  };

  const getDescription = () => {
    return scanType
      ? `Start tracking your pet's ${scanType} health by performing a scan.`
      : 'Start tracking your pet\'s health journey by performing your first scan.';
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{getIcon()}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {getTitle()}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {getDescription()}
      </p>
      {onScanNow && (
        <button
          onClick={onScanNow}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Start Your First Scan
        </button>
      )}
    </div>
  );
};

export default TimelineEmptyState;

'use client';

import React from 'react';
import { TrendData, TrendType, TrendColors, TrendTypeIcons } from '@petvision/shared';

interface TimelineTrendProps {
  trend: TrendData;
  compact?: boolean;
}

export const TimelineTrend: React.FC<TimelineTrendProps> = ({ trend, compact = false }) => {
  const getTrendColor = () => {
    return TrendColors[trend.type];
  };

  const getTrendIcon = () => {
    return TrendTypeIcons[trend.type];
  };

  const getTrendLabel = () => {
    switch (trend.type) {
      case TrendType.IMPROVEMENT:
        return 'Improved';
      case TrendType.DECLINE:
        return 'Declined';
      case TrendType.STABLE:
        return 'Stable';
    }
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 text-sm font-medium`}
        style={{ color: getTrendColor() }}
      >
        <span className="text-lg">{getTrendIcon()}</span>
        <span>{trend.message}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-2`}
      style={{
        borderColor: getTrendColor(),
        backgroundColor: `${getTrendColor()}10`,
      }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold"
        style={{ backgroundColor: getTrendColor() }}
      >
        {getTrendIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: getTrendColor() }}
          >
            {getTrendLabel()}
          </span>
          {trend.percentageChange !== undefined && (
            <span
              className="text-sm font-bold px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: getTrendColor() }}
            >
              {trend.percentageChange > 0 ? '+' : ''}{trend.percentageChange}%
            </span>
          )}
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {trend.message}
        </p>
        {trend.findingsChange && (
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {trend.findingsChange.added > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded">
                +{trend.findingsChange.added} new
              </span>
            )}
            {trend.findingsChange.removed > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded">
                -{trend.findingsChange.removed} resolved
              </span>
            )}
            {trend.findingsChange.improved > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded">
                {trend.findingsChange.improved} improved
              </span>
            )}
            {trend.findingsChange.worsened > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded">
                {trend.findingsChange.worsened} worsened
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineTrend;

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { TimelineCardData, Severity, SeverityColors, ScanTypeLabels } from '@petvision/shared';
import { TimelineTrend } from './TimelineTrend';

interface TimelineCardProps {
  data: TimelineCardData;
  onPress?: () => void;
  onExpand?: () => void;
  onCompare?: () => void;
  isSelected?: boolean;
  isComparing?: boolean;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  data,
  onPress,
  onExpand,
  onCompare,
  isSelected = false,
  isComparing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(data.isExpanded);
  const { scan, trend } = data;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
  };

  const getSeverityColor = (severity: Severity) => {
    return SeverityColors[severity];
  };

  const getSeverityLabel = (severity: Severity) => {
    switch (severity) {
      case Severity.GREEN:
        return 'Healthy';
      case Severity.YELLOW:
        return 'Attention';
      case Severity.RED:
        return 'Concern';
    }
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-2 ${
        isSelected ? 'border-blue-500' : isComparing ? 'border-purple-500' : 'border-transparent'
      } ${
        scan.severity === Severity.RED ? 'ring-2 ring-red-500/20' : ''
      }`}
    >
      {/* Severity Color Indicator Strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: getSeverityColor(scan.severity) }}
      />

      <div className="pl-5 pr-4 py-4 cursor-pointer" onClick={onPress}>
        {/* Card Header */}
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 relative">
            <img
              src={scan.thumbnail_url || scan.image_url}
              alt={`${ScanTypeLabels[scan.scan_type]} scan`}
              className="w-20 h-20 object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
            />
            {/* Severity Badge on Thumbnail */}
            <div
              className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}
              style={{ backgroundColor: getSeverityColor(scan.severity) }}
            >
              {scan.findings.length}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Type and Date */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {ScanTypeLabels[scan.scan_type]} Scan
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(scan.created_at)}
              </span>
            </div>

            {/* Severity Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full text-white`}
                style={{ backgroundColor: getSeverityColor(scan.severity) }}
              >
                {getSeverityLabel(scan.severity)}
              </span>
              {scan.notes && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {scan.notes.length > 30 ? scan.notes.slice(0, 30) + '...' : scan.notes}
                </span>
              )}
            </div>

            {/* Expand Button */}
            <button
              onClick={handleExpand}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              {isExpanded ? 'Show Less' : 'View Details'}
              <span
                className={`transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>
          </div>

          {/* Compare Checkbox */}
          {onCompare && (
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                checked={isSelected || isComparing}
                onChange={(e) => {
                  e.stopPropagation();
                  onCompare();
                }}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className="mt-3">
            <TimelineTrend trend={trend} compact />
          </div>
        )}

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Findings List */}
            {scan.findings.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Findings ({scan.findings.length})
                </h4>
                <ul className="space-y-2">
                  {scan.findings.map((finding) => (
                    <li
                      key={finding.id}
                      className="flex items-start gap-2 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: getSeverityColor(finding.severity) }}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {finding.condition}
                        </span>
                        {finding.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {finding.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(finding.confidence * 100)}% confidence
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                No findings detected. Looking healthy!
              </p>
            )}

            {/* Metadata */}
            {scan.metadata && Object.keys(scan.metadata).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                  Scan Metadata
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(scan.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{key}:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Image Link */}
            <div className="mt-3">
              <a
                href={scan.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                onClick={(e) => e.stopPropagation()}
              >
                <span>View Full Scan Image</span>
                <span>→</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineCard;

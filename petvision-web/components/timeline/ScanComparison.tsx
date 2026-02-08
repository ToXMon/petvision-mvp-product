'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ScanComparison as ScanComparisonType, TrendType, TrendColors, SeverityColors, ScanTypeLabels } from '@petvision/shared';
import { TimelineTrend } from './TimelineTrend';

interface ScanComparisonProps {
  comparison: ScanComparisonType;
  onClose: () => void;
}

export const ScanComparison: React.FC<ScanComparisonProps> = ({ comparison, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeTab, setActiveTab] = useState<'visual' | 'findings'>('visual');

  const { beforeScan, afterScan } = comparison;
  const { timeDifference, severityChange, findingsComparison, trend } = comparison.comparison;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
  };

  const getSeverityColor = (severity: string) => {
    return SeverityColors[severity as keyof typeof SeverityColors];
  };

  const getTrendColor = () => {
    return TrendColors[trend.type];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: getTrendColor() }}>
              {trend.type === TrendType.IMPROVEMENT ? '↑' : trend.type === TrendType.DECLINE ? '↓' : '→'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Scan Comparison</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {timeDifference.days > 0 ? `${timeDifference.days} days` : `${timeDifference.hours} hours`} between scans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close comparison"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Trend Summary */}
          <div className="mb-6"><TimelineTrend trend={trend} /></div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'visual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
              }`}
            >
              Visual Comparison
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'findings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
              }`}
            >
              Findings Comparison
            </button>
          </div>

          {activeTab === 'visual' && (
            <div className="space-y-4">
              {/* Image Slider Comparison */}
              <div className="relative rounded-xl overflow-hidden border-2 border-gray-200" style={{ aspectRatio: '4/3' }}>
                <img src={beforeScan.image_url} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                  <img src={afterScan.image_url} alt="After" className="absolute inset-0 w-full h-full object-cover" style={{ left: `-${(100 - sliderPosition)}%` }} />
                </div>
                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize" style={{ left: `${sliderPosition}%` }}>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={sliderPosition} onChange={(e) => setSliderPosition(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" />
              </div>
            </div>
          )}

          {activeTab === 'findings' && (
            <div className="space-y-4">
              {findingsComparison.newFindings.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">New Findings ({findingsComparison.newFindings.length})</h3>
                  {findingsComparison.newFindings.map((f) => (
                    <div key={f.id} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">{f.condition}</div>
                  ))}
                </div>
              )}
              {findingsComparison.resolvedFindings.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Resolved Findings ({findingsComparison.resolvedFindings.length})</h3>
                  {findingsComparison.resolvedFindings.map((f) => (
                    <div key={f.id} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">{f.condition}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanComparison;

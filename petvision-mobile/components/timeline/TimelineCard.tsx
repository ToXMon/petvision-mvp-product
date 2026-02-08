import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { format } from 'date-fns';
import {
  TimelineCardData,
  Severity,
  SeverityColors,
  ScanTypeLabels,
} from '@petvision/shared';
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

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.card,
      scan.severity === Severity.RED && styles.cardRed,
      isSelected && styles.cardSelected,
      isComparing && styles.cardComparing,
      pressed && styles.cardPressed,
    ]}>
      {/* Severity Indicator Strip */}
      <View
        style={[
          styles.severityStrip,
          { backgroundColor: getSeverityColor(scan.severity) },
        ]}
      />

      <View style={styles.content}>
        {/* Card Header */}
        <View style={styles.header}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            <Image
              source={{
                uri: scan.thumbnail_url || scan.image_url,
              }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            {/* Severity Badge on Thumbnail */}
            <View
              style={[
                styles.thumbnailBadge,
                { backgroundColor: getSeverityColor(scan.severity) },
              ]}
            >
              <Text style={styles.thumbnailBadgeText}>{scan.findings.length}</Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Type and Date */}
            <View style={styles.typeDateRow}>
              <Text style={styles.scanTypeText}>
                {ScanTypeLabels[scan.scan_type]} Scan
              </Text>
              <Text style={styles.dateText}>{formatDate(scan.created_at)}</Text>
            </View>

            {/* Severity Badge */}
            <View style={styles.severityRow}>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(scan.severity) },
                ]}
              >
                <Text style={styles.severityBadgeText}>
                  {getSeverityLabel(scan.severity)}
                </Text>
              </View>
              {scan.notes && (
                <Text style={styles.notesText} numberOfLines={1}>
                  {scan.notes.length > 30
                    ? scan.notes.slice(0, 30) + '...'
                    : scan.notes}
                </Text>
              )}
            </View>

            {/* Expand Button */}
            <TouchableOpacity onPress={handleExpand} style={styles.expandButton}>
              <Text style={styles.expandButtonText}>
                {isExpanded ? 'Show Less' : 'View Details'}
              </Text>
              <Text
                style={[
                  styles.expandArrow,
                  isExpanded && styles.expandArrowRotated,
                ]}>
                ▼
              </Text>
            </TouchableOpacity>
          </View>

          {/* Compare Checkbox */}
          {onCompare && (
            <TouchableOpacity
              onPress={onCompare}
              style={styles.checkboxContainer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={[
                  styles.checkbox,
                  (isSelected || isComparing) && styles.checkboxChecked,
                ]}>
                {(isSelected || isComparing) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Trend Indicator */}
        {trend && (
          <View style={styles.trendContainer}>
            <TimelineTrend trend={trend} compact />
          </View>
        )}

        {/* Expandable Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Findings List */}
            {scan.findings.length > 0 ? (
              <View>
                <Text style={styles.findingsTitle}>
                  Findings ({scan.findings.length})
                </Text>
                <ScrollView style={styles.findingsList}>
                  {scan.findings.map((finding) => (
                    <View
                      key={finding.id}
                      style={[
                        styles.findingItem,
                        {
                          borderLeftColor: getSeverityColor(finding.severity),
                        },
                      ]}>
                      <View
                        style={[
                          styles.findingDot,
                          { backgroundColor: getSeverityColor(finding.severity) },
                        ]}
                      />
                      <View style={styles.findingContent}>
                        <Text style={styles.findingConditionText}>
                          {finding.condition}
                        </Text>
                        {finding.description && (
                          <Text style={styles.findingDescriptionText}>
                            {finding.description}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.findingConfidenceText}>
                        {Math.round(finding.confidence * 100)}%
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.noFindingsContainer}>
                <Text style={styles.noFindingsText}>
                  No findings detected. Looking healthy!
                </Text>
              </View>
            )}

            {/* Metadata */}
            {scan.metadata && Object.keys(scan.metadata).length > 0 && (
              <View style={styles.metadataContainer}>
                <Text style={styles.metadataTitle}>SCAN METADATA</Text>
                <View style={styles.metadataGrid}>
                  {Object.entries(scan.metadata).map(([key, value]) => (
                    <View key={key} style={styles.metadataRow}>
                      <Text style={styles.metadataKey}>{key}:</Text>
                      <Text style={styles.metadataValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardRed: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  cardSelected: {
    borderColor: '#3B82F6',
  },
  cardComparing: {
    borderColor: '#8B5CF6',
  },
  cardPressed: {
    shadowOpacity: 0.2,
  },
  severityStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  content: {
    paddingLeft: 10,
    paddingRight: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbnailBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  typeDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scanTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2563EB',
  },
  expandArrow: {
    fontSize: 10,
    color: '#2563EB',
  },
  expandArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  trendContainer: {
    marginTop: 12,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  findingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  findingsList: {
    maxHeight: 200,
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  findingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  findingContent: {
    flex: 1,
  },
  findingConditionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  findingDescriptionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  findingConfidenceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noFindingsContainer: {
    paddingVertical: 12,
  },
  noFindingsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  metadataContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metadataTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metadataRow: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metadataKey: {
    fontSize: 12,
    color: '#6B7280',
  },
  metadataValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
});

export default TimelineCard;

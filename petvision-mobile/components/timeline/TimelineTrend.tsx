import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
      <View style={[styles.compactContainer, { borderColor: getTrendColor() }]}>
        <Text style={[styles.compactIcon, { color: getTrendColor() }]}>
          {getTrendIcon()}
        </Text>
        <Text style={[styles.compactMessage, { color: getTrendColor() }]}>
          {trend.message}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: getTrendColor(),
          backgroundColor: getTrendColor() + '15',
        },
      ]}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: getTrendColor() }]}
      >
        <Text style={styles.iconText}>{getTrendIcon()}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: getTrendColor() }]}>
            {getTrendLabel()}
          </Text>
          {trend.percentageChange !== undefined && (
            <View style={[styles.badge, { backgroundColor: getTrendColor() }]}>
              <Text style={styles.badgeText}>
                {trend.percentageChange > 0 ? '+' : ''}
                {trend.percentageChange}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.message}>{trend.message}</Text>
        {trend.findingsChange && (
          <View style={styles.badgesRow}>
            {trend.findingsChange.added > 0 && (
              <View style={styles.findingBadge}>
                <Text style={styles.findingBadgeText}>+{trend.findingsChange.added} new</Text>
              </View>
            )}
            {trend.findingsChange.removed > 0 && (
              <View style={[styles.findingBadge, styles.greenBadge]}>
                <Text style={styles.findingBadgeText}>-{trend.findingsChange.removed} resolved</Text>
              </View>
            )}
            {trend.findingsChange.improved > 0 && (
              <View style={[styles.findingBadge, styles.greenBadge]}>
                <Text style={styles.findingBadgeText}>{trend.findingsChange.improved} improved</Text>
              </View>
            )}
            {trend.findingsChange.worsened > 0 && (
              <View style={[styles.findingBadge, styles.redBadge]}>
                <Text style={styles.findingBadgeText}>{trend.findingsChange.worsened} worsened</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  findingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  greenBadge: {
    backgroundColor: '#ECFDF5',
  },
  redBadge: {
    backgroundColor: '#FEF2F2',
  },
  findingBadgeText: {
    fontSize: 12,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  compactIcon: {
    fontSize: 18,
  },
  compactMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TimelineTrend;

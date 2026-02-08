import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
      : "Start tracking your pet's health journey by performing your first scan.";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{getIcon()}</Text>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.description}>{getDescription()}</Text>
      {onScanNow && (
        <Pressable onPress={onScanNow} style={styles.button}>
          <Text style={styles.buttonText}>Start Your First Scan</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TimelineEmptyState;

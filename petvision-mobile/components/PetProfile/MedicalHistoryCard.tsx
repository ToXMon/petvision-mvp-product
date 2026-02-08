// ============================================================================
// MedicalHistoryCard - Component for displaying medical records
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  GestureResponderEvent,
  AccessibilityInfo,
} from 'react-native';
import { MedicalHistoryCardProps, MedicalRecordType } from '../../types/pet';

export const MedicalHistoryCard: React.FC<MedicalHistoryCardProps> = ({
  record,
  onPress,
  onEdit,
  onDelete,
}) => {
  const getRecordTypeIcon = (type: MedicalRecordType) => {
    const icons = {
      vaccination: '💉',
      vet_visit: '🏥',
      condition: '📋',
      medication: '💊',
      allergy: '⚠️',
    };
    return icons[type] || '📄';
  };

  const getRecordTypeColor = (type: MedicalRecordType) => {
    const colors = {
      vaccination: '#10B981',
      vet_visit: '#3B82F6',
      condition: '#F59E0B',
      medication: '#8B5CF6',
      allergy: '#EF4444',
    };
    return colors[type] || '#6B7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCardPress = (event: GestureResponderEvent) => {
    AccessibilityInfo.announceForAccessibility(`Viewing ${record.title}`);
    onPress();
  };

  const handleEditPress = () => {
    AccessibilityInfo.announceForAccessibility(`Editing ${record.title}`);
    onEdit();
  };

  const handleDeletePress = () => {
    AccessibilityInfo.announceForAccessibility(`Deleting ${record.title}`);
    onDelete();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { borderLeftColor: getRecordTypeColor(record.record_type) },
        pressed && styles.pressed,
      ]}
      onPress={handleCardPress}
      accessible={true}
      accessibilityLabel={`${record.title}, ${formatDate(record.date)}`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        {/* Icon and Title */}
        <View style={styles.header}>
          <Text style={styles.icon}>{getRecordTypeIcon(record.record_type)}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {record.title}
            </Text>
            <Text style={styles.date}>{formatDate(record.date)}</Text>
          </View>
        </View>

        {/* Description */}
        {record.description && (
          <Text style={styles.description} numberOfLines={2}>
            {record.description}
          </Text>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          {record.veterinarian && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>👨‍⚕️</Text>
              <Text style={styles.metadataText} numberOfLines={1}>
                {record.veterinarian}
              </Text>
            </View>
          )}
          {record.next_due_date && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>📅</Text>
              <Text style={[styles.metadataText, styles.nextDue]}>
                Due: {formatDate(record.next_due_date)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEditPress}
          accessibilityLabel="Edit"
          accessibilityRole="button"
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDeletePress}
          accessibilityLabel="Delete"
          accessibilityRole="button"
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pressed: {
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#6B7280',
  },
  nextDue: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  actions: {
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 16,
  },
});

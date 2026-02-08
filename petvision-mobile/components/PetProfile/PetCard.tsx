// ============================================================================
// PetCard - Component for displaying pet information
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
import { PetCardProps } from '../../types/pet';
import { PetAvatar } from './PetAvatar';

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  onPress,
  onScan,
  onEdit,
  onDelete,
}) => {
  const getAgeDisplay = () => {
    if (pet.age_years && pet.age_years > 0) {
      const years = pet.age_years;
      const months = pet.age_months || 0;
      return months > 0 ? `${years}y ${months}m` : `${years}y`;
    }
    if (pet.age_months) {
      return `${pet.age_months}m`;
    }
    return 'Age unknown';
  };

  const getSpeciesEmoji = (species: string) => {
    const emojis = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      reptile: '🦎',
      other: '🐾',
    };
    return emojis[species as keyof typeof emojis] || emojis.other;
  };

  const handleCardPress = (event: GestureResponderEvent) => {
    AccessibilityInfo.announceForAccessibility(`Viewing ${pet.name}'s profile`);
    onPress();
  };

  const handleScanPress = () => {
    AccessibilityInfo.announceForAccessibility(`Starting scan for ${pet.name}`);
    onScan();
  };

  const handleEditPress = () => {
    AccessibilityInfo.announceForAccessibility(`Editing ${pet.name}'s profile`);
    onEdit();
  };

  const handleDeletePress = () => {
    AccessibilityInfo.announceForAccessibility(`Deleting ${pet.name}`);
    onDelete();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handleCardPress}
      accessible={true}
      accessibilityLabel={`${pet.name}, ${pet.species}, ${getAgeDisplay()}`}
      accessibilityRole="button"
      accessibilityHint="View pet profile"
    >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <PetAvatar
          uri={pet.avatar_url}
          name={pet.name}
          species={pet.species}
          size="lg"
        />
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.name} numberOfLines={1}>
          {pet.name}
        </Text>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            {getSpeciesEmoji(pet.species)} {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.detailText}>{getAgeDisplay()}</Text>
        </View>
        {pet.breed && (
          <Text style={styles.breedText} numberOfLines={1}>
            {pet.breed}
          </Text>
        )}
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleScanPress}
          accessibilityLabel={`Scan ${pet.name}`}
          accessibilityRole="button"
          accessibilityHint="Start new health scan"
        >
          <Text style={styles.actionIcon}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEditPress}
          accessibilityLabel={`Edit ${pet.name}`}
          accessibilityRole="button"
          accessibilityHint="Edit pet profile"
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDeletePress}
          accessibilityLabel={`Delete ${pet.name}`}
          accessibilityRole="button"
          accessibilityHint="Delete pet profile"
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    backgroundColor: '#F3F4F6',
  },
  avatarSection: {
    marginRight: 12,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    marginHorizontal: 6,
    color: '#9CA3AF',
  },
  breedText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
});

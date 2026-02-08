// ============================================================================
// PetSelectionModal - Modal for selecting a pet before scanning
// ============================================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
  ScrollView,
} from 'react-native';
import { PetSelectionModalProps } from '../../types/pet';
import { PetAvatar } from './PetAvatar';

export const PetSelectionModal: React.FC<PetSelectionModalProps> = ({
  visible,
  pets,
  selectedPetId,
  onSelect,
  onAddNew,
  onClose,
}) => {
  const renderPet = ({ item: pet }: { item: any }) => {
    const isSelected = pet.id === selectedPetId;
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

    return (
      <Pressable
        style={[
          styles.petItem,
          isSelected && styles.selectedItem,
        ]}
        onPress={() => onSelect(pet)}
        accessible={true}
        accessibilityLabel={`${pet.name} ${isSelected ? ', selected' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <PetAvatar
          uri={pet.avatar_url}
          name={pet.name}
          species={pet.species}
          size="md"
        />
        <View style={styles.petInfo}>
          <Text style={[styles.petName, isSelected && styles.selectedText]}>
            {pet.name}
          </Text>
          <Text style={styles.petDetails}>
            {pet.species} • {getAgeDisplay()}
          </Text>
        </View>
        <View style={styles.checkmark}>
          {isSelected && (
            <Text style={styles.checkIcon}>✓</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={styles.container}
          accessible={true}
          accessibilityLabel="Select a pet"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select a Pet</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Pet List */}
          <ScrollView style={styles.petList}>
            {pets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🐾</Text>
                <Text style={styles.emptyTitle}>No pets yet</Text>
                <Text style={styles.emptyText}>
                  Add your first pet to get started
                </Text>
              </View>
            ) : (
              pets.map((pet) => (
                <View key={pet.id}>{renderPet({ item: pet })}</View>
              ))
            )}
          </ScrollView>

          {/* Add New Button */}
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={onAddNew}
            accessible={true}
            accessibilityLabel="Add new pet"
            accessibilityRole="button"
          >
            <Text style={styles.addNewIcon}>+</Text>
            <Text style={styles.addNewText}>Add New Pet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  closeIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
  petList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  selectedItem: {
    backgroundColor: '#EBF5FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  petInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedText: {
    color: '#2563EB',
  },
  petDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  addNewIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: '300',
  },
  addNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

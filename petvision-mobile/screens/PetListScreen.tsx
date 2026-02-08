// ============================================================================
// PetListScreen - Main screen for displaying all pets
// ============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { PetService, PetServiceError } from '../services/PetService';
import { PetCard } from '../components/PetProfile';
import { PetProfile, RootStackParamList, Species } from '../types/pet';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'PetList'>;
}

export const PetListScreen: React.FC<Props> = ({ navigation }) => {
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [filteredPets, setFilteredPets] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species | undefined>();
  const [error, setError] = useState<string | undefined>();

  // Mock user ID - replace with actual auth
  const userId = 'mock-user-id';

  // Load pets
  const loadPets = useCallback(async () => {
    try {
      setError(undefined);
      const data = await PetService.getPets(userId);
      setPets(data);
      setFilteredPets(data);
    } catch (err) {
      console.error('Error loading pets:', err);
      const errorMessage = err instanceof PetServiceError 
        ? err.message 
        : 'Failed to load pets. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh pets
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await PetService.getPets(userId);
      setPets(data);
      setFilteredPets(data);
    } catch (err) {
      console.error('Error refreshing pets:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  // Filter pets
  useEffect(() => {
    let filtered = [...pets];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pet) =>
          pet.name.toLowerCase().includes(query) ||
          pet.breed?.toLowerCase().includes(query)
      );
    }

    if (selectedSpecies) {
      filtered = filtered.filter((pet) => pet.species === selectedSpecies);
    }

    setFilteredPets(filtered);
  }, [pets, searchQuery, selectedSpecies]);

  // Initial load
  useEffect(() => {
    loadPets();
  }, [loadPets]);

  // Handle delete
  const handleDelete = useCallback(
    (pet: PetProfile) => {
      Alert.alert(
        `Delete ${pet.name}?`,
        'This action cannot be undone. Are you sure you want to delete this pet profile?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await PetService.deletePet(pet.id);
                setPets((prev) => prev.filter((p) => p.id !== pet.id));
              } catch (err) {
                Alert.alert('Error', 'Failed to delete pet. Please try again.');
              }
            },
          },
        ]
      );
    },
    []
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🐾</Text>
      <Text style={styles.emptyTitle}>No pets yet</Text>
      <Text style={styles.emptyText}>
        Add your first pet to get started with health scanning
      </Text>
      <TouchableOpacity
        style={styles.addPetButton}
        onPress={() => navigation.navigate('AddEditPet')}
        accessible={true}
        accessibilityLabel="Add your first pet"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addPetButtonText}>Add Your First Pet</Text>
      </TouchableOpacity>
    </View>
  );

  // Render pet item
  const renderPet = useCallback(
    ({ item }: { item: PetProfile }) => (
      <PetCard
        pet={item}
        onPress={() => navigation.navigate('PetDetail', { petId: item.id })}
        onScan={() => navigation.navigate('Scan', { petId: item.id })}
        onEdit={() => navigation.navigate('AddEditPet', { petId: item.id })}
        onDelete={() => handleDelete(item)}
      />
    ),
    [navigation, handleDelete]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddEditPet')}
          accessible={true}
          accessibilityLabel="Add new pet"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle" size={32} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or breed..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
          accessible={true}
          accessibilityLabel="Search pets"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { label: 'All', value: undefined },
          { label: 'Dogs', value: Species.DOG },
          { label: 'Cats', value: Species.CAT },
          { label: 'Birds', value: Species.OTHER },
          { label: 'Others', value: Species.OTHER },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.label}
            style={[
              styles.filterChip,
              (selectedSpecies === filter.value ||
                (!selectedSpecies && !filter.value)) &&
                styles.filterChipActive,
            ]}
            onPress={() =>
              setSelectedSpecies(filter.value as Species | undefined)
            }
            accessible={true}
            accessibilityLabel={`Filter by ${filter.label}`}
            accessibilityState={{ selected: selectedSpecies === filter.value }}
          >
            <Text
              style={[
                styles.filterChipText,
                (selectedSpecies === filter.value ||
                  (!selectedSpecies && !filter.value)) &&
                  styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading pets...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadPets}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPets.length === 0 && !searchQuery ? (
        <FlatList
          data={filteredPets}
          renderItem={renderPet}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <FlatList
          data={filteredPets}
          renderItem={renderPet}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No pets found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContent: {
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  addPetButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

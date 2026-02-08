// ============================================================================
// PetDetailScreen - Screen for viewing pet details and medical history
// ============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { PetService, PetServiceError } from '../services/PetService';
import { PetAvatar, MedicalHistoryCard } from '../components/PetProfile';
import { PetProfile, MedicalRecord, RootStackParamList, MedicalRecordType } from '../types/pet';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'PetDetail'>;
  route: { params: { petId: string } };
}

export const PetDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { petId } = route.params;

  // State
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<MedicalRecordType | undefined>();
  const [error, setError] = useState<string | undefined>();

  // Load data
  const loadData = useCallback(async () => {
    try {
      setError(undefined);
      const [petData, records] = await Promise.all([
        PetService.getPetById(petId),
        PetService.getMedicalRecords(petId, {
          type: selectedRecordType,
        }),
      ]);

      if (petData) {
        setPet(petData);
        setMedicalRecords(records);
      } else {
        setError('Pet not found');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      const errorMessage =
        err instanceof PetServiceError
          ? err.message
          : 'Failed to load pet details. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [petId, selectedRecordType]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Delete medical record
  const handleDeleteRecord = useCallback(
    (record: MedicalRecord) => {
      Alert.alert(
        `Delete ${record.title}?`,
        'This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await PetService.deleteMedicalRecord(record.id);
                setMedicalRecords((prev) => prev.filter((r) => r.id !== record.id));
              } catch (err) {
                Alert.alert('Error', 'Failed to delete record. Please try again.');
              }
            },
          },
        ]
      );
    },
    []
  );

  // Get age display
  const getAgeDisplay = () => {
    if (!pet) return '';
    if (pet.age_years && pet.age_years > 0) {
      const years = pet.age_years;
      const months = pet.age_months || 0;
      return months > 0 ? `${years} years, ${months} months` : `${years} years old`;
    }
    if (pet.age_months) {
      return `${pet.age_months} months old`;
    }
    return 'Age unknown';
  };

  // Get gender display
  const getGenderDisplay = () => {
    if (!pet?.gender || pet.gender === 'unknown') return 'Unknown';
    return pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // Record type labels
  const recordTypeLabels = {
    vaccination: 'Vaccinations',
    vet_visit: 'Vet Visits',
    condition: 'Conditions',
    medication: 'Medications',
    allergy: 'Allergies',
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Pet not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pet Profile</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('AddEditPet', { petId })}
        >
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Pet Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.avatarContainer}>
            <PetAvatar uri={pet.avatar_url} name={pet.name} species={pet.species} size="xl" />
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
          <View style={styles.petMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="paw" size={18} color="#6B7280" />
              <Text style={styles.metaText}>
                {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={18} color="#6B7280" />
              <Text style={styles.metaText}>{getAgeDisplay()}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={18} color="#6B7280" />
              <Text style={styles.metaText}>{getGenderDisplay()}</Text>
            </View>
          </View>
          {pet.breed && (
            <Text style={styles.breedText}>{pet.breed}</Text>
          )}
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Birthday</Text>
              <Text style={styles.detailValue}>{formatDate(pet.date_of_birth)}</Text>
            </View>
            {pet.weight && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>
                  {pet.weight} {pet.weight_unit}
                </Text>
              </View>
            )}
          </View>
          {pet.microchip_id && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Microchip ID</Text>
                <Text style={styles.detailValue}>{pet.microchip_id}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Notes Card */}
        {pet.notes && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{pet.notes}</Text>
          </View>
        )}

        {/* Medical History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                // Navigate to add medical record screen
                Alert.alert('Add Record', 'Medical record form coming soon!');
              }}
            >
              <Ionicons name="add" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabs}
            contentContainerStyle={styles.filterTabsContent}
          >
            <TouchableOpacity
              style={[
                styles.filterTab,
                !selectedRecordType && styles.filterTabActive,
              ]}
              onPress={() => setSelectedRecordType(undefined)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  !selectedRecordType && styles.filterTabTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {Object.entries(recordTypeLabels).map(([type, label]) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterTab,
                  selectedRecordType === type && styles.filterTabActive,
                ]}
                onPress={() => setSelectedRecordType(type as MedicalRecordType)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedRecordType === type && styles.filterTabTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Medical Records List */}
          {medicalRecords.length === 0 ? (
            <View style={styles.emptyRecords}>
              <Ionicons name="medical" size={48} color="#D1D5DB" />
              <Text style={styles.emptyRecordsText}>No medical records yet</Text>
              <Text style={styles.emptyRecordsSubtext}>
                Add vaccinations, vet visits, and more
              </Text>
            </View>
          ) : (
            medicalRecords.map((record) => (
              <MedicalHistoryCard
                key={record.id}
                record={record}
                onPress={() => {
                  // Navigate to record detail
                  Alert.alert('Record Detail', 'Record detail screen coming soon!');
                }}
                onEdit={() => {
                  // Navigate to edit record
                  Alert.alert('Edit Record', 'Edit record form coming soon!');
                }}
                onDelete={() => handleDeleteRecord(record)}
              />
            ))
          )}
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scan', { petId })}
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>Start Health Scan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  petName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  petMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  breedText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  notesText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 18,
  },
  filterTabs: {
    marginBottom: 12,
  },
  filterTabsContent: {
    paddingRight: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  emptyRecords: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
  },
  emptyRecordsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyRecordsSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  scanButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

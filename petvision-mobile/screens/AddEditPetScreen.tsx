// ============================================================================
// AddEditPetScreen - Screen for adding or editing pet profiles
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  AccessibilityInfo,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PetService, PetServiceError } from '../services/PetService';
import { PetAvatar } from '../components/PetProfile';
import { PetProfile, CreatePetInput, UpdatePetInput, Species, PetGender, WeightUnit, RootStackParamList } from '../types/pet';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'AddEditPet'>;
  route: { params: { petId?: string } };
}

export const AddEditPetScreen: React.FC<Props> = ({ navigation, route }) => {
  const petId = route.params?.petId;
  const isEditing = !!petId;

  // Form state
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>(Species.DOG);
  const [breed, setBreed] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState<PetGender>(PetGender.UNKNOWN);
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(WeightUnit.KG);
  const [microchipId, setMicrochipId] = useState('');
  const [notes, setNotes] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock user ID - replace with actual auth
  const userId = 'mock-user-id';

  // Load existing pet data
  const loadPetData = useCallback(async () => {
    if (!petId) return;

    try {
      setLoading(true);
      const pet = await PetService.getPetById(petId);
      if (pet) {
        setName(pet.name);
        setSpecies(pet.species);
        setBreed(pet.breed || '');
        setDateOfBirth(new Date(pet.date_of_birth));
        setGender(pet.gender || PetGender.UNKNOWN);
        setWeight(pet.weight?.toString() || '');
        setWeightUnit(pet.weight_unit || WeightUnit.KG);
        setMicrochipId(pet.microchip_id || '');
        setNotes(pet.notes || '');
        setAvatarUri(pet.avatar_url);
      }
    } catch (err) {
      console.error('Error loading pet:', err);
      Alert.alert('Error', 'Failed to load pet data. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [petId, navigation]);

  useEffect(() => {
    loadPetData();
  }, [loadPetData]);

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Camera permission is required to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Pet name is required';
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const now = new Date();
      if (dateOfBirth > now) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    if (weight && parseFloat(weight) <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save pet
  const handleSave = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      AccessibilityInfo.announceForAccessibility('Please fix the errors before saving');
      return;
    }

    try {
      setSaving(true);
      let avatarUrl = avatarUri;

      // Upload avatar if new one selected
      if (avatarUri && !avatarUri.startsWith('http')) {
        const tempId = petId || `temp-${Date.now()}`;
        avatarUrl = await PetService.uploadAvatar(userId, tempId, avatarUri);
      }

      if (isEditing && petId) {
        const updateData: UpdatePetInput = {
          id: petId,
          name: name.trim(),
          species,
          breed: breed.trim() || undefined,
          date_of_birth: dateOfBirth.toISOString(),
          gender,
          weight: weight ? parseFloat(weight) : undefined,
          weight_unit: weight ? weightUnit : undefined,
          microchip_id: microchipId.trim() || undefined,
          notes: notes.trim() || undefined,
          avatar_url: avatarUrl,
        };
        await PetService.updatePet(updateData);
      } else {
        const createData: CreatePetInput = {
          name: name.trim(),
          species,
          breed: breed.trim() || undefined,
          date_of_birth: dateOfBirth.toISOString(),
          gender,
          weight: weight ? parseFloat(weight) : undefined,
          weight_unit: weight ? weightUnit : undefined,
          microchip_id: microchipId.trim() || undefined,
          notes: notes.trim() || undefined,
          avatar_url: avatarUrl,
        };
        await PetService.createPet(userId, createData);
      }

      navigation.goBack();
    } catch (err) {
      console.error('Error saving pet:', err);
      const errorMessage =
        err instanceof PetServiceError
          ? err.message
          : 'Failed to save pet. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDateDisplay = (date: Date | null) => {
    if (!date) return 'Select date of birth';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Pet' : 'Add New Pet'}
          </Text>
          <TouchableOpacity
            style={[styles.headerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
            accessible={true}
            accessibilityLabel="Save pet"
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <PetAvatar
              uri={avatarUri}
              name={name || 'Pet'}
              species={species}
              size="xl"
            />
            <View style={styles.avatarButtons}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={takePhoto}
                accessible={true}
                accessibilityLabel="Take photo"
                accessibilityRole="button"
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.avatarButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={pickImage}
                accessible={true}
                accessibilityLabel="Choose from gallery"
                accessibilityRole="button"
              >
                <Ionicons name="image" size={18} color="#FFFFFF" />
                <Text style={styles.avatarButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter pet name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
              accessible={true}
              accessibilityLabel="Pet name"
              accessibilityState={{ invalid: !!errors.name }}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Species */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Species *</Text>
            <View style={styles.speciesContainer}>
              {Object.values(Species).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.speciesButton,
                    species === s && styles.speciesButtonActive,
                  ]}
                  onPress={() => setSpecies(s)}
                  accessible={true}
                  accessibilityLabel={s}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: species === s }}
                >
                  <Text
                    style={[
                      styles.speciesButtonText,
                      species === s && styles.speciesButtonTextActive,
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Breed */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter breed (optional)"
              value={breed}
              onChangeText={setBreed}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              accessible={true}
              accessibilityLabel="Pet breed"
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date of Birth *</Text>
            <TouchableOpacity
              style={[styles.input, styles.dateInput, errors.dateOfBirth && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              accessible={true}
              accessibilityLabel="Date of birth"
              accessibilityHint={formatDateDisplay(dateOfBirth)}
              accessibilityRole="button"
              accessibilityState={{ invalid: !!errors.dateOfBirth }}
            >
              <Text
                style={[
                  styles.dateText,
                  !dateOfBirth && styles.dateTextPlaceholder,
                ]}
              >
                {formatDateDisplay(dateOfBirth)}
              </Text>
              <Ionicons name="calendar" size={20} color="#6B7280" />
            </TouchableOpacity>
            {errors.dateOfBirth && (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            )}
          </View>

          {/* Gender */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {Object.values(PetGender).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender(g)}
                  accessible={true}
                  accessibilityLabel={g}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: gender === g }}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === g && styles.genderButtonTextActive,
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weight */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Weight</Text>
            <View style={styles.weightContainer}>
              <TextInput
                style={[styles.input, styles.weightInput, errors.weight && styles.inputError]}
                placeholder="0"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
                accessible={true}
                accessibilityLabel="Pet weight"
                accessibilityState={{ invalid: !!errors.weight }}
              />
              {Object.values(WeightUnit).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.weightUnitButton,
                    weightUnit === unit && styles.weightUnitButtonActive,
                  ]}
                  onPress={() => setWeightUnit(unit)}
                  accessible={true}
                  accessibilityLabel={unit}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: weightUnit === unit }}
                >
                  <Text
                    style={[
                      styles.weightUnitButtonText,
                      weightUnit === unit && styles.weightUnitButtonTextActive,
                    ]}
                  >
                    {unit.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.weight && (
              <Text style={styles.errorText}>{errors.weight}</Text>
            )}
          </View>

          {/* Microchip ID */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Microchip ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter microchip ID (optional)"
              value={microchipId}
              onChangeText={setMicrochipId}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              accessible={true}
              accessibilityLabel="Microchip ID"
            />
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any notes about your pet..."
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessible={true}
              accessibilityLabel="Pet notes"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
  },
  avatarButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EF4444',
  },
  speciesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  speciesButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  speciesButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  speciesButtonTextActive: {
    color: '#2563EB',
  },
  dateInput: {
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  dateTextPlaceholder: {
    color: '#9CA3AF',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: '#2563EB',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightInput: {
    flex: 1,
  },
  weightUnitButton: {
    width: 60,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weightUnitButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  weightUnitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  weightUnitButtonTextActive: {
    color: '#2563EB',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
});

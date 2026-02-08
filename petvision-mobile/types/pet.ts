// ============================================================================
// Pet Profile Management Types
// ============================================================================

import { Species } from '@petvision/shared';

// ----------------------------------------------------------------------------
// Enums
// ----------------------------------------------------------------------------

export enum PetGender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum WeightUnit {
  KG = 'kg',
  LBS = 'lbs',
}

export enum MedicalRecordType {
  VACCINATION = 'vaccination',
  VET_VISIT = 'vet_visit',
  CONDITION = 'condition',
  MEDICATION = 'medication',
  ALLERGY = 'allergy',
}

// ----------------------------------------------------------------------------
// Pet Profile Extended Types
// ----------------------------------------------------------------------------

export interface PetProfile extends Omit<import('@petvision/shared').PetProfile, 'date_of_birth'> {
  date_of_birth: string;
  gender?: PetGender;
  weight?: number;
  weight_unit?: WeightUnit;
  microchip_id?: string;
  notes?: string;
  avatar_url?: string;
  species: Species;
  last_scan_date?: string;
  age_years?: number;
  age_months?: number;
}

export interface CreatePetInput {
  name: string;
  species: Species;
  breed?: string;
  date_of_birth: string;
  gender?: PetGender;
  weight?: number;
  weight_unit?: WeightUnit;
  microchip_id?: string;
  notes?: string;
  avatar_url?: string;
}

export interface UpdatePetInput extends Partial<CreatePetInput> {
  id: string;
}

// ----------------------------------------------------------------------------
// Medical History Types
// ----------------------------------------------------------------------------

export interface MedicalRecord {
  id: string;
  pet_id: string;
  record_type: MedicalRecordType;
  title: string;
  description?: string;
  date: string;
  veterinarian?: string;
  next_due_date?: string;
  attachments?: string[];
  created_at: string;
  updated_at?: string;
}

export interface CreateMedicalRecordInput {
  pet_id: string;
  record_type: MedicalRecordType;
  title: string;
  description?: string;
  date: string;
  veterinarian?: string;
  next_due_date?: string;
  attachments?: string[];
}

export interface UpdateMedicalRecordInput extends Partial<CreateMedicalRecordInput> {
  id: string;
}

// ----------------------------------------------------------------------------
// UI State Types
// ----------------------------------------------------------------------------

export interface PetListState {
  pets: PetProfile[];
  loading: boolean;
  error?: string;
  refreshing: boolean;
  searchQuery: string;
  selectedSpecies?: Species;
}

export interface PetFormState {
  name: string;
  species: Species;
  breed: string;
  dateOfBirth: Date | null;
  gender: PetGender;
  weight: string;
  weightUnit: WeightUnit;
  microchipId: string;
  notes: string;
  avatarUri?: string;
  errors: Record<string, string>;
}

// ----------------------------------------------------------------------------
// Component Props Types
// ----------------------------------------------------------------------------

export interface PetCardProps {
  pet: PetProfile;
  onPress: () => void;
  onScan: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface PetAvatarProps {
  uri?: string;
  name: string;
  species: Species;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface MedicalHistoryCardProps {
  record: MedicalRecord;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface PetSelectionModalProps {
  visible: boolean;
  pets: PetProfile[];
  selectedPetId?: string;
  onSelect: (pet: PetProfile) => void;
  onAddNew: () => void;
  onClose: () => void;
}

export interface ScanHistoryProps {
  lastScanDate?: string;
  scanCount: number;
  onScan: () => void;
}

// ----------------------------------------------------------------------------
// Navigation Types
// ----------------------------------------------------------------------------

export type RootStackParamList = {
  PetList: undefined;
  AddEditPet: { petId?: string };
  PetDetail: { petId: string };
  MedicalHistory: { petId: string };
  Scan: { petId: string };
};

export type PetListNavigationProp = any;
export type PetDetailNavigationProp = any;
export type AddEditPetNavigationProp = any;

// ============================================================================
// PetService - Supabase CRUD Operations for Pet Profiles
// ============================================================================

import { supabase } from '../lib/supabase/client';
import type {
  PetProfile,
  CreatePetInput,
  UpdatePetInput,
  MedicalRecord,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  MedicalRecordType,
  PetGender,
  WeightUnit,
} from '../types/pet';

// ============================================================================
// Error Types
// ============================================================================

export class PetServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'PetServiceError';
  }
}

// ============================================================================
// Pet Profile Operations
// ============================================================================

export class PetService {
  /**
   * Fetch all pets for the current user
   */
  static async getPets(userId: string): Promise<PetProfile[]> {
    try {
      const { data, error } = await supabase
        .from('pet_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new PetServiceError(error.message, error.code);

      return (data || []).map(this.transformPetData);
    } catch (error) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  }

  /**
   * Get a single pet by ID
   */
  static async getPetById(petId: string): Promise<PetProfile | null> {
    try {
      const { data, error } = await supabase
        .from('pet_profiles')
        .select('*')
        .eq('id', petId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new PetServiceError(error.message, error.code);
      }

      return this.transformPetData(data);
    } catch (error) {
      console.error('Error fetching pet:', error);
      throw error;
    }
  }

  /**
   * Create a new pet profile
   */
  static async createPet(
    userId: string,
    input: CreatePetInput
  ): Promise<PetProfile> {
    try {
      const { data, error } = await supabase
        .from('pet_profiles')
        .insert({
          user_id: userId,
          name: input.name,
          species: input.species,
          breed: input.breed,
          date_of_birth: input.date_of_birth,
          gender: input.gender,
          weight: input.weight,
          weight_unit: input.weight_unit,
          microchip_id: input.microchip_id,
          notes: input.notes,
          avatar_url: input.avatar_url,
        })
        .select()
        .single();

      if (error) throw new PetServiceError(error.message, error.code);

      return this.transformPetData(data);
    } catch (error) {
      console.error('Error creating pet:', error);
      throw error;
    }
  }

  /**
   * Update an existing pet profile
   */
  static async updatePet(input: UpdatePetInput): Promise<PetProfile> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.breed !== undefined) updateData.breed = input.breed;
      if (input.gender !== undefined) updateData.gender = input.gender;
      if (input.weight !== undefined) updateData.weight = input.weight;
      if (input.weight_unit !== undefined) updateData.weight_unit = input.weight_unit;
      if (input.microchip_id !== undefined) updateData.microchip_id = input.microchip_id;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.avatar_url !== undefined) updateData.avatar_url = input.avatar_url;

      const { data, error } = await supabase
        .from('pet_profiles')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new PetServiceError(error.message, error.code);

      return this.transformPetData(data);
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  }

  /**
   * Delete a pet profile
   */
  static async deletePet(petId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pet_profiles')
        .delete()
        .eq('id', petId);

      if (error) throw new PetServiceError(error.message, error.code);
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  }

  /**
   * Upload pet avatar image
   */
  static async uploadAvatar(
    userId: string,
    petId: string,
    uri: string
  ): Promise<string> {
    try {
      const fileExt = uri.split('.').pop();
      const fileName = `${userId}/${petId}/avatar.${fileExt}`;
      const filePath = `pet-avatars/${fileName}`;

      // Get file info to determine MIME type
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: `image/${fileExt}`,
        name: `avatar.${fileExt}`,
      } as any);

      const { data, error } = await supabase.storage
        .from('pet-avatars')
       .upload(filePath, formData as any);

      if (error) throw new PetServiceError(error.message, error.code);

      const { data: publicUrl } = supabase.storage
        .from('pet-avatars')
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  // ============================================================================
  // Medical Record Operations
  // ============================================================================

  /**
   * Fetch all medical records for a pet
   */
  static async getMedicalRecords(
    petId: string,
    filters?: {
      type?: MedicalRecordType;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<MedicalRecord[]> {
    try {
      let query = supabase
        .from('health_events')
        .select('*')
        .eq('pet_id', petId)
        .order('date', { ascending: false });

      if (filters?.type) {
        query = query.eq('record_type', filters.type);
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw new PetServiceError(error.message, error.code);

      return (data || []).map(this.transformMedicalRecordData);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw error;
    }
  }

  /**
   * Create a medical record
   */
  static async createMedicalRecord(
    input: CreateMedicalRecordInput
  ): Promise<MedicalRecord> {
    try {
      const { data, error } = await supabase
        .from('health_events')
        .insert(input)
        .select()
        .single();

      if (error) throw new PetServiceError(error.message, error.code);

      return this.transformMedicalRecordData(data);
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw error;
    }
  }

  /**
   * Update a medical record
   */
  static async updateMedicalRecord(
    input: UpdateMedicalRecordInput
  ): Promise<MedicalRecord> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.date !== undefined) updateData.date = input.date;
      if (input.veterinarian !== undefined) updateData.veterinarian = input.veterinarian;
      if (input.next_due_date !== undefined) updateData.next_due_date = input.next_due_date;
      if (input.attachments !== undefined) updateData.attachments = input.attachments;

      const { data, error } = await supabase
        .from('health_events')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new PetServiceError(error.message, error.code);

      return this.transformMedicalRecordData(data);
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  }

  /**
   * Delete a medical record
   */
  static async deleteMedicalRecord(recordId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('health_events')
        .delete()
        .eq('id', recordId);

      if (error) throw new PetServiceError(error.message, error.code);
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw error;
    }
  }

  /**
   * Get vet visits count
   */
  static async getVetVisitsCount(petId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('vet_visits')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', petId);

      if (error) throw new PetServiceError(error.message, error.code);

      return count || 0;
    } catch (error) {
      console.error('Error fetching vet visits count:', error);
      throw error;
    }
  }

  // ============================================================================
  // Real-time Subscriptions
  // ============================================================================

  /**
   * Subscribe to pet changes
   */
  static subscribeToPets(
    userId: string,
    callback: (pet: PetProfile) => void
  ): () => void {
    const subscription = supabase
      .channel(`pets:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pet_profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(this.transformPetData(payload.new as any));
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Transform pet data from database to app format
   */
  private static transformPetData(data: any): PetProfile {
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    const ageInMonths =
      (today.getFullYear() - birthDate.getFullYear()) * 12 +
      (today.getMonth() - birthDate.getMonth());

    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      species: data.species,
      breed: data.breed,
      date_of_birth: data.date_of_birth,
      gender: data.gender || undefined,
      weight: data.weight || undefined,
      weight_unit: data.weight_unit || undefined,
      microchip_id: data.microchip_id || undefined,
      notes: data.notes || undefined,
      avatar_url: data.avatar_url || undefined,
      age_years: Math.floor(ageInMonths / 12),
      age_months: ageInMonths % 12,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Transform medical record data from database to app format
   */
  private static transformMedicalRecordData(data: any): MedicalRecord {
    return {
      id: data.id,
      pet_id: data.pet_id,
      record_type: data.record_type,
      title: data.title,
      description: data.description || undefined,
      date: data.date,
      veterinarian: data.veterinarian || undefined,
      next_due_date: data.next_due_date || undefined,
      attachments: data.attachments || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

export default PetService;

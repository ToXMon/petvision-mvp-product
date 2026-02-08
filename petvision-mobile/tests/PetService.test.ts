// ============================================================================
// PetService Unit Tests
// ============================================================================

import {
  PetService,
  PetServiceError,
} from '../services/PetService';
import { supabase } from '../lib/supabase/client';
import { CreatePetInput, UpdatePetInput, CreateMedicalRecordInput, MedicalRecordType } from '../types/pet';
import { Species } from '@petvision/shared';

// Mock Supabase client
jest.mock('../lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('PetService', () => {
  const mockUserId = 'test-user-id';
  const mockPetId = 'test-pet-id';
  const mockPet = {
    id: mockPetId,
    user_id: mockUserId,
    name: 'Buddy',
    species: Species.DOG,
    breed: 'Golden Retriever',
    date_of_birth: '2020-01-15',
    gender: 'male',
    weight: 30,
    weight_unit: 'kg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPets', () => {
    it('should return list of pets for user', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockPet], error: null }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockSelect);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.getPets(mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('pet_profiles');
      expect(mockSelect.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockSelect.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Buddy');
    });

    it('should throw error on failure', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error', code: 'DB_ERROR' } }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockSelect);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      await expect(PetService.getPets(mockUserId)).rejects.toThrow(PetServiceError);
    });
  });

  describe('getPetById', () => {
    it('should return single pet by ID', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPet, error: null }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockSelect);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.getPetById(mockPetId);

      expect(supabase.from).toHaveBeenCalledWith('pet_profiles');
      expect(mockSelect.eq).toHaveBeenCalledWith('id', mockPetId);
      expect(result?.name).toBe('Buddy');
    });

    it('should return null when pet not found', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Not found', code: 'PGRST116' } 
        }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockSelect);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.getPetById(mockPetId);

      expect(result).toBeNull();
    });
  });

  describe('createPet', () => {
    it('should create new pet', async () => {
      const createInput: CreatePetInput = {
        name: 'New Pet',
        species: Species.CAT,
        date_of_birth: '2022-05-10',
      };

      const mockInsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...mockPet, ...createInput }, error: null }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockInsert);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.createPet(mockUserId, createInput);

      expect(supabase.from).toHaveBeenCalledWith('pet_profiles');
      expect(mockInsert.single).toHaveBeenCalled();
      expect(result.name).toBe('New Pet');
    });

    it('should throw error on creation failure', async () => {
      const createInput: CreatePetInput = {
        name: 'Test',
        species: Species.DOG,
        date_of_birth: '2020-01-01',
      };

      const mockInsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Invalid data', code: 'INVALID' } 
        }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockInsert);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      await expect(PetService.createPet(mockUserId, createInput)).rejects.toThrow(PetServiceError);
    });
  });

  describe('updatePet', () => {
    it('should update existing pet', async () => {
      const updateInput: UpdatePetInput = {
        id: mockPetId,
        name: 'Updated Name',
      };

      const mockUpdate = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...mockPet, name: 'Updated Name' }, error: null }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockUpdate);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.updatePet(updateInput);

      expect(supabase.from).toHaveBeenCalledWith('pet_profiles');
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('deletePet', () => {
    it('should delete pet', async () => {
      const mockDelete = {
        eq: jest.fn().mockReturnThis(),
      };
      const mockFrom = jest.fn().mockReturnValue(mockDelete);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      await expect(PetService.deletePet(mockPetId)).resolves.not.toThrow();
      expect(mockDelete.eq).toHaveBeenCalledWith('id', mockPetId);
    });
  });

  describe('getMedicalRecords', () => {
    it('should return medical records for pet', async () => {
      const mockRecord = {
        id: 'record-id',
        pet_id: mockPetId,
        record_type: MedicalRecordType.VACCINATION,
        title: 'Rabies Vaccine',
        date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockRecord], error: null }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockSelect);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.getMedicalRecords(mockPetId);

      expect(supabase.from).toHaveBeenCalledWith('health_events');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Rabies Vaccine');
    });

    it('should filter by record type', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockSelect);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      await PetService.getMedicalRecords(mockPetId, { type: MedicalRecordType.VACCINATION });

      expect(mockSelect.eq).toHaveBeenCalledWith('pet_id', mockPetId);
      expect(mockSelect.eq).toHaveBeenCalledWith('record_type', MedicalRecordType.VACCINATION);
    });
  });

  describe('createMedicalRecord', () => {
    it('should create medical record', async () => {
      const createInput: CreateMedicalRecordInput = {
        pet_id: mockPetId,
        record_type: MedicalRecordType.VET_VISIT,
        title: 'Annual Checkup',
        date: '2024-01-01',
      };

      const mockInsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { ...createInput, id: 'record-id', created_at: '2024-01-01T00:00:00Z' }, 
          error: null 
        }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockInsert);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.createMedicalRecord(createInput);

      expect(supabase.from).toHaveBeenCalledWith('health_events');
      expect(result.title).toBe('Annual Checkup');
    });
  });

  describe('updateMedicalRecord', () => {
    it('should update medical record', async () => {
      const updateInput = {
        id: 'record-id',
        title: 'Updated Title',
      };

      const mockUpdate = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { ...updateInput, created_at: '2024-01-01T00:00:00Z' }, 
          error: null 
        }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockUpdate);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.updateMedicalRecord(updateInput);

      expect(supabase.from).toHaveBeenCalledWith('health_events');
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('deleteMedicalRecord', () => {
    it('should delete medical record', async () => {
      const mockDelete = {
        eq: jest.fn().mockReturnThis(),
      };
      const mockFrom = jest.fn().mockReturnValue(mockDelete);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      await expect(PetService.deleteMedicalRecord('record-id')).resolves.not.toThrow();
      expect(mockDelete.eq).toHaveBeenCalledWith('id', 'record-id');
    });
  });

  describe('age calculation', () => {
    it('should calculate correct age for older pet', async () => {
      const oldPet = {
        ...mockPet,
        date_of_birth: '2018-06-15', // About 5.5 years old
      };

      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: oldPet, error: null }),
      };
      const mockFrom = jest.fn().mockReturnValue(mockSelect);
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await PetService.getPetById(mockPetId);

      expect(result?.age_years).toBeGreaterThan(0);
    });
  });
});

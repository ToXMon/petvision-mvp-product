/**
 * Unit Tests for Vision Prompts
 * Story 5: PetVision AI-powered pet health screening
 */

import { describe, it, expect } from '@jest/globals';
import { getAnalysisPrompt } from '../prompts';
import { ScanType } from '../../../types/vision-analysis';

describe('getAnalysisPrompt', () => {
  it('should generate prompt for eye analysis', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'eye',
      petBreed: 'Golden Retriever',
      petAge: '5 years',
    });

    expect(prompt).toContain('EYE ANALYSIS INSTRUCTIONS');
    expect(prompt).toContain('Breed: Golden Retriever');
    expect(prompt).toContain('Age: 5 years');
    expect(prompt).toContain('analysis_summary');
    expect(prompt).toContain('overall_severity');
    expect(prompt).toContain('findings');
  });

  it('should generate prompt for skin analysis', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'skin',
    });

    expect(prompt).toContain('SKIN ANALYSIS INSTRUCTIONS');
    expect(prompt).toContain('No additional pet information provided');
  });

  it('should generate prompt for teeth analysis', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'teeth',
      petBreed: 'Poodle',
      petAge: '3 years',
      medicalHistory: 'Previous dental cleaning',
    });

    expect(prompt).toContain('TEETH AND ORAL CAVITY ANALYSIS INSTRUCTIONS');
    expect(prompt).toContain('Medical History: Previous dental cleaning');
  });

  it('should generate prompt for gait analysis', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'gait',
    });

    expect(prompt).toContain('GAIT AND MOBILITY ANALYSIS INSTRUCTIONS');
  });

  it('should generate prompt for multi analysis', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'multi',
      petBreed: 'German Shepherd',
    });

    expect(prompt).toContain('COMPREHENSIVE MULTI-AREA ANALYSIS INSTRUCTIONS');
  });

  it('should include JSON format instructions', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'eye',
    });

    expect(prompt).toContain('Return ONLY a valid JSON object');
    expect(prompt).toContain('analysis_summary');
    expect(prompt).toContain('overall_severity');
    expect(prompt).toContain('confidence_score');
    expect(prompt).toContain('recommendations');
  });

  it('should include severity color instructions', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'skin',
    });

    expect(prompt).toContain('GREEN: No concerns or minor issues');
    expect(prompt).toContain('YELLOW: Monitor closely');
    expect(prompt).toContain('RED: Immediate veterinary attention');
  });

  it('should handle missing pet information', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'eye',
    });

    expect(prompt).toContain('No additional pet information provided');
  });

  it('should include base system prompt', () => {
    const prompt = getAnalysisPrompt({
      scanType: 'teeth',
    });

    expect(prompt).toContain('specialized veterinary AI assistant');
    expect(prompt).toContain('PetVision');
  });
});

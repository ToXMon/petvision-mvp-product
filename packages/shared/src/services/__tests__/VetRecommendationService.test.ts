// ============================================================================
// VetRecommendationService Tests
// ============================================================================

import { VetRecommendationService } from '../VetRecommendationService';
import {
  RecommendationInput,
  UrgencyLevel,
  Severity,
  Finding,
  ScanType,
  TrendType,
  Species
} from '../../index';

// ----------------------------------------------------------------------------
// Test Data Helpers
// ----------------------------------------------------------------------------

const createMockFinding = (
  condition: string,
  severity: Severity,
  confidence: number = 0.85
): Finding => ({
  id: `finding-${Math.random()}`,
  condition,
  description: `Detected ${condition}`,
  confidence,
  severity
});

const createMockScanResult = (
  scanType: ScanType,
  severity: Severity,
  findings: Finding[]
) => ({
  id: `scan-${Math.random()}`,
  pet_id: 'pet-123',
  scan_type: scanType,
  severity,
  findings,
  image_url: 'https://example.com/image.jpg',
  created_at: new Date().toISOString()
});

const createMockPetProfile = (
  species: Species = Species.DOG,
  breed?: string,
  dateOfBirth?: string
) => ({
  id: 'pet-123',
  name: 'Buddy',
  species,
  breed,
  date_of_birth: dateOfBirth,
  avatar_url: 'https://example.com/avatar.jpg',
  created_at: new Date().toISOString()
});

// ----------------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------------

describe('VetRecommendationService', () => {
  let service: VetRecommendationService;

  beforeEach(() => {
    service = new VetRecommendationService();
  });

  describe('Green Severity Tests', () => {
    it('should generate monitor recommendation for healthy scan', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.GREEN,
        [createMockFinding('clear eyes', Severity.GREEN, 0.95)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = {
        scanResult,
        petProfile
      };

      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.overall_severity).toBe(Severity.GREEN);
      expect(recommendation.urgency_level).toBe(UrgencyLevel.MONITOR);
      expect(recommendation.timeframe).toBe('Monitor at home');
      expect(recommendation.confidence_score).toBeGreaterThanOrEqual(90);
      expect(recommendation.emergency_warning).toBeUndefined();
    });

    it('should handle minor eye irritation with monitoring', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.GREEN,
        [createMockFinding('slight redness', Severity.GREEN, 0.88)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.urgency_level).toBe(UrgencyLevel.MONITOR);
      expect(recommendation.primary_recommendation).toContain('Monitor');
      expect(recommendation.specific_actions).toHaveLength(1);
    });

    it('should handle dry skin with home care recommendations', async () => {
      const scanResult = createMockScanResult(
        ScanType.SKIN,
        Severity.GREEN,
        [createMockFinding('dry skin', Severity.GREEN, 0.92)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.urgency_level).toBe(UrgencyLevel.MONITOR);
      expect(recommendation.secondary_recommendations).toBeDefined();
      expect(recommendation.secondary_recommendations!.length).toBeGreaterThan(0);
    });
  });

  describe('Yellow Severity Tests', () => {
    it('should generate routine recommendation for moderate findings', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.YELLOW,
        [createMockFinding('eye discharge', Severity.YELLOW, 0.87)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.overall_severity).toBe(Severity.YELLOW);
      expect(recommendation.urgency_level).toBe(UrgencyLevel.ROUTINE);
      expect(recommendation.timeframe).toContain('2 weeks');
      expect(recommendation.vet_consultation_required).toBe(true);
    });

    it('should handle plaque buildup with dental cleaning recommendation', async () => {
      const scanResult = createMockScanResult(
        ScanType.TEETH,
        Severity.YELLOW,
        [createMockFinding('plaque buildup', Severity.YELLOW, 0.90)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.urgency_level).toBe(UrgencyLevel.ROUTINE);
      expect(recommendation.primary_recommendation).toLowerCase().toContain('dental');
      expect(recommendation.specific_actions[0].action).toContain('cleaning');
    });

    it('should handle hair loss with 1-2 week timeframe', async () => {
      const scanResult = createMockScanResult(
        ScanType.SKIN,
        Severity.YELLOW,
        [createMockFinding('hair loss patches', Severity.YELLOW, 0.85)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.urgency_level).toBe(UrgencyLevel.ROUTINE);
      expect(recommendation.timeframe).toContain('1-2 weeks');
    });

    it('should handle reduced mobility with 1 week timeframe', async () => {
      const scanResult = createMockScanResult(
        ScanType.GAIT,
        Severity.YELLOW,
        [createMockFinding('reduced mobility', Severity.YELLOW, 0.88)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.urgency_level).toBe(UrgencyLevel.ROUTINE);
      expect(recommendation.timeframe).toContain('1 week');
    });
  });

  describe('Red Severity Tests', () => {
    it('should generate urgent recommendation for severe findings', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.RED,
        [createMockFinding('cloudiness vision loss', Severity.RED, 0.91)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.overall_severity).toBe(Severity.RED);
      expect(recommendation.urgency_level).toBe(UrgencyLevel.URGENT);
      expect(recommendation.timeframe).toContain('24-48');
      expect(recommendation.vet_consultation_required).toBe(true);
    });

    it('should generate emergency recommendation for trauma', async () => {
      const scanResult = createMockScanResult(
        ScanType.GAIT,
        Severity.RED,
        [createMockFinding('fracture trauma', Severity.RED, 0.95)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.overall_severity).toBe(Severity.RED);
      expect(recommendation.urgency_level).toBe(UrgencyLevel.EMERGENCY);
      expect(recommendation.timeframe).toBe('Immediately');
      expect(recommendation.emergency_warning).toBeDefined();
      expect(recommendation.emergency_warning).toContain('EMERGENCY');
    });

    it('should handle oral bleeding as emergency', async () => {
      const scanResult = createMockScanResult(
        ScanType.TEETH,
        Severity.RED,
        [createMockFinding('oral bleeding', Severity.RED, 0.93)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.urgency_level).toBe(UrgencyLevel.EMERGENCY);
      expect(recommendation.emergency_warning).toBeDefined();
    });

    it('should handle inability to walk as emergency', async () => {
      const scanResult = createMockScanResult(
        ScanType.GAIT,
        Severity.RED,
        [createMockFinding('unable to walk paralysis', Severity.RED, 0.97)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.urgency_level).toBe(UrgencyLevel.EMERGENCY);
      expect(recommendation.emergency_warning).toBeDefined();
    });

    it('should handle skin infection as urgent', async () => {
      const scanResult = createMockScanResult(
        ScanType.SKIN,
        Severity.RED,
        [createMockFinding('infection pus swelling', Severity.RED, 0.89)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.urgency_level).toBe(UrgencyLevel.URGENT);
      expect(recommendation.timeframe).toContain('24-48');
    });
  });

  describe('Mixed Severity Tests', () => {
    it('should escalate when multiple yellow findings present', async () => {
      const scanResult = createMockScanResult(
        ScanType.MULTI,
        Severity.GREEN,
        [
          createMockFinding('plaque buildup', Severity.YELLOW, 0.85),
          createMockFinding('minor limp', Severity.YELLOW, 0.82),
          createMockFinding('dry skin', Severity.YELLOW, 0.88)
        ]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.overall_severity).toBe(Severity.YELLOW);
      expect(recommendation.findings_analysis.yellow_count).toBe(3);
    });

    it('should escalate to red when red findings present', async () => {
      const scanResult = createMockScanResult(
        ScanType.MULTI,
        Severity.YELLOW,
        [
          createMockFinding('discharge', Severity.YELLOW, 0.80),
          createMockFinding('oral bleeding', Severity.RED, 0.95)
        ]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.overall_severity).toBe(Severity.RED);
      expect(recommendation.urgency_level).toBe(UrgencyLevel.EMERGENCY);
    });

    it('should provide specific actions for all findings', async () => {
      const scanResult = createMockScanResult(
        ScanType.MULTI,
        Severity.YELLOW,
        [
          createMockFinding('redness', Severity.GREEN, 0.90),
          createMockFinding('hair loss', Severity.YELLOW, 0.85),
          createMockFinding('plaque', Severity.YELLOW, 0.88)
        ]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.specific_actions).toHaveLength(3);
      expect(recommendation.findings_analysis.total_findings).toBe(3);
    });
  });

  describe('Confidence-Based Tests', () => {
    it('should indicate high confidence when >= 90%', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.GREEN,
        [createMockFinding('clear eyes', Severity.GREEN, 0.95)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.confidence_score).toBeGreaterThanOrEqual(90);
    });

    it('should indicate medium confidence (70-89%) with vet confirmation', async () => {
      const scanResult = createMockScanResult(
        ScanType.SKIN,
        Severity.YELLOW,
        [createMockFinding('rash', Severity.YELLOW, 0.75)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.confidence_score).toBeGreaterThanOrEqual(70);
      expect(recommendation.confidence_score).toBeLessThan(90);
      expect(recommendation.vet_consultation_required).toBe(true);
    });

    it('should indicate low confidence when < 70%', async () => {
      const scanResult = createMockScanResult(
        ScanType.GAIT,
        Severity.YELLOW,
        [createMockFinding('limp', Severity.YELLOW, 0.65)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.confidence_score).toBeLessThan(70);
      expect(recommendation.vet_consultation_required).toBe(true);
    });
  });

  describe('Trend-Based Adjustments', () => {
    it('should downgrade urgency when trend is improving', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.YELLOW,
        [createMockFinding('mild discharge', Severity.YELLOW, 0.85)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = {
        scanResult,
        petProfile,
        trendData: {
          type: TrendType.IMPROVEMENT,
          message: 'Condition improving',
          comparedScanId: 'prev-scan',
          severityChange: { from: Severity.RED, to: Severity.YELLOW }
        }
      };

      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.risk_factors).toContain('Condition showing improvement - continue current approach');
    });

    it('should escalate urgency when trend is declining', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.YELLOW,
        [createMockFinding('discharge', Severity.YELLOW, 0.82)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = {
        scanResult,
        petProfile,
        trendData: {
          type: TrendType.DECLINE,
          message: 'Condition worsening',
          comparedScanId: 'prev-scan',
          severityChange: { from: Severity.GREEN, to: Severity.YELLOW }
        }
      };

      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.risk_factors).toContain('Condition worsening - escalated monitoring recommended');
      expect(recommendation.urgency_level).toBe(UrgencyLevel.URGENT);
    });

    it('should maintain urgency when trend is stable', async () => {
      const scanResult = createMockScanResult(
        ScanType.SKIN,
        Severity.YELLOW,
        [createMockFinding('hair loss', Severity.YELLOW, 0.87)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = {
        scanResult,
        petProfile,
        trendData: {
          type: TrendType.STABLE,
          message: 'Condition stable',
          comparedScanId: 'prev-scan'
        }
      };

      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.risk_factors).toContain('Condition stable - maintain routine care');
    });
  });

  describe('Pet Profile Context Tests', () => {
    it('should add senior pet risk factor for older pets', async () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      const scanResult = createMockScanResult(
        ScanType.GAIT,
        Severity.YELLOW,
        [createMockFinding('stiffness', Severity.YELLOW, 0.85)]
      );
      const petProfile = createMockPetProfile(
        Species.DOG,
        'Golden Retriever',
        tenYearsAgo.toISOString()
      );

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.risk_factors).toContain('Senior pet (7+ years) - more cautious approach recommended');
    });

    it('should add brachycephalic breed risk factor', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.YELLOW,
        [createMockFinding('redness', Severity.YELLOW, 0.83)]
      );
      const petProfile = createMockPetProfile(
        Species.DOG,
        'Pug'
      );

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.risk_factors).toContain('Brachycephalic breed - elevated respiratory and eye health risks');
    });

    it('should add feline risk factor for cats', async () => {
      const scanResult = createMockScanResult(
        ScanType.SKIN,
        Severity.YELLOW,
        [createMockFinding('hair loss', Severity.YELLOW, 0.88)]
      );
      const petProfile = createMockPetProfile(
        Species.CAT,
        'Domestic Shorthair'
      );

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.risk_factors).toContain('Feline - cats often hide symptoms, recommend closer monitoring');
    });

    it('should add large breed risk factor', async () => {
      const scanResult = createMockScanResult(
        ScanType.GAIT,
        Severity.YELLOW,
        [createMockFinding('minor limp', Severity.YELLOW, 0.86)]
      );
      const petProfile = createMockPetProfile(
        Species.DOG,
        'Great Dane'
      );

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.risk_factors).toContain('Large breed - elevated joint and cardiac concerns');
    });
  });

  describe('Findings Analysis Tests', () => {
    it('should correctly count findings by severity', async () => {
      const scanResult = createMockScanResult(
        ScanType.MULTI,
        Severity.YELLOW,
        [
          createMockFinding('issue1', Severity.GREEN, 0.90),
          createMockFinding('issue2', Severity.YELLOW, 0.85),
          createMockFinding('issue3', Severity.YELLOW, 0.88),
          createMockFinding('issue4', Severity.RED, 0.92)
        ]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.findings_analysis.total_findings).toBe(4);
      expect(recommendation.findings_analysis.green_count).toBe(1);
      expect(recommendation.findings_analysis.yellow_count).toBe(2);
      expect(recommendation.findings_analysis.red_count).toBe(1);
    });

    it('should categorize findings correctly', async () => {
      const scanResult = createMockScanResult(
        ScanType.MULTI,
        Severity.YELLOW,
        [
          createMockFinding('eye discharge', Severity.YELLOW, 0.85),
          createMockFinding('skin rash', Severity.YELLOW, 0.88),
          createMockFinding('dental plaque', Severity.YELLOW, 0.90)
        ]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.findings_analysis.by_category.eye.total).toBe(1);
      expect(recommendation.findings_analysis.by_category.skin.total).toBe(1);
      expect(recommendation.findings_analysis.by_category.teeth.total).toBe(1);
    });
  });

  describe('Escalation Path Tests', () => {
    it('should provide escalation path for monitor level', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.GREEN,
        [createMockFinding('slight redness', Severity.GREEN, 0.88)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.escalation_path).toBeDefined();
      expect(recommendation.escalation_path).toContain('worsens');
    });

    it('should provide escalation path for emergency level', async () => {
      const scanResult = createMockScanResult(
        ScanType.GAIT,
        Severity.RED,
        [createMockFinding('fracture', Severity.RED, 0.95)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.escalation_path).toBeDefined();
      expect(recommendation.escalation_path).toContain('emergency');
    });
  });

  describe('Batch Processing Tests', () => {
    it('should generate recommendations for multiple scans', async () => {
      const scan1 = createMockScanResult(
        ScanType.EYE,
        Severity.GREEN,
        [createMockFinding('clear', Severity.GREEN, 0.95)]
      );
      const scan2 = createMockScanResult(
        ScanType.TEETH,
        Severity.YELLOW,
        [createMockFinding('plaque', Severity.YELLOW, 0.88)]
      );
      const petProfile = createMockPetProfile();

      const inputs: RecommendationInput[] = [
        { scanResult: scan1, petProfile },
        { scanResult: scan2, petProfile }
      ];

      const recommendations = await service.generateBatchRecommendations(inputs);

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].overall_severity).toBe(Severity.GREEN);
      expect(recommendations[1].overall_severity).toBe(Severity.YELLOW);
    });

    it('should handle errors in batch processing gracefully', async () => {
      const scan1 = createMockScanResult(
        ScanType.EYE,
        Severity.GREEN,
        [createMockFinding('clear', Severity.GREEN, 0.95)]
      );
      const scan2 = createMockScanResult(
        ScanType.TEETH,
        Severity.YELLOW,
        [createMockFinding('plaque', Severity.YELLOW, 0.88)]
      );
      const petProfile = createMockPetProfile();

      // Create invalid input (will cause error)
      const invalidScan = { ...scan2, findings: null } as any;

      const inputs: RecommendationInput[] = [
        { scanResult: scan1, petProfile },
        { scanResult: invalidScan, petProfile },
        { scanResult: scan2, petProfile }
      ];

      const recommendations = await service.generateBatchRecommendations(inputs);

      // Should return valid recommendations and skip invalid ones
      expect(recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Rule Validation Tests', () => {
    it('should validate rules successfully', () => {
      expect(service.validateRules()).toBe(true);
    });

    it('should return current rules', () => {
      const rules = service.getRules();
      expect(rules).toBeDefined();
      expect(rules.categoryRules).toBeDefined();
      expect(rules.confidenceRules).toBeDefined();
      expect(rules.riskFactors).toBeDefined();
      expect(rules.escalationPaths).toBeDefined();
    });

    it('should throw error when updating with invalid rules', () => {
      const invalidRules = {
        categoryRules: [],
        confidenceRules: [],
        riskFactors: [],
        escalationPaths: {},
        severityThresholds: { maxGreenYellowMixed: -1, maxYellowRedMixed: -1 }
      };

      expect(() => {
        service.updateRules(invalidRules);
      }).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle scan with no findings', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.GREEN,
        []
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.findings_analysis.total_findings).toBe(0);
      expect(recommendation.confidence_score).toBe(0);
      expect(recommendation.urgency_level).toBe(UrgencyLevel.MONITOR);
    });

    it('should handle missing date of birth', async () => {
      const scanResult = createMockScanResult(
        ScanType.SKIN,
        Severity.YELLOW,
        [createMockFinding('rash', Severity.YELLOW, 0.85)]
      );
      const petProfile = createMockPetProfile(
        Species.DOG,
        'Labrador',
        undefined // No date of birth
      );

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation).toBeDefined();
      expect(recommendation.overall_severity).toBe(Severity.YELLOW);
    });

    it('should handle unknown condition types', async () => {
      const scanResult = createMockScanResult(
        ScanType.EYE,
        Severity.YELLOW,
        [createMockFinding('unknown condition xyz', Severity.YELLOW, 0.75)]
      );
      const petProfile = createMockPetProfile();

      const input: RecommendationInput = { scanResult, petProfile };
      const recommendation = await service.generateRecommendation(input);

      expect(recommendation.specific_actions).toHaveLength(1);
      expect(recommendation.specific_actions[0].action).toContain('consult');
    });
  });
});

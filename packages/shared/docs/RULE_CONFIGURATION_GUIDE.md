# Rule Configuration Guide

## Overview

This guide explains how to configure and customize the Vet Recommendation Engine rules to match your specific veterinary guidelines, regional requirements, or business needs.

## Table of Contents

1. [Rule Architecture](#rule-architecture)
2. [Category Rules](#category-rules)
3. [Confidence Rules](#confidence-rules)
4. [Risk Factor Rules](#risk-factor-rules)
5. [Severity Thresholds](#severity-thresholds)
6. [Escalation Paths](#escalation-paths)
7. [Validation & Testing](#validation--testing)
8. [Best Practices](#best-practices)

---

## Rule Architecture

The recommendation system uses a four-tier rule structure:

```
RecommendationRules
├── categoryRules[]          // Finding-specific recommendations
├── confidenceRules[]         // AI confidence handling
├── riskFactors[]            // Pet-specific risk modifiers
├── escalationPaths{}         // What to do if condition worsens
└── severityThresholds{}     // Mixed severity handling
```

### Rule Priority

Rules are evaluated in this order:
1. **Category-specific rules** (highest priority)
2. **Confidence rules** (adjusts vet consultation requirement)
3. **Risk factors** (adds context warnings)
4. **Severity thresholds** (escalates mixed severities)
5. **Escalation paths** (defines what-if scenarios)

---

## Category Rules

Category rules define recommendations for specific finding types and conditions.

### Structure

```typescript
interface CategoryRule {
  category: FindingCategory;  // 'eye', 'skin', 'teeth', 'gait'
  rules: SeverityRule[];
}

interface SeverityRule {
  condition: string;           // Regex pattern to match finding condition
  minSeverity: Severity;       // Minimum severity to trigger
  recommendation: {
    urgency: UrgencyLevel;
    timeframe: string;
    primaryAction: string;
    secondaryActions?: string[];
  };
}
```

### Creating Category Rules

#### Example: Adding Eye Allergy Rule

```typescript
import { addCategoryRule } from '@petvision/shared';
import { FindingCategory, UrgencyLevel, Severity } from '@petvision/shared';

// Get current rules
const currentRules = vetRecommendationService.getRules();

// Add new allergy rule
const updatedRules = addCategoryRule(
  currentRules,
  FindingCategory.EYE,
  {
    condition: 'allergy|allergic|conjunctivitis',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 1 week',
      primaryAction: 'Schedule allergy evaluation',
      secondaryActions: [
        'Identify potential allergens',
        'Flush eyes with sterile saline if irritation',
        'Monitor for excessive scratching'
      ]
    }
  }
);

// Apply the updated rules
vetRecommendationService.updateRules(updatedRules);
```

#### Example: Skin Parasite Rule

```typescript
const updatedRules = addCategoryRule(
  currentRules,
  FindingCategory.SKIN,
  {
    condition: 'flea|tick|mange|parasite',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.URGENT,
      timeframe: 'Within 48 hours',
      primaryAction: 'Start parasite treatment immediately',
      secondaryActions: [
        'Treat all pets in household',
        'Wash all bedding',
        'Vacuum thoroughly',
        'Re-treat in 2 weeks'
      ]
    }
  }
);
```

### Regex Pattern Matching

The `condition` field uses regex patterns to match finding descriptions:

```typescript
// Single keyword
condition: 'redness'
// Matches: "eye redness", "skin redness", "redness detected"

// Multiple keywords (OR)
condition: 'redness|irritation|inflammation'
// Matches: "eye redness", "skin irritation", "ear inflammation"

// Phrase matching
condition: 'unable to walk'
// Matches: "unable to walk", "dog unable to walk"

// Case-insensitive matching is automatic
condition: 'DISCHARGE'
// Matches: "discharge", "Discharge", "DISCHARGE"

// Word boundaries
condition: '\bdry skin\b'
// Matches: "dry skin" but not "dry skin patches"

// Complex pattern
condition: 'fracture|break|crack|splinter'
// Matches: "leg fracture", "broken bone", "cracked paw", "splinter in pad"
```

### Rule Ordering

Rules are evaluated in order. More specific rules should come first:

```typescript
// ❌ BAD ORDER - General rule catches everything first
[
  { condition: 'eye', ... },           // Too broad
  { condition: 'eye trauma', ... },     // Never reached
  { condition: 'eye ulcer', ... }       // Never reached
]

// ✅ GOOD ORDER - Specific to general
[
  { condition: 'eye trauma|ulcer', ... }, // Specific emergencies first
  { condition: 'eye discharge', ... },   // Then specific conditions
  { condition: 'eye', ... }               // General fallback last
]
```

### Severity-Based Triggers

The `minSeverity` parameter controls when a rule applies:

```typescript
// Only triggers on yellow or red findings
{
  condition: 'redness',
  minSeverity: Severity.YELLOW,
  // ... recommendation
}

// Triggers on any severity including green
{
  condition: 'dry skin',
  minSeverity: Severity.GREEN,
  // ... recommendation
}
```

---

## Confidence Rules

Confidence rules determine how AI confidence scores affect recommendations.

### Structure

```typescript
interface ConfidenceRule {
  minConfidence: number;       // 0-100
  maxConfidence: number;       // 0-100
  message: string;
  requiresVetConfirmation: boolean;
}
```

### Default Configuration

```typescript
const defaultConfidenceRules = [
  {
    minConfidence: 90,
    maxConfidence: 100,
    message: 'High confidence in AI analysis',
    requiresVetConfirmation: false
  },
  {
    minConfidence: 70,
    maxConfidence: 89.99,
    message: 'Recommendation reliable - veterinary confirmation suggested',
    requiresVetConfirmation: true
  },
  {
    minConfidence: 0,
    maxConfidence: 69.99,
    message: 'Analysis uncertain - please consult veterinarian',
    requiresVetConfirmation: true
  }
];
```

### Customizing Confidence Thresholds

```typescript
// Stricter thresholds (only 95%+ is high confidence)
const strictConfidenceRules = [
  {
    minConfidence: 95,
    maxConfidence: 100,
    message: 'Very high confidence in AI analysis',
    requiresVetConfirmation: false
  },
  {
    minConfidence: 80,
    maxConfidence: 94.99,
    message: 'Recommendation reliable - veterinary confirmation suggested',
    requiresVetConfirmation: true
  },
  {
    minConfidence: 0,
    maxConfidence: 79.99,
    message: 'Analysis uncertain - please consult veterinarian',
    requiresVetConfirmation: true
  }
];

// Apply to rules
const currentRules = vetRecommendationService.getRules();
const updatedRules = {
  ...currentRules,
  confidenceRules: strictConfidenceRules
};
vetRecommendationService.updateRules(updatedRules);
```

### Adding Confidence-Based Actions

You can add custom messages for different confidence ranges:

```typescript
const detailedConfidenceRules = [
  {
    minConfidence: 95,
    maxConfidence: 100,
    message: 'Excellent AI confidence - recommendation highly reliable',
    requiresVetConfirmation: false
  },
  {
    minConfidence: 90,
    maxConfidence: 94.99,
    message: 'High AI confidence - recommendation reliable',
    requiresVetConfirmation: false
  },
  {
    minConfidence: 80,
    maxConfidence: 89.99,
    message: 'Good AI confidence - veterinary confirmation recommended',
    requiresVetConfirmation: true
  },
  {
    minConfidence: 70,
    maxConfidence: 79.99,
    message: 'Moderate AI confidence - consult veterinarian',
    requiresVetConfirmation: true
  },
  {
    minConfidence: 50,
    maxConfidence: 69.99,
    message: 'Low AI confidence - veterinarian consultation required',
    requiresVetConfirmation: true
  },
  {
    minConfidence: 0,
    maxConfidence: 49.99,
    message: 'Very low AI confidence - immediate veterinarian consultation required',
    requiresVetConfirmation: true
  }
];
```

---

## Risk Factor Rules

Risk factor rules add context-aware warnings based on pet characteristics.

### Structure

```typescript
interface RiskFactorRule {
  condition: (pet: PetProfile) => boolean;
  factor: string;
  impact: 'elevate' | 'maintain' | 'reduce';
}
```

### Built-in Risk Factors

The default rules include:
- **Age-based**: Senior pets (7+), Junior pets (<1 year)
- **Breed-based**: Brachycephalic, Large breeds, Toy/small breeds (dental)
- **Species-based**: Cats (hide symptoms), Rabbits (prey species)

### Creating Custom Risk Factors

#### Example: Geographic Risk Factor

```typescript
const geographicRiskFactors: RiskFactorRule[] = [
  {
    condition: (pet) => {
      // Assume pet has location data in metadata
      const location = pet.metadata?.location;
      return location === 'tropical' || location === 'subtropical';
    },
    factor: 'Tropical climate - elevated risk for skin parasites and fungal infections',
    impact: 'elevate'
  },
  {
    condition: (pet) => {
      const location = pet.metadata?.location;
      return location === 'cold';
    },
    factor: 'Cold climate - watch for dry skin and joint stiffness',
    impact: 'elevate'
  }
];
```

#### Example: Weight-Based Risk Factor

```typescript
const weightRiskFactors: RiskFactorRule[] = [
  {
    condition: (pet) => {
      const weight = pet.metadata?.weight;
      const idealWeight = pet.metadata?.idealWeight;
      return weight > idealWeight * 1.2; // More than 20% overweight
    },
    factor: 'Obesity detected - elevated risk for joint issues, diabetes, heart disease',
    impact: 'elevate'
  },
  {
    condition: (pet) => {
      const weight = pet.metadata?.weight;
      const idealWeight = pet.metadata?.idealWeight;
      return weight < idealWeight * 0.8; // More than 20% underweight
    },
    factor: 'Underweight - assess nutrition and underlying health issues',
    impact: 'elevate'
  }
];
```

#### Example: Medical History Risk Factor

```typescript
const medicalHistoryRiskFactors: RiskFactorRule[] = [
  {
    condition: (pet) => {
      const conditions = pet.metadata?.medicalConditions || [];
      return conditions.includes('diabetes');
    },
    factor: 'Diabetic - watch for slow healing, cataracts, and neuropathy',
    impact: 'elevate'
  },
  {
    condition: (pet) => {
      const conditions = pet.metadata?.medicalConditions || [];
      return conditions.includes('heart_disease');
    },
    factor: 'Heart condition - caution with exercise and anesthesia',
    impact: 'elevate'
  },
  {
    condition: (pet) => {
      const medications = pet.metadata?.medications || [];
      return medications.some(med => 
        med.toLowerCase().includes('immunosuppressant')
      );
    },
    factor: 'Immunosuppressed - elevated infection risk',
    impact: 'elevate'
  }
];
```

#### Example: Breed-Specific Genetic Risks

```typescript
const geneticRiskFactors: RiskFactorRule[] = [
  // Hip Dysplasia
  {
    condition: (pet) => {
      const dysplasiaProne = [
        'german shepherd', 'labrador', 'golden retriever',
        'rottweiler', 'bernese mountain'
      ];
      return dysplasiaProne.some(breed => 
        pet.breed?.toLowerCase().includes(breed)
      );
    },
    factor: 'Breed prone to hip dysplasia - watch for gait changes',
    impact: 'elevate'
  },
  
  // Eye Problems
  {
    condition: (pet) => {
      const eyeProne = [
        'shih tzu', 'poodle', 'cocker spaniel', 'basset hound'
      ];
      return eyeProne.some(breed => 
        pet.breed?.toLowerCase().includes(breed)
      );
    },
    factor: 'Breed prone to eye problems - regular exams recommended',
    impact: 'elevate'
  },
  
  // Dental Issues
  {
    condition: (pet) => {
      const dentalProne = [
        'yorkshire terrier', 'chihuahua', 'maltese',
        'toy poodle', 'pomeranian'
      ];
      return dentalProne.some(breed => 
        pet.breed?.toLowerCase().includes(breed)
      );
    },
    factor: 'Toy breed prone to dental crowding and disease',
    impact: 'elevate'
  }
];
```

### Combining Risk Factors

```typescript
const currentRules = vetRecommendationService.getRules();

const allRiskFactors = [
  ...currentRules.riskFactors,
  ...geographicRiskFactors,
  ...weightRiskFactors,
  ...medicalHistoryRiskFactors,
  ...geneticRiskFactors
];

const updatedRules = {
  ...currentRules,
  riskFactors: allRiskFactors
};

vetRecommendationService.updateRules(updatedRules);
```

---

## Severity Thresholds

Severity thresholds control how mixed severities are handled (e.g., when a scan has both green and yellow findings).

### Structure

```typescript
interface SeverityThresholds {
  maxGreenYellowMixed: number;   // Max yellow findings before escalating green scan
  maxYellowRedMixed: number;      // Max findings before escalating to red
}
```

### Default Configuration

```typescript
const defaultThresholds = {
  maxGreenYellowMixed: 2,  // Up to 2 yellow findings stays in green
  maxYellowRedMixed: 1    // Any red finding escalates to red
};
```

### Customizing Thresholds

#### Example: More Lenient Thresholds

```typescript
const lenientThresholds = {
  maxGreenYellowMixed: 5,  // Allow 5 yellow findings before escalation
  maxYellowRedMixed: 3     // Need 3 severe findings for red urgency
};

const currentRules = vetRecommendationService.getRules();
const updatedRules = {
  ...currentRules,
  severityThresholds: lenientThresholds
};
vetRecommendationService.updateRules(updatedRules);
```

#### Example: Stricter Thresholds

```typescript
const strictThresholds = {
  maxGreenYellowMixed: 1,  // Any yellow finding escalates
  maxYellowRedMixed: 1     // Any red finding escalates
};
```

#### Example: Zero-Tolerance for Red Findings

```typescript
const emergencyThresholds = {
  maxGreenYellowMixed: 3,
  maxYellowRedMixed: 0     // Zero tolerance - immediate emergency
};
```

---

## Escalation Paths

Escalation paths define what pet owners should do if the condition worsens.

### Structure

```typescript
interface EscalationPaths {
  monitor: string;      // What to do if monitoring worsens
  routine: string;      // What to do before routine visit
  urgent: string;       // What to do if urgent care fails
  emergency: string;    // What to do while seeking emergency care
}
```

### Default Escalation Paths

```typescript
const defaultEscalationPaths = {
  monitor: 'If condition worsens or symptoms persist beyond recommended timeframe, escalate to routine veterinary visit.',
  routine: 'If symptoms worsen or new symptoms develop before scheduled appointment, contact veterinarian urgently.',
  urgent: 'If condition deteriorates, pet becomes distressed, or symptoms worsen, seek emergency veterinary care immediately.',
  emergency: 'If emergency care is not immediately available, contact emergency veterinary hotlines for guidance while transporting to nearest facility.'
};
```

### Customizing Escalation Paths

#### Example: Detailed Escalation with Phone Numbers

```typescript
const detailedEscalationPaths = {
  monitor: 'Monitor closely. If symptoms worsen, persist for more than 48 hours, or new symptoms appear, contact your veterinarian to schedule an appointment.',
  routine: 'Continue monitoring. If condition worsens, new symptoms develop, or you are concerned before your appointment, call your veterinarian or consider urgent care.',
  urgent: 'Seek urgent care within 24-48 hours. If condition significantly worsens, pet shows signs of distress, or symptoms progress rapidly, proceed directly to emergency veterinary care.',
  emergency: 'Seek emergency care immediately. If the nearest emergency clinic is more than 30 minutes away, call the emergency veterinary hotline at 1-800-VET-EMER for guidance during transport.'
};
```

#### Example: Multilingual Escalation Paths

```typescript
// Could be implemented with localization
const multilingualEscalationPaths = {
  monitor: {
    en: 'If condition worsens, contact your veterinarian.',
    es: 'Si la condición empeora, contacte a su veterinario.',
    fr: 'Si l\'état s\'aggrave, contactez votre vétérinaire.'
  },
  // ... other levels
};
```

---

## Validation & Testing

### Validating Rules

Always validate rules before applying them:

```typescript
import { validateRules } from '@petvision/shared';

const updatedRules = { /* your custom rules */ };

if (validateRules(updatedRules)) {
  vetRecommendationService.updateRules(updatedRules);
  console.log('Rules updated successfully');
} else {
  console.error('Invalid rules configuration');
  // Don't apply invalid rules!
}
```

### Test Scenarios

Create test scenarios to verify your rules:

```typescript
import { VetRecommendationService } from '@petvision/shared';
import { Severity, ScanType } from '@petvision/shared';

async function testCustomRules() {
  const service = new VetRecommendationService(customRules);
  
  // Test case 1: Eye trauma
  const traumaResult = await service.generateRecommendation({
    scanResult: {
      scan_type: ScanType.EYE,
      severity: Severity.RED,
      findings: [{
        id: 'f1',
        condition: 'eye trauma',
        description: 'Trauma detected',
        confidence: 0.95,
        severity: Severity.RED
      }],
      image_url: 'test.jpg',
      id: 'scan1',
      pet_id: 'pet1',
      created_at: new Date().toISOString()
    },
    petProfile: { /* ... */ }
  });
  
  console.assert(
    traumaResult.urgency_level === UrgencyLevel.EMERGENCY,
    'Eye trauma should trigger emergency'
  );
  
  console.log('✓ Eye trauma test passed');
  
  // Add more test cases...
}

testCustomRules();
```

---

## Best Practices

### 1. Start with Default Rules

```typescript
// Import default rules
import { DEFAULT_RECOMMENDATION_RULES } from '@petvision/shared';

// Modify as needed
const customRules = {
  ...DEFAULT_RECOMMENDATION_RULES,
  // your modifications
};
```

### 2. Use Specific Patterns First

```typescript
const rules = [
  { condition: 'eye trauma|ulcer|rupture', ... },  // Most specific
  { condition: 'eye discharge|redness', ... },      // Less specific
  { condition: 'eye', ... }                          // General fallback
];
```  

### 3. Test Before Deploying

```typescript
// Run tests
npm test -- VetRecommendationService.test.ts

// Test with real data
const testRecommendation = await service.generateRecommendation(testInput);
console.log(JSON.stringify(testRecommendation, null, 2));
```

### 4. Document Custom Rules

```typescript
// Add comments explaining WHY rules exist
const specialBreedRules: CategoryRule[] = [
  {
    category: FindingCategory.EYE,
    rules: [
      {
        // Pugs are prone to cherry eye due to shallow eye sockets
        condition: 'prolapse|cherry.eye',
        minSeverity: Severity.YELLOW,
        recommendation: {
          // ...
        }
      }
    ]
  }
];
```

### 5. Version Control Your Rules

```typescript
// Save rule configurations
const rulesV1 = DEFAULT_RECOMMENDATION_RULES;
const rulesV2 = { /* updated */ };

// Track changes
console.log('Rules updated from v1 to v2');
```

### 6. Monitor Rule Performance

```typescript
// Log which rules are triggered
const recommendation = await service.generateRecommendation(input);
console.log(`Rules triggered: ${recommendation.specific_actions.length}`);
console.log(`Risk factors: ${recommendation.risk_factors.length}`);
```

---

## Complete Example: Custom Rule Set

```typescript
import { VetRecommendationService } from '@petvision/shared';
import { addCategoryRule, updateSeverityThresholds } from '@petvision/shared';
import { DEFAULT_RECOMMENDATION_RULES } from '@petvision/shared';

// Start with defaults
let customRules = { ...DEFAULT_RECOMMENDATION_RULES };

// Add specialized rules
const eyeSpecialistRules: SeverityRule[] = [
  {
    condition: 'corneal.ulcer|ulceration',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.EMERGENCY,
      timeframe: 'Immediately',
      primaryAction: 'Emergency care needed for corneal ulcer - risk of vision loss',
      secondaryActions: [
        'Do not apply any eye drops',
        'Prevent rubbing',
        'Transport to emergency vet'
      ]
    }
  }
];

// Add to eye rules
const eyeCategoryIndex = customRules.categoryRules.findIndex(
  cr => cr.category === FindingCategory.EYE
);
if (eyeCategoryIndex >= 0) {
  customRules.categoryRules[eyeCategoryIndex].rules.push(
    ...eyeSpecialistRules
  );
}

// Update thresholds
const strictThresholds = {
  maxGreenYellowMixed: 2,
  maxYellowRedMixed: 1
};

customRules = {
  ...customRules,
  severityThresholds: strictThresholds
};

// Create service with custom rules
const customService = new VetRecommendationService(customRules);

// Validate
if (!customService.validateRules()) {
  throw new Error('Invalid custom rules');
}

console.log('Custom rules loaded successfully!');
```

---

## Support

For additional help with rule configuration:

1. See the main [Vet Recommendation Engine Documentation](./VET_RECOMMENDATION_ENGINE.md)
2. Review the [API Reference](#api-reference)
3. Check the [test suite](../services/__tests__/VetRecommendationService.test.ts) for examples
4. Contact the PetVision development team

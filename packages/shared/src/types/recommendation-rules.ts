// ============================================================================
// Recommendation Rules Configuration
// ============================================================================

import { 
  RecommendationRules, 
  CategoryRule, 
  SeverityRule, 
  ConfidenceRule, 
  RiskFactorRule,
  UrgencyLevel,
  Severity,
  FindingCategory
} from './vet-recommendation';
import { Species } from '../index';

// ----------------------------------------------------------------------------
// Eye Finding Rules
// ----------------------------------------------------------------------------

const eyeRules: SeverityRule[] = [
  {
    condition: 'redness|irritation',
    minSeverity: Severity.GREEN,
    recommendation: {
      urgency: UrgencyLevel.MONITOR,
      timeframe: 'Monitor 24-48 hours',
      primaryAction: 'Clean eye gently with sterile saline solution',
      secondaryActions: [
        'Monitor for changes in discharge or swelling',
        'Prevent pet from rubbing the eye',
        'Keep eye area clean and dry'
      ]
    }
  },
  {
    condition: 'discharge',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 1 week',
      primaryAction: 'Schedule veterinary examination for eye discharge',
      secondaryActions: [
        'Note color and consistency of discharge',
        'Monitor for changes in frequency',
        'Clean eye with sterile saline as needed'
      ]
    }
  },
  {
    condition: 'cloudiness|vision.loss|opacity',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.URGENT,
      timeframe: 'Within 24 hours',
      primaryAction: 'Urgent veterinary care needed for vision changes',
      secondaryActions: [
        'Do not delay - vision issues can worsen quickly',
        'Monitor for signs of pain or discomfort',
        'Restrict activity to prevent injury'
      ]
    }
  },
  {
    condition: 'trauma|ulcer|scratch|injury',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.EMERGENCY,
      timeframe: 'Immediately',
      primaryAction: 'EMERGENCY: Seek immediate veterinary care for eye trauma',
      secondaryActions: [
        'Do not attempt to treat at home',
        'Do not apply any medication without vet approval',
        'Protect eye from further damage'
      ]
    }
  },
  {
    condition: 'prolapse|cherry.eye',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.URGENT,
      timeframe: 'Within 24 hours',
      primaryAction: 'Urgent veterinary evaluation for gland prolapse',
      secondaryActions: [
        'Keep eye moist with sterile saline',
        'Prevent pet from rubbing',
        'Do not attempt to push back'
      ]
    }
  }
];

// ----------------------------------------------------------------------------
// Skin Finding Rules
// ----------------------------------------------------------------------------

const skinRules: SeverityRule[] = [
  {
    condition: 'dry.skin|flaking|dandruff',
    minSeverity: Severity.GREEN,
    recommendation: {
      urgency: UrgencyLevel.MONITOR,
      timeframe: 'Monitor at home',
      primaryAction: 'Increase environmental humidity and consider omega-3 supplements',
      secondaryActions: [
        'Use pet-safe moisturizers if recommended by vet',
        'Ensure proper hydration',
        'Avoid harsh shampoos'
      ]
    }
  },
  {
    condition: 'redness|irritation|rash',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.MONITOR,
      timeframe: 'Monitor for 3-5 days',
      primaryAction: 'Monitor skin irritation for changes',
      secondaryActions: [
        'Identify and remove potential allergens',
        'Use gentle, hypoallergenic shampoo',
        'Prevent scratching or licking'
      ]
    }
  },
  {
    condition: 'hair.loss|alopecia|patches|bald.spot',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 1-2 weeks',
      primaryAction: 'Schedule veterinary visit for hair loss evaluation',
      secondaryActions: [
        'Document progression with photos',
        'Check for parasites (fleas, ticks)',
        'Note if itching accompanies loss'
      ]
    }
  },
  {
    condition: 'lesion|sore|wound|hot.spot',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 3-5 days',
      primaryAction: 'Veterinary examination for skin lesions',
      secondaryActions: [
        'Keep area clean and dry',
        'Use Elizabeth collar to prevent licking',
        'Monitor for signs of infection'
      ]
    }
  },
  {
    condition: 'infection|pus|swelling|heat|abscess',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.URGENT,
      timeframe: 'Within 24-48 hours',
      primaryAction: 'Urgent veterinary care for signs of infection',
      secondaryActions: [
        'Do not squeeze or drain at home',
        'Monitor for fever or lethargy',
        'Keep pet from licking area'
      ]
    }
  },
  {
    condition: 'severe.burn|deep.laceration|mass|tumor',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.URGENT,
      timeframe: 'Within 24 hours',
      primaryAction: 'Immediate veterinary evaluation for serious skin condition',
      secondaryActions: [
        'Do not attempt home remedies',
        'Document any changes in size or appearance',
        'Keep area clean and covered if possible'
      ]
    }
  }
];

// ----------------------------------------------------------------------------
// Teeth Finding Rules
// ----------------------------------------------------------------------------

const teethRules: SeverityRule[] = [
  {
    condition: 'plaque|tartar|calculus',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Schedule dental cleaning',
      primaryAction: 'Schedule professional dental cleaning',
      secondaryActions: [
        'Begin daily tooth brushing with pet-safe toothpaste',
        'Consider dental chews or treats',
        'Monitor for bad breath or gum changes'
      ]
    }
  },
  {
    condition: 'red.gums|gingivitis|inflammation',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 1-2 weeks',
      primaryAction: 'Veterinary dental examination for gum inflammation',
      secondaryActions: [
        'Check for plaque buildup',
        'Begin gentle brushing routine',
        'Monitor for bleeding or pain'
      ]
    }
  },
  {
    condition: 'bad.breath|halitosis',
    minSeverity: Severity.GREEN,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 2-4 weeks',
      primaryAction: 'Schedule dental examination',
      secondaryActions: [
        'Check for tartar or gum disease',
        'Start dental hygiene routine',
        'Monitor eating behavior'
      ]
    }
  },
  {
    condition: 'loose.tooth|mobile|exposed.root',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.URGENT,
      timeframe: 'Within 48 hours',
      primaryAction: 'Urgent dental evaluation for loose tooth',
      secondaryActions: [
        'Do not attempt to pull tooth',
        'Feed soft food to avoid pain',
        'Monitor for signs of infection'
      ]
    }
  },
  {
    condition: 'bleeding|hemorrhage|oral.trauma|fracture',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.EMERGENCY,
      timeframe: 'Immediately',
      primaryAction: 'EMERGENCY: Seek immediate veterinary care for oral bleeding or trauma',
      secondaryActions: [
        'Apply gentle pressure with clean gauze if safe',
        'Do not give pain medication without vet approval',
        'Transport pet carefully'
      ]
    }
  },
  {
    condition: 'abscess|swelling.face|tooth.root.infection',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.URGENT,
      timeframe: 'Within 24 hours',
      primaryAction: 'Urgent veterinary care for dental abscess',
      secondaryActions: [
        'Monitor for fever or loss of appetite',
        'Note any facial asymmetry',
        'Do not attempt to drain at home'
      ]
    }
  }
];

// ----------------------------------------------------------------------------
// Gait Finding Rules
// ----------------------------------------------------------------------------

const gaitRules: SeverityRule[] = [
  {
    condition: 'minor.limp|subtle.stiffness',
    minSeverity: Severity.GREEN,
    recommendation: {
      urgency: UrgencyLevel.MONITOR,
      timeframe: 'Monitor for 24 hours',
      primaryAction: 'Restrict activity and monitor gait',
      secondaryActions: [
        'Provide comfortable rest area',
        'Avoid stairs and jumping',
        'Monitor for worsening'
      ]
    }
  },
  {
    condition: 'reduced.mobility|stiffness|reluctance.to.move',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 1 week',
      primaryAction: 'Schedule veterinary examination for mobility issues',
      secondaryActions: [
        'Note which limbs are affected',
        'Document when symptoms occur',
        'Provide orthopedic bedding'
      ]
    }
  },
  {
    condition: 'limping|lameness|favouring.limb',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 48 hours',
 primaryAction: 'Veterinary evaluation for lameness',
      secondaryActions: [
        'Rest and restrict activity',
        'Check limb for visible injury',
        'Monitor for improvement'
      ]
    }
  },
  {
    condition: 'unable.to.walk|non.ambulatory|paralysis',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.EMERGENCY,
      timeframe: 'Immediately',
      primaryAction: 'EMERGENCY: Seek immediate veterinary care for inability to walk',
      secondaryActions: [
        'Minimize movement to prevent further injury',
        'Use proper lifting technique if transport needed',
        'Do not attempt to force walking'
      ]
    }
  },
  {
    condition: 'trauma|fracture|visible.injury|swelling',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.EMERGENCY,
      timeframe: 'Immediately',
      primaryAction: 'EMERGENCY: Seek immediate veterinary care for visible injury',
      secondaryActions: [
        'Do not manipulate injured area',
        'Immobilize if possible and safe',
        'Monitor for signs of shock'
      ]
    }
  },
  {
    condition: 'severe.pain|distress|cries|whining',
    minSeverity: Severity.RED,
    recommendation: {
      urgency: UrgencyLevel.EMERGENCY,
      timeframe: 'Immediately',
      primaryAction: 'EMERGENCY: Immediate pain relief and evaluation needed',
      secondaryActions: [
        'Do not give human pain medication',
        'Keep pet calm and warm',
        'Transport to emergency vet'
      ]
    }
  }
];

// ----------------------------------------------------------------------------
// Confidence-Based Rules
// ----------------------------------------------------------------------------

const confidenceRules: ConfidenceRule[] = [
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

// ----------------------------------------------------------------------------
// Risk Factor Rules (Pet-Specific)
// ----------------------------------------------------------------------------

const riskFactors: RiskFactorRule[] = [
  // Age-based risk factors
  {
    condition: (pet) => {
      if (!pet.date_of_birth) return false;
      const age = calculatePetAge(pet.date_of_birth);
      return age.years >= 7;
    },
    factor: 'Senior pet (7+ years) - more cautious approach recommended',
    impact: 'elevate'
  },
  {
    condition: (pet) => {
      if (!pet.date_of_birth) return false;
      const age = calculatePetAge(pet.date_of_birth);
      return age.years < 1;
    },
    factor: 'Junior pet (<1 year) - rapid development changes expected',
    impact: 'elevate'
  },
  
  // Breed-specific risk factors
  {
    condition: (pet) => {
      const brachycephalicBreeds = [
        'pug', 'bulldog', 'boston terrier', 'boxer', 'shih tzu',
        'pekingese', 'french bulldog', 'cavalier king charles'
      ];
      return brachycephalicBreeds.some(breed => 
        pet.breed?.toLowerCase().includes(breed)
      );
    },
    factor: 'Brachycephalic breed - elevated respiratory and eye health risks',
    impact: 'elevate'
  },
  {
    condition: (pet) => {
      const largeBreeds = [
        'great dane', 'mastiff', 'st. bernard', 'newfoundland',
        'irish wolfhound', 'leonberger', 'bernese mountain'
      ];
      return largeBreeds.some(breed => 
        pet.breed?.toLowerCase().includes(breed)
      );
    },
    factor: 'Large breed - elevated joint and cardiac concerns',
    impact: 'elevate'
  },
  {
    condition: (pet) => {
      const dentalBreeds = [
        'yorkshire terrier', 'toy poodle', 'chihuahua', 'maltese',
        'shih tzu', 'pomeranian'
      ];
      return dentalBreeds.some(breed => 
        pet.breed?.toLowerCase().includes(breed)
      );
    },
    factor: 'Toy/small breed - elevated dental disease risk',
    impact: 'elevate'
  },
  
  // Species-specific risk factors
  {
    condition: (pet) => pet.species === Species.CAT,
    factor: 'Feline - cats often hide symptoms, recommend closer monitoring',
    impact: 'elevate'
  },
  {
    condition: (pet) => pet.species === Species.RABBIT,
    factor: 'Rabbit - prey species that hides illness, very cautious approach needed',
    impact: 'elevate'
  }
];

// ----------------------------------------------------------------------------
// Escalation Paths
// ----------------------------------------------------------------------------

const escalationPaths: Record<UrgencyLevel, string> = {
  [UrgencyLevel.MONITOR]: 
    'If condition worsens or symptoms persist beyond recommended timeframe, escalate to routine veterinary visit.',
  [UrgencyLevel.ROUTINE]: 
    'If symptoms worsen or new symptoms develop before scheduled appointment, contact veterinarian urgently.',
  [UrgencyLevel.URGENT]: 
    'If condition deteriorates, pet becomes distressed, or symptoms worsen, seek emergency veterinary care immediately.',
  [UrgencyLevel.EMERGENCY]: 
    'If emergency care is not immediately available, contact emergency veterinary hotlines for guidance while transporting to nearest facility.'
};

// ----------------------------------------------------------------------------
// Severity Thresholds for Mixed Findings
// ----------------------------------------------------------------------------

const severityThresholds = {
  maxGreenYellowMixed: 2, // Max yellow findings in green scan before upgrading
  maxYellowRedMixed: 1,  // Max red findings before upgrading to red
};

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function calculatePetAge(dateOfBirth: string): { years: number; months: number } {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months };
}

// ----------------------------------------------------------------------------
// Complete Rules Export
// ----------------------------------------------------------------------------

export const DEFAULT_RECOMMENDATION_RULES: RecommendationRules = {
  categoryRules: [
    { category: FindingCategory.EYE, rules: eyeRules },
    { category: FindingCategory.SKIN, rules: skinRules },
    { category: FindingCategory.TEETH, rules: teethRules },
    { category: FindingCategory.GAIT, rules: gaitRules },
  ],
  confidenceRules,
  riskFactors,
  escalationPaths,
  severityThresholds
};

// ----------------------------------------------------------------------------
// Rule Validation Functions
// ----------------------------------------------------------------------------

export function validateRules(rules: RecommendationRules): boolean {
  try {
    // Validate category rules
    if (!rules.categoryRules || rules.categoryRules.length === 0) {
      return false;
    }
    
    for (const categoryRule of rules.categoryRules) {
      if (!categoryRule.category || !categoryRule.rules) {
        return false;
      }
      
      for (const rule of categoryRule.rules) {
        if (!rule.condition || !rule.minSeverity || !rule.recommendation) {
          return false;
        }
        
        const { urgency, timeframe, primaryAction } = rule.recommendation;
        if (!urgency || !timeframe || !primaryAction) {
          return false;
        }
      }
    }
    
    // Validate confidence rules
    if (!rules.confidenceRules || rules.confidenceRules.length === 0) {
      return false;
    }
    
    for (const confRule of rules.confidenceRules) {
      if (typeof confRule.minConfidence !== 'number' ||
          typeof confRule.maxConfidence !== 'number' ||
          confRule.minConfidence >= confRule.maxConfidence ||
          !confRule.message ||
          typeof confRule.requiresVetConfirmation !== 'boolean') {
        return false;
      }
    }
    
    // Validate escalation paths
    for (const urgency of Object.values(UrgencyLevel)) {
      if (!rules.escalationPaths[urgency] || rules.escalationPaths[urgency].trim() === '') {
        return false;
      }
    }
    
    // Validate severity thresholds
    if (typeof rules.severityThresholds.maxGreenYellowMixed !== 'number' ||
        typeof rules.severityThresholds.maxYellowRedMixed !== 'number' ||
        rules.severityThresholds.maxGreenYellowMixed < 0 ||
        rules.severityThresholds.maxYellowRedMixed < 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Rule validation error:', error);
    return false;
  }
}

// ----------------------------------------------------------------------------
// Rule Modification Helpers
// ----------------------------------------------------------------------------

export function addCategoryRule(
  rules: RecommendationRules,
  category: FindingCategory,
  rule: SeverityRule
): RecommendationRules {
  const existingCategory = rules.categoryRules.find(cr => cr.category === category);
  
  if (existingCategory) {
    existingCategory.rules.push(rule);
  } else {
    rules.categoryRules.push({ category, rules: [rule] });
  }
  
  return { ...rules };
}

export function addRiskFactor(
  rules: RecommendationRules,
  riskFactor: RiskFactorRule
): RecommendationRules {
  return {
    ...rules,
    riskFactors: [...rules.riskFactors, riskFactor]
  };
}

export function updateSeverityThresholds(
  rules: RecommendationRules,
  thresholds: Partial<typeof rules.severityThresholds>
): RecommendationRules {
  return {
    ...rules,
    severityThresholds: {
      ...rules.severityThresholds,
      ...thresholds
    }
  };
}

# Vet Recommendation Engine Documentation

## Overview

The Vet Recommendation Engine is an intelligent, rule-based system that analyzes AI findings from pet health scans and generates actionable veterinary recommendations. It provides tiered recommendations based on severity, finding types, confidence levels, historical trends, and pet-specific factors.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Integration Guide](#integration-guide)
5. [Rule Configuration](#rule-configuration)
6. [Database Schema](#database-schema)
7. [Examples](#examples)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Scan Input                               │
│  - ScanResult (AI findings)                                 │
│  - PetProfile (pet data)                                    │
│  - TrendData (historical comparison)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              VetRecommendationService                        │
│                                                              │
│  1. Findings Analysis                                        │
│  2. Severity Determination                                   │
│  3. Urgency Level Calculation                                │
│  4. Specific Actions Generation                              │
│  5. Confidence Scoring                                       │
│  6. Risk Factor Evaluation                                   │
│  7. Trend-Based Adjustments                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              VetRecommendation Output                        │
│  - Overall Severity                                         │
│  - Urgency Level & Timeframe                                │
│  - Primary & Secondary Recommendations                     │
│  - Specific Actions per Finding                             │
│  - Risk Factors                                             │
│  - Confidence Score                                         │
│  - Escalation Path                                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Input**: Scan results from Z.AI Vision Analysis, pet profile data, and historical scans
2. **Processing**: Rules engine analyzes findings, applies confidence scoring, evaluates risk factors
3. **Adjustment**: Trend data modifies urgency levels based on improvement/decline
4. **Output**: Structured recommendation with actionable guidance

---

## Core Concepts

### Severity Levels

| Level | Color | Meaning | Default Urgency |
|-------|-------|---------|-----------------|
| Green | 🟢 | Healthy/Minor | Monitor at home |
| Yellow | 🟡 | Attention Needed | Routine visit (2 weeks) |
| Red | 🔴 | Concerning/Serious | Urgent (24-48h) or Emergency |

### Urgency Levels

- **Monitor**: Home observation, no immediate action required
- **Routine**: Schedule veterinary visit within 1-2 weeks
- **Urgent**: Seek veterinary care within 24-48 hours
- **Emergency**: Seek immediate emergency veterinary care

### Finding Categories

- **Eye**: Redness, discharge, cloudiness, trauma, etc.
- **Skin**: Dryness, irritation, hair loss, lesions, infection
- **Teeth**: Plaque, gum issues, bad breath, loose teeth, bleeding
- **Gait**: Minor limp, reduced mobility, inability to walk, trauma

### Confidence Thresholds

| Range | Level | Vet Confirmation |
|-------|-------|------------------|
| 90-100% | High | Not required |
| 70-89% | Medium | Suggested |
| 0-69% | Low | Required |

---

## API Reference

### Class: VetRecommendationService

#### Constructor

```typescript
constructor(rules?: RecommendationRules)
```

Creates a new recommendation service instance with optional custom rules.

#### Methods

##### generateRecommendation

```typescript
async generateRecommendation(input: RecommendationInput): Promise<VetRecommendation>
```

Generate a veterinary recommendation for a single scan.

**Parameters:**
- `input`: RecommendationInput object containing:
  - `scanResult`: ScanResult from AI analysis
  - `petProfile`: Pet profile data
  - `previousScans`: Optional array of historical scans
  - `trendData`: Optional trend analysis data

**Returns:** `Promise<VetRecommendation>`

**Example:**
```typescript
const service = new VetRecommendationService();

const recommendation = await service.generateRecommendation({
  scanResult: scanResult,
  petProfile: petProfile,
  previousScans: previousScans,
  trendData: trendData
});

console.log(recommendation.primary_recommendation);
console.log(recommendation.urgency_level); // 'urgent', 'routine', 'monitor', 'emergency'
```

##### generateBatchRecommendations

```typescript
async generateBatchRecommendations(inputs: RecommendationInput[]): Promise<VetRecommendation[]>
```

Generate recommendations for multiple scans efficiently.

##### validateRules

```typescript
validateRules(): boolean
```

Validate the current rule configuration.

##### getRules

```typescript
getRules(): RecommendationRules
```

Get a copy of the current rules.

##### updateRules

```typescript
updateRules(newRules: RecommendationRules): void
```

Update the rule configuration (throws if invalid).

### Types

#### VetRecommendation

```typescript
interface VetRecommendation {
  overall_severity: 'green' | 'yellow' | 'red';
  urgency_level: UrgencyLevel;
  timeframe: string;
  primary_recommendation: string;
  secondary_recommendations?: string[];
  findings_analysis: FindingsAnalysis;
  specific_actions: SpecificAction[];
  risk_factors: string[];
  confidence_score: number;
  escalation_path: string;
  vet_consultation_required: boolean;
  emergency_warning?: string;
}
```

#### RecommendationInput

```typescript
interface RecommendationInput {
  scanResult: ScanResult;
  petProfile: PetProfile;
  previousScans?: ScanResult[];
  trendData?: TrendData;
}
```

---

## Integration Guide

### Step 1: Import the Service

```typescript
import { VetRecommendationService, vetRecommendationService } from '@petvision/shared';
```

### Step 2: Gather Input Data

```typescript
// From your database/API
const scanResult = await fetchScanResult(scanId);
const petProfile = await fetchPetProfile(scanResult.pet_id);
const previousScans = await fetchPreviousScans(petProfile.id);
const trendData = await calculateTrend(scanResult, previousScans);
```

### Step 3: Generate Recommendation

```typescript
const recommendation = await vetRecommendationService.generateRecommendation({
  scanResult,
  petProfile,
  previousScans,
  trendData
});
```

### Step 4: Store and Use Recommendation

```typescript
// Store in database
await db.insert('vet_recommendations', {
  scan_result_id: scanResult.id,
  ...recommendation
});

// Display in UI
<HealthReportCard recommendation={recommendation} />
```

### Integration with HealthReportCard

```typescript
// In HealthReportCard component
import { VetRecommendation } from '@petvision/shared';

interface HealthReportCardProps {
  recommendation: VetRecommendation;
}

const HealthReportCard: React.FC<HealthReportCardProps> = ({ recommendation }) => {
  const urgencyColor = {
    monitor: 'text-green-600',
    routine: 'text-yellow-600',
    urgent: 'text-orange-600',
    emergency: 'text-red-600'
  };

  return (
    <div className="recommendation-card">
      <div className={`urgency-badge ${urgencyColor[recommendation.urgency_level]}`}>
        {recommendation.urgency_level.toUpperCase()}
      </div>
      <p>{recommendation.primary_recommendation}</p>
      {recommendation.emergency_warning && (
        <Alert type="error">{recommendation.emergency_warning}</Alert>
      )}
    </div>
  );
};
```

### Integration with PDF Report Generation

```typescript
// In PDF Report Service
import { VetRecommendationService } from '@petvision/shared';

const recommendation = await vetRecommendationService.generateRecommendation({
  scanResult,
  petProfile,
  previousScans
});

pdfData.recommendations = recommendation;
pdfData.recommendationDetails = {
  primary: recommendation.primary_recommendation,
  secondary: recommendation.secondary_recommendations,
  specificActions: recommendation.specific_actions,
  riskFactors: recommendation.risk_factors
};
```

---

## Rule Configuration

### Default Rules Structure

The recommendation engine uses a hierarchical rule system:

1. **Category Rules**: Specific rules for Eye, Skin, Teeth, Gait findings
2. **Confidence Rules**: Actions based on AI confidence scores
3. **Risk Factor Rules**: Pet-specific risk modifiers (age, breed, species)
4. **Severity Thresholds**: Rules for handling mixed severities

### Adding Custom Rules

```typescript
import { VetRecommendationService } from '@petvision/shared';
import { addCategoryRule, updateSeverityThresholds } from '@petvision/shared';

const service = new VetRecommendationService();

// Get current rules
const currentRules = service.getRules();

// Add custom eye rule
const customRules = addCategoryRule(
  currentRules,
  FindingCategory.EYE,
  {
    condition: 'allergy|allergic',
    minSeverity: Severity.YELLOW,
    recommendation: {
      urgency: UrgencyLevel.ROUTINE,
      timeframe: 'Within 1 week',
      primaryAction: 'Schedule allergy evaluation',
      secondaryActions: ['Identify allergens', 'Monitor symptoms']
    }
  }
);

// Update severity thresholds
const updatedRules = updateSeverityThresholds(customRules, {
  maxGreenYellowMixed: 3 // Allow 3 yellow findings before escalation
});

// Apply updated rules
service.updateRules(updatedRules);
```

### Rule Matching

Rules are matched using regex pattern matching on finding conditions:

```typescript
{
  condition: 'redness|irritation',  // Matches "eye redness" or "skin irritation"
  minSeverity: Severity.GREEN,        // Minimum severity to trigger
  recommendation: {
    urgency: UrgencyLevel.MONITOR,
    timeframe: 'Monitor 24-48 hours',
    primaryAction: 'Clean with saline',
    secondaryActions: ['Monitor for changes']
  }
}
```

### Priority Order

When multiple rules match:
1. More specific patterns (longer, more detailed) take precedence
2. Higher minimum severity requirements are prioritized
3. Category-specific rules override severity defaults

---

## Database Schema

### Table: vet_recommendations

```sql
CREATE TABLE vet_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_result_id UUID NOT NULL REFERENCES scan_results(id) ON DELETE CASCADE,
  overall_severity TEXT NOT NULL CHECK (overall_severity IN ('green', 'yellow', 'red')),
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('monitor', 'routine', 'urgent', 'emergency')),
  timeframe TEXT NOT NULL,
  primary_recommendation TEXT NOT NULL,
  secondary_recommendations TEXT[],
  findings_analysis JSONB NOT NULL,
  specific_actions JSONB NOT NULL,
  risk_factors TEXT[],
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  escalation_path TEXT,
  vet_consultation_required BOOLEAN NOT NULL DEFAULT true,
  emergency_warning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_vet_recommendations_scan_result ON vet_recommendations(scan_result_id);
CREATE INDEX idx_vet_recommendations_severity ON vet_recommendations(overall_severity);
CREATE INDEX idx_vet_recommendations_urgency ON vet_recommendations(urgency_level);
CREATE INDEX idx_vet_recommendations_created_at ON vet_recommendations(created_at DESC);
```

---

## Examples

### Example 1: Healthy Eye Scan

**Input:**
```json
{
  "scanResult": {
    "id": "scan-123",
    "scan_type": "eye",
    "severity": "green",
    "findings": [
      {
        "id": "f1",
        "condition": "clear eyes",
        "description": "No abnormalities detected",
        "confidence": 0.95,
        "severity": "green"
      }
    ]
  },
  "petProfile": {
    "id": "pet-123",
    "name": "Buddy",
    "species": "dog",
    "breed": "Golden Retriever"
  }
}
```

**Output:**
```json
{
  "overall_severity": "green",
  "urgency_level": "monitor",
  "timeframe": "Monitor at home",
  "primary_recommendation": "No significant findings detected. Continue regular health monitoring and routine check-ups.",
  "secondary_recommendations": [
    "Continue routine monitoring",
    "Maintain regular check-ups"
  ],
  "findings_analysis": {
    "total_findings": 1,
    "green_count": 1,
    "yellow_count": 0,
    "red_count": 0,
    "by_category": { ... }
  },
  "confidence_score": 95,
  "vet_consultation_required": false,
  "escalation_path": "If condition worsens or symptoms persist beyond recommended timeframe, escalate to routine veterinary visit."
}
```

### Example 2: Dental Issues

**Input:**
```json
{
  "scanResult": {
    "id": "scan-456",
    "scan_type": "teeth",
    "severity": "yellow",
    "findings": [
      {
        "id": "f2",
        "condition": "plaque tartar",
        "description": "Significant tartar buildup",
        "confidence": 0.88,
        "severity": "yellow"
      }
    ]
  },
  "petProfile": {
    "id": "pet-456",
    "name": "Max",
    "species": "dog",
    "breed": "Yorkshire Terrier"
  }
}
```

**Output:**
```json
{
  "overall_severity": "yellow",
  "urgency_level": "routine",
  "timeframe": "Schedule dental cleaning",
  "primary_recommendation": "Schedule routine veterinary visit within 2 weeks for dental issues. Regular monitoring is advised.",
  "risk_factors": [
    "Toy/small breed - elevated dental disease risk"
  ],
  "specific_actions": [
    {
      "finding_id": "f2",
      "action": "Schedule professional dental cleaning",
      "severity": "yellow",
      "category": "teeth"
    }
  ],
  "confidence_score": 88,
  "vet_consultation_required": true
}
```

### Example 3: Emergency - Gait Trauma

**Input:**
```json
{
  "scanResult": {
    "id": "scan-789",
    "scan_type": "gait",
    "severity": "red",
    "findings": [
      {
        "id": "f3",
        "condition": "fracture trauma",
        "description": "Visible leg fracture",
        "confidence": 0.97,
        "severity": "red"
      }
    ]
  },
  "petProfile": {
    "id": "pet-789",
    "name": "Bella",
    "species": "dog",
    "breed": "Great Dane",
    "date_of_birth": "2018-03-15"
  }
}
```

**Output:**
```json
{
  "overall_severity": "red",
  "urgency_level": "emergency",
  "timeframe": "Immediately",
  "primary_recommendation": "Seek immediate emergency veterinary care for mobility issues. This requires immediate attention to prevent serious complications.",
  "emergency_warning": "⚠️ EMERGENCY SITUATION DETECTED Mobility emergencies require immediate attention to prevent further injury. Contact your nearest emergency veterinary clinic or animal hospital immediately.",
  "risk_factors": [
    "Large breed - elevated joint and cardiac concerns",
    "Senior pet (7+ years) - more cautious approach recommended"
  ],
  "confidence_score": 97,
  "vet_consultation_required": true
}
```

### Example 4: Worsening Trend

**Input:**
```json
{
  "scanResult": {
    "id": "scan-999",
    "scan_type": "eye",
    "severity": "yellow",
    "findings": [
      {
        "id": "f4",
        "condition": "discharge",
        "description": "Eye discharge worsening",
        "confidence": 0.85,
        "severity": "yellow"
      }
    ]
  },
  "petProfile": {
    "id": "pet-999",
    "name": "Luna",
    "species": "cat",
    "breed": "Persian"
  },
  "trendData": {
    "type": "decline",
    "message": "Condition worsening",
    "severityChange": {
      "from": "green",
      "to": "yellow"
    }
  }
}
```

**Output:**
```json
{
  "overall_severity": "yellow",
  "urgency_level": "urgent",  // Escalated from routine due to decline
  "timeframe": "Within 24-48 hours",
  "primary_recommendation": "Schedule urgent veterinary care within 24-48 hours for eye issues. Prompt treatment is recommended.",
  "risk_factors": [
    "Feline - cats often hide symptoms, recommend closer monitoring",
    "Condition worsening - escalated monitoring recommended"
  ],
  "confidence_score": 85,
  "vet_consultation_required": true
}
```

---

## Testing

Run the comprehensive test suite:

```bash
npm test -- VetRecommendationService.test.ts
```

Test coverage includes:
- All severity levels (green, yellow, red)
- Mixed severity handling
- Confidence-based recommendations
- Trend-based adjustments
- Pet profile context (age, breed, species)
- Emergency warnings
- Batch processing
- Edge cases

---

## Support

For questions or issues, please refer to the main PetVision documentation or contact the development team.

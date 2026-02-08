# Vision Service

Story 5: PetVision AI-powered pet health screening

## Overview

The Vision Service is a production-grade TypeScript service that integrates Z.AI's GLM-4.7 vision model for analyzing pet photos. It provides comprehensive AI-powered health screening for pets across multiple body systems including eyes, skin, teeth, gait, and comprehensive multi-area analysis.

## Features

### Core Capabilities

- ✅ **Multi-scan type support** - Analyze eyes, skin, teeth, gait, and comprehensive multi-area health
- ✅ **Intelligent image processing** - Automatic resizing, format conversion, and quality assessment
- ✅ **Structured JSON responses** - Consistent, validated output with severity ratings and confidence scores
- ✅ **Context-aware analysis** - Incorporates pet breed, age, and medical history
- ✅ **Robust error handling** - Comprehensive error types with exponential backoff retry logic
- ✅ **Built-in caching** - In-memory and Redis caching with configurable TTL (24 hours default)
- ✅ **Batch processing** - Efficiently analyze multiple images in parallel
- ✅ **Type-safe API** - Full TypeScript support with comprehensive interfaces
- ✅ **Production-ready** - Rate limiting, timeout handling, and logging

### Scan Types

| Scan Type | Purpose | Key Indicators |
|-----------|---------|----------------|
| **Eye** | Ocular health analysis | Redness, discharge, cloudiness, pupils, third eyelid, corneal health |
| **Skin** | Dermatological assessment | Redness, irritation, lesions, hair loss, parasites, lumps, infection signs |
| **Teeth** | Oral cavity examination | Plaque, tartar, gum health, loose/broken teeth, oral tumors |
| **Gait** | Mobility and posture | Limping, stiffness, reduced mobility, posture, walking pattern |
| **Multi** | Comprehensive assessment | Full-body health assessment across all areas |

## Quick Start

```typescript
import { VisionService } from './VisionService';

// Initialize service
const visionService = new VisionService({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Analyze a pet photo
const result = await visionService.analyzeImage({
  imageUrl: '/path/to/pet-photo.jpg',
  scanType: 'eye',
  petBreed: 'Golden Retriever',
  petAge: '5 years',
  medicalHistory: 'Previous conjunctivitis treatment'
});

console.log('Summary:', result.analysisSummary);
console.log('Severity:', result.overallSeverity); // green | yellow | red
console.log('Confidence:', result.confidenceScore); // 0-100
console.log('Findings:', result.findings);
console.log('Recommendations:', result.recommendations);
```

## Installation

```bash
npm install sharp @anthropic-ai/sdk
```

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_api_key_here

# Optional (with defaults shown)
VISION_MODEL=glm-4.7
VISION_BASE_URL=https://api.z.ai/api/anthropic
VISION_CACHE_ENABLED=true
VISION_CACHE_TTL=86400000
VISION_MAX_RETRIES=3
VISION_TIMEOUT=60000
REDIS_URL=redis://localhost:6379
```

### Programmatic Configuration

```typescript
import { VisionService } from './VisionService';

const visionService = new VisionService({
  apiKey: 'your-api-key',
  baseURL: 'https://api.z.ai/api/anthropic',
  model: 'glm-4.7',
  maxRetries: 3,
  timeout: 60000,
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
});
```

## Project Structure

```
vision/
├── VisionService.ts          # Main service class
├── types.ts                    # TypeScript interfaces
├── prompts.ts                  # Scan-type specific prompts
├── imageProcessor.ts           # Image preprocessing utilities
├── cache.ts                    # Caching layer (In-Memory/Redis)
├── errorHandler.ts             # Error handling & retry logic
├── __tests__/                  # Unit tests
│   ├── VisionService.test.ts
│   ├── prompts.test.ts
│   ├── imageProcessor.test.ts
│   ├── cache.test.ts
│   └── errorHandler.test.ts
└── documentation/               # Documentation
    ├── API.md                   # Complete API reference
    ├── INTEGRATION.md           # Integration guide & examples
    └── README.md                # This file
```

## API Reference

### VisionService

Main service class for pet vision analysis.

#### Methods

- `analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisResult>` - Analyze a single image
- `analyzeImageWithRetry(input: VisionAnalysisInput, maxRetries?: number): Promise<VisionAnalysisResult>` - Analyze with custom retry count
- `batchAnalyze(inputs: VisionAnalysisInput[]): Promise<VisionAnalysisResult[]>` - Analyze multiple images
- `getConfig(): VisionServiceConfig` - Get service configuration

### VisionAnalysisInput

```typescript
interface VisionAnalysisInput {
  imageUrl: string | Buffer;      // Image URL, data URL, or Buffer
  scanType: 'eye' | 'skin' | 'teeth' | 'gait' | 'multi';
  petBreed?: string;             // Pet breed for context
  petAge?: string;               // Pet age for context
  medicalHistory?: string;       // Medical history for context
}
```

### VisionAnalysisResult

```typescript
interface VisionAnalysisResult {
  analysisId: string;                    // Unique analysis ID
  analysisSummary: string;                // 2-3 sentence summary
  overallSeverity: 'green' | 'yellow' | 'red';
  findings: AIFinding[];                  // Array of findings
  confidenceScore: number;                 // 0-100
  imageQualityAssessment: 'good' | 'fair' | 'poor';
  recommendations: string[];              // Actionable recommendations
  processedAt: string;                    // ISO timestamp
}
```

## Severity Color Meanings

| Color | Meaning | Action Required |
|-------|---------|----------------|
| **Green** | No concerns or minor issues | Routine checkup sufficient |
| **Yellow** | Monitor closely | Veterinary consultation recommended within 1-2 weeks |
| **Red** | Immediate veterinary attention required | Contact veterinarian as soon as possible |

## Error Handling

The vision service provides comprehensive error handling:

| Error Class | Code | Description |
|-------------|------|-------------|
| `VisionError` | `VISION_ERROR` | Base error class |
| `APIError` | `API_ERROR` | API request errors |
| `RateLimitError` | `RATE_LIMIT_ERROR` | Rate limit exceeded (429) |
| `TimeoutError` | `TIMEOUT_ERROR` | Request timeout (408) |
| `ValidationError` | `VALIDATION_ERROR` | Input validation errors |
| `InvalidResponseError` | `INVALID_RESPONSE_ERROR` | Invalid API response |
| `ImageProcessingError` | `IMAGE_PROCESSING_ERROR` | Image processing errors |

## Example Usage

### Basic Eye Analysis

```typescript
const result = await visionService.analyzeImage({
  imageUrl: '/uploads/eye-photo.jpg',
  scanType: 'eye',
  petBreed: 'Golden Retriever',
  petAge: '5 years',
});

if (result.overallSeverity === 'red') {
  console.warn('Urgent: Immediate veterinary attention needed');
  console.warn('Findings:', result.findings);
  console.warn('Recommendations:', result.recommendations);
}
```

### Skin Analysis with Medical History

```typescript
const result = await visionService.analyzeImage({
  imageUrl: '/uploads/skin-photo.jpg',
  scanType: 'skin',
  petBreed: 'Poodle',
  petAge: '3 years',
  medicalHistory: 'Previous treatment for dermatitis in 2024'
});

console.log(`Analysis confidence: ${result.confidenceScore}%`);
console.log(`Image quality: ${result.imageQualityAssessment}`);
```

### Batch Processing Multiple Scans

```typescript
const inputs = [
  { imageUrl: eyeImage, scanType: 'eye', petBreed: 'Labrador' },
  { imageUrl: skinImage, scanType: 'skin', petBreed: 'Labrador' },
  { imageUrl: teethImage, scanType: 'teeth', petBreed: 'Labrador' },
];

const results = await visionService.batchAnalyze(inputs);

results.forEach((result, index) => {
  console.log(`${inputs[index].scanType} scan: ${result.overallSeverity}`);
});
```

### Handling Errors

```typescript
import { 
  VisionError, 
  RateLimitError, 
  TimeoutError,
  ValidationError 
} from './errorHandler';

try {
  const result = await visionService.analyzeImage(input);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof TimeoutError) {
    console.log('Request timed out');
  } else if (error instanceof ValidationError) {
    console.log('Validation error:', error.message);
  } else if (error instanceof VisionError) {
    console.log('Vision error:', error.code, error.message);
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- vision/__tests__/VisionService.test.ts

# Run with coverage
npm test -- --coverage
```

## Documentation

- **[API Documentation](./documentation/API.md)** - Complete API reference
- **[Integration Guide](./documentation/INTEGRATION.md)** - Integration patterns and examples

## Database Schema

```sql
CREATE TABLE scan_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('eye', 'skin', 'teeth', 'gait', 'multi')),
  image_url TEXT NOT NULL,
  image_hash TEXT UNIQUE,
  analysis_summary TEXT,
  overall_severity TEXT CHECK (overall_severity IN ('green', 'yellow', 'red')),
  findings JSONB NOT NULL DEFAULT '[]',
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  image_quality_assessment TEXT CHECK (image_quality_assessment IN ('good', 'fair', 'poor')),
  ai_recommendations TEXT[],
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Integration Points

- **Input**: Image from PhotoCaptureModule (Story 4)
- **Context**: Pet profile from `pet_profiles` table
- **Output**: ScanResult stored in `scan_results` table
- **Recommendations**: Passed to VetRecommendationService (Story 10)
- **Webhook**: Trigger health report generation (Story 6, 9)

## Performance Considerations

### Image Optimization

- Resize large images to max 2048x2048
- Convert to JPEG at 85% quality
- Validate minimum dimensions (256x256)

### Caching Strategy

- Cache results by image hash + scan type
- Default TTL: 24 hours
- In-memory cache for single-instance deployments
- Redis for distributed systems

### Rate Limiting

- Default max retries: 3
- Exponential backoff: 1s, 2s, 4s
- Recommended concurrent requests: 5

## License

Part of the PetVision project.

## Support

For issues, questions, or contributions, please refer to the main PetVision project repository.

# Vision Service API Documentation

Story 5: PetVision AI-powered pet health screening

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Types](#types)
- [Error Handling](#error-handling)
- [Caching](#caching)

---

## Overview

The Vision Service provides AI-powered pet health analysis using Z.AI's GLM-4.7 vision model. It analyzes pet photos for various health concerns across different body systems (eyes, skin, teeth, gait, and comprehensive multi-area analysis).

### Key Features

- **Multi-scan type support**: eye, skin, teeth, gait, and multi-area analysis
- **Intelligent image processing**: automatic resizing, format conversion, and quality assessment
- **Robust error handling**: exponential backoff retry logic and comprehensive error types
- **Built-in caching**: reduces redundant API calls with configurable TTL
- **Batch processing**: analyze multiple images efficiently
- **Type-safe**: full TypeScript support with comprehensive interfaces

---

## Installation

```bash
npm install @anthropic-ai/sdk sharp
```

### Required Dependencies

- `sharp` - Image processing and optimization
- `@anthropic-ai/sdk` - Z.AI API client (or direct fetch)
- `crypto` - Built-in Node.js module for image hashing

---

## Configuration

### Environment Variables

```bash
# Z.AI API Configuration
ANTHROPIC_API_KEY=your_api_key_here
ZAI_API_KEY=alternative_api_key_here

# Vision Service Configuration
VISION_CACHE_ENABLED=true
VISION_CACHE_TTL=86400000
REDIS_URL=redis://localhost:6379  # Optional, for Redis caching
```

### Programmatic Configuration

```typescript
import { VisionService } from './services/vision/VisionService';

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

---

## API Reference

### VisionService

Main service class for pet vision analysis.

#### Constructor

```typescript
constructor(config?: Partial<VisionServiceConfig>)
```

**Parameters:**
- `config` (optional): Partial configuration object
  - `apiKey` (string): Z.AI API key (default: from environment)
  - `baseURL` (string): API base URL (default: `https://api.z.ai/api/anthropic`)
  - `model` (string): Model name (default: `glm-4.7`)
  - `maxRetries` (number): Maximum retry attempts (default: `3`)
  - `timeout` (number): Request timeout in ms (default: `60000`)
  - `cacheEnabled` (boolean): Enable caching (default: `true`)
  - `cacheTTL` (number): Cache TTL in ms (default: `86400000`)

#### Methods

##### analyzeImage

Analyzes a single pet image.

```typescript
async analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisResult>
```

**Parameters:**
- `input`: Analysis input object
  - `imageUrl` (string | Buffer): Image URL, data URL, or Buffer
  - `scanType` ('eye' | 'skin' | 'teeth' | 'gait' | 'multi'): Type of analysis
  - `petBreed` (string, optional): Pet breed for context
  - `petAge` (string, optional): Pet age for context
  - `medicalHistory` (string, optional): Medical history for context

**Returns:** `Promise<VisionAnalysisResult>`

**Example:**
```typescript
const result = await visionService.analyzeImage({
  imageUrl: '/path/to/image.jpg',
  scanType: 'eye',
  petBreed: 'Golden Retriever',
  petAge: '5 years',
  medicalHistory: 'Previous conjunctivitis'
});

console.log(result.analysisSummary);
console.log(result.overallSeverity); // 'green', 'yellow', or 'red'
console.log(result.findings);
```

##### analyzeImageWithRetry

Analyzes an image with custom retry configuration.

```typescript
async analyzeImageWithRetry(
  input: VisionAnalysisInput,
  maxRetries?: number
): Promise<VisionAnalysisResult>
```

**Parameters:**
- `input`: Same as `analyzeImage`
- `maxRetries` (optional): Override default max retry count

**Returns:** `Promise<VisionAnalysisResult>`

**Example:**
```typescript
const result = await visionService.analyzeImageWithRetry(
  { imageUrl: imageBuffer, scanType: 'skin' },
  5 // Retry up to 5 times
);
```

##### batchAnalyze

Analyzes multiple images in batches.

```typescript
async batchAnalyze(inputs: VisionAnalysisInput[]): Promise<VisionAnalysisResult[]>
```

**Parameters:**
- `inputs`: Array of analysis input objects

**Returns:** `Promise<VisionAnalysisResult[]>`

**Example:**
```typescript
const inputs = [
  { imageUrl: img1, scanType: 'eye' },
  { imageUrl: img2, scanType: 'skin' },
  { imageUrl: img3, scanType: 'teeth' },
];

const results = await visionService.batchAnalyze(inputs);
```

##### getConfig

Returns the service configuration (API key masked).

```typescript
getConfig(): VisionServiceConfig
```

**Returns:** Configuration object with masked API key

---

### Singleton Access

```typescript
import { getVisionService, resetVisionService } from './services/vision/VisionService';

// Get or create singleton instance
const visionService = getVisionService({ apiKey: 'your-key' });

// Reset singleton (useful for testing)
resetVisionService();
```

---

## Types

### VisionAnalysisInput

```typescript
interface VisionAnalysisInput {
  imageUrl: string | Buffer;
  scanType: 'eye' | 'skin' | 'teeth' | 'gait' | 'multi';
  petBreed?: string;
  petAge?: string;
  medicalHistory?: string;
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

### AIFinding

```typescript
interface AIFinding {
  id: string;                             // Unique finding ID
  condition: string;                      // Condition name
  description: string;                    // 2-3 sentence description
  severity: 'green' | 'yellow' | 'red';   // Severity rating
  confidence: number;                      // 0-100
  area: string;                            // Specific area affected
  anatomical_location: string;           // General location
}
```

---

## Error Handling

The vision service provides comprehensive error handling with specific error types:

### Error Classes

| Error Class | Code | Status Code | Description |
|-------------|------|-------------|-------------|
| `VisionError` | `VISION_ERROR` | - | Base error class |
| `APIError` | `API_ERROR` | 400-599 | API request errors |
| `RateLimitError` | `RATE_LIMIT_ERROR` | 429 | Rate limit exceeded |
| `TimeoutError` | `TIMEOUT_ERROR` | 408 | Request timeout |
| `ValidationError` | `VALIDATION_ERROR` | 400 | Input validation errors |
| `InvalidResponseError` | `INVALID_RESPONSE_ERROR` | 502 | Invalid API response |
| `ImageProcessingError` | `IMAGE_PROCESSING_ERROR` | 422 | Image processing errors |

### Example Error Handling

```typescript
import { 
  VisionError, 
  RateLimitError, 
  TimeoutError,
  ValidationError 
} from './services/vision/errorHandler';

try {
  const result = await visionService.analyzeImage(input);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof TimeoutError) {
    console.log('Request timed out after:', error.timeout);
  } else if (error instanceof ValidationError) {
    console.log('Validation error:', error.message, error.field);
  } else if (error instanceof VisionError) {
    console.log('Vision error:', error.code, error.message);
  }
}
```

---

## Caching

### Cache Configuration

```typescript
import { visionCache, generateCacheKey } from './services/vision/cache';

// Cache is automatically used by VisionService when enabled
// Cache keys are generated as: `vision:{scanType}:{imageHash}`
```

### Cache Implementations

1. **In-Memory Cache** (default): Fast, no external dependencies
2. **Redis Cache**: For distributed systems (requires `REDIS_URL`)
3. **No-Op Cache**: When caching is disabled

### Cache TTL

- Default: 24 hours (86400000 ms)
- Configurable via `VISION_CACHE_TTL` environment variable

### Manual Cache Operations

```typescript
import { visionCache } from './services/vision/cache';

// Check if key exists
const hasCache = await visionCache.has(cacheKey);

// Get cached value
const cached = await visionCache.get(cacheKey);

// Set value manually
await visionCache.set(cacheKey, result, ttl);

// Delete specific key
await visionCache.delete(cacheKey);

// Clear all cache
await visionCache.clear();
```

---

## Response Format

### Severity Color Meanings

- **Green**: No concerns or minor issues, routine checkup sufficient
- **Yellow**: Monitor closely, veterinary consultation recommended within 1-2 weeks
- **Red**: Immediate veterinary attention required or strongly recommended

### Image Quality Assessment

- **Good**: High resolution, clear, well-lit image
- **Fair**: Acceptable quality, minor issues
- **Poor**: Low resolution, blurry, poor lighting

### Example Response

```json
{
  "analysisId": "analysis_1676328900000_abc123",
  "analysisSummary": "The pet's eyes appear healthy with clear corneas and normal pupil responses. No signs of inflammation or discharge detected.",
  "overallSeverity": "green",
  "findings": [
    {
      "id": "finding_1",
      "condition": "Normal Eye Health",
      "description": "Eyes appear healthy with clear corneas and normal appearance.",
      "severity": "green",
      "confidence": 95,
      "area": "Both eyes",
      "anatomical_location": "eye"
    }
  ],
  "confidenceScore": 95,
  "imageQualityAssessment": "good",
  "recommendations": [
    "Continue routine eye monitoring",
    "Schedule regular veterinary checkups"
  ],
  "processedAt": "2026-02-04T20:00:00.000Z"
}
```

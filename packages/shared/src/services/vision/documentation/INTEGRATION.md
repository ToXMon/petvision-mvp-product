# Vision Service Integration Guide

Story 5: PetVision AI-powered pet health screening

## Table of Contents

- [Quick Start](#quick-start)
- [Common Use Cases](#common-use-cases)
- [Integration Patterns](#integration-patterns)
- [Database Integration](#database-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies

```bash
cd packages/shared
npm install sharp @anthropic-ai/sdk
```

### 2. Basic Usage

```typescript
import { VisionService } from './services/vision/VisionService';
import fs from 'fs';

// Initialize service
const visionService = new VisionService({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Read and analyze image
const imageBuffer = fs.readFileSync('./pet-eye.jpg');

const result = await visionService.analyzeImage({
  imageUrl: imageBuffer,
  scanType: 'eye',
  petBreed: 'Golden Retriever',
  petAge: '5 years',
});

console.log('Analysis Summary:', result.analysisSummary);
console.log('Overall Severity:', result.overallSeverity);
console.log('Confidence:', result.confidenceScore);
console.log('Recommendations:', result.recommendations);
```

### 3. Environment Setup

Create a `.env` file in your project root:

```bash
# Z.AI API Configuration
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Override defaults
VISION_MODEL=glm-4.7
VISION_CACHE_ENABLED=true
VISION_CACHE_TTL=86400000
VISION_MAX_RETRIES=3
VISION_TIMEOUT=60000
```

---

## Common Use Cases

### Use Case 1: Web API Endpoint

```typescript
// Fastify/Express route handler
import { VisionService } from './services/vision/VisionService';
import { fastify } from 'fastify';

const app = fastify();
const visionService = new VisionService();

app.post('/api/scan', async (request, reply) => {
  try {
    const { image, scanType, petId } = request.body;
    
    // Get pet context from database
    const pet = await getPetProfile(petId);
    
    const result = await visionService.analyzeImage({
      imageUrl: image, // Base64 data URL or buffer
      scanType,
      petBreed: pet.breed,
      petAge: pet.age,
      medicalHistory: pet.medicalHistory,
    });
    
    // Save to database
    await saveScanResult({
      petId,
      scanType,
      imageHash: await getImageHash(image),
      ...result,
    });
    
    return result;
  } catch (error) {
    handleVisionError(error, reply);
  }
});
```

### Use Case 2: Scheduled Health Check

```typescript
// Scan multiple pets periodically
import { VisionService } from './services/vision/VisionService';
import cron from 'node-cron';

const visionService = new VisionService();

cron.schedule('0 9 * * *', async () => {
  console.log('Starting daily health scan...');
  
  const pets = await getActivePets();
  
  for (const pet of pets) {
    try {
      const recentImages = await getRecentPetImages(pet.id, 'eye');
      
      if (recentImages.length > 0) {
        const result = await visionService.analyzeImage({
          imageUrl: recentImages[0].url,
          scanType: 'eye',
          petBreed: pet.breed,
          petAge: pet.age,
          medicalHistory: pet.medicalHistory,
        });
        
        // Alert if red severity
        if (result.overallSeverity === 'red') {
          await sendAlert(pet.ownerId, {
            type: 'health_alert',
            severity: 'red',
            summary: result.analysisSummary,
            recommendations: result.recommendations,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to scan pet ${pet.id}:`, error);
    }
  }
});
```

### Use Case 3: Batch Processing

```typescript
// Process multiple images from a photo session
import { VisionService } from './services/vision/VisionService';

const visionService = new VisionService();

async function processPhotoSession(sessionId: string) {
  const session = await getPhotoSession(sessionId);
  
  const inputs = session.images.map(img => ({
    imageUrl: img.buffer,
    scanType: session.scanType,
    petBreed: session.petBreed,
    petAge: session.petAge,
    medicalHistory: session.medicalHistory,
  }));
  
  // Batch analyze all images
  const results = await visionService.batchAnalyze(inputs);
  
  // Save results
  for (let i = 0; i < results.length; i++) {
    await saveScanResult({
      sessionId,
      imageId: session.images[i].id,
      ...results[i],
    });
  }
  
  return results;
}
```

---

## Integration Patterns

### Pattern 1: Singleton Service

```typescript
// services/vision.ts
import { VisionService } from './services/vision/VisionService';

// Create singleton instance
export const visionService = new VisionService({
  apiKey: process.env.ANTHROPIC_API_KEY,
  cacheEnabled: true,
});

// Use throughout application
import { visionService } from './services/vision';
```

### Pattern 2: Context Enrichment

```typescript
// Enrich analysis with pet medical history
interface EnrichedInput {
  image: Buffer | string;
  scanType: ScanType;
  petId: string;
}

async function analyzeWithContext(input: EnrichedInput) {
  // Fetch pet profile
  const pet = await db.petProfiles.findUnique({
    where: { id: input.petId },
    include: { medicalHistory: true, vaccinations: true },
  });
  
  // Build context string
  const medicalContext = [
    pet.medicalHistory.map(h => `${h.condition} (${h.date})`).join(', '),
    pet.vaccinations.map(v => `${v.name} (${v.date})`).join(', '),
  ].filter(Boolean).join('; ');
  
  return visionService.analyzeImage({
    imageUrl: input.image,
    scanType: input.scanType,
    petBreed: pet.breed,
    petAge: calculateAge(pet.birthDate),
    medicalHistory: medicalContext || undefined,
  });
}
```
### Pattern 3: Retry with Fallback

```typescript
// Implement fallback for critical scans
import { 
  VisionError, 
  RateLimitError, 
  TimeoutError 
} from './services/vision/errorHandler';

async function analyzeWithFallback(input: VisionAnalysisInput) {
  try {
    // First attempt with caching
    return await visionService.analyzeImage(input);
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Wait and retry
      await new Promise(resolve => 
        setTimeout(resolve, error.retryAfter)
      );
      return visionService.analyzeImageWithRetry(input, 5);
    }
    
    if (error instanceof TimeoutError) {
      // Try with extended timeout
      const service = new VisionService({ timeout: 120000 });
      return service.analyzeImage(input);
    }
    
    // For other errors, return fallback response
    if (error instanceof VisionError) {
      console.warn('Vision analysis failed, using fallback:', error.message);
      return getFallbackResponse(input.scanType);
    }
    
    throw error;
  }
}

function getFallbackResponse(scanType: string) {
  return {
    analysisId: `fallback_${Date.now()}`,
    analysisSummary: 'Unable to perform AI analysis at this time. Please try again later or consult a veterinarian for a manual examination.',
    overallSeverity: 'yellow',
    findings: [],
    confidenceScore: 0,
    imageQualityAssessment: 'unknown' as const,
    recommendations: [
      'Please try the scan again',
      'If the issue persists, contact support',
      'Consider scheduling a veterinary appointment for examination'
    ],
    processedAt: new Date().toISOString(),
  };
}
```

---

## Database Integration

### Schema (PostgreSQL)

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

CREATE INDEX idx_scan_results_pet_id ON scan_results(pet_id);
CREATE INDEX idx_scan_results_scan_type ON scan_results(scan_type);
CREATE INDEX idx_scan_results_severity ON scan_results(overall_severity);
CREATE INDEX idx_scan_results_created_at ON scan_results(created_at DESC);
```

### Prisma Model

```prisma
model ScanResult {
  id                        String    @id @default(uuid())
  petId                     String
  scanType                  ScanType
  imageUrl                  String
  imageHash                 String?   @unique
  analysisSummary           String?   @db.Text
  overallSeverity           Severity
  findings                  Json      @default("[]")
  confidenceScore           Int?
  imageQualityAssessment   ImageQuality?
  aiRecommendations         String[]  @default([])
  processedAt               DateTime  @default(now())
  createdAt                 DateTime  @default(now())
  
  pet                       Pet       @relation(fields: [petId], references: [id], onDelete: Cascade)
  
  @@index([petId])
  @@index([scanType])
  @@index([overallSeverity])
  @@index([createdAt(sort: Desc)])
}

enum ScanType {
  eye
  skin
  teeth
  gait
  multi
}

enum Severity {
  green
  yellow
  red
}

enum ImageQuality {
  good
  fair
  poor
}
```

### Saving Results to Database

```typescript
import { prisma } from './prisma';
import { VisionAnalysisResult } from './types/vision-analysis';

async function saveScanResult(
  petId: string,
  imageUrl: string,
  imageHash: string,
  result: VisionAnalysisResult
) {
  return prisma.scanResult.create({
    data: {
      petId,
      scanType: 'eye', // or appropriate type
      imageUrl,
      imageHash,
      analysisSummary: result.analysisSummary,
      overallSeverity: result.overallSeverity,
      findings: result.findings,
      confidenceScore: result.confidenceScore,
      imageQualityAssessment: result.imageQualityAssessment,
      aiRecommendations: result.recommendations,
      processedAt: new Date(result.processedAt),
    },
  });
}
```

---

## Best Practices

### 1. Handle Large Images

```typescript
import sharp from 'sharp';

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(2048, 2048, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

// Before analysis
const optimizedImage = await optimizeImage(rawImageBuffer);
const result = await visionService.analyzeImage({
  imageUrl: optimizedImage,
  scanType: 'eye',
});
```

### 2. Cache Management

```typescript
// Pre-warm cache for frequently scanned pets
async function preWarmCache(petId: string) {
  const recentScans = await getRecentScans(petId);
  
  const inputs = recentScans.map(scan => ({
    imageUrl: scan.imageUrl,
    scanType: scan.scanType,
  }));
  
  await visionService.batchAnalyze(inputs);
}
```

### 3. Rate Limiting

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent requests

async function analyzeMultiple(inputs: VisionAnalysisInput[]) {
  return Promise.all(
    inputs.map(input => 
      limit(() => visionService.analyzeImage(input))
    )
  );
}
```

### 4. Monitoring and Logging

```typescript
import { visionService } from './services/vision';

const originalAnalyze = visionService.analyzeImage.bind(visionService);

visionService.analyzeImage = async function(input) {
  const startTime = Date.now();
  
  try {
    const result = await originalAnalyze(input);
    
    // Log success metrics
    await logAnalysis({
      scanType: input.scanType,
      duration: Date.now() - startTime,
      severity: result.overallSeverity,
      confidence: result.confidenceScore,
      success: true,
    });
    
    return result;
  } catch (error) {
    // Log errors
    await logAnalysis({
      scanType: input.scanType,
      duration: Date.now() - startTime,
      success: false,
      error: error.message,
    });
    
    throw error;
  }
};
```

---

## Troubleshooting

### Common Issues

#### Issue: API Key Not Found

```
Error: API key is required
```

**Solution:** Set `ANTHROPIC_API_KEY` environment variable or pass it to the VisionService constructor.

#### Issue: Timeout Errors

```
Error: API request timed out
```

**Solution:**
- Increase timeout: `new VisionService({ timeout: 120000 })`
- Optimize image size before sending
- Check network connectivity

#### Issue: Rate Limit Exceeded

```
Error: Rate limit exceeded (429)
```

**Solution:**
- Enable caching to reduce duplicate requests
- Implement exponential backoff
- Contact Z.AI to increase rate limits

#### Issue: Invalid JSON Response

```
Error: Invalid API response: Failed to parse JSON
```

**Solution:**
- Check model configuration (should be `glm-4.7`)
- Verify API endpoint URL
- Review API response logs

#### Issue: Poor Image Quality Results

```
imageQualityAssessment: 'poor'
```

**Solution:**
- Ensure images are well-lit and in focus
- Use proper camera positioning
- Preprocess images with sharp to enhance quality
- Request users to retake photos

---

## Support

For issues, questions, or contributions:

- GitHub Issues: [Project Repository]
- Documentation: [API Docs](./API.md)
- Email: support@petvision.example.com

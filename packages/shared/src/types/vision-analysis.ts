/**
 * Z.AI Vision Analysis Integration Types
 * Story 5: PetVision AI-powered pet health screening
 */

export type ScanType = 'eye' | 'skin' | 'teeth' | 'gait' | 'multi';

export type SeverityRating = 'green' | 'yellow' | 'red';

export type ImageQuality = 'good' | 'fair' | 'poor';

export interface AIFinding {
  id: string;
  condition: string;
  description: string;
  severity: SeverityRating;
  confidence: number; // 0-100
  area: string;
  anatomical_location: string;
}

export interface VisionAnalysisInput {
  imageUrl: string | Buffer;
  scanType: ScanType;
  petBreed?: string;
  petAge?: string;
  medicalHistory?: string;
}

export interface VisionAnalysisResult {
  analysisId: string;
  analysisSummary: string;
  overallSeverity: SeverityRating;
  findings: AIFinding[];
  confidenceScore: number; // 0-100
  imageQualityAssessment: ImageQuality;
  recommendations: string[];
  processedAt: string;
}

export interface ZAIAPIRequest {
  model: string;
  messages: Array<{
    role: string;
    content: Array<{
      type: 'image' | 'text';
      source?: {
        type: 'base64';
        media_type: string;
        data: string;
      };
      text?: string;
    }>;
  }>;
  max_tokens: number;
  temperature: number;
}

export interface ZAIAPIResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface VisionAnalysisInternal {
  analysis_summary: string;
  overall_severity: SeverityRating;
  findings: AIFinding[];
  confidence_score: number;
  image_quality_assessment: ImageQuality;
  recommendations: string[];
}

export interface CacheEntry {
  result: VisionAnalysisResult;
  timestamp: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp';
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface VisionServiceConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxRetries?: number;
  timeout?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number; // in milliseconds
}

export interface VisionService {
  analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisResult>;
  analyzeImageWithRetry(input: VisionAnalysisInput, maxRetries?: number): Promise<VisionAnalysisResult>;
  batchAnalyze(inputs: VisionAnalysisInput[]): Promise<VisionAnalysisResult[]>;
}

export interface ScanResult {
  id: string;
  petId: string;
  scanType: ScanType;
  imageUrl: string;
  imageHash: string;
  analysisSummary: string;
  overallSeverity: SeverityRating;
  findings: AIFinding[];
  confidenceScore: number;
  imageQualityAssessment: ImageQuality;
  aiRecommendations: string[];
  processedAt: string;
  createdAt: string;
}

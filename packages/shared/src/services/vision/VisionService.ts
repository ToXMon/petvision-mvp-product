/**
 * Z.AI Vision Analysis Service
 * Story 5: PetVision AI-powered pet health screening
 */

import {
  VisionAnalysisInput,
  VisionAnalysisResult,
  VisionAnalysisInternal,
  VisionServiceConfig,
  ZAIAPIRequest,
  AIFinding,
} from '../../types/vision-analysis';

import { getAnalysisPrompt } from './prompts';
import { imageProcessor } from './imageProcessor';
import { visionCache, generateCacheKey } from './cache';
import {
  retryWithBackoff,
  parseAPIError,
  validateAnalysisResponse,
  parseJSONResponse,
  VisionError,
  APIError,
  TimeoutError,
  ValidationError,
  logger,
} from './errorHandler';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Partial<VisionServiceConfig> = {
  baseURL: 'https://api.z.ai/api/anthropic',
  model: 'glm-4.7',
  maxRetries: 3,
  timeout: 60000, // 60 seconds
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
};

export class VisionService {
  private config: Required<VisionServiceConfig>;

  constructor(config: Partial<VisionServiceConfig> = {}) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || process.env.ZAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key is required. Set ANTHROPIC_API_KEY or ZAI_API_KEY environment variable.');
    }

    this.config = {
      apiKey,
      baseURL: config.baseURL || DEFAULT_CONFIG.baseURL!,
      model: config.model || DEFAULT_CONFIG.model!,
      maxRetries: config.maxRetries ?? DEFAULT_CONFIG.maxRetries!,
      timeout: config.timeout ?? DEFAULT_CONFIG.timeout!,
      cacheEnabled: config.cacheEnabled ?? DEFAULT_CONFIG.cacheEnabled!,
      cacheTTL: config.cacheTTL ?? DEFAULT_CONFIG.cacheTTL!,
    };
  }

  /**
   * Main method to analyze a pet image
   */
  async analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
    const { imageUrl, scanType, petBreed, petAge, medicalHistory } = input;

    logger.info('Starting vision analysis', { scanType, petBreed, petAge });

    // Prepare image
    const imageData = await imageProcessor.prepareImage(imageUrl);

    // Generate cache key
    const cacheKey = generateCacheKey(imageData.hash, scanType);

    // Check cache if enabled
    if (this.config.cacheEnabled) {
      const cached = await visionCache.get(cacheKey);
      if (cached) {
        logger.info('Returning cached analysis result', { cacheKey });
        return cached;
      }
    }

    // Build prompt
    const prompt = getAnalysisPrompt({
      scanType,
      petBreed,
      petAge,
      medicalHistory,
    });

    // Build API request
    const apiRequest: ZAIAPIRequest = {
      model: this.config.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageData.mediaType,
                data: imageData.base64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    };

    // Call API with retry logic
    const result = await this.callAPIWithRetry(apiRequest, scanType);

    // Transform result to output format
    const visionResult = await this.transformResult(result, scanType, imageData.quality);

    // Cache result if enabled
    if (this.config.cacheEnabled) {
      await visionCache.set(cacheKey, visionResult, this.config.cacheTTL);
    }

    logger.info('Vision analysis completed', {
      analysisId: visionResult.analysisId,
      overallSeverity: visionResult.overallSeverity,
      findingsCount: visionResult.findings.length,
    });

    return visionResult;
  }

  /**
   * Analyze image with explicit retry configuration
   */
  async analyzeImageWithRetry(
    input: VisionAnalysisInput,
    maxRetries?: number
  ): Promise<VisionAnalysisResult> {
    const originalMaxRetries = this.config.maxRetries;
    
    if (maxRetries !== undefined) {
      this.config.maxRetries = maxRetries;
    }

    try {
      return await this.analyzeImage(input);
    } finally {
      this.config.maxRetries = originalMaxRetries;
    }
  }

  /**
   * Batch analyze multiple images
   */
  async batchAnalyze(inputs: VisionAnalysisInput[]): Promise<VisionAnalysisResult[]> {
    logger.info('Starting batch analysis', { count: inputs.length });

    const results: VisionAnalysisResult[] = [];
    const batchSize = 3; // Process 3 at a time to avoid overwhelming the API

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const batchPromises = batch.map(input => this.analyzeImage(input));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    logger.info('Batch analysis completed', {
      total: results.length,
    });

    return results;
  }

  /**
   * Call Z.AI API with retry logic
   */
  private async callAPIWithRetry(
    request: ZAIAPIRequest,
    scanType: string
  ): Promise<VisionAnalysisInternal> {
    return retryWithBackoff(
      async () => this.callAPI(request, scanType),
      {
        maxRetries: this.config.maxRetries,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
      },
      `VisionAnalysis-${scanType}`
    );
  }

  /**
   * Call Z.AI API directly
   */
  private async callAPI(
    request: ZAIAPIRequest,
    scanType: string
  ): Promise<VisionAnalysisInternal> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      logger.debug('Sending API request', {
        model: request.model,
        scanType,
      });

      const response = await fetch(`${this.config.baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let responseBody;
        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text();
        }
        throw parseAPIError(response, responseBody);
      }

      const data = await response.json();

      // Extract text from response
      const content = data.content?.[0]?.text;
      if (!content) {
        throw new VisionError('No content in API response', 'NO_CONTENT');
      }

      logger.debug('API response received', {
        contentLength: content.length,
        tokens: data.usage,
      });

      // Parse JSON response
      const parsedResult = parseJSONResponse(content);

      // Validate response structure
      validateAnalysisResponse(parsedResult);

      return parsedResult;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof VisionError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError('API request timed out', this.config.timeout);
      }

      throw new APIError(
        `API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Transform internal result to output format
   */
  private async transformResult(
    internal: VisionAnalysisInternal,
    scanType: string,
    imageQuality: 'good' | 'fair' | 'poor'
  ): Promise<VisionAnalysisResult> {
    const analysisId = this.generateAnalysisId();

    // Normalize severity
    const overallSeverity = this.normalizeSeverity(internal.overall_severity);

    // Transform findings
    const findings: AIFinding[] = internal.findings.map(finding => ({
      id: finding.id || this.generateFindingId(),
      condition: finding.condition,
      description: finding.description,
      severity: this.normalizeSeverity(finding.severity),
      confidence: finding.confidence,
      area: finding.area,
      anatomical_location: finding.anatomical_location,
    }));

    // Normalize image quality
    const normalizedQuality = this.normalizeImageQuality(
      internal.image_quality_assessment,
      imageQuality
    );

    return {
      analysisId,
      analysisSummary: internal.analysis_summary,
      overallSeverity,
      findings,
      confidenceScore: internal.confidence_score,
      imageQualityAssessment: normalizedQuality,
      recommendations: internal.recommendations,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Normalize severity from API format to internal format
   */
  private normalizeSeverity(
    severity: string
  ): 'green' | 'yellow' | 'red' {
    const s = severity.toLowerCase();
    if (s === 'green') return 'green';
    if (s === 'yellow') return 'yellow';
    if (s === 'red') return 'red';
    // Default to yellow if unknown
    return 'yellow';
  }

  /**
   * Normalize image quality
   */
  private normalizeImageQuality(
    apiQuality: string,
   processorQuality: 'good' | 'fair' | 'poor'
  ): 'good' | 'fair' | 'poor' {
    const api = apiQuality.toLowerCase();
    const proc = processorQuality;

    // Use the lower quality between API and processor assessment
    if (proc === 'poor') return 'poor';
    if (api === 'poor') return 'poor';

    if (proc === 'fair' || api === 'fair') return 'fair';

    return 'good';
  }

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate unique finding ID
   */
  private generateFindingId(): string {
    return `finding_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get service configuration
   */
  getConfig(): VisionServiceConfig {
    return { ...this.config, apiKey: '***' }; // Don't expose API key
  }
}

/**
 * Create singleton instance
 */
let visionServiceInstance: VisionService | null = null;

export const getVisionService = (config?: Partial<VisionServiceConfig>): VisionService => {
  if (!visionServiceInstance) {
    visionServiceInstance = new VisionService(config);
  }
  return visionServiceInstance;
};

/**
 * Reset singleton instance (useful for testing)
 */
export const resetVisionService = (): void => {
  visionServiceInstance = null;
};

/**
 * Default export
 */
export default VisionService;

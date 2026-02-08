/**
 * Unit Tests for Vision Service
 * Story 5: PetVision AI-powered pet health screening
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VisionService, getVisionService, resetVisionService } from '../VisionService';
import { VisionAnalysisInput, VisionAnalysisResult } from '../../../types/vision-analysis';
import sharp from 'sharp';

describe('VisionService', () => {
  let service: VisionService;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    resetVisionService();
    service = new VisionService({
      apiKey: 'test-api-key',
      baseURL: 'https://test.z.ai/api/anthropic',
      model: 'glm-4.7',
      maxRetries: 2,
      timeout: 5000,
      cacheEnabled: false, // Disable cache for testing
    });

    // Mock fetch
    mockFetch = jest.fn() as jest.Mock;
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetVisionService();
  });

  describe('constructor', () => {
    it('should create service with default config', () => {
      const defaultService = new VisionService({
        apiKey: 'test-key',
      });
      expect(defaultService.getConfig().model).toBe('glm-4.7');
      expect(defaultService.getConfig().maxRetries).toBe(3);
    });

    it('should throw error if no API key provided', () => {
      // Temporarily remove API key from environment
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.ZAI_API_KEY;

      expect(() => new VisionService()).toThrow('API key is required');

      // Restore
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });
  });

  describe('analyzeImage', () => {
    const createMockImage = async (): Promise<Buffer> => {
      return await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();
    };

    const mockAPIResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            analysis_summary: 'Test analysis summary',
            overall_severity: 'green',
            findings: [
              {
                id: 'f1',
                condition: 'Test condition',
                description: 'Test description',
                severity: 'yellow',
                confidence: 85,
                area: 'test area',
                anatomical_location: 'test location',
              },
            ],
            confidence_score: 90,
            image_quality_assessment: 'Good',
            recommendations: ['Recommendation 1', 'Recommendation 2'],
          }),
        },
      ],
      usage: { input_tokens: 100, output_tokens: 200 },
    };

    it('should analyze image successfully', async () => {
      const imageBuffer = await createMockImage();

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockAPIResponse,
      } as Response);

      const input: VisionAnalysisInput = {
        imageUrl: imageBuffer,
        scanType: 'eye',
        petBreed: 'Golden Retriever',
        petAge: '5 years',
      };

      const result = await service.analyzeImage(input);

      expect(result.analysisId).toBeDefined();
      expect(result.analysisSummary).toBe('Test analysis summary');
      expect(result.overallSeverity).toBe('green');
      expect(result.findings).toHaveLength(1);
      expect(result.confidenceScore).toBe(90);
      expect(result.recommendations).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should include scan type in request', async () => {
      const imageBuffer = await createMockImage();

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockAPIResponse,
      } as Response);

      const input: VisionAnalysisInput = {
        imageUrl: imageBuffer,
        scanType: 'skin',
      };

      await service.analyzeImage(input);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('glm-4.7');
      expect(requestBody.messages[0].content[1].text).toContain('SKIN ANALYSIS INSTRUCTIONS');
    });

    it('should handle API errors with retry', async () => {
      const imageBuffer = await createMockImage();

      let attempt = 0;
      mockFetch.mockImplementation(async () => {
        attempt++;
        if (attempt < 2) {
          return {
            ok: false,
            status: 500,
            headers: new Headers(),
            json: async () => ({ error: { message: 'Server error' } }),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockAPIResponse,
        } as Response;
      });

      const input: VisionAnalysisInput = {
        imageUrl: imageBuffer,
        scanType: 'teeth',
      };

      const result = await service.analyzeImage(input);
      expect(result).toBeDefined();
      expect(attempt).toBe(2);
    });

    it('should throw after max retries', async () => {
      const imageBuffer = await createMockImage();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({ error: { message: 'Server error' } }),
      } as Response);

      const input: VisionAnalysisInput = {
        imageUrl: imageBuffer,
        scanType: 'gait',
      };

      await expect(service.analyzeImage(input)).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle timeout', async () => {
      const imageBuffer = await createMockImage();

      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
      );

      const input: VisionAnalysisInput = {
        imageUrl: imageBuffer,
        scanType: 'multi',
      };

      await expect(service.analyzeImage(input)).rejects.toThrow('API request timed out');
    }, 10000);
  });

  describe('analyzeImageWithRetry', () => {
    it('should use custom retry count', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();

      let attempt = 0;
      mockFetch.mockImplementation(async () => {
        attempt++;
        if (attempt < 4) {
          return {
            ok: false,
            status: 500,
            headers: new Headers(),
            json: async () => ({ error: { message: 'Server error' } }),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  analysis_summary: 'Test',
                  overall_severity: 'green',
                  findings: [],
                  confidence_score: 90,
                  image_quality_assessment: 'Good',
                  recommendations: [],
                }),
              },
            ],
          }),
        } as Response;
      });

      const input: VisionAnalysisInput = {
        imageUrl: imageBuffer,
        scanType: 'eye',
      };

      await service.analyzeImageWithRetry(input, 5);
      expect(attempt).toBe(4);
    });
  });

  describe('batchAnalyze', () => {
    it('should analyze multiple images in batches', async () => {
      const createInput = async (i: number): Promise<VisionAnalysisInput> => ({
        imageUrl: await sharp({
          create: {
            width: 800,
            height: 600,
            channels: 3,
            background: { r: i * 50, g: 100, b: 200 },
          },
        })
          .jpeg()
          .toBuffer(),
        scanType: 'eye',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                analysis_summary: 'Test',
                overall_severity: 'green',
                findings: [],
                confidence_score: 90,
                image_quality_assessment: 'Good',
                recommendations: [],
              }),
            },
          ],
        }),
      } as Response);

      const inputs = await Promise.all(
        [1, 2, 3, 4].map(i => createInput(i))
      );

      const results = await service.batchAnalyze(inputs);

      expect(results).toHaveLength(4);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('getConfig', () => {
    it('should return config with masked API key', () => {
      const config = service.getConfig();
      expect(config.apiKey).toBe('***');
      expect(config.model).toBe('glm-4.7');
      expect(config.baseURL).toBe('https://test.z.ai/api/anthropic');
    });
  });
});

describe('getVisionService singleton', () => {
  beforeEach(() => {
    resetVisionService();
  });

  it('should create singleton instance', () => {
    const service1 = getVisionService({ apiKey: 'key1' });
    const service2 = getVisionService();
    expect(service1).toBe(service2);
  });

  it('should create new instance after reset', () => {
    const service1 = getVisionService({ apiKey: 'key1' });
    resetVisionService();
    const service2 = getVisionService({ apiKey: 'key2' });
    expect(service1).not.toBe(service2);
  });
});

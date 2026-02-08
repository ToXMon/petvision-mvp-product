/**
 * Unit Tests for Error Handler
 * Story 5: PetVision AI-powered pet health screening
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  VisionError,
  APIError,
  RateLimitError,
  TimeoutError,
  ValidationError,
  InvalidResponseError,
  ImageProcessingError,
  ConsoleLogger,
  retryWithBackoff,
  parseAPIError,
  validateAnalysisResponse,
  cleanJSONResponse,
  parseJSONResponse,
  logger,
} from '../errorHandler';

describe('VisionError Classes', () => {
  it('should create VisionError with correct properties', () => {
    const error = new VisionError('Test message', 'TEST_CODE', 400);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('VisionError');
  });

  it('should create APIError with correct properties', () => {
    const error = new APIError('API failed', 500);
    expect(error.message).toBe('API failed');
    expect(error.code).toBe('API_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('APIError');
  });

  it('should create RateLimitError with correct properties', () => {
    const error = new RateLimitError('Rate limited', 5000);
    expect(error.message).toBe('Rate limited');
    expect(error.code).toBe('RATE_LIMIT_ERROR');
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(5000);
  });

  it('should create TimeoutError with correct properties', () => {
    const error = new TimeoutError('Request timeout', 60000);
    expect(error.message).toBe('Request timeout');
    expect(error.code).toBe('TIMEOUT_ERROR');
    expect(error.statusCode).toBe(408);
    expect(error.timeout).toBe(60000);
  });

  it('should create ValidationError with correct properties', () => {
    const error = new ValidationError('Invalid input', 'field_name');
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.field).toBe('field_name');
  });

  it('should create InvalidResponseError with correct properties', () => {
    const error = new InvalidResponseError('Bad response', { data: 'test' });
    expect(error.message).toBe('Bad response');
    expect(error.code).toBe('INVALID_RESPONSE_ERROR');
    expect(error.statusCode).toBe(502);
    expect(error.responseData).toEqual({ data: 'test' });
  });

  it('should create ImageProcessingError with correct properties', () => {
    const original = new Error('Original error');
    const error = new ImageProcessingError('Image failed', original);
    expect(error.message).toBe('Image failed');
    expect(error.code).toBe('IMAGE_PROCESSING_ERROR');
    expect(error.statusCode).toBe(422);
    expect(error.originalError).toBe(original);
  });
});

describe('ConsoleLogger', () => {
  let logSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should log error messages', () => {
    logger.error('Test error', { key: 'value' });
    expect(logSpy).toHaveBeenCalledWith('[Vision Error] Test error', { key: 'value' });
  });

  it('should log warning messages', () => {
    logger.warn('Test warning');
    expect(console.warn).toHaveBeenCalledWith('[Vision Warn] Test warning', '');
  });
});

describe('retryWithBackoff', () => {
  it('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(mockFn, { maxRetries: 3 });
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    let attempts = 0;
    const mockFn = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new APIError('Server error', 500);
      }
      return 'success';
    });

    const result = await retryWithBackoff(mockFn, { maxRetries: 3, initialDelay: 10 });
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable errors', async () => {
    const mockFn = jest.fn().mockRejectedValue(
      new ValidationError('Invalid input')
    );

    await expect(retryWithBackoff(mockFn, { maxRetries: 3 })).rejects.toThrow(
      'Invalid input'
    );
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(
      new APIError('Server error', 500)
    );

    await expect(
      retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 10 })
    ).rejects.toThrow('Server error');
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should implement exponential backoff', async () => {
    const timestamps: number[] = [];
    const mockFn = jest.fn().mockImplementation(async () => {
      timestamps.push(Date.now());
      if (timestamps.length < 3) {
        throw new APIError('Server error', 500);
      }
      return 'success';
    });

    await retryWithBackoff(mockFn, { maxRetries: 2, initialDelay: 50 });

    // Check that delays increased (with some tolerance)
    expect(timestamps.length).toBe(3);
    const delay1 = timestamps[1] - timestamps[0];
    const delay2 = timestamps[2] - timestamps[1];
    expect(delay2).toBeGreaterThan(delay1 * 1.5); // At least 1.5x increase
  });
});

describe('parseAPIError', () => {
  it('should parse 429 as RateLimitError', () => {
    const response = {
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '60' }),
    } as Response;

    const error = parseAPIError(response);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.statusCode).toBe(429);
  });

  it('should parse error from JSON body', () => {
    const response = {
      ok: false,
      status: 400,
      headers: new Headers(),
    } as Response;

    const error = parseAPIError(response, {
      error: { message: 'Bad request', type: 'INVALID_REQUEST' },
    });

    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe('Bad request');
  });

  it('should handle string body', () => {
    const response = {
      ok: false,
      status: 500,
      headers: new Headers(),
    } as Response;

    const error = parseAPIError(response, 'Internal server error');
    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe('Internal server error');
  });
});

describe('validateAnalysisResponse', () => {
  it('should validate correct response', () => {
    const validResponse = {
      analysis_summary: 'Test summary',
      overall_severity: 'green',
      findings: [
        {
          id: 'f1',
          condition: 'Test condition',
          description: 'Test description',
          severity: 'yellow',
          confidence: 80,
          area: 'test area',
          anatomical_location: 'test location',
        },
      ],
      confidence_score: 85,
      image_quality_assessment: 'Good',
      recommendations: ['Recommendation 1'],
    };

    expect(() => validateAnalysisResponse(validResponse)).not.toThrow();
  });

  it('should throw for missing analysis_summary', () => {
    const invalidResponse = {
      overall_severity: 'green',
      findings: [],
      confidence_score: 85,
      image_quality_assessment: 'Good',
      recommendations: [],
    };

    expect(() => validateAnalysisResponse(invalidResponse)).toThrow(
      'analysis_summary'
    );
  });

  it('should throw for invalid overall_severity', () => {
    const invalidResponse = {
      analysis_summary: 'Test',
      overall_severity: 'invalid',
      findings: [],
      confidence_score: 85,
      image_quality_assessment: 'Good',
      recommendations: [],
    };

    expect(() => validateAnalysisResponse(invalidResponse)).toThrow(
      'overall_severity'
    );
  });

  it('should throw for missing findings array', () => {
    const invalidResponse = {
      analysis_summary: 'Test',
      overall_severity: 'green',
      findings: 'not an array',
      confidence_score: 85,
      image_quality_assessment: 'Good',
      recommendations: [],
    };

    expect(() => validateAnalysisResponse(invalidResponse)).toThrow('findings');
  });

  it('should throw for invalid finding severity', () => {
    const invalidResponse = {
      analysis_summary: 'Test',
      overall_severity: 'green',
      findings: [
        {
          id: 'f1',
          condition: 'Test',
          description: 'Test',
          severity: 'invalid',
          confidence: 80,
          area: 'test',
          anatomical_location: 'test',
        },
      ],
      confidence_score: 85,
      image_quality_assessment: 'Good',
      recommendations: [],
    };

    expect(() => validateAnalysisResponse(invalidResponse)).toThrow('severity');
  });

  it('should throw for invalid confidence_score range', () => {
    const invalidResponse = {
      analysis_summary: 'Test',
      overall_severity: 'green',
      findings: [],
      confidence_score: 150,
      image_quality_assessment: 'Good',
      recommendations: [],
    };

    expect(() => validateAnalysisResponse(invalidResponse)).toThrow(
      'confidence_score'
    );
  });
});

describe('cleanJSONResponse', () => {
  it('should remove markdown code blocks', () => {
    const text = '```json\n{"key": "value"}\n```';
    const cleaned = cleanJSONResponse(text);
    expect(cleaned).toBe('{"key": "value"}');
  });

  it('should remove ``` only code blocks', () => {
    const text = '```\n{"key": "value"}\n```';
    const cleaned = cleanJSONResponse(text);
    expect(cleaned).toBe('{"key": "value"}');
  });

  it('should not modify plain JSON', () => {
    const text = '{"key": "value"}';
    const cleaned = cleanJSONResponse(text);
    expect(cleaned).toBe('{"key": "value"}');
  });

  it('should handle whitespace', () => {
    const text = '  ```json\n{"key": "value"}\n```  ';
    const cleaned = cleanJSONResponse(text);
    expect(cleaned).toBe('{"key": "value"}');
  });
});

describe('parseJSONResponse', () => {
  it('should parse valid JSON', () => {
    const text = '{"key": "value"}';
    const parsed = parseJSONResponse(text);
    expect(parsed).toEqual({ key: 'value' });
  });
  
  it('should parse JSON with markdown blocks', () => {
    const text = '```json\n{"key": "value"}\n```';
    const parsed = parseJSONResponse(text);
    expect(parsed).toEqual({ key: 'value' });
  });

  it('should extract JSON from text', () => {
    const text = 'Some text before {"key": "value"} some text after';
    const parsed = parseJSONResponse(text);
    expect(parsed).toEqual({ key: 'value' });
  });

  it('should throw for invalid JSON', () => {
    const text = 'not valid json';
    expect(() => parseJSONResponse(text)).toThrow(InvalidResponseError);
  });
});

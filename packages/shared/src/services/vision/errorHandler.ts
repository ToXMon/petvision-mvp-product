/**
 * Error Handler for Vision Service
 * Story 5: PetVision AI-powered pet health screening
 */

import { RetryOptions } from '../../types/vision-analysis';

/**
 * Custom Vision Error Classes
 */
export class VisionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'VisionError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class APIError extends VisionError {
  constructor(
    message: string,
    statusCode: number,
    public originalError?: Error
  ) {
    super(message, 'API_ERROR', statusCode, originalError);
    this.name = 'APIError';
  }
}

export class RateLimitError extends VisionError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends VisionError {
  constructor(
    message: string = 'Request timed out',
    public timeout: number
  ) {
    super(message, 'TIMEOUT_ERROR', 408);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends VisionError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class InvalidResponseError extends VisionError {
  constructor(message: string, public responseData?: any) {
    super(message, 'INVALID_RESPONSE_ERROR', 502);
    this.name = 'InvalidResponseError';
  }
}

export class ImageProcessingError extends VisionError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'IMAGE_PROCESSING_ERROR', 422, originalError);
    this.name = 'ImageProcessingError';
  }
}

/**
 * Error logger interface
 */
export interface ILogger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

/**
 * Default console logger
 */
export class ConsoleLogger implements ILogger {
  error(message: string, meta?: any): void {
    console.error(`[Vision Error] ${message}`, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`[Vision Warn] ${message}`, meta || '');
  }

  info(message: string, meta?: any): void {
    console.info(`[Vision Info] ${message}`, meta || '');
  }

  debug(message: string, meta?: any): void {
    console.debug(`[Vision Debug] ${message}`, meta || '');
  }
}

/**
 * Default logger instance
 */
export const logger: ILogger = new ConsoleLogger();

/**
 * Retry configuration defaults
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
const calculateDelay = (
  attempt: number,
  options: Required<RetryOptions>
): number => {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  // Add some jitter to avoid thundering herd
  const jitter = delay * 0.1 * Math.random();
  return Math.min(delay + jitter, options.maxDelay);
};

/**
 * Determine if an error is retryable
 */
const isRetryable = (error: Error): boolean => {
  if (error instanceof RateLimitError) {
    return true;
  }

  if (error instanceof TimeoutError) {
    return true;
  }

  if (error instanceof APIError) {
    // Retry on 5xx errors and 429 (rate limit)
    const statusCode = error.statusCode;
    return (
      statusCode === 429 ||
      (statusCode !== undefined && statusCode >= 500 && statusCode < 600)
    );
  }

  // Don't retry on validation errors or invalid responses
  if (
    error instanceof ValidationError ||
    error instanceof InvalidResponseError ||
    error instanceof ImageProcessingError
  ) {
    return false;
  }

  // Retry on network errors
  if (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ECONNRESET')
  ) {
    return true;
  }

  return false;
};

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  context?: string
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logger.info(
          `Retry attempt ${attempt}/${opts.maxRetries}`,
          context ? { context } : undefined
        );
      }
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this is the last attempt
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryable(lastError)) {
        logger.warn(
          `Non-retryable error encountered`,
          {
            error: lastError.message,
            code: lastError instanceof VisionError ? lastError.code : 'UNKNOWN',
            context,
          }
        );
        break;
      }

      // Calculate delay for retry
      const delay = calculateDelay(attempt, opts);

      logger.warn(
        `Retrying after ${Math.round(delay / 1000)}s due to error`,
        {
          attempt,
          error: lastError.message,
          code: lastError instanceof VisionError ? lastError.code : 'UNKNOWN',
          context,
        }
      );

      await sleep(delay);
    }
  }

  // If we got here, all retries failed
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Parse API error response
 */
export function parseAPIError(response: Response, responseBody?: any): APIError {
  let message = 'API request failed';
  let code = 'API_ERROR';

  if (responseBody) {
    if (typeof responseBody === 'object') {
      // Try common error response formats
      message =
        (responseBody as any).error?.message ||
        (responseBody as any).message ||
        (responseBody as any).detail ||
        message;
      code = (responseBody as any).error?.type || (responseBody as any).code || code;
    } else if (typeof responseBody === 'string') {
      try {
        const parsed = JSON.parse(responseBody);
        message = parsed.error?.message || parsed.message || message;
        code = parsed.error?.type || parsed.code || code;
      } catch {
        message = responseBody;
      }
    }
  }

  // Check for rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;
    return new RateLimitError(message, retryAfterMs);
  }

  return new APIError(message, response.status);
}

/**
 * Validate JSON response structure
 */
export function validateAnalysisResponse(response: any): void {
  if (!response || typeof response !== 'object') {
    throw new InvalidResponseError('Response is not a valid object', response);
  }

  if (!response.analysis_summary || typeof response.analysis_summary !== 'string') {
    throw new InvalidResponseError('Missing or invalid analysis_summary', response);
  }

  if (
    !response.overall_severity ||
    !['green', 'yellow', 'red'].includes(response.overall_severity)
  ) {
    throw new InvalidResponseError('Missing or invalid overall_severity', response);
  }

  if (!Array.isArray(response.findings)) {
    throw new InvalidResponseError('Missing or invalid findings array', response);
  }

  if (typeof response.confidence_score !== 'number' || response.confidence_score < 0 || response.confidence_score > 100) {
    throw new InvalidResponseError('Missing or invalid confidence_score', response);
  }

  if (
    !response.image_quality_assessment ||
    !['Good', 'Fair', 'Poor'].includes(response.image_quality_assessment)
  ) {
    throw new InvalidResponseError('Missing or invalid image_quality_assessment', response);
  }

  if (!Array.isArray(response.recommendations)) {
    throw new InvalidResponseError('Missing or invalid recommendations array', response);
  }

  // Validate each finding
  for (const finding of response.findings) {
    if (!finding.id || typeof finding.id !== 'string') {
      throw new InvalidResponseError('Finding missing id', response);
    }
    if (!finding.condition || typeof finding.condition !== 'string') {
      throw new InvalidResponseError('Finding missing condition', response);
    }
    if (!finding.description || typeof finding.description !== 'string') {
      throw new InvalidResponseError('Finding missing description', response);
    }
    if (!['green', 'yellow', 'red'].includes(finding.severity)) {
      throw new InvalidResponseError('Finding has invalid severity', response);
    }
    if (typeof finding.confidence !== 'number' || finding.confidence < 0 || finding.confidence > 100) {
      throw new InvalidResponseError('Finding has invalid confidence', response);
    }
  }
}

/**
 * Clean up JSON response - remove markdown code blocks if present
 */
export function cleanJSONResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.trim();
  
  // Remove ```json ... ```
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/```$/i, '');
  
  // Remove ``` ... ```
  cleaned = cleaned.replace(/^```\s*/i, '');
  
  return cleaned.trim();
}

/**
 * Parse JSON response with fallback
 */
export function parseJSONResponse(text: string): any {
  const cleaned = cleanJSONResponse(text);
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // Try to find JSON in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Still failed
      }
    }
    throw new InvalidResponseError(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      text
    );
  }
}

/**
 * Retry logic for external service calls with exponential backoff
 */

import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'NetworkError',
    'TimeoutError',
  ],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;

  // Check error code
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }

  // Check error name
  if (error.name && retryableErrors.includes(error.name)) {
    return true;
  }

  // Check for specific HTTP status codes (5xx server errors)
  if (error.status && error.status >= 500 && error.status < 600) {
    return true;
  }

  return false;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function call
 * @throws The last error if all retries fail
 * 
 * @example
 * const result = await withRetry(
 *   async () => await stripe.customers.create({ email }),
 *   { maxAttempts: 3 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts) {
        logger.error(
          `All retry attempts failed after ${attempt} tries`,
          error,
          { maxAttempts: opts.maxAttempts }
        );
        throw error;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        logger.warn(
          'Error is not retryable, failing immediately',
          { error, attempt }
        );
        throw error;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier
      );

      logger.warn(
        `Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms`,
        { error, delay, attempt }
      );

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry a function with custom retry condition
 * 
 * @param fn - The async function to retry
 * @param shouldRetry - Function that determines if retry should happen
 * @param options - Retry configuration options
 * @returns The result of the function call
 * 
 * @example
 * const result = await withRetryIf(
 *   async () => await fetchData(),
 *   (error) => error.status === 429, // Retry on rate limit
 *   { maxAttempts: 5 }
 * );
 */
export async function withRetryIf<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: any) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts) {
        throw error;
      }

      // Don't retry if custom condition is not met
      if (!shouldRetry(error)) {
        throw error;
      }

      const delay = calculateDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

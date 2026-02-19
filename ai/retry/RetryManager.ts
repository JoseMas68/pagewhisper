/**
 * PageWhisper AI System - Retry Manager
 *
 * Intelligent retry logic with exponential backoff and jitter.
 * Handles rate limits, network errors, and transient failures.
 */

import type {
  RetryConfig,
  RetryResult,
  RetryAttempt,
  RateLimitError
} from '../types'

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryableErrors: [
    'RATE_LIMIT_ERROR',
    'TIMEOUT_ERROR',
    'NETWORK_ERROR',
    'API_ERROR'
  ],
  retryOn4xx: false,
  retryOn5xx: true
}

/**
 * Retry Manager
 */
export class RetryManager {
  private config: RetryConfig

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: { operation?: string; metadata?: Record<string, any> }
  ): Promise<RetryResult<T>> {
    const attempts: RetryAttempt[] = []
    let lastError: Error | undefined
    let totalTime = 0

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      const attemptStart = Date.now()

      try {
        const result = await fn()
        const attemptTime = Date.now() - attemptStart
        totalTime += attemptTime

        attempts.push({
          attempt,
          delay: 0
        })

        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime,
          attemptDetails: attempts
        }
      } catch (error) {
        const attemptTime = Date.now() - attemptStart
        totalTime += attemptTime
        lastError = error as Error

        attempts.push({
          attempt,
          delay: 0,
          error
        })

        // Check if we should retry
        if (!this.shouldRetry(error as Error, attempt)) {
          break
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt)

        attempts[attempts.length - 1].delay = delay

        // Wait before retry
        await this.sleep(delay)
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError,
      attempts: this.config.maxAttempts,
      totalTime,
      attemptDetails: attempts
    }
  }

  /**
   * Check if error is retryable
   */
  private shouldRetry(error: Error, attempt: number): boolean {
    // Check if we've exceeded max attempts
    if (attempt >= this.config.maxAttempts) {
      return false
    }

    // Check error code
    const errorCode = (error as any).code

    if (!this.config.retryableErrors.includes(errorCode)) {
      // Check if it's a 4xx or 5xx error
      const statusCode = (error as any).statusCode

      if (statusCode) {
        if (statusCode >= 500 && this.config.retryOn5xx) {
          return true
        }

        if (statusCode === 429) {
          // Always retry rate limits
          return true
        }

        if (statusCode >= 400 && statusCode < 500 && this.config.retryOn4xx) {
          return true
        }
      }

      // Not retryable
      return false
    }

    // Retryable error code
    return true
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff
    const baseDelay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt - 1)

    // Add jitter
    const jitter = baseDelay * this.config.jitterFactor * (Math.random() * 2 - 1)

    // Cap at max delay
    const delay = Math.min(baseDelay + jitter, this.config.maxDelay)

    return Math.max(delay, 0)
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config }
  }
}

/**
 * Retry decorator for class methods
 */
export function Retry(config?: Partial<RetryConfig>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const manager = new RetryManager(config)

    descriptor.value = async function (...args: any[]) {
      const result = await manager.execute(() => originalMethod.apply(this, args))

      if (result.success) {
        return result.data
      }

      throw result.error
    }

    return descriptor
  }
}

/**
 * Async retry wrapper function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const manager = new RetryManager(config)
  const result = await manager.execute(fn)

  if (result.success) {
    return result.data
  }

  throw result.error
}

/**
 * Calculate delay before retry based on rate limit error
 */
export function calculateRateLimitDelay(error: RateLimitError): number {
  if (error.retryAfter) {
    // Use retry-after header if available
    return error.retryAfter
  }

  // Default exponential backoff for rate limits
  return 1000 + Math.random() * 2000 // 1-3 seconds
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.name === 'TypeError' || // fetch() throws TypeError on network failure
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('ETIMEDOUT')
  )
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: Error): boolean {
  return (
    error.name === 'AbortError' ||
    error.name === 'TimeoutError' ||
    error.message.includes('timeout') ||
    error.message.includes('timed out')
  )
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: Error): error is RateLimitError {
  return (
    (error as any).code === 'RATE_LIMIT_ERROR' ||
    (error as any).statusCode === 429 ||
    error.message.includes('rate limit')
  )
}

// ============================================================================
// Export
// ============================================================================

export default RetryManager
export { DEFAULT_CONFIG }

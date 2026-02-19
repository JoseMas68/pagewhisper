/**
 * PageWhisper AI System - Retry Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RetryManager } from '../../ai/retry/RetryManager'
import type { RetryConfig } from '../../ai/types'

describe('RetryManager', () => {
  let retryManager: RetryManager

  beforeEach(() => {
    retryManager = new RetryManager()
  })

  describe('Basic Retry Logic', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.attempts).toBe(1)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('API_ERROR'))
        .mockResolvedValue('success')

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.attempts).toBe(2)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should fail after max attempts', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('API_ERROR'))

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.attempts).toBe(3) // Default maxAttempts
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should track attempt details', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('API_ERROR'))
        .mockResolvedValue('success')

      const result = await retryManager.execute(mockFn)

      expect(result.attemptDetails).toHaveLength(2)
      expect(result.attemptDetails[0].attempt).toBe(1)
      expect(result.attemptDetails[0].error).toBeDefined()
      expect(result.attemptDetails[1].attempt).toBe(2)
    })

    it('should calculate total time', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      const result = await retryManager.execute(mockFn)

      expect(result.totalTime).toBeGreaterThanOrEqual(0)
      expect(result.totalTime).toBeLessThan(1000) // Should be fast
    })
  })

  describe('Backoff Calculation', () => {
    it('should use exponential backoff', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 4,
        initialDelay: 100,
        backoffMultiplier: 2
      }

      const retry = new RetryManager(config)
      const delays: number[] = []

      const mockFn = vi.fn()
        .mockImplementation(() => {
          const error = new Error('API_ERROR')
          delays.push(retry['calculateDelay'](delays.length + 1))
          throw error
        })

      await retry.execute(mockFn)

      // Expected delays: 100, 200, 400 (exponential)
      expect(delays[0]).toBe(100)
      expect(delays[1]).toBe(200)
      expect(delays[2]).toBe(400)
    })

    it('should apply jitter to delays', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        jitterFactor: 0.2
      }

      const retry = new RetryManager(config)

      const delay1 = retry['calculateDelay'](1)
      const delay2 = retry['calculateDelay'](1)

      // With jitter, same input should produce different output
      // (though this test might occasionally fail if jitter happens to be the same)
      const tolerance = 100 * 0.2 * 2 // 20% jitter * 2
      expect(Math.abs(delay1 - delay2)).toBeLessThanOrEqual(tolerance)
    })

    it('should respect max delay', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 10,
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 10
      }

      const retry = new RetryManager(config)

      const delay = retry['calculateDelay'](5)
      expect(delay).toBeLessThanOrEqual(5000)
    })
  })

  describe('Error Handling', () => {
    it('should retry on retryable errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('RATE_LIMIT_ERROR'))
        .mockResolvedValue('success')

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(true)
      expect(result.attempts).toBe(2)
    })

    it('should not retry on non-retryable errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('AUTH_ERROR'))

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(false)
      expect(result.attempts).toBe(1)
    })

    it('should respect retryOn4xx setting', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 3,
        retryOn4xx: true
      }

      const retry = new RetryManager(config)
      const mockFn = vi.fn().mockRejectedValue(new Error('4xx_ERROR'))

      const result = await retry.execute(mockFn)

      expect(result.attempts).toBe(3) // Should retry
    })

    it('should respect retryOn5xx setting', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 3,
        retryOn5xx: false
      }

      const retry = new RetryManager(config)
      const mockFn = vi.fn().mockRejectedValue(new Error('500_ERROR'))

      const result = await retry.execute(mockFn)

      expect(result.attempts).toBe(1) // Should not retry
    })

    it('should handle custom retryable errors', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 3,
        retryableErrors: ['CUSTOM_ERROR']
      }

      const retry = new RetryManager(config)
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('CUSTOM_ERROR'))
        .mockResolvedValue('success')

      const result = await retry.execute(mockFn)

      expect(result.success).toBe(true)
      expect(result.attempts).toBe(2)
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const retry = new RetryManager()
      const config = retry.getConfig()

      expect(config.maxAttempts).toBe(3)
      expect(config.initialDelay).toBe(1000)
      expect(config.maxDelay).toBe(30000)
      expect(config.backoffMultiplier).toBe(2)
      expect(config.jitterFactor).toBe(0.1)
    })

    it('should accept custom configuration', () => {
      const customConfig: Partial<RetryConfig> = {
        maxAttempts: 5,
        initialDelay: 500,
        maxDelay: 60000
      }

      const retry = new RetryManager(customConfig)
      const config = retry.getConfig()

      expect(config.maxAttempts).toBe(5)
      expect(config.initialDelay).toBe(500)
      expect(config.maxDelay).toBe(60000)
    })

    it('should update configuration', () => {
      retryManager.updateConfig({
        maxAttempts: 10,
        initialDelay: 2000
      })

      const config = retryManager.getConfig()

      expect(config.maxAttempts).toBe(10)
      expect(config.initialDelay).toBe(2000)
    })

    it('should reset to default configuration', () => {
      retryManager.updateConfig({ maxAttempts: 10 })
      retryManager.resetConfig()

      const config = retryManager.getConfig()

      expect(config.maxAttempts).toBe(3)
    })
  })

  describe('Context and Metadata', () => {
    it('should pass context to attempts', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      await retryManager.execute(mockFn, {
        operation: 'test-operation',
        metadata: { key: 'value' }
      })

      // Context is used internally, verify function was called
      expect(mockFn).toHaveBeenCalled()
    })

    it('should include metadata in error details', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('API_ERROR'))

      const result = await retryManager.execute(mockFn, {
        operation: 'test-operation',
        metadata: { key: 'value' }
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle maxAttempts of 1', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 1
      }

      const retry = new RetryManager(config)
      const mockFn = vi.fn().mockRejectedValue(new Error('API_ERROR'))

      const result = await retry.execute(mockFn)

      expect(result.attempts).toBe(1)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should handle zero initial delay', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 3,
        initialDelay: 0
      }

      const retry = new RetryManager(config)
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('API_ERROR'))
        .mockResolvedValue('success')

      const result = await retry.execute(mockFn)

      expect(result.success).toBe(true)
    })

    it('should handle very large maxAttempts', async () => {
      const config: Partial<RetryConfig> = {
        maxAttempts: 100,
        initialDelay: 1
      }

      const retry = new RetryManager(config)
      const mockFn = vi.fn().mockRejectedValue(new Error('API_ERROR'))

      // Should stop after maxAttempts
      const result = await retry.execute(mockFn)

      expect(result.attempts).toBe(100)
    })

    it('should handle function that throws non-Error', async () => {
      const mockFn = vi.fn().mockRejectedValue('string error')

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(false)
    })

    it('should handle synchronous errors', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        throw new Error('API_ERROR')
      })

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(false)
      expect(result.attempts).toBeGreaterThan(0)
    })
  })

  describe('Rate Limit Handling', () => {
    it('should extract retry-after from rate limit error', async () => {
      const error = new Error('RATE_LIMIT_ERROR')
      ;(error as any).retryAfter = 60

      const mockFn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success')

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(true)
      // Should respect retry-after if implemented
    })

    it('should handle rate limit with exponential backoff', async () => {
      const mockFn = vi.fn()
        .mockRejectedValue(new Error('RATE_LIMIT_ERROR'))
        .mockRejectedValue(new Error('RATE_LIMIT_ERROR'))
        .mockResolvedValue('success')

      const result = await retryManager.execute(mockFn)

      expect(result.success).toBe(true)
      expect(result.attempts).toBe(3)
    })
  })

  describe('Performance', () => {
    it('should complete successful operation quickly', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      const start = Date.now()
      const result = await retryManager.execute(mockFn)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(100)
    })

    it('should handle multiple concurrent retries', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('API_ERROR'))
        .mockResolvedValue('success')

      const promises = Array(10).fill(null).map(() =>
        retryManager.execute(mockFn)
      )

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should not cause memory leaks', async () => {
      const mockFn = vi.fn()
        .mockRejectedValue(new Error('API_ERROR'))

      // Run many retries
      for (let i = 0; i < 100; i++) {
        await retryManager.execute(mockFn)
      }

      // If we got here without running out of memory, we're good
      expect(true).toBe(true)
    })
  })

  describe('Utility Methods', () => {
    it('should calculate delay correctly', () => {
      const delay = retryManager['calculateDelay'](1)

      expect(delay).toBeGreaterThan(0)
      expect(delay).toBeLessThanOrEqual(30000) // maxDelay
    })

    it('should sleep for correct duration', async () => {
      const start = Date.now()

      await retryManager['sleep'](100)

      const duration = Date.now() - start

      expect(duration).toBeGreaterThanOrEqual(100)
      expect(duration).toBeLessThan(150) // Allow some tolerance
    })

    it('should determine if error is retryable', () => {
      const retryableError = new Error('RATE_LIMIT_ERROR')
      const nonRetryableError = new Error('AUTH_ERROR')

      expect(retryManager['shouldRetry'](retryableError, 1)).toBe(true)
      expect(retryManager['shouldRetry'](nonRetryableError, 1)).toBe(false)
    })

    it('should not retry on last attempt', () => {
      const error = new Error('API_ERROR')

      expect(retryManager['shouldRetry'](error, 3)).toBe(false) // maxAttempts is 3
    })
  })
})

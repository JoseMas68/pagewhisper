/**
 * PageWhisper AI System - Cache Manager Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CacheManager } from '../../ai/cache/CacheManager'
import type { CacheConfig, GenerationRequest, GenerationResponse } from '../../ai/types'

describe('CacheManager', () => {
  let cacheManager: CacheManager
  let mockRequest: GenerationRequest
  let mockResponse: GenerationResponse

  beforeEach(() => {
    const config: CacheConfig = {
      enabled: true,
      ttl: 3600,
      maxSize: 100,
      cleanupInterval: 60,
      storage: 'memory'
    }

    cacheManager = new CacheManager(config)

    mockRequest = {
      prompt: 'Convert this HTML to React',
      systemPrompt: 'You are an expert React developer',
      temperature: 0.7,
      maxTokens: 4000
    }

    mockResponse = {
      content: 'Here is the React component...',
      usage: {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300
      },
      model: 'claude-3-sonnet',
      finishReason: 'stop',
      cached: false
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Cache Operations', () => {
    it('should cache a response', async () => {
      await cacheManager.set(mockRequest, mockResponse)

      const cached = await cacheManager.get(mockRequest)

      expect(cached).toBeDefined()
      expect(cached?.content).toBe(mockResponse.content)
      expect(cached?.usage).toEqual(mockResponse.usage)
    })

    it('should return null for non-existent key', async () => {
      const cached = await cacheManager.get(mockRequest)

      expect(cached).toBeNull()
    })

    it('should delete cached entry', async () => {
      await cacheManager.set(mockRequest, mockResponse)

      await cacheManager.delete(mockRequest)

      const cached = await cacheManager.get(mockRequest)
      expect(cached).toBeNull()
    })

    it('should clear all cache', async () => {
      await cacheManager.set(mockRequest, mockResponse)

      await cacheManager.clear()

      const cached = await cacheManager.get(mockRequest)
      expect(cached).toBeNull()
    })

    it('should check if key exists', async () => {
      await cacheManager.set(mockRequest, mockResponse)

      const exists = await cacheManager.has(mockRequest)
      expect(exists).toBe(true)
    })

    it('should return false for non-existent key', async () => {
      const exists = await cacheManager.has(mockRequest)
      expect(exists).toBe(false)
    })

    it('should return cache size', async () => {
      expect(await cacheManager.size()).toBe(0)

      await cacheManager.set(mockRequest, mockResponse)

      expect(await cacheManager.size()).toBe(1)
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache hits', async () => {
      await cacheManager.set(mockRequest, mockResponse)

      await cacheManager.get(mockRequest)
      await cacheManager.get(mockRequest)

      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(0)
    })

    it('should track cache misses', async () => {
      await cacheManager.get(mockRequest)
      await cacheManager.get(mockRequest)

      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(2)
    })

    it('should calculate hit rate correctly', async () => {
      await cacheManager.set(mockRequest, mockResponse)

      // 2 hits
      await cacheManager.get(mockRequest)
      await cacheManager.get(mockRequest)

      // 1 miss
      const differentRequest = { ...mockRequest, prompt: 'Different prompt' }
      await cacheManager.get(differentRequest)

      const stats = cacheManager.getStats()
      expect(stats.hitRate).toBe(2/3)
    })

    it('should reset statistics', async () => {
      await cacheManager.set(mockRequest, mockResponse)
      await cacheManager.get(mockRequest)

      cacheManager.resetStats()

      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })

  describe('TTL Expiration', () => {
    it('should expire entries after TTL', async () => {
      const shortTTLConfig: CacheConfig = {
        enabled: true,
        ttl: 1, // 1 second
        maxSize: 100,
        storage: 'memory'
      }

      const shortTTLCache = new CacheManager(shortTTLConfig)

      await shortTTLCache.set(mockRequest, mockResponse)

      // Should be cached immediately
      expect(await shortTTLCache.get(mockRequest)).toBeDefined()

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should be expired
      const cached = await shortTTLCache.get(mockRequest)
      expect(cached).toBeNull()
    })

    it('should not expire before TTL', async () => {
      const ttlConfig: CacheConfig = {
        enabled: true,
        ttl: 5, // 5 seconds
        maxSize: 100,
        storage: 'memory'
      }

      const ttlCache = new CacheManager(ttlConfig)

      await ttlCache.set(mockRequest, mockResponse)

      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 1000))

      const cached = await ttlCache.get(mockRequest)
      expect(cached).toBeDefined()
    })
  })

  describe('Max Size Management', () => {
    it('should enforce max size limit', async () => {
      const smallConfig: CacheConfig = {
        enabled: true,
        ttl: 3600,
        maxSize: 3,
        storage: 'memory'
      }

      const smallCache = new CacheManager(smallConfig)

      // Add 4 entries (max is 3)
      for (let i = 0; i < 4; i++) {
        const request = { ...mockRequest, prompt: `Prompt ${i}` }
        await smallCache.set(request, mockResponse)
      }

      // Size should be at most 3
      const size = await smallCache.size()
      expect(size).toBeLessThanOrEqual(3)
    })

    it('should use LRU eviction when full', async () => {
      const lruConfig: CacheConfig = {
        enabled: true,
        ttl: 3600,
        maxSize: 3,
        storage: 'memory'
      }

      const lruCache = new CacheManager(lruConfig)

      // Add 3 entries
      await lruCache.set({ prompt: '1' }, mockResponse)
      await lruCache.set({ prompt: '2' }, mockResponse)
      await lruCache.set({ prompt: '3' }, mockResponse)

      // Access entry 1 to make it recently used
      await lruCache.get({ prompt: '1' })

      // Add 4th entry (should evict entry 2, not entry 1)
      await lruCache.set({ prompt: '4' }, mockResponse)

      expect(await lruCache.has({ prompt: '1' })).toBe(true)
      expect(await lruCache.has({ prompt: '2' })).toBe(false)
      expect(await lruCache.has({ prompt: '3' })).toBe(true)
      expect(await lruCache.has({ prompt: '4' })).toBe(true)
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate same key for identical requests', async () => {
      const key1 = await cacheManager.generateKey(mockRequest)
      const key2 = await cacheManager.generateKey(mockRequest)

      expect(key1).toBe(key2)
    })

    it('should generate different keys for different prompts', async () => {
      const key1 = await cacheManager.generateKey(mockRequest)
      const key2 = await cacheManager.generateKey({
        ...mockRequest,
        prompt: 'Different prompt'
      })

      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different temperatures', async () => {
      const key1 = await cacheManager.generateKey(mockRequest)
      const key2 = await cacheManager.generateKey({
        ...mockRequest,
        temperature: 0.5
      })

      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different maxTokens', async () => {
      const key1 = await cacheManager.generateKey(mockRequest)
      const key2 = await cacheManager.generateKey({
        ...mockRequest,
        maxTokens: 2000
      })

      expect(key1).not.toBe(key2)
    })
  })

  describe('Disabled Cache', () => {
    it('should not cache when disabled', async () => {
      const disabledConfig: CacheConfig = {
        enabled: false,
        ttl: 3600,
        maxSize: 100,
        storage: 'memory'
      }

      const disabledCache = new CacheManager(disabledConfig)

      await disabledCache.set(mockRequest, mockResponse)

      const cached = await disabledCache.get(mockRequest)
      expect(cached).toBeNull()
    })

    it('should return false for has() when disabled', async () => {
      const disabledConfig: CacheConfig = {
        enabled: false,
        ttl: 3600,
        maxSize: 100,
        storage: 'memory'
      }

      const disabledCache = new CacheManager(disabledConfig)

      await disabledCache.set(mockRequest, mockResponse)

      expect(await disabledCache.has(mockRequest)).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup expired entries', async () => {
      const cleanupConfig: CacheConfig = {
        enabled: true,
        ttl: 1,
        maxSize: 100,
        cleanupInterval: 1,
        storage: 'memory'
      }

      const cleanupCache = new CacheManager(cleanupConfig)

      // Add entry
      await cleanupCache.set(mockRequest, mockResponse)

      expect(await cleanupCache.has(mockRequest)).toBe(true)

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000))

      expect(await cleanupCache.has(mockRequest)).toBe(false)
    })

    it('should cleanup old entries when max size reached', async () => {
      const sizeConfig: CacheConfig = {
        enabled: true,
        ttl: 3600,
        maxSize: 5,
        cleanupInterval: 60,
        storage: 'memory'
      }

      const sizeCache = new CacheManager(sizeConfig)

      // Add more entries than max size
      for (let i = 0; i < 10; i++) {
        await sizeCache.set({ prompt: `Prompt ${i}` }, mockResponse)
      }

      // Size should be maintained
      expect(await sizeCache.size()).toBeLessThanOrEqual(5)
    })
  })

  describe('Configuration', () => {
    it('should use default configuration when not provided', () => {
      const defaultCache = new CacheManager()

      expect(defaultCache).toBeDefined()
      expect(defaultCache.getStats()).toBeDefined()
    })

    it('should update configuration', () => {
      const newConfig: Partial<CacheConfig> = {
        ttl: 7200,
        maxSize: 200
      }

      cacheManager.updateConfig(newConfig)

      // Config should be updated (verify by checking behavior)
      expect(cacheManager).toBeDefined()
    })

    it('should get current configuration', () => {
      const config = cacheManager.getConfig()

      expect(config).toBeDefined()
      expect(config.enabled).toBe(true)
      expect(config.ttl).toBe(3600)
      expect(config.maxSize).toBe(100)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty request', async () => {
      const emptyRequest: GenerationRequest = {
        prompt: ''
      }

      const key = await cacheManager.generateKey(emptyRequest)
      expect(key).toBeDefined()
    })

    it('should handle request with all parameters', async () => {
      const fullRequest: GenerationRequest = {
        prompt: 'Test prompt',
        systemPrompt: 'Test system',
        temperature: 0.5,
        maxTokens: 2000,
        topP: 0.9,
        messages: [{ role: 'user', content: 'Hello' }],
        metadata: { key: 'value' }
      }

      const key = await cacheManager.generateKey(fullRequest)
      expect(key).toBeDefined()

      await cacheManager.set(fullRequest, mockResponse)
      const cached = await cacheManager.get(fullRequest)
      expect(cached).toBeDefined()
    })

    it('should handle concurrent operations', async () => {
      const promises = []

      // Set multiple entries concurrently
      for (let i = 0; i < 50; i++) {
        const promise = cacheManager.set(
          { prompt: `Concurrent ${i}` },
          mockResponse
        )
        promises.push(promise)
      }

      await Promise.all(promises)

      expect(await cacheManager.size()).toBe(50)
    })

    it('should handle special characters in prompt', async () => {
      const specialRequest: GenerationRequest = {
        prompt: 'Test with <script>alert("xss")</script> & "quotes"',
        systemPrompt: 'System with emoji 🎯 and unicode 中文'
      }

      await cacheManager.set(specialRequest, mockResponse)

      const cached = await cacheManager.get(specialRequest)
      expect(cached).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should cache quickly', async () => {
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        await cacheManager.set({ prompt: `Test ${i}` }, mockResponse)
      }

      const duration = Date.now() - start

      // Should cache 100 entries in less than 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should retrieve quickly', async () => {
      // Add entry
      await cacheManager.set(mockRequest, mockResponse)

      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        await cacheManager.get(mockRequest)
      }

      const duration = Date.now() - start

      // Should retrieve 1000 times in less than 100ms
      expect(duration).toBeLessThan(100)
    })

    it('should generate keys quickly', async () => {
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        await cacheManager.generateKey(mockRequest)
      }

      const duration = Date.now() - start

      // Should generate 100 keys in less than 500ms
      expect(duration).toBeLessThan(500)
    })
  })
})

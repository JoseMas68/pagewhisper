/**
 * PageWhisper AI System - Cache Manager
 *
 * Deterministic caching system for AI responses.
 * Supports multiple storage backends and automatic expiration.
 */

import type {
  CacheConfig,
  CacheEntry,
  CacheStats,
  CacheStorage,
  GenerationRequest,
  GenerationResponse
} from '../types'

/**
 * Hash generator for cache keys
 */
class CacheKeyGenerator {
  /**
   * Generate deterministic cache key from request
   */
  static async generate(request: GenerationRequest): Promise<string> {
    const components = [
      request.systemPrompt || '',
      request.prompt,
      request.temperature?.toString() || '0.7',
      request.maxTokens?.toString() || '4000',
      request.topP?.toString() || '',
      JSON.stringify(request.messages || []),
      JSON.stringify(request.metadata || {})
    ]

    const combined = components.join('|||')
    return this.hash(combined)
  }

  /**
   * Simple hash function (FNV-1a inspired)
   */
  private static async hash(input: string): Promise<string> {
    // Use Web Crypto API if available
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return 'cache_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // Fallback: Simple string hash
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }

    return `cache_${Math.abs(hash).toString(16)}`
  }
}

/**
 * In-memory cache storage
 */
class MemoryStorage implements CacheStorage {
  private store: Map<string, { value: any; expiresAt: number }>

  constructor() {
    this.store = new Map()
  }

  async get(key: string): Promise<any> {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + (ttl * 1000) : Date.now() + 3600000 // Default 1 hour
    this.store.set(key, { value, expiresAt })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys())
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key)
  }

  async size(): Promise<number> {
    return this.store.size
  }

  /**
   * Clean expired entries
   */
  async cleanExpired(): Promise<number> {
    let cleaned = 0
    const now = Date.now()

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

/**
 * LocalStorage adapter (browser only)
 */
class LocalStorageAdapter implements CacheStorage {
  private prefix: string

  constructor(prefix: string = 'pw_cache_') {
    this.prefix = prefix
  }

  private getPrefixedKey(key: string): string {
    return this.prefix + key
  }

  async get(key: string): Promise<any> {
    if (typeof localStorage === 'undefined') {
      return null
    }

    try {
      const prefixedKey = this.getPrefixedKey(key)
      const item = localStorage.getItem(prefixedKey)

      if (!item) {
        return null
      }

      const entry = JSON.parse(item)

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(prefixedKey)
        return null
      }

      return entry.value
    } catch {
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      const prefixedKey = this.getPrefixedKey(key)
      const expiresAt = ttl ? Date.now() + (ttl * 1000) : Date.now() + 3600000

      const entry = {
        value,
        expiresAt,
        createdAt: Date.now()
      }

      localStorage.setItem(prefixedKey, JSON.stringify(entry))
    } catch (error) {
      // Quota exceeded or other error - silently fail
      console.warn('LocalStorage set failed:', error)
    }
  }

  async delete(key: string): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return
    }

    const prefixedKey = this.getPrefixedKey(key)
    localStorage.removeItem(prefixedKey)
  }

  async clear(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return
    }

    // Only remove keys with our prefix
    const keys = await this.keys()
    for (const key of keys) {
      localStorage.removeItem(this.getPrefixedKey(key))
    }
  }

  async keys(): Promise<string[]> {
    if (typeof localStorage === 'undefined') {
      return []
    }

    const keys: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length))
      }
    }

    return keys
  }

  async has(key: string): Promise<boolean> {
    if (typeof localStorage === 'undefined') {
      return false
    }

    const prefixedKey = this.getPrefixedKey(key)
    return localStorage.getItem(prefixedKey) !== null
  }

  async size(): Promise<number> {
    return (await this.keys()).length
  }
}

/**
 * Cache Manager
 */
export class CacheManager {
  private storage: CacheStorage
  private config: CacheConfig
  private stats: CacheStats
  private cleanupTimer?: ReturnType<typeof setInterval>

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = this.buildConfig(config)
    this.storage = this.createStorage()
    this.stats = this.createStats()

    // Start automatic cleanup
    if (this.config.cleanupInterval) {
      this.startCleanup()
    }
  }

  /**
   * Get cached response for request
   */
  async get(request: GenerationRequest): Promise<GenerationResponse | null> {
    if (!this.config.enabled) {
      return null
    }

    const key = await CacheKeyGenerator.generate(request)
    const entry = await this.storage.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      await this.storage.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    this.stats.hits++
    this.updateHitRate()

    return entry.value as GenerationResponse
  }

  /**
   * Set cached response for request
   */
  async set(request: GenerationRequest, response: GenerationResponse): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    // Check max size
    if (this.config.maxSize) {
      const currentSize = await this.storage.size()
      if (currentSize >= this.config.maxSize) {
        // Remove oldest entry (simple FIFO)
        const keys = await this.storage.keys()
        if (keys.length > 0) {
          await this.storage.delete(keys[0])
        }
      }
    }

    const key = await CacheKeyGenerator.generate(request)
    const entry: CacheEntry = {
      key,
      value: response,
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.config.ttl * 1000),
      metadata: {
        promptHash: key,
        model: response.model,
        temperature: request.temperature || 0.7
      }
    }

    await this.storage.set(key, entry, this.config.ttl)
    this.stats.size = await this.storage.size()
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(request: GenerationRequest): Promise<void> {
    const key = await CacheKeyGenerator.generate(request)
    await this.storage.delete(key)
    this.stats.size = await this.storage.size()
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await this.storage.clear()
    this.resetStats()
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.createStats()
  }

  /**
   * Clean expired entries
   */
  async cleanExpired(): Promise<number> {
    let cleaned = 0

    if (this.storage instanceof MemoryStorage) {
      cleaned = await this.storage.cleanExpired()
    } else {
      // Generic cleanup
      const keys = await this.storage.keys()
      const now = Date.now()

      for (const key of keys) {
        const entry = await this.storage.get(key)
        if (entry && entry.expiresAt && now > entry.expiresAt) {
          await this.storage.delete(key)
          cleaned++
        }
      }
    }

    this.stats.expiredKeys = cleaned
    this.stats.lastCleaned = Date.now()

    return cleaned
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config }

    // Recreate storage if type changed
    if (config.storage) {
      this.storage = this.createStorage()
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Build configuration with defaults
   */
  private buildConfig(config: Partial<CacheConfig>): CacheConfig {
    return {
      enabled: config.enabled ?? true,
      ttl: config.ttl ?? 3600, // 1 hour default
      maxSize: config.maxSize ?? 100,
      cleanupInterval: config.cleanupInterval ?? 300, // 5 minutes
      storage: config.storage ?? 'memory',
      customStorage: config.customStorage
    }
  }

  /**
   * Create storage instance
   */
  private createStorage(): CacheStorage {
    switch (this.config.storage) {
      case 'memory':
        return new MemoryStorage()

      case 'localStorage':
        return new LocalStorageAdapter()

      case 'custom':
        if (!this.config.customStorage) {
          throw new Error('Custom storage specified but not provided')
        }
        return this.config.customStorage

      default:
        return new MemoryStorage()
    }
  }

  /**
   * Create initial stats
   */
  private createStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      totalKeys: 0,
      expiredKeys: 0,
      lastCleaned: Date.now()
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    const interval = this.config.cleanupInterval! * 1000 // Convert to ms

    this.cleanupTimer = setInterval(async () => {
      await this.cleanExpired()
    }, interval)
  }
}

// ============================================================================
// Export
// ============================================================================

export default CacheManager
export { CacheKeyGenerator, MemoryStorage, LocalStorageAdapter }
export type { CacheStorage }

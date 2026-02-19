/**
 * PageWhisper AI System - Main Orchestrator
 *
 * Coordinates all AI components: providers, cache, prompts, and retry logic.
 * Provides unified API for AI-powered code generation.
 */

import { CacheManager } from './cache/CacheManager'
import { PromptVersioning } from './prompts/PromptVersioning'
import { RetryManager } from './retry/RetryManager'
import { OpenRouterProvider } from './providers/OpenRouterProvider'
import type {
  AIProvider,
  AISystemConfig,
  AIRequestContext,
  AIResponse,
  GenerationRequest,
  GenerationResponse,
  ProviderConfig,
  RenderedPrompt
} from './types'

/**
 * Default AI System configuration
 */
const DEFAULT_CONFIG: AISystemConfig = {
  provider: 'openrouter',
  providers: {
    openrouter: {
      apiKey: '',
      model: 'anthropic/claude-3-sonnet',
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000,
      retries: 3
    }
  },
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 100,
    cleanupInterval: 300,
    storage: 'memory'
  },
  prompts: {
    defaultVersion: 'enhanced-v2',
    autoMigrate: true,
    allowDeprecated: false
  },
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
    retryableErrors: ['RATE_LIMIT_ERROR', 'TIMEOUT_ERROR', 'API_ERROR'],
    retryOn4xx: false,
    retryOn5xx: true
  },
  defaults: {
    model: 'anthropic/claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 4000
  }
}

/**
 * AI System - Main orchestrator
 */
export class AISystem {
  private config: AISystemConfig
  private providers: Map<string, AIProvider>
  private cache: CacheManager
  private prompts: PromptVersioning
  private retry: RetryManager
  private defaultProvider: AIProvider

  constructor(config?: Partial<AISystemConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config)
    this.providers = new Map()
    this.cache = new CacheManager(this.config.cache)
    this.prompts = new PromptVersioning(this.config.prompts)
    this.retry = new RetryManager(this.config.retry)

    // Register default provider
    this.defaultProvider = this.registerProvider('openrouter', new OpenRouterProvider())
  }

  /**
   * Generate AI completion
   */
  async generate(
    request: GenerationRequest,
    context?: Partial<AIRequestContext>
  ): Promise<AIResponse> {
    const requestContext = this.buildRequestContext(context)
    const startTime = Date.now()

    try {
      // Check cache first
      const cached = await this.cache.get(request)
      if (cached) {
        return this.buildResponse(cached, requestContext, {
          hit: true,
          key: await this.getCacheKey(request),
          age: Date.now() - (cached.metadata?.requestId ? 0 : Date.now())
        })
      }

      // Generate with retry logic
      const result = await this.retry.execute(async () => {
        return await this.defaultProvider.generate(request)
      })

      if (!result.success) {
        throw result.error
      }

      const response = result.data
      const latency = Date.now() - startTime

      // Add metadata to response
      response.metadata = {
        ...response.metadata,
        latency,
        requestId: requestContext.requestId
      }

      // Cache the response
      await this.cache.set(request, response)

      return this.buildResponse(response, requestContext, {
        hit: false,
        key: await this.getCacheKey(request)
      })

    } catch (error) {
      throw this.enrichError(error, requestContext)
    }
  }

  /**
   * Generate from prompt template
   */
  async generateFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    options?: Partial<GenerationRequest>
  ): Promise<AIResponse> {
    // Render prompt
    const rendered = this.prompts.render(templateId, variables)

    // Build request
    const request: GenerationRequest = {
      prompt: rendered.userPrompt,
      systemPrompt: rendered.systemPrompt,
      ...options
    }

    // Add metadata
    request.metadata = {
      ...request.metadata,
      templateId: rendered.templateId,
      templateVersion: rendered.templateVersion
    }

    return this.generate(request)
  }

  /**
   * Generate streaming completion
   */
  async *generateStream(
    request: GenerationRequest,
    context?: Partial<AIRequestContext>
  ): AsyncIterableIterator<AIResponse> {
    const requestContext = this.buildRequestContext(context)

    // Check if provider supports streaming
    if (!this.defaultProvider.generateStream) {
      throw new Error('Provider does not support streaming')
    }

    try {
      const startTime = Date.now()

      for await (const chunk of this.defaultProvider.generateStream(request)) {
        yield this.buildResponse(
          chunk as any,
          requestContext,
          { hit: false, key: '' }
        )
      }

    } catch (error) {
      throw this.enrichError(error, requestContext)
    }
  }

  /**
   * Register a new provider
   */
  registerProvider(name: string, provider: AIProvider): AIProvider {
    this.providers.set(name, provider)

    // Configure provider if config exists
    const providerConfig = this.config.providers[name]
    if (providerConfig) {
      provider.configure(providerConfig)
    }

    return provider
  }

  /**
   * Get registered provider
   */
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name)
  }

  /**
   * Set default provider
   */
  setDefaultProvider(name: string): void {
    const provider = this.providers.get(name)

    if (!provider) {
      throw new Error(`Provider '${name}' not found`)
    }

    this.defaultProvider = provider
    this.config.provider = name
  }

  /**
   * Configure provider
   */
  async configureProvider(name: string, config: ProviderConfig): Promise<void> {
    const provider = this.providers.get(name)

    if (!provider) {
      throw new Error(`Provider '${name}' not found`)
    }

    // Update config
    this.config.providers[name] = config

    // Configure provider
    provider.configure(config)

    // Validate configuration
    const validation = await provider.validateConfig()

    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors?.join(', ')}`)
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear()
  }

  /**
   * Get prompt templates
   */
  getTemplates() {
    return this.prompts.getAllTemplates()
  }

  /**
   * Render prompt template
   */
  renderPrompt(templateId: string, variables: Record<string, any>): RenderedPrompt {
    return this.prompts.render(templateId, variables)
  }

  /**
   * Register custom prompt template
   */
  registerTemplate(template: any): void {
    this.prompts.registerTemplate(template)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AISystemConfig>): void {
    this.config = this.mergeConfig(this.config, config)
    this.cache.updateConfig(this.config.cache)
    this.prompts.updateConfig(this.config.prompts)
    this.retry.updateConfig(this.config.retry)
  }

  /**
   * Get current configuration
   */
  getConfig(): AISystemConfig {
    return { ...this.config }
  }

  /**
   * Estimate cost for request
   */
  async estimateCost(request: GenerationRequest): Promise<number> {
    if (!this.defaultProvider.estimateCost) {
      return 0
    }

    const estimate = await this.defaultProvider.estimateCost(request)
    return estimate.totalCost
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean
    provider?: string
    cache?: { size: number; hitRate: number }
    errors?: string[]
  }> {
    const errors: string[] = []

    // Check provider
    if (!this.defaultProvider.isConfigured()) {
      errors.push('Default provider is not configured')
    }

    // Check cache
    const cacheStats = this.cache.getStats()

    return {
      healthy: errors.length === 0,
      provider: this.config.provider,
      cache: {
        size: cacheStats.size,
        hitRate: cacheStats.hitRate
      },
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Destroy AI system
   */
  destroy(): void {
    this.cache.destroy()
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Build request context
   */
  private buildRequestContext(context?: Partial<AIRequestContext>): AIRequestContext {
    return {
      requestId: context?.requestId || this.generateId(),
      sessionId: context?.sessionId,
      userId: context?.userId,
      timestamp: Date.now(),
      metadata: context?.metadata
    }
  }

  /**
   * Build response object
   */
  private buildResponse(
    data: GenerationResponse,
    context: AIRequestContext,
    cache?: { hit: boolean; key: string; age?: number }
  ): AIResponse {
    return {
      data,
      context,
      cache: cache ? {
        hit: cache.hit,
        key: cache.key,
        age: cache.age
      } : undefined,
      provider: {
        name: this.defaultProvider.name,
        model: data.model,
        latency: data.metadata?.latency || 0
      }
    }
  }

  /**
   * Enrich error with context
   */
  private enrichError(error: unknown, context: AIRequestContext): Error {
    if (error instanceof Error) {
      ;(error as any).requestId = context.requestId
      ;(error as any).timestamp = context.timestamp
    }

    return error as Error
  }

  /**
   * Get cache key for request
   */
  private async getCacheKey(request: GenerationRequest): Promise<string> {
    // Simple hash for now
    const combined = `${request.prompt}-${request.systemPrompt || ''}-${request.temperature || 0.7}`
    const hash = await this.hashString(combined)
    return `cache_${hash}`
  }

  /**
   * Hash string (simple implementation)
   */
  private async hashString(input: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // Fallback
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }

    return Math.abs(hash).toString(16)
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Merge configurations recursively
   */
  private mergeConfig(base: AISystemConfig, partial?: Partial<AISystemConfig>): AISystemConfig {
    if (!partial) {
      return { ...base }
    }

    return {
      ...base,
      ...partial,
      providers: { ...base.providers, ...partial.providers },
      cache: { ...base.cache, ...partial.cache },
      prompts: { ...base.prompts, ...partial.prompts },
      retry: { ...base.retry, ...partial.retry },
      defaults: { ...base.defaults, ...partial.defaults }
    }
  }

  // ==========================================================================
  // Static Factory Methods
  // ==========================================================================

  /**
   * Create AI system with default configuration
   */
  static create(): AISystem {
    return new AISystem()
  }

  /**
   * Create AI system with OpenRouter
   */
  static createWithOpenRouter(apiKey: string, model?: string): AISystem {
    return new AISystem({
      providers: {
        openrouter: {
          apiKey,
          model: model || 'anthropic/claude-3-sonnet'
        }
      }
    })
  }
}

// ============================================================================
// Export
// ============================================================================

export default AISystem

// Re-export major components
export { CacheManager } from './cache/CacheManager'
export { PromptVersioning } from './prompts/PromptVersioning'
export { RetryManager } from './retry/RetryManager'
export { OpenRouterProvider } from './providers/OpenRouterProvider'
export { BaseAIProvider } from './providers/BaseProvider'

// Re-export types
export type {
  AIProvider,
  GenerationRequest,
  GenerationResponse,
  AIRequestContext,
  AIResponse,
  AISystemConfig,
  ProviderConfig,
  RenderedPrompt
}

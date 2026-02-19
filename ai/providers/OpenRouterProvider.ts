/**
 * PageWhisper AI System - OpenRouter Provider
 *
 * OpenRouter API adapter for AI generation.
 * Documentation: https://openrouter.ai/docs
 */

import { BaseAIProvider } from './BaseProvider'
import type {
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  GenerationChunk,
  ProviderCapabilities,
  CostEstimate
} from '../types'

/**
 * OpenRouter-specific configuration
 */
export interface OpenRouterConfig extends ProviderConfig {
  /**
   * Site URL for ranking (optional)
   */
  siteUrl?: string

  /**
   * Site name for ranking (optional)
   */
  siteName?: string

  /**
   * Include request details in headers
   */
  includeRequestDetails?: boolean
}

/**
 * OpenRouter API response format
 */
interface OpenRouterResponse {
  id: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

/**
 * OpenRouter streaming chunk
 */
interface OpenRouterChunk {
  id: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

/**
 * OpenRouter provider implementation
 */
export class OpenRouterProvider extends BaseAIProvider {
  private static readonly BASE_URL = 'https://openrouter.ai/api/v1'
  private static readonly CHAT_ENDPOINT = '/chat/completions'

  // Pricing per 1M tokens (approximate, subject to change)
  private static readonly PRICING: Record<string, { input: number; output: number }> = {
    'anthropic/claude-3-opus': { input: 15, output: 75 },
    'anthropic/claude-3-sonnet': { input: 3, output: 15 },
    'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
    'openai/gpt-4-turbo': { input: 10, output: 30 },
    'openai/gpt-4-turbo-preview': { input: 10, output: 30 },
    'openai/gpt-4': { input: 30, output: 60 },
    'openai/gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'google/gemini-pro': { input: 0.5, output: 1.5 },
    'meta-llama/llama-3-70b': { input: 0.7, output: 0.7 },
    'mistralai/mistral-large': { input: 4, output: 12 }
  }

  constructor(config?: OpenRouterConfig) {
    super('openrouter')

    if (config) {
      this.configure(config)
    }
  }

  /**
   * Configure OpenRouter provider
   */
  configure(config: OpenRouterConfig): void {
    super.configure({
      ...config,
      baseURL: OpenRouterProvider.BASE_URL
    })
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      maxTokens: 128000, // Some models support up to 128k
      supportsStreaming: true,
      supportsSystemPrompt: true,
      supportsChatHistory: true,
      supportedModels: [
        // Claude
        'anthropic/claude-3-opus',
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-haiku',

        // GPT
        'openai/gpt-4-turbo',
        'openai/gpt-4-turbo-preview',
        'openai/gpt-4',
        'openai/gpt-3.5-turbo',

        // Gemini
        'google/gemini-pro',

        // Llama
        'meta-llama/llama-3-70b',
        'meta-llama/llama-3-8b',

        // Mistral
        'mistralai/mistral-large',
        'mistralai/mistral-medium'
      ],
      modelLimits: {
        'anthropic/claude-3-opus': { maxTokens: 200000, maxInputTokens: 200000, maxOutputTokens: 4096 },
        'anthropic/claude-3-sonnet': { maxTokens: 200000, maxInputTokens: 200000, maxOutputTokens: 4096 },
        'openai/gpt-4-turbo': { maxTokens: 128000, maxInputTokens: 128000, maxOutputTokens: 4096 },
        'openai/gpt-3.5-turbo': { maxTokens: 16385, maxInputTokens: 16385, maxOutputTokens: 4096 }
      },
      features: {
        functionCalling: true,
        imageInput: true,
        jsonMode: true,
        parallelRequests: true
      }
    }
  }

  /**
   * Generate completion
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter provider is not configured')
    }

    const startTime = Date.now()
    const controller = this.createTimeout()

    try {
      const body = this.buildRequestBody(request)
      const response = await this.makeRequest(
        OpenRouterProvider.CHAT_ENDPOINT,
        body,
        { signal: controller.signal }
      )

      const parsed = this.parseResponse(response, this.config.model)
      const latency = Date.now() - startTime

      // Add metadata
      parsed.metadata = {
        ...parsed.metadata,
        latency,
        provider: 'openrouter',
        requestId: response.id
      }

      return parsed
    } catch (error) {
      if (error.name === 'AbortError') {
        const { TimeoutError } = await import('../types')
        throw new TimeoutError('Request timeout', this.name)
      }
      throw error
    }
  }

  /**
   * Generate streaming completion
   */
  async *generateStream(request: GenerationRequest): AsyncIterableIterator<GenerationChunk> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter provider is not configured')
    }

    const body = {
      ...this.buildRequestBody(request),
      stream: true
    }

    const url = `${this.getBaseURL()}${OpenRouterProvider.CHAT_ENDPOINT}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      await this.handleErrorResponse(response)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              yield {
                content: '',
                isComplete: true
              }
              return
            }

            try {
              const chunk: OpenRouterChunk = JSON.parse(data)
              const delta = chunk.choices[0]?.delta

              if (delta?.content) {
                yield {
                  content: delta.content,
                  isComplete: chunk.choices[0]?.finish_reason !== null,
                  metadata: {
                    accumulatedTokens: chunk.choices?.length
                  }
                }
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Estimate cost for request
   */
  async estimateCost(request: GenerationRequest): Promise<CostEstimate> {
    const pricing = OpenRouterProvider.PRICING[this.config.model]

    if (!pricing) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        currency: 'USD'
      }
    }

    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const inputTokens = Math.ceil((request.prompt.length + (request.systemPrompt?.length || 0)) / 4)
    const outputTokens = this.config.maxTokens || 1000

    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD'
    }
  }

  // ==========================================================================
  // Protected Methods
  // ==========================================================================

  /**
   * Validate API key format for OpenRouter
   */
  protected isValidApiKey(apiKey: string): boolean {
    // OpenRouter keys typically start with 'sk-or-v1-'
    return apiKey.startsWith('sk-or-v1-') && apiKey.length > 20
  }

  /**
   * Get headers for OpenRouter requests
   */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      ...super.getHeaders(),
      'Authorization': `Bearer ${this.config.apiKey}`,
      'HTTP-Referer': this.getSiteUrl(),
      'X-Title': this.getSiteName()
    }

    // OpenRouter-specific headers
    if (this.includeRequestDetails()) {
      headers['X-Client'] = 'PageWhisper'
    }

    return headers
  }

  /**
   * Parse OpenRouter response
   */
  protected parseResponse(response: OpenRouterResponse, model: string): GenerationResponse {
    const choice = response.choices[0]
    if (!choice) {
      throw new Error('No choices in response')
    }

    return {
      content: choice.message.content,
      usage: this.extractTokenUsage(response),
      model: response.model || model,
      finishReason: this.mapFinishReason(choice.finish_reason),
      metadata: {
        requestId: response.id
      },
      raw: response
    }
  }

  /**
   * Extract token usage from response
   */
  protected extractTokenUsage(response: OpenRouterResponse) {
    const usage = response.usage

    // Calculate estimated cost
    const pricing = OpenRouterProvider.PRICING[this.config.model]
    let estimatedCost: number | undefined

    if (pricing) {
      const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input
      const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output
      estimatedCost = inputCost + outputCost
    }

    return {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost
    }
  }

  /**
   * Map OpenRouter finish reason to standard format
   */
  private mapFinishReason(reason: string): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'length':
        return 'length'
      case 'content_filter':
        return 'content_filter'
      default:
        return 'error'
    }
  }

  /**
   * Get site URL for headers
   */
  private getSiteUrl(): string {
    const config = this.config as OpenRouterConfig

    if (config.siteUrl) {
      return config.siteUrl
    }

    // Browser environment
    if (typeof window !== 'undefined') {
      return window.location.href
    }

    // Node.js environment
    return 'https://github.com/pagewhisper'
  }

  /**
   * Get site name for headers
   */
  private getSiteName(): string {
    const config = this.config as OpenRouterConfig

    if (config.siteName) {
      return config.siteName
    }

    return 'PageWhisper'
  }

  /**
   * Check if request details should be included
   */
  private includeRequestDetails(): boolean {
    const config = this.config as OpenRouterConfig
    return config.includeRequestDetails ?? true
  }
}

// ============================================================================
// Export
// ============================================================================

export default OpenRouterProvider
export type { OpenRouterConfig }

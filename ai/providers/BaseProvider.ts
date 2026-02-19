/**
 * PageWhisper AI System - Base Provider
 *
 * Abstract base class for all AI providers.
 * Provides common functionality and ensures consistent interface.
 */

import type {
  AIProvider,
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  ProviderCapabilities,
  ValidationResult,
  CostEstimate,
  TokenUsage
} from '../types'

/**
 * Abstract base provider class
 */
export abstract class BaseAIProvider implements AIProvider {
  protected config: ProviderConfig
  protected configured: boolean = false

  constructor(protected readonly providerName: string) {
    this.config = {
      apiKey: '',
      model: '',
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000,
      retries: 3
    }
  }

  /**
   * Provider name (readonly)
   */
  get name(): string {
    return this.providerName
  }

  /**
   * Configure the provider
   */
  configure(config: ProviderConfig): void {
    this.config = { ...this.config, ...config }
    this.configured = true
    this.onConfigured()
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return this.configured && !!this.config.apiKey
  }

  /**
   * Abstract method: Generate completion
   */
  abstract generate(request: GenerationRequest): Promise<GenerationResponse>

  /**
   * Abstract method: Get provider capabilities
   */
  abstract getCapabilities(): ProviderCapabilities

  /**
   * Validate configuration
   */
  async validateConfig(): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check API key
    if (!this.config.apiKey) {
      errors.push('API key is required')
    } else if (!this.isValidApiKey(this.config.apiKey)) {
      errors.push('Invalid API key format')
    }

    // Check model
    if (!this.config.model) {
      errors.push('Model is required')
    } else {
      const capabilities = this.getCapabilities()
      if (!capabilities.supportedModels.includes(this.config.model)) {
        warnings.push(`Model '${this.config.model}' may not be supported`)
      }
    }

    // Check temperature
    if (this.config.temperature !== undefined) {
      if (this.config.temperature < 0 || this.config.temperature > 2) {
        warnings.push('Temperature should be between 0 and 2')
      }
    }

    // Check max tokens
    if (this.config.maxTokens !== undefined) {
      const capabilities = this.getCapabilities()
      if (this.config.maxTokens > capabilities.maxTokens) {
        warnings.push(`maxTokens exceeds provider maximum of ${capabilities.maxTokens}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Estimate cost for a request (optional)
   */
  async estimateCost?(request: GenerationRequest): Promise<CostEstimate> {
    // Default implementation - child classes can override
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD'
    }
  }

  // ==========================================================================
  // Protected Helper Methods
  // ==========================================================================

  /**
   * Build request body for API call
   */
  protected buildRequestBody(request: GenerationRequest): any {
    const body: any = {
      model: this.config.model,
      messages: this.buildMessages(request)
    }

    // Add optional parameters
    if (request.temperature !== undefined) {
      body.temperature = request.temperature
    } else if (this.config.temperature !== undefined) {
      body.temperature = this.config.temperature
    }

    if (request.maxTokens !== undefined) {
      body.max_tokens = request.maxTokens
    } else if (this.config.maxTokens !== undefined) {
      body.max_tokens = this.config.maxTokens
    }

    if (request.topP !== undefined) {
      body.top_p = request.topP
    }

    if (request.stopSequences) {
      body.stop = request.stopSequences
    }

    return body
  }

  /**
   * Build messages array from request
   */
  protected buildMessages(request: GenerationRequest): any[] {
    const messages: any[] = []

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      })
    }

    // Add conversation history if provided
    if (request.messages && request.messages.length > 0) {
      messages.push(...request.messages.map(m => ({
        role: m.role,
        content: m.content
      })))
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: request.prompt
    })

    return messages
  }

  /**
   * Parse API response
   */
  protected parseResponse(response: any, model: string): GenerationResponse {
    // To be implemented by child classes
    throw new Error('parseResponse must be implemented by child class')
  }

  /**
   * Extract token usage from response
   */
  protected extractTokenUsage(response: any): TokenUsage {
    // Default implementation - child classes can override
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }
  }

  /**
   * Validate API key format
   */
  protected isValidApiKey(apiKey: string): boolean {
    return apiKey.length > 10
  }

  /**
   * Hook called after configuration
   */
  protected onConfigured(): void {
    // Child classes can override
  }

  /**
   * Get default headers for API requests
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.config.headers
    }
  }

  /**
   * Get base URL for API requests
   */
  protected getBaseURL(): string {
    return this.config.baseURL || ''
  }

  /**
   * Make HTTP request (abstract - to be implemented by child classes or use fetch)
   */
  protected async makeRequest(
    endpoint: string,
    body: any,
    options?: RequestInit
  ): Promise<any> {
    const url = `${this.getBaseURL()}${endpoint}`
    const headers = this.getHeaders()

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: options?.signal,
      ...options
    })

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    return response.json()
  }

  /**
   * Handle error response from API
   */
  protected async handleErrorResponse(response: Response): Promise<never> {
    const { APIError, AuthError, RateLimitError } = await import('../types')

    let errorMessage = `API error: ${response.status}`
    let errorDetails: any

    try {
      const errorData = await response.json()
      errorMessage = errorData.error?.message || errorData.message || errorMessage
      errorDetails = errorData
    } catch {
      // Ignore parse errors
    }

    switch (response.status) {
      case 401:
      case 403:
        throw new AuthError(errorMessage, this.providerName)

      case 429:
        const retryAfter = response.headers.get('Retry-After')
        throw new RateLimitError(
          errorMessage,
          this.providerName,
          retryAfter ? parseInt(retryAfter) * 1000 : undefined
        )

      default:
        throw new APIError(errorMessage, this.providerName, response.status, errorDetails)
    }
  }

  /**
   * Create timeout promise
   */
  protected createTimeout(): AbortController {
    const controller = new AbortController()
    const timeout = this.config.timeout || 30000

    setTimeout(() => controller.abort(), timeout)

    return controller
  }

  /**
   * Sleep for a specified duration
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// Export
// ============================================================================

export default BaseAIProvider

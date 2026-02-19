/**
 * PageWhisper AI System - Type Definitions
 *
 * Complete type system for AI provider abstraction layer.
 * Supports multiple AI providers (OpenRouter, OpenAI, Anthropic, etc.)
 */

// ============================================================================
// AI Provider Types
// ============================================================================

/**
 * Base AI Provider interface
 * All providers must implement this interface
 */
export interface AIProvider {
  /**
   * Provider name identifier
   */
  readonly name: string

  /**
   * Configure the provider with credentials and options
   */
  configure(config: ProviderConfig): void | Promise<void>

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean | Promise<boolean>

  /**
   * Generate a completion
   */
  generate(request: GenerationRequest): Promise<GenerationResponse>

  /**
   * Generate a streaming completion
   */
  generateStream?(request: GenerationRequest): AsyncIterableIterator<GenerationChunk>

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities

  /**
   * Validate configuration
   */
  validateConfig(): Promise<ValidationResult>

  /**
   * Estimate cost for a request (optional)
   */
  estimateCost?(request: GenerationRequest): Promise<CostEstimate>
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey: string
  baseURL?: string
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  metadata?: Record<string, any>
}

/**
 * Generation request
 */
export interface GenerationRequest {
  /**
   * User prompt
   */
  prompt: string

  /**
   * System prompt (optional)
   */
  systemPrompt?: string

  /**
   * Conversation history for context
   */
  messages?: ChatMessage[]

  /**
   * Generation parameters
   */
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  stopSequences?: string[]

  /**
   * Request metadata
   */
  metadata?: {
    requestId?: string
    sessionId?: string
    userId?: string
    [key: string]: any
  }

  /**
   * Streaming request
   */
  stream?: boolean
}

/**
 * Chat message for conversation history
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
  metadata?: Record<string, any>
}

/**
 * Generation response
 */
export interface GenerationResponse {
  /**
   * Generated content
   */
  content: string

  /**
   * Token usage information
   */
  usage: TokenUsage

  /**
   * Model used for generation
   */
  model: string

  /**
   * Reason for completion
   */
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'

  /**
   * Response metadata
   */
  metadata?: {
    requestId?: string
    latency?: number
    cacheHit?: boolean
    [key: string]: any
  }

  /**
   * Original provider response (for debugging)
   */
  raw?: any
}

/**
 * Streaming generation chunk
 */
export interface GenerationChunk {
  /**
   * Partial content
   */
  content: string

  /**
   * Is this the final chunk?
   */
  isComplete: boolean

  /**
   * Chunk metadata
   */
  metadata?: {
    index?: number
    accumulatedTokens?: number
    [key: string]: any
  }
}

/**
 * Token usage information
 */
export interface TokenUsage {
  /**
   * Input tokens (prompt + system)
   */
  promptTokens: number

  /**
   * Output tokens (generated)
   */
  completionTokens: number

  /**
   * Total tokens
   */
  totalTokens: number

  /**
   * Estimated cost (if available)
   */
  estimatedCost?: number
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  /**
   * Maximum tokens supported
   */
  maxTokens: number

  /**
   * Supports streaming responses
   */
  supportsStreaming: boolean

  /**
   * Supports system prompts
   */
  supportsSystemPrompt: boolean

  /**
   * Supports chat/history
   */
  supportsChatHistory: boolean

  /**
   * Supported models
   */
  supportedModels: string[]

  /**
   * Input token limits per model
   */
  modelLimits?: Record<string, ModelLimits>

  /**
   * Supported features
   */
  features: {
    functionCalling?: boolean
    imageInput?: boolean
    jsonMode?: boolean
    parallelRequests?: boolean
  }
}

/**
 * Model-specific limits
 */
export interface ModelLimits {
  maxTokens: number
  maxOutputTokens: number
  maxInputTokens: number
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

/**
 * Cost estimate
 */
export interface CostEstimate {
  inputCost: number
  outputCost: number
  totalCost: number
  currency: string
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache entry
 */
export interface CacheEntry<T = GenerationResponse> {
  key: string
  value: T
  createdAt: number
  expiresAt: number
  metadata: {
    promptHash: string
    model: string
    temperature: number
    [key: string]: any
  }
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  totalKeys: number
  expiredKeys: number
  lastCleaned: number
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Enable/disable caching
   */
  enabled: boolean

  /**
   * Time-to-live in seconds
   */
  ttl: number

  /**
   * Maximum cache size (number of entries)
   */
  maxSize?: number

  /**
   * Cleanup interval in seconds
   */
  cleanupInterval?: number

  /**
   * Storage backend
   */
  storage: 'memory' | 'localStorage' | 'custom'

  /**
   * Custom storage implementation
   */
  customStorage?: CacheStorage
}

/**
 * Cache storage interface
 */
export interface CacheStorage {
  get(key: string): Promise<any>
  set(key: string, value: any, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
  has(key: string): Promise<boolean>
  size(): Promise<number>
}

// ============================================================================
// Prompt Types
// ============================================================================

/**
 * Prompt template
 */
export interface PromptTemplate {
  /**
   * Template unique identifier
   */
  id: string

  /**
   * Template version (semver)
   */
  version: string

  /**
   * Template name
   */
  name: string

  /**
   * Template description
   */
  description: string

  /**
   * System prompt template
   */
  systemPrompt: string

  /**
   * User prompt template
   */
  userPrompt: string

  /**
   * Template variables
   */
  variables: PromptVariable[]

  /**
   * Target framework
   */
  targetFramework?: string

  /**
   * Is this template deprecated?
   */
  deprecated: boolean

  /**
   * Replacement template ID if deprecated
   */
  replacedBy?: string

  /**
   * Creation date
   */
  createdAt: string

  /**
   * Last modified date
   */
  modifiedAt: string

  /**
   * Template metadata
   */
  metadata?: Record<string, any>
}

/**
 * Prompt variable definition
 */
export interface PromptVariable {
  /**
   * Variable name
   */
  name: string

  /**
   * Variable type
   */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'

  /**
   * Is variable required?
   */
  required: boolean

  /**
   * Variable description
   */
  description: string

  /**
   * Default value
   */
  default?: any

  /**
   * Validation regex (for strings)
   */
  pattern?: RegExp

  /**
   * Allowed values (for enums)
   */
  enum?: any[]
}

/**
 * Rendered prompt
 */
export interface RenderedPrompt {
  /**
   * System prompt
   */
  systemPrompt: string

  /**
   * User prompt
   */
  userPrompt: string

  /**
   * Template ID used
   */
  templateId: string

  /**
   * Template version
   */
  templateVersion: string

  /**
   * Variables used
   */
  variables: Record<string, any>

  /**
   * Render metadata
   */
  metadata: {
    renderedAt: string
    targetFramework?: string
    [key: string]: any
  }
}

/**
 * Prompt versioning configuration
 */
export interface PromptVersioningConfig {
  /**
   * Default template version
   */
  defaultVersion: string

  /**
   * Auto-migrate to latest version
   */
  autoMigrate: boolean

  /**
   * Allow deprecated templates
   */
  allowDeprecated: boolean

  /**
   * Custom templates directory (optional)
   */
  customTemplatesPath?: string
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base AI error
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AIError'
  }
}

/**
 * Configuration error
 */
export class ConfigError extends AIError {
  constructor(message: string, provider?: string, details?: any) {
    super(message, 'CONFIG_ERROR', provider, details)
    this.name = 'ConfigError'
  }
}

/**
 * Authentication error
 */
export class AuthError extends AIError {
  constructor(message: string, provider?: string) {
    super(message, 'AUTH_ERROR', provider)
    this.name = 'AuthError'
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AIError {
  constructor(
    message: string,
    provider?: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', provider)
    this.name = 'RateLimitError'
  }
}

/**
 * API error
 */
export class APIError extends AIError {
  constructor(
    message: string,
    provider?: string,
    public statusCode?: number,
    details?: any
  ) {
    super(message, 'API_ERROR', provider, details)
    this.name = 'APIError'
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AIError {
  constructor(message: string, provider?: string) {
    super(message, 'TIMEOUT_ERROR', provider)
    this.name = 'TimeoutError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends AIError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', undefined, details)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// Retry Types
// ============================================================================

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number

  /**
   * Initial delay in milliseconds
   */
  initialDelay: number

  /**
   * Maximum delay in milliseconds
   */
  maxDelay: number

  /**
   * Backoff multiplier
   */
  backoffMultiplier: number

  /**
   * Jitter factor (0-1)
   */
  jitterFactor: number

  /**
   * Retryable error codes
   */
  retryableErrors: string[]

  /**
   * Retry on 4xx errors (except 429)
   */
  retryOn4xx: boolean

  /**
   * Retry on 5xx errors
   */
  retryOn5xx: boolean
}

/**
 * Retry attempt
 */
export interface RetryAttempt {
  attempt: number
  delay: number
  error?: Error
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTime: number
  attemptDetails: RetryAttempt[]
}

// ============================================================================
// AI System Types
// ============================================================================

/**
 * AI System configuration
 */
export interface AISystemConfig {
  /**
   * Default provider
   */
  provider: string

  /**
   * Provider configurations
   */
  providers: Record<string, ProviderConfig>

  /**
   * Cache configuration
   */
  cache: CacheConfig

  /**
   * Prompt versioning configuration
   */
  prompts: PromptVersioningConfig

  /**
   * Retry configuration
   */
  retry: RetryConfig

  /**
   * Default generation options
   */
  defaults: {
    model: string
    temperature: number
    maxTokens: number
  }
}

/**
 * AI request context
 */
export interface AIRequestContext {
  /**
   * Request ID
   */
  requestId: string

  /**
   * Session ID
   */
  sessionId?: string

  /**
   * User ID
   */
  userId?: string

  /**
   * Timestamp
   */
  timestamp: number

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>
}

/**
 * AI response with metadata
 */
export interface AIResponse<T = GenerationResponse> {
  /**
   * Response data
   */
  data: T

  /**
   * Request context
   */
  context: AIRequestContext

  /**
   * Cache information
   */
  cache?: {
    hit: boolean
    key: string
    age?: number
  }

  /**
   * Provider information
   */
  provider: {
    name: string
    model: string
    latency: number
  }

  /**
   * Retry information
   */
  retry?: {
    attempts: number
    totalDelay: number
  }
}

// ============================================================================
// Export all types
// ============================================================================

export default {
  // Provider
  AIProvider,
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  GenerationChunk,
  ChatMessage,
  TokenUsage,
  ProviderCapabilities,
  ModelLimits,
  ValidationResult,
  CostEstimate,

  // Cache
  CacheEntry,
  CacheStats,
  CacheConfig,
  CacheStorage,

  // Prompts
  PromptTemplate,
  PromptVariable,
  RenderedPrompt,
  PromptVersioningConfig,

  // Errors
  AIError,
  ConfigError,
  AuthError,
  RateLimitError,
  APIError,
  TimeoutError,
  ValidationError,

  // Retry
  RetryConfig,
  RetryAttempt,
  RetryResult,

  // System
  AISystemConfig,
  AIRequestContext,
  AIResponse
}

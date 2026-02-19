/**
 * PageWhisper AI System
 *
 * Complete AI abstraction layer for code generation.
 * Supports multiple providers (OpenRouter, OpenAI, Anthropic, etc.)
 *
 * @module AISystem
 */

// Main orchestrator
export { AISystem } from './AISystem'

// Providers
export { BaseAIProvider } from './providers/BaseProvider'
export { OpenRouterProvider } from './providers/OpenRouterProvider'

// Cache
export { CacheManager, CacheKeyGenerator, MemoryStorage, LocalStorageAdapter } from './cache/CacheManager'

// Prompts
export { PromptVersioning, BUILTIN_TEMPLATES } from './prompts/PromptVersioning'

// Retry
export { RetryManager, retry, Retry, calculateRateLimitDelay, isNetworkError, isTimeoutError, isRateLimitError } from './retry/RetryManager'

// Types
export type {
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
} from './types'

// Default export
export { AISystem as default } from './AISystem'

# PageWhisper AI System

Complete AI abstraction layer for intelligent code generation. Supports multiple AI providers with unified interface.

## 🎯 Overview

The AI System provides:

- **Multi-Provider Support** - OpenRouter, OpenAI, Anthropic, and more
- **Intelligent Caching** - Deterministic cache with TTL and storage backends
- **Prompt Versioning** - Template system with variable interpolation
- **Retry Logic** - Exponential backoff with jitter for resilience
- **Type-Safe** - Full TypeScript support with strict types

## 📦 Architecture

```
AISystem (Orchestrator)
├── Providers           # AI provider implementations
│   ├── BaseProvider    # Abstract base class
│   └── OpenRouterProvider
├── Cache              # Caching layer
│   ├── CacheManager
│   ├── MemoryStorage
│   └── LocalStorageAdapter
├── Prompts            # Prompt versioning
│   └── PromptVersioning
├── Retry              # Retry logic
│   └── RetryManager
└── Types              # TypeScript definitions
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { AISystem } from './ai'

// Create AI system
const ai = AISystem.createWithOpenRouter('sk-or-v1-...')

// Generate completion
const response = await ai.generate({
  prompt: 'Convert this HTML to React component...',
  systemPrompt: 'You are an expert React developer.'
})

console.log(response.data.content)
```

### Using Prompt Templates

```typescript
import { AISystem } from './ai'

const ai = AISystem.createWithOpenRouter('sk-or-v1-...')

// Use built-in template
const response = await ai.generateFromTemplate('react-v2', {
  html: '<button class="btn">Click me</button>',
  css: '.btn { padding: 10px 20px; }'
})

console.log(response.data.content)
```

### Custom Provider Configuration

```typescript
import { AISystem } from './ai'

const ai = AISystem.create()

await ai.configureProvider('openrouter', {
  apiKey: 'sk-or-v1-...',
  model: 'anthropic/claude-3-opus',
  temperature: 0.5,
  maxTokens: 8000
})
```

## 📚 Modules

### 1. Providers

**BaseProvider** - Abstract base class for all providers

```typescript
import { BaseAIProvider } from './ai'

class CustomProvider extends BaseAIProvider {
  constructor() {
    super('custom-provider')
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Implementation
  }

  getCapabilities(): ProviderCapabilities {
    return {
      maxTokens: 4000,
      supportsStreaming: true,
      supportsSystemPrompt: true,
      supportsChatHistory: true,
      supportedModels: ['model-1', 'model-2']
    }
  }
}
```

**OpenRouterProvider** - OpenRouter API adapter

```typescript
import { OpenRouterProvider } from './ai'

const provider = new OpenRouterProvider({
  apiKey: 'sk-or-v1-...',
  model: 'anthropic/claude-3-sonnet',
  siteUrl: 'https://mysite.com',
  siteName: 'MyApp'
})

// Generate with streaming
for await (const chunk of provider.generateStream(request)) {
  console.log(chunk.content)
}
```

### 2. Cache Manager

**Memory Storage** (default)

```typescript
import { CacheManager } from './ai'

const cache = new CacheManager({
  enabled: true,
  ttl: 3600, // 1 hour
  maxSize: 100,
  storage: 'memory'
})

// Get/Set
await cache.set('key', response)
const cached = await cache.get('key')

// Statistics
const stats = cache.getStats()
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
```

**LocalStorage Storage** (browser)

```typescript
const cache = new CacheManager({
  storage: 'localStorage',
  ttl: 7200 // 2 hours
})
```

**Custom Storage**

```typescript
import { CacheManager } from './ai'

const cache = new CacheManager({
  storage: 'custom',
  customStorage: {
    async get(key) { /* ... */ },
    async set(key, value, ttl) { /* ... */ },
    async delete(key) { /* ... */ },
    async clear() { /* ... */ },
    async keys() { /* ... */ },
    async has(key) { /* ... */ },
    async size() { /* ... */ }
  }
})
```

### 3. Prompt Versioning

**Using Built-in Templates**

```typescript
import { PromptVersioning } from './ai'

const prompts = new PromptVersioning()

// List templates
const templates = prompts.getAllTemplates()

// Render template
const rendered = prompts.render('react-v2', {
  html: '<div class="card">...</div>',
  css: '.card { ... }'
})

console.log(rendered.systemPrompt)
console.log(rendered.userPrompt)
```

**Custom Templates**

```typescript
import { PromptVersioning } from './ai'

const prompts = new PromptVersioning()

prompts.registerTemplate({
  id: 'my-template-v1',
  version: '1.0.0',
  name: 'My Custom Template',
  description: 'Description',
  systemPrompt: 'You are...',
  userPrompt: 'Convert {{html}} to {{framework}}',
  variables: [
    { name: 'html', type: 'string', required: true, description: 'HTML code' },
    { name: 'framework', type: 'string', required: true, description: 'Target framework' }
  ],
  deprecated: false,
  createdAt: '2025-02-19T00:00:00Z',
  modifiedAt: '2025-02-19T00:00:00Z'
})
```

### 4. Retry Manager

**Automatic Retry**

```typescript
import { RetryManager } from './ai'

const retry = new RetryManager({
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1
})

const result = await retry.execute(async () => {
  return await apiCall()
})

if (result.success) {
  console.log(result.data)
} else {
  console.error('Failed after', result.attempts, 'attempts')
}
```

**Retry Decorator**

```typescript
import { Retry } from './ai'

class MyService {
  @Retry({ maxAttempts: 3 })
  async fetchData() {
    return await apiCall()
  }
}
```

## 🔧 Configuration

### Default Configuration

```typescript
const config = {
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
    ttl: 3600,
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
```

## 📊 Supported Models

### OpenRouter

| Model | Input Tokens | Output Tokens | Cost (per 1M tokens) |
|-------|--------------|---------------|---------------------|
| Claude 3 Opus | 200k | 4k | $15 input / $75 output |
| Claude 3 Sonnet | 200k | 4k | $3 input / $15 output |
| Claude 3 Haiku | 200k | 4k | $0.25 input / $1.25 output |
| GPT-4 Turbo | 128k | 4k | $10 input / $30 output |
| GPT-3.5 Turbo | 16k | 4k | $0.50 input / $1.50 output |
| Gemini Pro | - | - | $0.50 input / $1.50 output |
| Llama 3 70B | - | - | $0.70 input / $0.70 output |

## 🎨 Built-in Templates

| ID | Name | Framework | Version |
|----|------|-----------|---------|
| `basic-v1` | Basic Component Conversion | Generic | 1.0.0 |
| `enhanced-v2` | Enhanced Component Conversion | Generic | 2.0.0 |
| `react-v2` | React Component Conversion | React | 2.0.0 |
| `vue-v2` | Vue 3 Component Conversion | Vue | 2.0.0 |

## 🔒 Error Handling

```typescript
import { AISystem, RateLimitError, AuthError, APIError } from './ai'

const ai = AISystem.create()

try {
  const response = await ai.generate(request)
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter)
  } else if (error instanceof AuthError) {
    console.log('Invalid API key')
  } else if (error instanceof APIError) {
    console.log('API error:', error.message, error.statusCode)
  }
}
```

## 📈 Monitoring

### Health Check

```typescript
const health = await ai.healthCheck()

console.log('Healthy:', health.healthy)
console.log('Provider:', health.provider)
console.log('Cache size:', health.cache?.size)
console.log('Cache hit rate:', health.cache?.hitRate)
```

### Cache Statistics

```typescript
const stats = ai.getCacheStats()

console.log('Hits:', stats.hits)
console.log('Misses:', stats.misses)
console.log('Hit rate:', (stats.hitRate * 100).toFixed(1) + '%')
console.log('Size:', stats.size)
```

## 🧪 Testing

```typescript
import { AISystem } from './ai'

// Mock provider for testing
class MockProvider extends BaseAIProvider {
  async generate(request: GenerationRequest) {
    return {
      content: 'Mock response',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      model: 'mock-model',
      finishReason: 'stop'
    }
  }

  getCapabilities() {
    return {
      maxTokens: 4000,
      supportsStreaming: false,
      supportsSystemPrompt: true,
      supportsChatHistory: false,
      supportedModels: ['mock-model']
    }
  }
}

const ai = AISystem.create()
ai.registerProvider('mock', new MockProvider())
ai.setDefaultProvider('mock')
```

## 📝 API Reference

See [types/index.ts](types/index.ts) for complete type definitions.

## 🔗 Links

- [Technical Documentation](../TECHNICAL_DOCUMENTATION.md)
- [Core Engine](../core/README.md)
- [Project README](../README.md)

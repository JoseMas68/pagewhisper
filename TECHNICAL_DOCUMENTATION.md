# PageWhisper - Technical Documentation

**Version:** 1.0.0
**Status:** Architecture Definition
**Last Updated:** 2025-02-19

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Evolution](#product-vision--evolution)
3. [Architecture Overview](#architecture-overview)
4. [Core Engine](#core-engine)
5. [Chrome MV3 Adapter](#chrome-mv3-adapter)
6. [AI System](#ai-system)
7. [Technical Flows](#technical-flows)
8. [Security Model](#security-model)
9. [Caching Strategy](#caching-strategy)
10. [Prompt Engineering](#prompt-engineering)
11. [Testing Strategy](#testing-strategy)
12. [Production Roadmap](#production-roadmap)
13. [Risk Assessment](#risk-assessment)

---

## Executive Summary

PageWhisper is a Chrome Extension (Manifest V3) designed to extract, clean, and convert web components into reusable code using AI. The project follows an **evolutionary architecture** approach, starting as an internal tool and scaling to a full SaaS platform.

### Key Objectives

- Extract DOM components with context preservation
- Clean and optimize HTML/CSS automatically
- Detect underlying frameworks and patterns
- Generate production-ready code via AI
- Maintain flexibility for multiple AI providers

### Success Metrics

- Extraction accuracy: >95% component isolation
- Code generation quality: Production-ready output
- Processing time: <5s per component
- User satisfaction: Manual edits <20%

---

## Product Vision & Evolution

### Stage A: Internal Tool (Current)

**Target:** Developer productivity for internal team

**Characteristics:**
- Direct OpenRouter API integration
- Local storage for API keys
- Basic UI/UX
- Manual configuration
- No billing management

**Technical Scope:**
```
┌─────────────────────────────────────┐
│     Chrome Extension (Local)        │
│  ┌───────────────────────────────┐  │
│  │   Core Engine + AI Module     │  │
│  │   (OpenRouter Direct)         │  │
│  └───────────────────────────────┘  │
│             │                        │
│  ┌─────────▼─────────┐              │
│  │  chrome.storage   │              │
│  │  (API Keys)       │              │
│  └───────────────────┘              │
└─────────────────────────────────────┘
```

**Timeline:** 0-3 months

---

### Stage B: Chrome Web Store Product

**Target:** Public developer tool

**Characteristics:**
- Polished UI/UX
- Onboarding flow
- Error handling & edge cases
- Rate limiting
- Basic analytics
- Privacy compliance

**Technical Scope:**
```
┌─────────────────────────────────────────┐
│    Chrome Extension (Public)            │
│  ┌───────────────────────────────────┐  │
│  │   Core Engine + AI Module         │  │
│  │   (Multi-provider ready)          │  │
│  └───────────────────────────────────┘  │
│              │                           │
│  ┌───────────▼────────────┐             │
│  │  Config Service        │             │
│  │  (Provider selection)  │             │
│  └────────────────────────┘             │
└─────────────────────────────────────────┘
```

**Requirements:**
- Chrome Web Store compliance
- Privacy policy & terms
- GDPR/CCPA compliance
- Comprehensive testing
- Documentation & support

**Timeline:** 3-6 months

---

### Stage C: SaaS Platform

**Target:** Enterprise solution with backend

**Characteristics:**
- User authentication
- Team collaboration
- Usage-based billing
- Custom backend infrastructure
- API access
- Advanced analytics

**Technical Scope:**
```
┌─────────────────────────────────────────────┐
│              Chrome Extension               │
│  ┌───────────────────────────────────────┐  │
│  │   Core Engine (Same as Stages A-B)    │  │
│  └───────────────────────────────────────┘  │
│                   │                          │
│                   ▼                          │
│  ┌─────────────────────────────────────┐    │
│  │        API Gateway                   │    │
│  │  (Auth, Rate Limit, Billing)        │    │
│  └─────────────────────────────────────┘    │
│                   │                          │
│  ┌──────────────┼──────────────┐           │
│  ▼              ▼               ▼           │
│ ┌─────┐    ┌─────────┐    ┌─────────┐      │
│ │Auth │    │ AI Core │    │Usage DB │      │
│ └─────┘    └─────────┘    └─────────┘      │
└─────────────────────────────────────────────┘
```

**Requirements:**
- Backend API (Node.js/Python)
- Database (PostgreSQL/MongoDB)
- Authentication (OAuth/JWT)
- Payment processing (Stripe)
- Infrastructure (AWS/GCP)
- Monitoring & logging

**Timeline:** 6-12 months

---

## Architecture Overview

### Modular Structure

```
pagewhisper/
├── core/                           # Framework-agnostic core
│   ├── engine/                     # Main orchestration
│   │   ├── extractor.ts            # DOM extraction logic
│   │   ├── cleaner.ts              # HTML/CSS cleaning
│   │   ├── detector.ts             # Framework detection
│   │   └── orchestrator.ts         # Pipeline coordinator
│   ├── models/                     # Data models
│   │   ├── component.ts            # Component schema
│   │   ├── config.ts               # Configuration schema
│   │   └── prompt.ts               # Prompt templates
│   └── utils/                      # Shared utilities
│       ├── dom.ts                  # DOM utilities
│       ├── css.ts                  # CSS utilities
│       └── validation.ts           # Validation helpers
│
├── adapters/                       # Platform adapters
│   ├── chrome/                     # Chrome MV3 adapter
│   │   ├── background.ts           # Service worker
│   │   ├── content.ts              # Content script
│   │   ├── popup.ts                # Extension UI
│   │   └── storage.ts              # Chrome storage wrapper
│   └── types/                      # Future: Firefox, Safari
│
├── ai/                             # AI provider layer
│   ├── providers/                  # AI provider implementations
│   │   ├── base.ts                 # Base provider interface
│   │   ├── openrouter.ts           # OpenRouter implementation
│   │   └── [future]/
│   │       ├── openai.ts
│   │       ├── anthropic.ts
│   │       └── local.ts
│   ├── prompts/                    # Prompt templates
│   │   ├── templates.ts            # Prompt definitions
│   │   └── versioning.ts           # Version management
│   └── cache/                      # Caching layer
│       ├── cache.ts                # Cache interface
│       └── storage.ts              # Cache storage
│
├── ui/                             # User interface
│   ├── popup/                      # Extension popup
│   ├── options/                    # Settings page
│   └── content/                    # Content script UI
│
├── config/                         # Configuration
│   ├── defaults.ts                 # Default configuration
│   └── constants.ts                # Constants
│
└── tests/                          # Test suite
    ├── unit/                       # Unit tests
    ├── integration/                # Integration tests
    └── e2e/                        # End-to-end tests
```

### Key Design Principles

1. **Separation of Concerns**
   - Core logic is platform-agnostic
   - Chrome-specific code is isolated in adapters
   - AI provider logic is abstracted

2. **Dependency Inversion**
   - Core depends on interfaces, not implementations
   - Easy to swap providers or platforms

3. **Single Responsibility**
   - Each module has one clear purpose
   - Easy to test and maintain

4. **Open/Closed**
   - Open for extension (new providers, platforms)
   - Closed for modification (stable core)

---

## Core Engine

### Architecture

The Core Engine is the framework-agnostic heart of PageWhisper. It contains all business logic without any platform-specific dependencies.

```typescript
// Core Engine Structure
interface CoreEngine {
  // Extraction
  extractComponent(element: HTMLElement): Component

  // Cleaning
  cleanHTML(html: string): string
  cleanCSS(css: string): string

  // Detection
  detectFramework(document: Document): FrameworkInfo

  // Orchestration
  process(request: ProcessRequest): Promise<ProcessResult>
}
```

### Components

#### 1. Extractor

**Responsibility:** Extract DOM components with context

```typescript
interface ExtractorConfig {
  includeStyles: boolean
  includeScripts: boolean
  depth: number
  preserveClasses: boolean
  extractAncestors: boolean
}

interface ExtractedComponent {
  html: string
  css: string[]
  scripts: string[]
  context: {
    url: string
    framework: string
    libraries: string[]
  }
  metadata: {
    timestamp: number
    elementSelector: string
    boundingRect: DOMRect
  }
}
```

**Key Features:**
- Intelligent element isolation
- Style inheritance tracking
- Computed style extraction
- Context preservation

#### 2. Cleaner

**Responsibility:** Optimize and clean HTML/CSS

```typescript
interface CleanerConfig {
  removeUnusedStyles: boolean
  minify: boolean
  prefixSelectors: boolean
  preserveImportant: boolean
}

interface CleanedResult {
  html: string
  css: string
  stats: {
    originalSize: number
    cleanedSize: number
    reductionPercent: number
  }
}
```

**Key Features:**
- Remove unused CSS rules
- Optimize selectors
- Normalize properties
- Prefix collision prevention

#### 3. Detector

**Responsibility:** Detect frameworks and libraries

```typescript
interface FrameworkInfo {
  name: string
  version: string
  confidence: number
  patterns: string[]
}

interface DetectorResult {
  frameworks: FrameworkInfo[]
  libraries: string[]
  cssFrameworks: string[]
  buildTools: string[]
}
```

**Detection Methods:**
1. **Global Variables** (React, Vue, Angular)
2. **DOM Attributes** (data-reactroot, ng-app)
3. **CSS Classes** (Bootstrap, Tailwind patterns)
4. **Script Tags** (CDN URLs, bundle signatures)
5. **Meta Tags** (generator, framework-specific)

#### 4. Orchestrator

**Responsibility:** Coordinate the entire pipeline

```typescript
interface ProcessRequest {
  element: HTMLElement
  config: ProcessConfig
  options: ProcessOptions
}

interface ProcessResult {
  component: ExtractedComponent
  cleaned: CleanedResult
  detected: DetectorResult
  generated?: GeneratedCode
  metadata: ProcessMetadata
}
```

---

## Chrome MV3 Adapter

### Architecture

The Chrome adapter bridges the Core Engine with the Chrome Extension API.

```
┌─────────────────────────────────────────┐
│         Chrome Extension Context        │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐      ┌─────────────┐  │
│  │   Popup UI   │──────│  Options    │  │
│  └──────┬───────┘      └─────────────┘  │
│         │                                │
│         ▼                                │
│  ┌─────────────────────────────────┐    │
│  │     Background Service Worker   │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │  Message Handler          │  │    │
│  │  └───────────┬───────────────┘  │    │
│  │              ▼                   │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │  Chrome Adapter Core      │  │    │
│  │  └───────────┬───────────────┘  │    │
│  └──────────────┼───────────────────┘    │
│                 │                         │
│                 ▼                         │
│  ┌─────────────────────────────────┐    │
│  │      Core Engine (Import)       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      Content Script             │    │
│  │  (Component Selection UI)       │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Components

#### 1. Background Service Worker

**Responsibility:** Extension lifecycle and message handling

```typescript
// background.ts
class BackgroundService {
  private coreEngine: CoreEngine
  private aiProvider: AIProvider

  constructor() {
    this.coreEngine = new CoreEngine()
    this.aiProvider = new OpenRouterProvider()
    this.setupMessageHandlers()
  }

  private setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'EXTRACT_COMPONENT':
          return this.handleExtract(message, sender, sendResponse)
        case 'PROCESS_COMPONENT':
          return this.handleProcess(message, sender, sendResponse)
        case 'GET_CONFIG':
          return this.handleGetConfig(sendResponse)
        case 'SET_CONFIG':
          return this.handleSetConfig(message, sendResponse)
      }
    })
  }
}
```

#### 2. Content Script

**Responsibility:** DOM interaction and component selection

```typescript
// content.ts
class ContentScript {
  private selectorUI: ComponentSelector

  constructor() {
    this.selectorUI = new ComponentSelector()
    this.setupElementHighlighting()
  }

  private setupElementHighlighting() {
    document.addEventListener('mouseover', this.handleHover)
    document.addEventListener('click', this.handleClick)
  }

  private handleHover = (event: MouseEvent) => {
    const element = event.target as HTMLElement
    this.selectorUI.highlightElement(element)
  }
}
```

#### 3. Popup UI

**Responsibility:** User interface for configuration and quick actions

```typescript
// popup.ts
class PopupUI {
  private configManager: ConfigManager

  constructor() {
    this.configManager = new ConfigManager()
    this.initializeUI()
  }

  private async initializeUI() {
    const config = await this.configManager.getConfig()
    this.renderConfig(config)
    this.setupEventListeners()
  }
}
```

#### 4. Storage Wrapper

**Responsibility:** Abstract Chrome storage API

```typescript
// storage.ts
class ChromeStorage implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key)
    return result[key] || null
  }

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value })
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key)
  }
}
```

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "PageWhisper",
  "version": "1.0.0",
  "description": "Extract and convert web components using AI",

  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],

  "host_permissions": [
    "https://*.openrouter.ai/*"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "options_page": "options.html",

  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## AI System

### Architecture

The AI system is completely decoupled from the Core Engine, allowing for multiple provider implementations.

```
┌─────────────────────────────────────────┐
│           AI Provider Layer             │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     Provider Interface            │  │
│  │  (Base abstraction)               │  │
│  └───────────────────────────────────┘  │
│           ▲         ▲         ▲          │
│           │         │         │          │
│  ┌────────┴─┐  ┌───┴────┐  ┌┴────────┐  │
│  │OpenRouter│  │ OpenAI │  │Anthropic │  │
│  │Provider  │  │Provider│  │Provider  │  │
│  └──────────┘  └────────┘  └─────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     Prompt Manager                │  │
│  │  (Templates + Versioning)         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     Cache Layer                   │  │
│  │  (Deterministic caching)          │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Provider Interface

```typescript
// base.ts
export interface AIProvider {
  // Configuration
  configure(config: ProviderConfig): void

  // Generation
  generate(request: GenerationRequest): Promise<GenerationResponse>

  // Streaming (optional)
  generateStream(request: GenerationRequest): AsyncIterator<GenerationChunk>

  // Validation
  validateConfig(): Promise<boolean>

  // Metadata
  getCapabilities(): ProviderCapabilities
}

export interface GenerationRequest {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
  metadata?: Record<string, any>
}

export interface GenerationResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason: string
  metadata?: Record<string, any>
}

export interface ProviderCapabilities {
  maxTokens: number
  supportsStreaming: boolean
  supportsSystemPrompt: boolean
  supportedModels: string[]
}
```

### OpenRouter Implementation

```typescript
// openrouter.ts
export class OpenRouterProvider implements AIProvider {
  private config: OpenRouterConfig
  private baseUrl = 'https://openrouter.ai/api/v1'

  constructor(config: OpenRouterConfig) {
    this.config = config
  }

  configure(config: OpenRouterConfig): void {
    this.config = { ...this.config, ...config }
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': chrome.runtime.getURL(''),
        'X-Title': 'PageWhisper'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        stop: request.stopSequences
      })
    })

    if (!response.ok) {
      throw new OpenRouterError(
        `API error: ${response.status}`,
        response.status
      )
    }

    const data = await response.json()
    return this.parseResponse(data)
  }

  getCapabilities(): ProviderCapabilities {
    return {
      maxTokens: 32000,
      supportsStreaming: true,
      supportsSystemPrompt: true,
      supportedModels: [
        'anthropic/claude-3-opus',
        'anthropic/claude-3-sonnet',
        'openai/gpt-4-turbo',
        'openai/gpt-4',
        'meta-llama/llama-3-70b'
      ]
    }
  }

  private parseResponse(data: any): GenerationResponse {
    const choice = data.choices[0]
    return {
      content: choice.message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      },
      model: data.model,
      finishReason: choice.finish_reason
    }
  }
}
```

### Configuration Management

```typescript
// config.ts
export interface AIConfig {
  provider: 'openrouter' | 'openai' | 'anthropic'
  apiKey: string
  model: string
  temperature?: number
  maxTokens?: number
  cacheEnabled?: boolean
  cache_ttl?: number
}

export class ConfigManager {
  private storage: StorageAdapter

  constructor(storage: StorageAdapter) {
    this.storage = storage
  }

  async getConfig(): Promise<AIConfig> {
    const config = await this.storage.get<AIConfig>('ai_config')
    return {
      provider: config?.provider ?? 'openrouter',
      apiKey: config?.apiKey ?? '',
      model: config?.model ?? 'anthropic/claude-3-sonnet',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 4000,
      cacheEnabled: config?.cacheEnabled ?? true,
      cache_ttl: config?.cache_ttl ?? 3600
    }
  }

  async setConfig(config: Partial<AIConfig>): Promise<void> {
    const current = await this.getConfig()
    const updated = { ...current, ...config }
    await this.storage.set('ai_config', updated)
  }

  async validateConfig(): Promise<boolean> {
    const config = await this.getConfig()

    if (!config.apiKey) {
      return false
    }

    // Provider-specific validation
    switch (config.provider) {
      case 'openrouter':
        return this.validateOpenRouterKey(config.apiKey)
      case 'openai':
        return this.validateOpenAIKey(config.apiKey)
      case 'anthropic':
        return this.validateAnthropicKey(config.apiKey)
    }
  }

  private validateOpenRouterKey(key: string): boolean {
    return key.startsWith('sk-or-v1-') && key.length > 20
  }

  private validateOpenAIKey(key: string): boolean {
    return key.startsWith('sk-') && key.length > 20
  }

  private validateAnthropicKey(key: string): boolean {
    return key.startsWith('sk-ant-') && key.length > 30
  }
}
```

---

## Technical Flows

### Complete Component Extraction Flow

```
User Action: Click "Extract Component"
         │
         ▼
┌─────────────────────────────────────────┐
│  1. Content Script                      │
│  ┌───────────────────────────────────┐  │
│  │ Capture element selection         │  │
│  │ Get computed styles               │  │
│  │ Identify parent context           │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               │ Send element data
               ▼
┌─────────────────────────────────────────┐
│  2. Background Service Worker            │
│  ┌───────────────────────────────────┐  │
│  │ Receive extraction request       │  │
│  │ Initialize Core Engine           │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Core Engine - Extractor             │
│  ┌───────────────────────────────────┐  │
│  │ Isolate element DOM              │  │
│  │ Extract inline styles            │  │
│  │ Collect CSS rules                │  │
│  │ Identify dependencies            │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Core Engine - Cleaner               │
│  ┌───────────────────────────────────┐  │
│  │ Remove unused CSS                │  │
│  │ Optimize selectors               │  │
│  │ Prefix class names               │  │
│  │ Normalize properties             │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Core Engine - Detector              │
│  ┌───────────────────────────────────┐  │
│  │ Detect framework (React/Vue/etc) │  │
│  │ Identify libraries               │  │
│  │ Analyze patterns                 │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. AI System                           │
│  ┌───────────────────────────────────┐  │
│  │ Check cache                      │  │
│  │ Build prompt from template       │  │
│  │ Call AI provider                 │  │
│  │ Cache response                   │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  7. Response Handler                    │
│  ┌───────────────────────────────────┐  │
│  │ Parse AI response                │  │
│  │ Format output                    │  │
│  │ Generate preview                 │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  8. UI Update                           │
│  ┌───────────────────────────────────┐  │
│  │ Display generated code            │  │
│  │ Show options (copy/download)      │  │
│  │ Enable re-generation              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Message Flow: Chrome Extension Context

```
┌─────────────┐                    ┌──────────────┐
│ Content     │                    │ Background   │
│ Script      │                    │ Service      │
│             │                    │ Worker       │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │ 1. User selects element          │
       │                                  │
       │ 2. chrome.runtime.sendMessage({  │
       │      type: 'EXTRACT_COMPONENT',  │
       │      payload: elementData        │
       │    })                            │
       ├─────────────────────────────────>│
       │                                  │ 3. Core Engine extraction
       │                                  │ 4. AI generation
       │                                  │ 5. Response processing
       │                                  │
       │ 6. sendResponse({                │
       │      result: processedData       │
       │    })                            │
       │<─────────────────────────────────┤
       │                                  │
       │ 7. Display result to user        │
       │                                  │
```

### API Call Flow: OpenRouter Integration

```
┌─────────────────────────────────────────┐
│  AI Provider (OpenRouter)               │
└──────────┬──────────────────────────────┘
           │
           │ 1. Check Cache
           │
           ├─────────────────┐
           │ Cache Hit?      │
           ├─────────────────┤
           │ NO              │ YES
           │                 │
           ▼                 ▼
    ┌──────────────┐   ┌──────────────┐
    │ 2. Build     │   │ Return       │
    │    Prompt    │   │ Cached       │
    │              │   │ Response     │
    └──────┬───────┘   └──────────────┘
           │
           │ 3. Call OpenRouter API
           │
           ▼
    ┌────────────────────────────────────┐
    │ POST https://openrouter.ai/api/v1 │
    │ /chat/completions                  │
    │                                    │
    │ Headers:                           │
    │ - Authorization: Bearer sk-or-...  │
    │ - Content-Type: application/json   │
    │ - HTTP-Referer: extension_url      │
    │ - X-Title: PageWhisper             │
    │                                    │
    │ Body:                              │
    │ {                                  │
    │   model: "anthropic/claude-3...",  │
    │   messages: [...],                 │
    │   temperature: 0.7,                │
    │   max_tokens: 4000                 │
    │ }                                  │
    └────────────┬───────────────────────┘
                 │
                 │ 4. Parse Response
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ {                                  │
    │   choices: [{                      │
    │     message: {                     │
    │       content: "generated code"    │
    │     }                              │
    │   }],                              │
    │   usage: {                         │
    │     prompt_tokens: 1234,           │
    │     completion_tokens: 567,        │
    │     total_tokens: 1801             │
    │   }                                │
    │ }                                  │
    └────────────┬───────────────────────┘
                 │
                 │ 5. Store in Cache
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ Return to caller                   │
    └────────────────────────────────────┘
```

---

## Security Model

### API Key Management

#### Stage A: Internal Tool

**Approach:** Chrome Storage Local (Non-persistent)

```typescript
// Config storage for internal use
class InternalKeyManager {
  async setApiKey(key: string): Promise<void> {
    // Store in chrome.storage.local (cleared on uninstall)
    await chrome.storage.local.set({
      'api_key': this.encrypt(key)
    })
  }

  async getApiKey(): Promise<string | null> {
    const result = await chrome.storage.local.get('api_key')
    return result.api_key ? this.decrypt(result.api_key) : null
  }

  private encrypt(key: string): string {
    // Basic encryption for local storage
    // In production, use Chrome's crypto API
    return btoa(key) // Base64 encoding (placeholder)
  }

  private decrypt(encrypted: string): string {
    return atob(encrypted)
  }
}
```

**Security Considerations:**
- ✅ API keys stored locally
- ✅ Cleared on extension uninstall
- ⚠️ Not encrypted (acceptable for internal tool)
- ⚠️ Accessible to other extensions with storage permission

#### Stage B: Chrome Web Store

**Approach:** Encrypted Chrome Storage

```typescript
// Enhanced security for public release
class SecureKeyManager {
  private readonly KEY_ALGORITHM = 'AES-GCM'
  private readonly SALT_LENGTH = 16

  async setApiKey(key: string, password: string): Promise<void> {
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH))
    const encryptionKey = await this.deriveKey(password, salt)
    const encrypted = await this.encryptData(key, encryptionKey)

    await chrome.storage.local.set({
      'api_key_encrypted': encrypted.data,
      'api_key_iv': encrypted.iv,
      'api_key_salt': Array.from(salt)
    })
  }

  async getApiKey(password: string): Promise<string | null> {
    const result = await chrome.storage.local.get([
      'api_key_encrypted',
      'api_key_iv',
      'api_key_salt'
    ])

    if (!result.api_key_encrypted) return null

    const salt = new Uint8Array(result.api_key_salt)
    const encryptionKey = await this.deriveKey(password, salt)

    return this.decryptData(
      result.api_key_encrypted,
      result.api_key_iv,
      encryptionKey
    )
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.KEY_ALGORITHM, length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  private async encryptData(data: string, key: CryptoKey): Promise<{data: string, iv: string}> {
    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt(
      { name: this.KEY_ALGORITHM, iv: iv },
      key,
      encoder.encode(data)
    )

    return {
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    }
  }

  private async decryptData(
    encryptedData: string,
    iv: string,
    key: CryptoKey
  ): Promise<string> {
    const decoder = new TextDecoder()
    const encrypted = new Uint8Array(
      Array.from(atob(encryptedData), c => c.charCodeAt(0))
    )
    const ivArray = new Uint8Array(
      Array.from(atob(iv), c => c.charCodeAt(0))
    )

    const decrypted = await crypto.subtle.decrypt(
      { name: this.KEY_ALGORITHM, iv: ivArray },
      key,
      encrypted
    )

    return decoder.decode(decrypted)
  }
}
```

**Security Enhancements:**
- ✅ AES-256-GCM encryption
- ✅ PBKDF2 key derivation (100k iterations)
- ✅ User password protection
- ✅ Random IV per encryption
- ✅ Web Crypto API (native browser)

#### Stage C: SaaS Platform

**Approach:** Server-side Key Management

```typescript
// Server-side key management
class ServerKeyManager {
  private db: Database
  private encryptionService: EncryptionService

  async setApiKey(userId: string, key: string): Promise<void> {
    // Encrypt with master key before storage
    const encrypted = await this.encryptionService.encrypt(key)

    await this.db.apiKeys.create({
      userId,
      encryptedKey: encrypted,
      provider: 'openrouter',
      createdAt: new Date()
    })
  }

  async getApiKey(userId: string): Promise<string | null> {
    const record = await this.db.apiKeys.findUnique({ userId })

    if (!record) return null

    return this.encryptionService.decrypt(record.encryptedKey)
  }
}
```

**Security Features:**
- ✅ Keys never stored client-side
- ✅ Server-side encryption with master key
- ✅ Audit logging
- ✅ Key rotation support
- ✅ Usage monitoring

### Data Privacy

```typescript
// Privacy settings configuration
interface PrivacyConfig {
  // Analytics
  sendAnonymousUsage: boolean

  // Data retention
  cache_ttl: number
  clearCacheOnExit: boolean

  // API calls
  logApiCalls: boolean
  includeSourceUrl: boolean

  // Component data
  stripPersonalData: boolean
  anonymizeUrls: boolean
}
```

### Content Security Policy (CSP)

```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src https://openrouter.ai"
  }
}
```

---

## Caching Strategy

### Deterministic Cache Key Generation

```typescript
// cache.ts
export class CacheManager {
  private storage: CacheStorage

  constructor(storage: CacheStorage) {
    this.storage = storage
  }

  generateCacheKey(request: GenerationRequest): string {
    // Deterministic key generation
    const components = [
      request.systemPrompt || '',
      request.prompt,
      request.temperature ?? 0.7,
      request.maxTokens ?? 4000,
      request.model || 'default',
      JSON.stringify(request.metadata || {})
    ]

    // Hash for consistent key
    return this.hash(components.join('|||'))
  }

  private hash(input: string): string {
    // Simple hash function (replace with proper hash in production)
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `cache_${Math.abs(hash)}`
  }

  async get(request: GenerationRequest): Promise<GenerationResponse | null> {
    const key = this.generateCacheKey(request)
    const cached = await this.storage.get(key)

    if (!cached) return null

    // Check TTL
    if (Date.now() > cached.expiresAt) {
      await this.storage.delete(key)
      return null
    }

    return cached.data
  }

  async set(request: GenerationRequest, response: GenerationResponse, ttl: number = 3600): Promise<void> {
    const key = this.generateCacheKey(request)

    await this.storage.set(key, {
      data: response,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000)
    })
  }

  async clear(): Promise<void> {
    await this.storage.clear()
  }

  async clearExpired(): Promise<void> {
    const allKeys = await this.storage.keys()

    for (const key of allKeys) {
      const cached = await this.storage.get(key)
      if (cached && Date.now() > cached.expiresAt) {
        await this.storage.delete(key)
      }
    }
  }
}
```

### Cache Storage Implementation

```typescript
// storage.ts
export interface CacheStorage {
  get(key: string): Promise<CachedResponse | null>
  set(key: string, value: CachedResponse): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  clear(): Promise<void>
}

// Chrome storage implementation
export class ChromeCacheStorage implements CacheStorage {
  private readonly prefix = 'pw_cache_'

  async get(key: string): Promise<CachedResponse | null> {
    const result = await chrome.storage.local.get(this.prefix + key)
    return result[this.prefix + key] || null
  }

  async set(key: string, value: CachedResponse): Promise<void> {
    await chrome.storage.local.set({
      [this.prefix + key]: value
    })
  }

  async delete(key: string): Promise<void> {
    await chrome.storage.local.remove(this.prefix + key)
  }

  async keys(): Promise<string[]> {
    const all = await chrome.storage.local.get()
    return Object.keys(all)
      .filter(k => k.startsWith(this.prefix))
      .map(k => k.slice(this.prefix.length))
  }

  async clear(): Promise<void> {
    const keys = await this.keys()
    await chrome.storage.local.remove(keys.map(k => this.prefix + k))
  }
}

interface CachedResponse {
  data: GenerationResponse
  createdAt: number
  expiresAt: number
}
```

### Cache Statistics

```typescript
// stats.ts
export class CacheStats {
  private storage: CacheStorage
  private statsKey = 'pw_cache_stats'

  async recordHit(): Promise<void> {
    const stats = await this.getStats()
    stats.hits++
    stats.lastHit = Date.now()
    await this.saveStats(stats)
  }

  async recordMiss(): Promise<void> {
    const stats = await this.getStats()
    stats.misses++
    await this.saveStats(stats)
  }

  async getStats(): Promise<CacheStatistics> {
    const stored = await this.storage.get(this.statsKey)
    return stored || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      lastHit: null,
      size: await this.getCacheSize()
    }
  }

  private async getCacheSize(): Promise<number> {
    const keys = await this.storage.keys()
    return keys.length
  }

  private async saveStats(stats: CacheStatistics): Promise<void> {
    stats.hitRate = stats.hits / (stats.hits + stats.misses)
    stats.size = await this.getCacheSize()
    await this.storage.set(this.statsKey, stats)
  }
}

interface CacheStatistics {
  hits: number
  misses: number
  hitRate: number
  lastHit: number | null
  size: number
}
```

---

## Prompt Engineering

### Prompt Versioning System

```typescript
// versioning.ts
export class PromptManager {
  private templates: Map<string, PromptTemplate>

  constructor() {
    this.templates = new Map()
    this.initializeTemplates()
  }

  private initializeTemplates() {
    this.register('v1', {
      version: 'v1',
      systemPrompt: `You are an expert frontend developer specializing in component extraction and code conversion.`,
      userPromptTemplate: this.buildPromptV1(),
      deprecated: false,
      createdAt: '2025-01-15'
    })

    this.register('v2', {
      version: 'v2',
      systemPrompt: `You are a senior frontend engineer with expertise in modern frameworks and component architecture.`,
      userPromptTemplate: this.buildPromptV2(),
      deprecated: false,
      createdAt: '2025-02-01',
      improvements: [
        'Better framework detection',
        'Improved accessibility support',
        'Enhanced error handling'
      ]
    })
  }

  private buildPromptV1(): string {
    return `
Extract the following web component and convert it to clean, reusable code.

**Component HTML:**
{{html}}

**Component CSS:**
{{css}}

**Detected Framework:**
{{framework}}

**Requirements:**
1. Create a clean, semantic component
2. Use modern JavaScript (ES6+)
3. Ensure responsive design
4. Add accessibility attributes
5. Include proper error handling

**Output Format:**
Return the code in markdown format with file names as headers.
`
  }

  private buildPromptV2(): string {
    return `
You are converting a web component into production-ready code.

**Input Component:**
\`\`\`html
{{html}}
\`\`\`

**Styles:**
\`\`\`css
{{css}}
\`\`\`

**Context:**
- Framework: {{framework}}
- Libraries: {{libraries}}
- Component Type: {{componentType}}

**Conversion Requirements:**

1. **Framework Conversion**: Convert to {{targetFramework}}
   - Use proper component structure
   - Implement state management appropriately
   - Handle events correctly

2. **Code Quality**:
   - Follow framework best practices
   - Use TypeScript if applicable
   - Include proper typing
   - Add JSDoc comments

3. **Accessibility**:
   - Add ARIA labels where needed
   - Ensure keyboard navigation
   - Maintain semantic HTML

4. **Performance**:
   - Optimize re-renders
   - Memoize expensive operations
   - Lazy load if appropriate

**Output Format:**
\`\`\`
// Component.tsx
[code here]

// Component.module.css
[styles here]

// types.ts
[typescript types]
\`\`\`

**Notes:**
- Maintain original functionality
- Preserve all visual aspects
- Add error boundaries if needed
`
  }

  getPrompt(version: string = 'latest'): PromptTemplate {
    if (version === 'latest') {
      version = this.getLatestVersion()
    }

    const template = this.templates.get(version)
    if (!template) {
      throw new Error(`Prompt version ${version} not found`)
    }

    return template
  }

  renderPrompt(version: string, variables: Record<string, any>): string {
    const template = this.getPrompt(version)
    let prompt = template.userPromptTemplate

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value))
    }

    return prompt
  }

  getLatestVersion(): string {
    const versions = Array.from(this.templates.values())
      .filter(t => !t.deprecated)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return versions[0]?.version || 'v1'
  }

  private register(version: string, template: PromptTemplate) {
    this.templates.set(version, template)
  }
}

interface PromptTemplate {
  version: string
  systemPrompt: string
  userPromptTemplate: string
  deprecated: boolean
  createdAt: string
  improvements?: string[]
}
```

### Prompt Optimization

```typescript
// optimizer.ts
export class PromptOptimizer {
  optimizeForModel(prompt: string, model: string): string {
    const optimizations = {
      'claude-3-opus': this.optimizeForClaude,
      'claude-3-sonnet': this.optimizeForClaude,
      'gpt-4-turbo': this.optimizeForGPT4,
      'gpt-4': this.optimizeForGPT4,
      'llama-3-70b': this.optimizeForLlama
    }

    const optimizer = optimizations[model] || this.optimizeGeneric
    return optimizer.call(this, prompt)
  }

  private optimizeForClaude(prompt: string): string {
    // Claude prefers detailed instructions and examples
    return `
I need you to convert a web component to clean, production-ready code.

${prompt}

**Additional Guidelines for Claude:**
- Think step-by-step before generating code
- Explain your approach briefly
- Use code blocks for all output
- Ensure all code is complete and runnable
`
  }

  private optimizeForGPT4(prompt: string): string {
    // GPT-4 works well with structured prompts
    return `
## Task: Component Conversion

${prompt}

## Output Requirements:
- Provide complete, runnable code
- Include all necessary imports
- Add comments for complex logic
- Follow the specified output format exactly
`
  }

  private optimizeForLlama(prompt: string): string {
    // Llama models prefer simpler, more direct instructions
    return `
Convert this web component to code:

${prompt}

Return the code in markdown format.
`
  }

  private optimizeGeneric(prompt: string): string {
    return prompt
  }
}
```

---

## Testing Strategy

### Unit Testing

```typescript
// tests/unit/extractor.test.ts
import { describe, it, expect } from 'vitest'
import { ComponentExtractor } from '../../core/engine/extractor'

describe('ComponentExtractor', () => {
  let extractor: ComponentExtractor

  beforeEach(() => {
    extractor = new ComponentExtractor()
  })

  describe('extract', () => {
    it('should extract simple div element', () => {
      const element = document.createElement('div')
      element.className = 'test-class'
      element.textContent = 'Test content'

      const result = extractor.extract(element)

      expect(result.html).toContain('<div')
      expect(result.html).toContain('test-class')
      expect(result.html).toContain('Test content')
    })

    it('should extract element with inline styles', () => {
      const element = document.createElement('span')
      element.style.color = 'red'
      element.style.fontSize = '14px'

      const result = extractor.extract(element)

      expect(result.css).toContain('color: red')
      expect(result.css).toContain('font-size: 14px')
    })

    it('should capture computed styles', () => {
      const element = document.createElement('p')
      document.body.appendChild(element)
      element.style.margin = '10px'

      const result = extractor.extract(element)

      expect(result.css).toBeDefined()
      expect(result.css.length).toBeGreaterThan(0)

      document.body.removeChild(element)
    })
  })

  describe('cleanHTML', () => {
    it('should remove empty attributes', () => {
      const html = '<div class="" id="" data-test="value">Content</div>'
      const cleaned = extractor.cleanHTML(html)

      expect(cleaned).not.toContain('class=""')
      expect(cleaned).not.toContain('id=""')
      expect(cleaned).toContain('data-test="value"')
    })

    it('should normalize whitespace', () => {
      const html = '<div>  Multiple   spaces  </div>'
      const cleaned = extractor.cleanHTML(html)

      expect(cleaned).not.toContain('  ')
    })
  })
})
```

### Integration Testing

```typescript
// tests/integration/ai-flow.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { CoreEngine } from '../../core/engine/orchestrator'
import { OpenRouterProvider } from '../../ai/providers/openrouter'
import { MockCacheStorage } from '../mocks/cache-storage'

describe('AI Integration Flow', () => {
  let engine: CoreEngine
  let provider: OpenRouterProvider
  let cache: MockCacheStorage

  beforeAll(() => {
    provider = new OpenRouterProvider({
      apiKey: process.env.TEST_API_KEY || 'test-key',
      model: 'anthropic/claude-3-sonnet'
    })

    cache = new MockCacheStorage()
    engine = new CoreEngine({ provider, cache })
  })

  it('should process component end-to-end', async () => {
    const element = document.createElement('button')
    element.className = 'btn btn-primary'
    element.textContent = 'Click me'
    element.style.padding = '10px 20px'
    element.style.backgroundColor = 'blue'

    const result = await engine.process({
      element,
      config: {
        targetFramework: 'react',
        includeStyles: true
      }
    })

    expect(result.generated).toBeDefined()
    expect(result.generated?.code).toContain('React')
    expect(result.metadata.processingTime).toBeGreaterThan(0)
  })

  it('should use cache for identical requests', async () => {
    const element = document.createElement('div')
    element.textContent = 'Test'

    // First call
    const result1 = await engine.process({
      element,
      config: { targetFramework: 'react' }
    })

    // Second call (should hit cache)
    const result2 = await engine.process({
      element,
      config: { targetFramework: 'react' }
    })

    expect(result1.generated?.code).toEqual(result2.generated?.code)
    expect(cache.getHitCount()).toBeGreaterThan(0)
  })
})
```

### End-to-End Testing

```typescript
// tests/e2e/extension.test.ts
import { test, expect } from '@playwright/test'

test.describe('PageWhisper Extension', () => {
  test.beforeEach(async ({ context }) => {
    // Load extension
    await context.addInitScript({
      path: './build/extension.js'
    })
  })

  test('should extract button component', async ({ page }) => {
    await page.goto('https://example.com')

    // Select a button element
    const button = await page.locator('button').first()
    await button.click({ button: 'right' })

    // Click extract from context menu
    await page.click('[data-action="extract-component"]')

    // Verify extraction result
    await expect(page.locator('.extraction-result')).toBeVisible()
    await expect(page.locator('.generated-code')).toContainText('React')
  })

  test('should configure API key in options', async ({ page }) => {
    await page.goto('chrome-extension://__/options.html')

    await page.fill('[name="apiKey"]', 'sk-or-test-key')
    await page.selectOption('[name="model"]', 'anthropic/claude-3-sonnet')
    await page.click('button[type="save"]')

    await expect(page.locator('.save-success')).toBeVisible()
  })
})
```

### Test Coverage

```typescript
// tests/config/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'build']
  }
})
```

---

## Production Roadmap

### Stage A: Internal Tool (0-3 months)

**Phase 1: Foundation (Month 1)**
- [x] Project setup and build configuration
- [ ] Core Engine implementation
  - [ ] Extractor
  - [ ] Cleaner
  - [ ] Detector
- [ ] Basic UI (popup, options page)
- [ ] Chrome MV3 adapter setup

**Phase 2: AI Integration (Month 1-2)**
- [ ] AI provider interface
- [ ] OpenRouter integration
- [ ] Prompt templates v1
- [ ] Basic caching

**Phase 3: Testing & Refinement (Month 2-3)**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Internal beta testing
- [ ] Bug fixes and iterations

**Deliverables:**
- Working Chrome extension
- Internal documentation
- Basic test coverage (>60%)

---

### Stage B: Chrome Web Store (3-6 months)

**Phase 1: Production Polish (Month 3-4)**
- [ ] UI/UX improvements
- [ ] Onboarding flow
- [ ] Error handling
- [ ] Edge case handling
- [ ] Performance optimization

**Phase 2: Compliance & Security (Month 4-5)**
- [ ] Security audit
- [ ] API key encryption
- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR/CCPA compliance
- [ ] CSP configuration

**Phase 3: Store Preparation (Month 5-6)**
- [ ] Screenshots and demo video
- [ ] Store listing optimization
- [ ] Documentation
- [ ] User guide
- [ ] Support channel setup
- [ ] Analytics integration

**Deliverables:**
- Chrome Web Store listing
- Public documentation
- Production-ready extension
- 90%+ test coverage

---

### Stage C: SaaS Platform (6-12 months)

**Phase 1: Backend Development (Month 6-8)**
- [ ] API design and implementation
- [ ] Database schema design
- [ ] Authentication system
- [ ] User management
- [ ] Billing integration (Stripe)

**Phase 2: Infrastructure (Month 8-10)**
- [ ] Cloud infrastructure setup (AWS/GCP)
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Error tracking (Sentry)
- [ ] Analytics (Mixpanel/Amplitude)

**Phase 3: Features & Scale (Month 10-12)**
- [ ] Team collaboration features
- [ ] Advanced analytics
- [ ] API access
- [ ] Rate limiting
- [ ] Key rotation
- [ ] Multi-provider support

**Deliverables:**
- Full SaaS platform
- API documentation
- Admin dashboard
- Production infrastructure

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **AI API Rate Limiting** | Medium | High | Implement caching, queue system, rate limiting |
| **Chrome Extension API Changes** | Low | High | Stay updated with Chrome releases, abstract adapter layer |
| **Cross-Origin Issues** | Medium | Medium | Proper CSP configuration, proxy if needed |
| **Memory Leaks in Content Scripts** | Medium | Medium | Regular memory profiling, proper cleanup |
| **Framework Detection Failures** | Low | Medium | Multiple detection methods, fallback strategies |
| **Prompt Version Conflicts** | Low | Low | Strict versioning, A/B testing framework |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **OpenRouter Service Downtime** | Low | High | Support multiple AI providers from day 1 |
| **API Cost Overruns** | Medium | High | Implement budget limits, cost tracking, optimization |
| **Competing Products** | Medium | Medium | Focus on unique features, quality, UX |
| **User Adoption Low** | Medium | High | Early user feedback, iterative improvement |
| **Chrome Web Store Rejection** | Low | High | Follow guidelines, compliance audit before submission |

### Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **API Key Leakage** | Low | Critical | Encryption, secure storage, no key logging |
| **XSS in Content Scripts** | Low | High | Input sanitization, CSP, regular audits |
| **Data Privacy Violations** | Low | High | Privacy policy, data anonymization, user control |
| **Malicious Website Exploitation** | Low | Medium | Input validation, sandboxing, permissions model |

### Performance Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Large DOM Extraction Slow** | Medium | Medium | Lazy loading, progressive extraction |
| **Cache Bloat** | Medium | Low | TTL limits, size limits, automatic cleanup |
| **AI Generation Timeout** | Medium | Medium | Timeout handling, retry logic, fallback |
| **Extension Size Limit** | Low | Low | Code splitting, lazy loading, optimization |

---

## Production Checklist

### Pre-Release (Stage A)

**Code Quality:**
- [ ] All code follows TypeScript strict mode
- [ ] ESLint rules configured and passing
- [ ] Prettier formatting applied
- [ ] Code review completed
- [ ] No console.log in production code

**Testing:**
- [ ] Unit tests for core modules
- [ ] Integration tests for critical paths
- [ ] Manual testing completed
- [ ] Edge cases identified and handled

**Documentation:**
- [ ] README with setup instructions
- [ ] Architecture documentation
- [ ] API documentation (internal)
- [ ] Development guidelines

**Performance:**
- [ ] Bundle size analyzed and optimized
- [ ] Memory profiling completed
- [ ] Load time < 2 seconds
- [ ] No memory leaks detected

---

### Chrome Web Store (Stage B)

**Compliance:**
- [ ] Chrome Web Store Developer Program agreement signed
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR/CCPA compliance verified
- [ ] COPPA compliance (if applicable)

**Security:**
- [ ] Security audit completed
- [ ] CSP properly configured
- [ ] API key encryption implemented
- [ ] Permissions minimized
- [ ] No vulnerable dependencies

**Assets:**
- [ ] Extension icon (128x128, 48x48, 16x16)
- [ ] Screenshots (1280x800 or 640x400)
- [ ] Promotional tile (440x280, optional)
- [ ] Promotional marquee (custom, optional)
- [ ] Demo video (optional)

**Listing:**
- [ ] Detailed description
- [ ] Short description (132 characters max)
- [ ] Category selected
- [ ] Language selected
- [ ] Privacy practices disclosed

**Support:**
- [ ] Support email or website
- [ ] Issue tracker setup
- [ ] User feedback channel
- [ ] Response plan for reviews

---

### SaaS Platform (Stage C)

**Infrastructure:**
- [ ] Cloud account setup (AWS/GCP)
- [ ] Domain and SSL certificates
- [ ] CDN configuration
- [ ] Database setup and backups
- [ ] CI/CD pipeline

**Monitoring:**
- [ ] Application monitoring (New Relic/DataDog)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (ELK stack)
- [ ] Uptime monitoring
- [ ] Performance monitoring

**Business:**
- [ ] Business registration
- [ ] Payment processor setup (Stripe)
- [ ] Billing infrastructure
- [ ] Invoice generation
- [ ] Customer support system
- [ ] Legal agreements (ToS, Privacy Policy, SLA)

**Security:**
- [ ] Penetration testing
- [ ] Security audit
- [ ] SOC 2 compliance (if needed)
- [ ] Data encryption at rest and in transit
- [ ] Incident response plan
- [ ] Disaster recovery plan

---

## Appendix

### A. Configuration Examples

**Development Config:**
```typescript
{
  "ai": {
    "provider": "openrouter",
    "model": "anthropic/claude-3-sonnet",
    "temperature": 0.7,
    "maxTokens": 4000,
    "cacheEnabled": true,
    "cache_ttl": 3600
  },
  "extraction": {
    "includeStyles": true,
    "includeScripts": false,
    "depth": 5,
    "preserveClasses": true
  },
  "ui": {
    "theme": "dark",
    "showPreview": true,
    "autoExtract": false
  }
}
```

**Production Config:**
```typescript
{
  "ai": {
    "provider": "openrouter",
    "model": "anthropic/claude-3-sonnet",
    "temperature": 0.5,
    "maxTokens": 8000,
    "cacheEnabled": true,
    "cache_ttl": 7200
  },
  "extraction": {
    "includeStyles": true,
    "includeScripts": true,
    "depth": 10,
    "preserveClasses": false
  },
  "ui": {
    "theme": "system",
    "showPreview": true,
    "autoExtract": false,
    "showTips": false
  },
  "privacy": {
    "sendAnonymousUsage": true,
    "clearCacheOnExit": false,
    "stripPersonalData": true,
    "anonymizeUrls": true
  }
}
```

### B. Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `PW_001` | `EXTRACTION_FAILED` | Component extraction failed |
| `PW_002` | `CLEANING_FAILED` | HTML/CSS cleaning failed |
| `PW_003` | `DETECTION_FAILED` | Framework detection failed |
| `PW_100` | `AI_API_ERROR` | AI API request failed |
| `PW_101` | `AI_RATE_LIMITED` | AI API rate limit exceeded |
| `PW_102` | `AI_TIMEOUT` | AI API request timed out |
| `PW_200` | `INVALID_API_KEY` | Invalid or missing API key |
| `PW_201` | `CACHE_ERROR` | Cache operation failed |
| `PW_300` | `STORAGE_ERROR` | Chrome storage error |
| `PW_400` | `NETWORK_ERROR` | Network connection error |

### C. Performance Benchmarks

**Target Metrics:**
- Extension load time: < 500ms
- Component extraction: < 1s
- AI generation: < 5s (cached: < 100ms)
- Memory usage: < 50MB
- Bundle size: < 1MB (gzipped)

**Optimization Techniques:**
- Code splitting and lazy loading
- Web Workers for heavy computation
- IndexedDB for large cache storage
- Debouncing and throttling
- Progressive rendering

---

## Document Metadata

**Authors:** Development Team
**Version:** 1.0.0
**Last Modified:** 2025-02-19
**Review Cycle:** Monthly
**Next Review:** 2025-03-19

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-02-19 | Initial documentation release |

---

*This document is maintained in the project repository. All changes should be documented in the change log above.*

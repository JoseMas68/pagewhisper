# Core Engine - Architecture Diagram

## Module Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CoreEngine (Orchestrator)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Coordinates all modules                             │ │
│  │  • Manages configuration                                │ │
│  │  • Provides unified API                                 │ │
│  │  • Handles errors & progress tracking                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────┬───────────┬───────────┬───────────┬───────────┬────────┘
      │           │           │           │           │
      ▼           ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐
│Extractor│ │ Cleaner │ │Detector │ │  Prompt │ │    Hash   │
│         │ │         │ │         │ │ Builder │ │ Generator │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └─────┬─────┘
     │           │           │           │             │
     ▼           ▼           ▼           ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐
│RawComponent│CleanedComponent│Detection│RenderedPrompt│CacheKey│
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────┘
```

## Data Flow

```
Input Element (HTMLElement/DOMElement)
         │
         ▼
┌─────────────────────────────────────────────┐
│  1. Extraction (DOMExtractor)               │
│  ┌───────────────────────────────────────┐  │
│  │ • Extract HTML structure             │  │
│  │ • Capture computed styles            │  │
│  │ • Identify CSS rules                │  │
│  │ • Build metadata                    │  │
│  └───────────────────────────────────────┘  │
└─────────────┬───────────────────────────────┘
              │
              ▼
        RawComponent
              │
              ▼
┌─────────────────────────────────────────────┐
│  2. Detection (FrameworkDetector)           │
│  ┌───────────────────────────────────────┐  │
│  │ • Detect JS frameworks               │  │
│  │ • Detect CSS frameworks              │  │
│  │ • Identify libraries                 │  │
│  │ • Calculate confidence               │  │
│  └───────────────────────────────────────┘  │
└─────────────┬───────────────────────────────┘
              │
              ▼
      DetectionResult
              │
              ▼
┌─────────────────────────────────────────────┐
│  3. Cleaning (DOMCleaner)                   │
│  ┌───────────────────────────────────────┐  │
│  │ • Remove unused CSS                  │  │
│  │ • Prefix selectors                   │  │
│  │ • Normalize properties               │  │
│  │ • Calculate statistics               │  │
│  └───────────────────────────────────────┘  │
└─────────────┬───────────────────────────────┘
              │
              ▼
      CleanedComponent
              │
              ├─────────────────┐
              │                 │
              ▼                 ▼
┌─────────────────────┐ ┌──────────────────────┐
│ 4. Hash Generation  │ │ 5. Prompt Building   │
│ (HashGenerator)     │ │ (PromptBuilder)      │
│ ┌─────────────────┐ │ ┌──────────────────┐  │
│ │ • Hash content  │ │ │ • Select template│  │
│ │ • Generate key  │ │ │ • Extract vars   │  │
│ │ • Encode result │ │ │ • Interpolate   │  │
│ └─────────────────┘ │ └──────────────────┘  │
└─────────┬───────────┘ └──────────┬───────────┘
          │                       │
          ▼                       ▼
    CacheKey              RenderedPrompt
          │                       │
          └───────────┬───────────┘
                      ▼
            ┌─────────────────────┐
            │   ProcessResult     │
            │ ┌─────────────────┐ │
            │ │ raw             │ │
            │ │ cleaned         │ │
            │ │ detected        │ │
            │ │ prompt          │ │
            │ │ hash            │ │
            │ │ cacheKey        │ │
            │ │ metadata        │ │
            │ └─────────────────┘ │
            └─────────────────────┘
```

## Module Responsibilities

### DOMExtractor
```
┌────────────────────────────────────────┐
│           DOMExtractor                 │
├────────────────────────────────────────┤
│ INPUT:  HTMLElement or DOMElement       │
│ OUTPUT: RawComponent                   │
│                                        │
│ Responsibilities:                       │
│ • Parse DOM structure                  │
│ • Extract computed styles              │
│ • Identify CSS rules                   │
│ • Capture inline styles                │
│ • Build metadata                       │
│ • Handle browser/Node.js differences   │
└────────────────────────────────────────┘
```

### DOMCleaner
```
┌────────────────────────────────────────┐
│            DOMCleaner                  │
├────────────────────────────────────────┤
│ INPUT:  RawComponent                   │
│ OUTPUT: CleanedComponent               │
│                                        │
│ Responsibilities:                       │
│ • Remove unused CSS rules              │
│ • Prefix CSS selectors                 │
│ • Normalize CSS properties             │
│ • Minify HTML/CSS (optional)           │
│ • Remove comments                      │
│ • Combine CSS rules                    │
│ • Calculate statistics                 │
└────────────────────────────────────────┘
```

### FrameworkDetector
```
┌────────────────────────────────────────┐
│        FrameworkDetector               │
├────────────────────────────────────────┤
│ INPUT:  DocumentContext                │
│ OUTPUT: DetectionResult                │
│                                        │
│ Responsibilities:                       │
│ • Detect JS frameworks (10+)           │
│ • Detect CSS frameworks (6+)           │
│ • Identify build tools                 │
│ • Extract version info                 │
│ • Calculate confidence scores          │
│ • Support browser & Node.js            │
└────────────────────────────────────────┘
```

### PromptBuilder
```
┌────────────────────────────────────────┐
│          PromptBuilder                 │
├────────────────────────────────────────┤
│ INPUT:  PromptContext                  │
│ OUTPUT: RenderedPrompt                 │
│                                        │
│ Responsibilities:                       │
│ • Template versioning                  │
│ • Variable interpolation               │
│ • Framework-specific optimization      │
│ • Built-in templates (v1, v2, react...)│
│ • Template validation                 │
│ • Custom template support             │
└────────────────────────────────────────┘
```

### HashGenerator
```
┌────────────────────────────────────────┐
│         HashGenerator                  │
├────────────────────────────────────────┤
│ INPUT:  Component + Context + Options   │
│ OUTPUT: CacheKey                       │
│                                        │
│ Responsibilities:                       │
│ • Deterministic hashing                │
│ • Multiple algorithms (SHA-256, etc.)  │
│ • Content hash generation              │
│ • Cache key generation                │
│ • Browser/Node.js compatibility        │
│ • Whitespace normalization             │
└────────────────────────────────────────┘
```

## Configuration Flow

```
┌─────────────────────────────────────────┐
│         User Configuration             │
│  ┌───────────────────────────────────┐ │
│  │ {                                │ │
│  │   extraction: {...},             │ │
│  │   cleaning: {...},               │ │
│  │   detection: {...},              │ │
│  │   prompts: {...},                │ │
│  │   hash: {...}                    │ │
│  │ }                                │ │
│  └───────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         CoreEngine                      │
│  ┌───────────────────────────────────┐ │
│  │ mergeConfig(base, partial)        │ │
│  └───────────────────────────────────┘ │
└─────┬─────────┬─────────┬─────────┬─────┘
      │         │         │         │
      ▼         ▼         ▼         ▼
┌─────────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Extractor│ │Cleaner│ │Detector│ │Prompt │
│updateConfig│updateConfig│updateConfig│setDefaultTemplate│
└─────────┘ └───────┘ └───────┘ └───────┘
```

## Type Hierarchy

```
Core Types
├── ProcessRequest
│   ├── element: HTMLElement | DOMElement
│   ├── config?: Partial<CoreConfig>
│   └── options?: GenerationOptions
│
├── ProcessResult
│   ├── raw: RawComponent
│   ├── cleaned: CleanedComponent
│   ├── detected: DetectionResult
│   ├── prompt: RenderedPrompt
│   ├── hash: ContentHash
│   ├── cacheKey: CacheKey
│   └── metadata: ProcessMetadata
│
└── CoreConfig
    ├── extraction: ExtractionConfig
    ├── cleaning: CleaningConfig
    ├── detection: DetectionConfig
    ├── prompts: PromptConfig
    └── hash: HashConfig

Component Types
├── RawComponent
│   ├── html: string
│   ├── css: ExtractedCSS
│   ├── scripts: string[]
│   └── metadata: ComponentMetadata
│
└── CleanedComponent
    ├── html: string
    ├── css: string
    ├── framework?: string
    ├── libraries: string[]
    ├── metadata: ComponentMetadata
    └── stats: CleaningStats

Detection Types
├── DetectionResult
│   ├── frameworks: FrameworkInfo[]
│   ├── cssFrameworks: FrameworkInfo[]
│   ├── libraries: string[]
│   ├── buildTools: string[]
│   └── confidence: number
│
└── FrameworkInfo
    ├── name: string
    ├── version?: string
    ├── confidence: number
    ├── indicators: string[]
    └── patterns: DetectionPattern[]

Prompt Types
├── PromptTemplate
│   ├── name: string
│   ├── version: string
│   ├── description: string
│   ├── systemPrompt: string
│   ├── userPromptTemplate: string
│   ├── variables: PromptVariable[]
│   ├── targetFrameworks: string[]
│   └── createdAt: string
│
├── RenderedPrompt
│   ├── systemPrompt: string
│   ├── userPrompt: string
│   ├── templateVersion: string
│   ├── variables: Record<string, any>
│   └── metadata: PromptMetadata
│
└── PromptContext
    ├── component: CleanedComponent
    ├── detection: DetectionResult
    └── options: GenerationOptions
```

## Platform Compatibility

```
┌─────────────────────────────────────────┐
│         Browser Environment             │
│  ┌───────────────────────────────────┐  │
│  │ • window.getComputedStyle()      │  │
│  │ • element.getBoundingClientRect() │  │
│  │ • crypto.subtle.digest()         │  │
│  │ • document.stylesheets           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Node.js Environment            │
│  ┌───────────────────────────────────┐  │
│  │ • jsdom for DOM parsing           │  │
│  │ • crypto.createHash()             │  │
│  │ • CSS parsers (optional)          │  │
│  │ • HTML parsers (optional)         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Error Handling

```
CoreError (base)
├── ExtractionError
│   └── Thrown when DOM extraction fails
├── CleaningError
│   └── Thrown when HTML/CSS cleaning fails
├── DetectionError
│   └── Thrown when framework detection fails
└── PromptError
    └── Thrown when prompt building fails

Error Enrichment:
{
  name: string
  message: string
  stack?: string
  context: string
  timestamp: number
}
```

## Performance Characteristics

```
┌─────────────────────────────────────────┐
│         Performance Metrics             │
├─────────────────────────────────────────┤
│ Extraction:      10-50ms               │
│ Cleaning:        20-100ms              │
│ Detection:       50-200ms              │
│ Hashing:         10-50ms               │
│ Prompt Building: 5-20ms                │
│ ────────────────────────────────────   │
│ Total:           < 500ms               │
└─────────────────────────────────────────┘

Optimizations:
• Lazy evaluation of expensive operations
• Configurable quality vs speed tradeoffs
• Efficient DOM traversal
• Minimal memory allocations
• Fast hash algorithms (FNV-1a fallback)
```

## Extension Points

```
Custom Extensions:
┌─────────────────────────────────────────┐
│  1. Custom Prompt Templates             │
│     └─ PromptBuilder.registerTemplate() │
│                                         │
│  2. Custom Hash Algorithms              │
│     └─ Extend HashGenerator             │
│                                         │
│  3. Custom Detection Patterns           │
│     └─ Add to FRAMEWORK_PATTERNS        │
│                                         │
│  4. Custom Cleaning Rules               │
│     └─ Extend DOMCleaner                │
│                                         │
│  5. Platform Adapters                   │
│     └─ Implements platform-specific APIs│
└─────────────────────────────────────────┘
```
